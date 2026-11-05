import OpenAI from 'openai';
import { z } from 'zod';
import { PAYMENT } from '../models/Transaction.js';
import { summarize, predictExpense, detectRecurring, heuristicInsights, guessCategory, monthKey, inr } from './financeAnalyzer.js';

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
let client;
const ai = () => {
  const k = process.env.OPENAI_API_KEY;
  if (!k || k.startsWith('your_')) return null;
  return (client ??= new OpenAI({ apiKey: k, timeout: 15000, maxRetries: 1 }));
};
export const provider = () => (ai() ? 'openai' : 'heuristic');
const json = async (system, user) => {
  const r = await ai().chat.completions.create({ model: MODEL, temperature: 0.2, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] });
  return JSON.parse(r.choices[0].message.content);
};

const parsed = z.object({ type: z.enum(['income', 'expense']), title: z.string().min(1), amount: z.coerce.number().positive(), category: z.string().min(1), paymentMethod: z.enum(PAYMENT).default('Other'), transactionDate: z.coerce.date() });

const regexParse = (text) => {
  const amount = Number((text.match(/(\d[\d,]*(?:\.\d+)?)/)?.[1] || '').replace(/,/g, ''));
  if (!amount) return null;
  const d = new Date();
  if (/yesterday/i.test(text)) d.setDate(d.getDate() - 1);
  const income = /salary|received|credited|earned|got paid/i.test(text);
  const title = (text.match(/\bon\s+([a-z0-9 &'-]+?)(?:\s+(?:yesterday|today|via|using|by)\b|$)/i)?.[1] || text).trim().slice(0, 60);
  return { type: income ? 'income' : 'expense', title, amount, category: guessCategory(text) || (income ? 'Income' : 'Other'), paymentMethod: PAYMENT.find((p) => new RegExp(`\\b${p}\\b`, 'i').test(text)) || 'Other', transactionDate: d };
};

export const parseTransaction = async (text) => {
  if (ai()) {
    try {
      const out = await json(`Convert the user's sentence into a transaction. Today is ${new Date().toISOString().slice(0, 10)}. Return JSON with keys type (income|expense), title, amount (number, INR), category (short, e.g. Food, Transport, Rent, Shopping, Entertainment, Utilities, Salary, Other), paymentMethod (one of ${PAYMENT.join(', ')}), transactionDate (ISO date).`, text);
      return { data: parsed.parse(out), provider: 'openai' };
    } catch (e) { console.error('AI parse failed:', e.message); }
  }
  const r = regexParse(text);
  return { data: r ? parsed.parse(r) : null, provider: 'heuristic' };
};

export const categorizeBatch = async (descriptions) => {
  if (!descriptions.length || !ai()) return {};
  try { return (await json('Assign a short spending category to each bank-statement description. Return JSON {"categories": {"<description>": "<category>"}}.', JSON.stringify(descriptions))).categories || {}; }
  catch (e) { console.error('AI categorize failed:', e.message); return {}; }
};

export const generateInsights = async ({ txs, budget }) => {
  const s = summarize(txs, budget), base = heuristicInsights(s);
  if (ai() && s.transactionCount) {
    try {
      const out = await json('You are a finance coach. Using only these totals (INR), return JSON {"insights": [3 to 5 specific, actionable strings]}.', JSON.stringify({ ...s, monthlyTrend: s.monthlyTrend.slice(-6) }));
      if (Array.isArray(out.insights) && out.insights.length) return { insights: out.insights.map(String), provider: 'openai' };
    } catch (e) { console.error('AI insights failed:', e.message); }
  }
  return { insights: base, provider: 'heuristic' };
};

const tools = [
  ['getCategoryTotals', 'Expense totals by category, optionally for one month (YYYY-MM)', { month: { type: 'string' } }],
  ['getMonthlyTrend', 'Income and expense per month', {}],
  ['getBudgetStatus', 'Monthly budget, spent this month, remaining, and forecast', {}],
  ['getRecurringPayments', 'Detected subscriptions and recurring bills', {}]
].map(([name, description, properties]) => ({ type: 'function', function: { name, description, parameters: { type: 'object', properties } } }));

const runTool = (name, args, { txs, budget }) => {
  const s = summarize(txs, budget);
  if (name === 'getCategoryTotals') return summarize(args.month ? txs.filter((t) => monthKey(t.transactionDate) === args.month) : txs).categoryBreakdown;
  if (name === 'getMonthlyTrend') return s.monthlyTrend;
  if (name === 'getBudgetStatus') return { monthlyBudget: s.monthlyBudget, spentThisMonth: s.currentMonthExpense, remaining: s.budgetRemaining, forecast: predictExpense(s.monthlyTrend, s.monthlyBudget) };
  if (name === 'getRecurringPayments') return detectRecurring(txs);
  return { error: 'unknown tool' };
};

const fallbackChat = (ctx) => {
  const s = summarize(ctx.txs, ctx.budget);
  return `This month you spent ${inr(s.currentMonthExpense)}${s.monthlyBudget ? ` of your ${inr(s.monthlyBudget)} budget` : ''}. ${s.categoryBreakdown[0] ? `${s.categoryBreakdown[0].category} is your top category.` : ''}`;
};

// The model never sees raw transactions: it calls server-side tools that return aggregates
export const chat = async (question, ctx) => {
  const c = ai();
  if (c) {
    try {
      const messages = [{ role: 'system', content: 'You are a careful personal finance assistant. Use the tools for every number and never invent figures. Amounts are INR. Keep answers under 120 words.' }, { role: 'user', content: question }], used = [];
      for (let i = 0; i < 4; i++) {
        const m = (await c.chat.completions.create({ model: MODEL, messages, tools, temperature: 0.2 })).choices[0].message;
        messages.push(m);
        if (!m.tool_calls?.length) return { reply: m.content, toolsUsed: used, provider: 'openai' };
        for (const t of m.tool_calls) {
          used.push(t.function.name);
          messages.push({ role: 'tool', tool_call_id: t.id, content: JSON.stringify(runTool(t.function.name, JSON.parse(t.function.arguments || '{}'), ctx)) });
        }
      }
    } catch (e) { console.error('AI chat failed:', e.message); }
  }
  return { reply: fallbackChat(ctx), toolsUsed: [], provider: 'heuristic' };
};
