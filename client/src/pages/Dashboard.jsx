import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api, { msg } from '../api';
import { Card, Stat, Btn, Tag, Alert, inp, inr, useFetch, COLORS } from '../ui';

export default function Dashboard() {
  const { data: s, error, reload } = useFetch(() => api.get('/dashboard/summary').then((r) => r.data.data), []);
  const [text, setText] = useState(''), [p, setP] = useState(null), [err, setErr] = useState('');
  const parse = async (e) => { e.preventDefault(); setErr(''); try { setP((await api.post('/ai/parse', { text })).data); } catch (x) { setErr(msg(x)); } };
  const save = async () => { try { await api.post('/transactions', p.data); setP(null); setText(''); reload(); } catch (x) { setErr(msg(x)); } };
  if (error) return <Alert>{error}</Alert>;
  if (!s) return <p>Loading…</p>;
  return (<>
    <h1 className="text-2xl font-bold">Dashboard</h1>
    <Card title="Smart add">
      <form onSubmit={parse} className="flex gap-2 flex-wrap"><input aria-label="Describe a transaction" className={`${inp} flex-1 min-w-[220px]`} placeholder="spent 450 on Swiggy yesterday via UPI" value={text} onChange={(e) => setText(e.target.value)} /><Btn type="submit">Parse</Btn></form>
      <Alert>{err}</Alert>
      {p && <div className="mt-3"><Tag>{p.data.type}</Tag><Tag>{inr(p.data.amount)}</Tag><Tag>{p.data.title}</Tag><Tag>{p.data.category}</Tag><Tag>{p.data.paymentMethod}</Tag><Tag>{new Date(p.data.transactionDate).toLocaleDateString('en-IN')}</Tag><Tag>via {p.provider}</Tag><Btn className="ml-2" onClick={save}>Save</Btn></div>}
    </Card>
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Stat label="Total income" value={inr(s.totalIncome)} tone="text-primary" /><Stat label="Total expense" value={inr(s.totalExpense)} tone="text-red-700" />
      <Stat label="Savings" value={inr(s.savings)} /><Stat label="Budget remaining" value={s.monthlyBudget ? inr(s.budgetRemaining) : 'No budget set'} />
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Monthly trend"><div className="h-60"><ResponsiveContainer><LineChart data={s.monthlyTrend}><XAxis dataKey="month" /><YAxis width={60} /><Tooltip formatter={inr} /><Line dataKey="expense" stroke="#17735C" strokeWidth={3} /><Line dataKey="income" stroke="#E8A33D" strokeWidth={2} /></LineChart></ResponsiveContainer></div></Card>
      <Card title="Spending by category"><div className="h-60"><ResponsiveContainer><PieChart><Pie data={s.categoryBreakdown} dataKey="amount" nameKey="category" outerRadius={85} label={(d) => d.category}>{s.categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={inr} /></PieChart></ResponsiveContainer></div></Card>
    </div>
    <Card title="Recent transactions">{s.recentTransactions.length ? s.recentTransactions.map((t) => (
      <div key={t._id} className="flex justify-between py-2 border-t text-sm"><span>{t.title} · {t.category}</span><b className={t.type === 'income' ? 'text-primary' : 'text-red-700'}>{t.type === 'income' ? '+' : '−'}{inr(t.amount)}</b></div>)) : <p className="text-slate-500 text-sm">No transactions yet. Try Smart add above.</p>}</Card>
  </>);
}
