import { useState } from 'react';
import api, { msg } from '../api';
import { Card, Btn, Tag, Alert, inp } from '../ui';

// CSV columns: description,amount,date,type (type optional: income|expense)
const parseCsv = (text) => text.trim().split(/\r?\n/).slice(1).map((l) => { const [description, amount, date, type] = l.split(',').map((x) => x.trim().replace(/^"|"$/g, '')); return { description, amount: Math.abs(+amount), date, type: type || 'expense' }; }).filter((r) => r.description && r.amount);

export default function Import() {
  const [rows, setRows] = useState([]), [err, setErr] = useState(''), [done, setDone] = useState('');
  const load = async (e) => {
    setErr(''); setDone('');
    try { const r = await api.post('/transactions/import/preview', { rows: parseCsv(await e.target.files[0].text()) }); setRows(r.data.rows.map((x) => ({ ...x, learn: false }))); } catch (x) { setErr(msg(x)); }
  };
  const edit = (i, v) => setRows(rows.map((r, j) => j === i ? { ...r, category: v, learn: true } : r));
  const commit = async () => {
    try { const r = await api.post('/transactions/import/commit', { rows: rows.map((r) => ({ ...r, category: r.category || 'Other' })) }); setDone(`Imported ${r.data.imported} transactions, learned ${r.data.rulesLearned} rules.`); setRows([]); } catch (x) { setErr(msg(x)); }
  };
  return (<>
    <h1 className="text-2xl font-bold">Smart import</h1>
    <Card title="Upload a CSV"><input aria-label="CSV file" type="file" accept=".csv" onChange={load} className="text-sm" /><p className="text-xs text-slate-500 mt-2">Columns: description, amount, date (YYYY-MM-DD), type (income or expense, optional).</p></Card>
    <Alert>{err}</Alert>{done && <p className="text-primary font-semibold">{done}</p>}
    {rows.length > 0 && <Card title={`${rows.length} rows`}>{rows.map((r, i) => (
      <div key={i} className="flex gap-2 items-center py-2 border-t text-sm flex-wrap"><span className="flex-1 min-w-[160px]">{r.description} · ₹{r.amount}</span>
        <input aria-label="Category" className={`${inp} w-40`} value={r.category || ''} placeholder="Choose…" onChange={(e) => edit(i, e.target.value)} />
        <Tag>{r.learn ? 'will save rule' : r.source === 'rule' ? 'saved rule' : r.source === 'ai' ? 'AI' : r.source === 'keyword' ? 'keyword' : 'needs review'}</Tag></div>))}
      <Btn className="mt-3" onClick={commit}>Import {rows.length} transactions</Btn></Card>}
  </>);
}
