import { z } from 'zod';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { summarize, predictExpense, detectAnomalies, detectRecurring, planGoal } from '../services/financeAnalyzer.js';
import { generateInsights, parseTransaction, chat } from '../services/aiService.js';

const load = async (userId) => ({ txs: await Transaction.find({ userId }).lean(), budget: await Budget.findOne({ userId }).lean() });

export const dashboard = async (req, res) => {
  const { txs, budget } = await load(req.userId);
  const recent = [...txs].sort((a, b) => b.transactionDate - a.transactionDate).slice(0, 5);
  res.json({ success: true, data: { ...summarize(txs, budget), recentTransactions: recent } });
};
export const insights = async (req, res) => res.json({ success: true, ...(await generateInsights(await load(req.userId))) });
export const predict = async (req, res) => { const { txs, budget } = await load(req.userId); res.json({ success: true, data: predictExpense(summarize(txs, budget).monthlyTrend, budget?.monthlyBudget) }); };
export const anomalies = async (req, res) => res.json({ success: true, data: detectAnomalies((await load(req.userId)).txs) });
export const recurring = async (req, res) => { const data = detectRecurring((await load(req.userId)).txs); res.json({ success: true, data, monthlyTotal: data.reduce((s, r) => s + r.amount, 0) }); };
export const goal = async (req, res) => {
  const { target, months } = z.object({ target: z.coerce.number().positive(), months: z.coerce.number().int().min(1).max(120) }).parse(req.body);
  res.json({ success: true, data: planGoal((await load(req.userId)).txs, target, months) });
};
export const parse = async (req, res) => {
  const { text } = z.object({ text: z.string().trim().min(3).max(300) }).parse(req.body);
  const r = await parseTransaction(text);
  r.data ? res.json({ success: true, ...r }) : res.status(422).json({ success: false, message: 'Could not find an amount in that sentence' });
};
export const ask = async (req, res) => {
  const { question } = z.object({ question: z.string().trim().min(2).max(500) }).parse(req.body);
  res.json({ success: true, ...(await chat(question, await load(req.userId))) });
};
