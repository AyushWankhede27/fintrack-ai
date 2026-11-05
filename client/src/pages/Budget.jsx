import { useState, useEffect } from 'react';
import api, { msg } from '../api';
import { Card, Btn, Alert, inp, inr, useFetch } from '../ui';

export default function Budget() {
  const { data, error } = useFetch(() => Promise.all([api.get('/budget'), api.get('/dashboard/summary')]).then(([b, s]) => ({ b: b.data.data, s: s.data.data })), []);
  const [monthly, setMonthly] = useState(''), [rows, setRows] = useState([]), [note, setNote] = useState('');
  useEffect(() => { if (data) { setMonthly(data.b.monthlyBudget || ''); setRows(data.b.categoryBudgets.map((c) => ({ ...c }))); } }, [data]);
  const save = async () => { setNote(''); try { await api.post('/budget', { monthlyBudget: monthly || 0, categoryBudgets: rows.filter((r) => r.category) }); setNote('Saved'); } catch (x) { setNote(msg(x)); } };
  if (error) return <Alert>{error}</Alert>;
  if (!data) return <p>Loading…</p>;
  const spent = (c) => data.s.categoryBreakdown.find((x) => x.category.toLowerCase() === c.toLowerCase())?.amount || 0;
  const over = rows.filter((r) => r.category && r.limit > 0 && spent(r.category) > r.limit);
  const Bar = ({ used, limit }) => <div className="h-2.5 bg-slate-200 rounded mt-1"><div className={`h-full rounded ${used > limit ? 'bg-red-600' : 'bg-primary'}`} style={{ width: `${Math.min(100, limit ? (used / limit) * 100 : 0)}%` }} /></div>;
  return (<>
    <h1 className="text-2xl font-bold">Budget</h1>
    {over.length > 0 && <Alert>Over budget: {over.map((r) => r.category).join(', ')}</Alert>}
    <Card title="Monthly budget"><input aria-label="Monthly budget" type="number" min="0" className={`${inp} max-w-xs`} value={monthly} onChange={(e) => setMonthly(e.target.value)} />
      <p className="text-sm mt-2">{inr(data.s.currentMonthExpense)} spent this month of {inr(monthly)}</p><Bar used={data.s.currentMonthExpense} limit={+monthly} /></Card>
    <Card title="Category limits">
      {rows.map((r, i) => (<div key={i} className="mb-3"><div className="flex gap-2"><input aria-label="Category" className={inp} placeholder="Category" value={r.category} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, category: e.target.value } : x))} />
        <input aria-label="Limit" type="number" min="0" className={inp} placeholder="Limit" value={r.limit} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, limit: +e.target.value } : x))} />
        <button className="text-red-700 px-2" aria-label="Remove" onClick={() => setRows(rows.filter((_, j) => j !== i))}>✕</button></div>
        {r.category && <><p className="text-xs text-slate-500 mt-1">{inr(spent(r.category))} of {inr(r.limit)}</p><Bar used={spent(r.category)} limit={r.limit} /></>}</div>))}
      <div className="flex gap-2 items-center"><Btn onClick={() => setRows([...rows, { category: '', limit: 0 }])}>+ Category</Btn><Btn onClick={save}>Save budget</Btn><span className="text-sm">{note}</span></div>
    </Card>
  </>);
}
