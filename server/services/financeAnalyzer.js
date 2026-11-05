const sum = (a, f = (x) => x) => a.reduce((s, x) => s + f(x), 0);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const quantile = (sorted, q) => { const p = (sorted.length - 1) * q, i = Math.floor(p); return sorted[i] + (sorted[Math.min(i + 1, sorted.length - 1)] - sorted[i]) * (p - i); };
export const inr = (v) => `₹${Math.round(v || 0).toLocaleString('en-IN')}`;
export const monthKey = (d) => { d = new Date(d); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };

const KEYWORDS = [
  ['Salary', /salary|payroll|stipend/], ['Rent', /\brent\b/], ['Food', /swiggy|zomato|restaurant|grocer|cafe|food|lunch|dinner|bigbasket/],
  ['Transport', /uber|\bola\b|metro|fuel|petrol|diesel|\bbus\b|train|cab|rapido/], ['Entertainment', /netflix|spotify|movie|game|prime|hotstar/],
  ['Shopping', /amazon|flipkart|myntra|mall/], ['Utilities', /electric|bescom|water|\bgas\b|wifi|broadband|recharge|bill/]
];
export const guessCategory = (text) => KEYWORDS.find(([, re]) => re.test(text.toLowerCase()))?.[0] || null;

export const summarize = (txs = [], budget = null) => {
  const expenses = txs.filter((t) => t.type === 'expense');
  const totalIncome = sum(txs.filter((t) => t.type === 'income'), (t) => t.amount);
  const totalExpense = sum(expenses, (t) => t.amount);
  const cat = {};
  expenses.forEach((t) => { cat[t.category] = (cat[t.category] || 0) + t.amount; });
  const categoryBreakdown = Object.entries(cat).map(([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount);
  const m = {};
  txs.forEach((t) => { const k = monthKey(t.transactionDate); (m[k] ??= { month: k, income: 0, expense: 0 })[t.type] += t.amount; });
  const monthlyTrend = Object.values(m).sort((a, b) => a.month.localeCompare(b.month));
  const currentMonthExpense = m[monthKey(new Date())]?.expense || 0;
  const monthlyBudget = budget?.monthlyBudget || 0;
  return { totalIncome, totalExpense, savings: totalIncome - totalExpense, currentMonthExpense, monthlyBudget,
    budgetRemaining: monthlyBudget ? monthlyBudget - currentMonthExpense : 0, categoryBreakdown, monthlyTrend, transactionCount: txs.length };
};

// Weighted moving average over the last 6 months (recent months count more), with a range and a confidence that drops when spending is volatile
export const predictExpense = (trend, monthlyBudget = 0) => {
  const v = trend.slice(-6).map((t) => t.expense);
  if (!v.length) return { predictedExpense: 0, low: 0, high: 0, confidence: 40, budgetRisk: false };
  const w = v.map((_, i) => i + 1), wma = sum(v.map((x, i) => x * w[i])) / sum(w);
  const mean = sum(v) / v.length, sd = Math.sqrt(sum(v, (x) => (x - mean) ** 2) / v.length);
  const confidence = clamp(Math.round(90 - (mean ? (sd / mean) * 60 : 0) - (6 - v.length) * 6), 40, 95);
  return { predictedExpense: Math.round(wma), low: Math.max(0, Math.round(wma - sd)), high: Math.round(wma + sd), confidence, budgetRisk: monthlyBudget > 0 && wma > monthlyBudget };
};

// Statistical anomaly detection: per category, flag amounts above Q3 + 1.5 * IQR (needs 5+ samples)
export const detectAnomalies = (txs) => {
  const by = {};
  txs.filter((t) => t.type === 'expense').forEach((t) => (by[t.category] ??= []).push(t));
  const out = [];
  for (const [category, list] of Object.entries(by)) {
    if (list.length < 5) continue;
    const s = list.map((t) => t.amount).sort((a, b) => a - b), q1 = quantile(s, 0.25), q3 = quantile(s, 0.75), median = quantile(s, 0.5);
    list.filter((t) => t.amount > q3 + 1.5 * (q3 - q1)).forEach((t) => out.push({ id: t._id, title: t.title, category, amount: t.amount, date: t.transactionDate, timesTypical: +(t.amount / median).toFixed(1) }));
  }
  return out.sort((a, b) => b.timesTypical - a.timesTypical);
};

// Recurring payments: same title in 3+ distinct months, similar amount, roughly monthly gaps
export const detectRecurring = (txs) => {
  const by = {};
  txs.filter((t) => t.type === 'expense').forEach((t) => (by[t.title.toLowerCase().trim()] ??= []).push(t));
  const out = [];
  for (const list of Object.values(by)) {
    list.sort((a, b) => new Date(a.transactionDate) - new Date(b.transactionDate));
    if (new Set(list.map((t) => monthKey(t.transactionDate))).size < 3) continue;
    const amounts = list.map((t) => t.amount).sort((a, b) => a - b), med = quantile(amounts, 0.5);
    if (amounts.some((a) => Math.abs(a - med) > med * 0.15)) continue;
    const gaps = list.slice(1).map((t, i) => (new Date(t.transactionDate) - new Date(list[i].transactionDate)) / 864e5), avg = sum(gaps) / gaps.length;
    if (avg < 25 || avg > 35) continue;
    const last = new Date(list.at(-1).transactionDate);
    out.push({ title: list[0].title, amount: Math.round(med), occurrences: list.length, nextExpected: new Date(last.getTime() + avg * 864e5) });
  }
  return out;
};

// Deterministic goal planner: how much to save monthly, and which flexible categories could absorb the gap (capped at 25% each)
export const planGoal = (txs, target, months) => {
  const s = summarize(txs), n = Math.max(1, s.monthlyTrend.length);
  const monthlyNeeded = target / months, currentSurplus = Math.max(0, s.savings / n), gap = Math.max(0, monthlyNeeded - currentSurplus);
  const flex = s.categoryBreakdown.filter((c) => ['Entertainment', 'Shopping', 'Food', 'Other'].includes(c.category)).map((c) => ({ category: c.category, monthly: c.amount / n }));
  const room = sum(flex, (c) => c.monthly * 0.25);
  const cuts = flex.map((c) => ({ category: c.category, cut: Math.round(room ? Math.min(c.monthly * 0.25, (gap * (c.monthly * 0.25)) / room) : 0) }));
  return { monthlyNeeded: Math.round(monthlyNeeded), currentSurplus: Math.round(currentSurplus), gap: Math.round(gap), cuts, feasible: gap <= room };
};

export const heuristicInsights = (s) => {
  if (!s.transactionCount) return ['Add your first income and expense to unlock insights.', 'Set a monthly budget so overspending alerts can work.'];
  const out = [], top = s.categoryBreakdown[0];
  if (top && s.totalExpense) out.push(`${top.category} is ${Math.round((top.amount / s.totalExpense) * 100)}% of your expenses (${inr(top.amount)}), your largest category.`);
  if (s.totalIncome) out.push(`You saved ${Math.round((s.savings / s.totalIncome) * 100)}% of income. ${s.savings / s.totalIncome >= 0.2 ? 'That beats the 20% rule of thumb.' : 'Aim for at least 20%.'}`);
  if (s.monthlyBudget) out.push(s.budgetRemaining < 0 ? `You are ${inr(-s.budgetRemaining)} over this month's budget.` : `You have ${inr(s.budgetRemaining)} left in this month's budget.`);
  return out;
};
