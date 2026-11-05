import { z } from 'zod';
import Transaction, { PAYMENT } from '../models/Transaction.js';
import Rule from '../models/Rule.js';
import { guessCategory } from '../services/financeAnalyzer.js';
import { categorizeBatch } from '../services/aiService.js';

const body = z.object({
  type: z.enum(['income', 'expense']), title: z.string().trim().min(1), amount: z.coerce.number().positive(), category: z.string().trim().min(1),
  paymentMethod: z.enum(PAYMENT).default('UPI'), description: z.string().default(''), transactionDate: z.coerce.date().default(() => new Date())
});
const SORTS = { latest: { transactionDate: -1 }, oldest: { transactionDate: 1 }, amount_desc: { amount: -1 }, amount_asc: { amount: 1 } };
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const create = async (req, res) => res.status(201).json({ success: true, data: await Transaction.create({ ...body.parse(req.body), userId: req.userId }) });
export const list = async (req, res) => {
  const { page = 1, limit = 10, category, type, search, sort = 'latest' } = req.query;
  const p = Math.max(1, +page || 1), l = Math.min(100, Math.max(1, +limit || 10)), q = { userId: req.userId };
  if (category) q.category = String(category);
  if (['income', 'expense'].includes(type)) q.type = type;
  if (search) { const re = new RegExp(esc(String(search)), 'i'); q.$or = [{ title: re }, { category: re }, { description: re }]; }
  const [data, total] = await Promise.all([Transaction.find(q).sort(SORTS[sort] || SORTS.latest).skip((p - 1) * l).limit(l), Transaction.countDocuments(q)]);
  res.json({ success: true, data, pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) } });
};
export const update = async (req, res) => {
  const d = await Transaction.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, body.partial().parse(req.body), { new: true, runValidators: true });
  d ? res.json({ success: true, data: d }) : res.status(404).json({ success: false, message: 'Transaction not found' });
};
export const remove = async (req, res) => {
  const d = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  d ? res.json({ success: true }) : res.status(404).json({ success: false, message: 'Transaction not found' });
};

const row = z.object({ description: z.string().min(1), amount: z.coerce.number().positive(), date: z.coerce.date(), type: z.enum(['income', 'expense']).default('expense') });
// Categorisation order: user's saved rules, keyword defaults, then one batched AI call for unknown merchants
export const importPreview = async (req, res) => {
  const { rows } = z.object({ rows: z.array(row).min(1).max(500) }).parse(req.body);
  const rules = await Rule.find({ userId: req.userId });
  const out = rows.map((r) => {
    const rule = rules.find((x) => r.description.toLowerCase().includes(x.keyword));
    const g = rule?.category || guessCategory(r.description);
    return { ...r, category: g, source: rule ? 'rule' : g ? 'keyword' : null };
  });
  const aiMap = await categorizeBatch([...new Set(out.filter((r) => !r.category).map((r) => r.description))]);
  res.json({ success: true, rows: out.map((r) => (r.category ? r : aiMap[r.description] ? { ...r, category: aiMap[r.description], source: 'ai' } : { ...r, source: 'review' })) });
};
export const importCommit = async (req, res) => {
  const { rows } = z.object({ rows: z.array(row.extend({ category: z.string().trim().min(1), learn: z.boolean().optional() })).min(1).max(500) }).parse(req.body);
  await Transaction.insertMany(rows.map((r) => ({ userId: req.userId, type: r.type, title: r.description, amount: r.amount, category: r.category, paymentMethod: 'Bank', transactionDate: r.date })));
  const learn = rows.filter((r) => r.learn);
  if (learn.length) await Rule.bulkWrite(learn.map((r) => { const keyword = r.description.toLowerCase().split(/\s+/).slice(0, 2).join(' '); return { updateOne: { filter: { userId: req.userId, keyword }, update: { $set: { category: r.category } }, upsert: true } }; }));
  res.status(201).json({ success: true, imported: rows.length, rulesLearned: learn.length });
};
