import { useState } from 'react';
import api, { msg } from '../api';
import { Card, Btn, Alert, inp, inr, useFetch } from '../ui';

const blank = { type: 'expense', title: '', amount: '', category: '', paymentMethod: 'UPI' };
export default function Transactions() {
  const [q, setQ] = useState({ search: '', type: '', sort: 'latest', page: 1 }), [f, setF] = useState(blank), [err, setErr] = useState('');
  const { data, error, reload } = useFetch(() => api.get('/transactions', { params: { ...q, limit: 8 } }).then((r) => r.data), [q]);
  const add = async (e) => { e.preventDefault(); setErr(''); try { await api.post('/transactions', f); setF(blank); reload(); } catch (x) { setErr(msg(x)); } };
  const del = async (id) => { await api.delete(`/transactions/${id}`); reload(); };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const filt = (k) => (e) => setQ({ ...q, [k]: e.target.value, page: 1 });
  return (<>
    <h1 className="text-2xl font-bold">Transactions</h1>
    <Card title="Add transaction"><form onSubmit={add} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
      <select aria-label="Type" className={inp} value={f.type} onChange={set('type')}><option value="expense">Expense</option><option value="income">Income</option></select>
      <input aria-label="Title" className={inp} placeholder="Title" value={f.title} onChange={set('title')} required />
      <input aria-label="Amount" type="number" min="0.01" step="0.01" className={inp} placeholder="Amount" value={f.amount} onChange={set('amount')} required />
      <input aria-label="Category" className={inp} placeholder="Category" value={f.category} onChange={set('category')} required />
      <select aria-label="Payment method" className={inp} value={f.paymentMethod} onChange={set('paymentMethod')}>{['UPI', 'Card', 'Cash', 'Bank', 'Other'].map((m) => <option key={m}>{m}</option>)}</select>
      <Btn type="submit">Add</Btn></form><div className="mt-2"><Alert>{err}</Alert></div></Card>
    <div className="flex gap-2 flex-wrap">
      <input aria-label="Search" className={`${inp} flex-1 min-w-[200px]`} placeholder="Search title, category…" value={q.search} onChange={filt('search')} />
      <select aria-label="Filter type" className={`${inp} w-auto`} value={q.type} onChange={filt('type')}><option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option></select>
      <select aria-label="Sort" className={`${inp} w-auto`} value={q.sort} onChange={filt('sort')}><option value="latest">Latest</option><option value="oldest">Oldest</option><option value="amount_desc">Amount high</option><option value="amount_asc">Amount low</option></select>
    </div>
    <Alert>{error}</Alert>
    <Card className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-500"><th className="py-2">Title</th><th>Category</th><th>Method</th><th>Date</th><th className="text-right">Amount</th><th /></tr></thead><tbody>
      {data?.data.map((t) => (<tr key={t._id} className="border-t"><td className="py-2">{t.title}</td><td>{t.category}</td><td>{t.paymentMethod}</td><td>{new Date(t.transactionDate).toLocaleDateString('en-IN')}</td>
        <td className={`text-right font-semibold ${t.type === 'income' ? 'text-primary' : 'text-red-700'}`}>{t.type === 'income' ? '+' : '−'}{inr(t.amount)}</td><td className="text-right"><button className="text-red-700" aria-label={`Delete ${t.title}`} onClick={() => del(t._id)}>Delete</button></td></tr>))}
    </tbody></table>{data && !data.data.length && <p className="text-slate-500 py-3">Nothing found.</p>}</Card>
    {data && <div className="flex justify-between items-center text-sm"><span>Page {data.pagination.page} of {Math.max(1, data.pagination.pages)}</span><span className="flex gap-2">
      <Btn disabled={q.page <= 1} onClick={() => setQ({ ...q, page: q.page - 1 })}>Previous</Btn><Btn disabled={q.page >= data.pagination.pages} onClick={() => setQ({ ...q, page: q.page + 1 })}>Next</Btn></span></div>}
  </>);
}
