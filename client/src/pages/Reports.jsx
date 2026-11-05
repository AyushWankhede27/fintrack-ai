import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api, { msg } from '../api';
import { Card, Stat, Btn, Alert, inp, inr, useFetch } from '../ui';

export default function Reports() {
  const now = new Date(), [year, setYear] = useState(now.getFullYear()), [month, setMonth] = useState(now.getMonth() + 1), [err, setErr] = useState('');
  const { data, error } = useFetch(() => api.get('/reports/monthly', { params: { year, month } }).then((r) => r.data), [year, month]);
  const pdf = async () => {
    try { const r = await api.get('/reports/monthly', { params: { year, month, format: 'pdf' }, responseType: 'blob' }); const a = document.createElement('a'); a.href = URL.createObjectURL(r.data); a.download = `finance-report-${year}-${String(month).padStart(2, '0')}.pdf`; a.click(); } catch (x) { setErr(msg(x)); }
  };
  return (<>
    <div className="flex justify-between flex-wrap gap-2 items-center"><h1 className="text-2xl font-bold">Monthly report</h1>
      <div className="flex gap-2"><input aria-label="Year" type="number" className={`${inp} w-24`} value={year} onChange={(e) => setYear(+e.target.value)} />
        <select aria-label="Month" className={`${inp} w-auto`} value={month} onChange={(e) => setMonth(+e.target.value)}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(2000, i).toLocaleString('en', { month: 'long' })}</option>)}</select><Btn onClick={pdf}>Export PDF</Btn></div></div>
    <Alert>{error || err}</Alert>
    {data && <><div className="grid gap-4 grid-cols-2 lg:grid-cols-4"><Stat label="Income" value={inr(data.summary.totalIncome)} /><Stat label="Expenses" value={inr(data.summary.totalExpense)} /><Stat label="Savings" value={inr(data.summary.savings)} /><Stat label="Transactions" value={data.summary.transactionCount} /></div>
      <Card title="By category"><div className="h-60"><ResponsiveContainer><BarChart data={data.summary.categoryBreakdown}><XAxis dataKey="category" /><YAxis width={60} /><Tooltip formatter={inr} /><Bar dataKey="amount" fill="#17735C" /></BarChart></ResponsiveContainer></div></Card></>}
  </>);
}
