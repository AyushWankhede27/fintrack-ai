import api from '../api';
import { Card, Alert, inr, useFetch } from '../ui';

export default function Alerts() {
  const { data, error } = useFetch(() => Promise.all([api.get('/ai/anomalies'), api.get('/ai/recurring')]).then(([a, r]) => ({ a: a.data.data, r: r.data })), []);
  if (error) return <Alert>{error}</Alert>;
  if (!data) return <p>Loading…</p>;
  return (<>
    <h1 className="text-2xl font-bold">Alerts</h1>
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Unusual transactions">{data.a.length ? data.a.map((t) => <div key={t.id} className="flex justify-between py-2 border-t text-sm"><span>{t.title} · {t.category}<br /><span className="text-slate-500">{t.timesTypical}× typical for this category</span></span><b className="text-red-700">{inr(t.amount)}</b></div>) : <p className="text-sm text-slate-500">Nothing unusual. Needs 5+ expenses in a category.</p>}
        <p className="text-xs text-slate-500 mt-2">Found with statistics (IQR), no LLM.</p></Card>
      <Card title="Recurring payments">{data.r.data.length ? <>{data.r.data.map((t) => <div key={t.title} className="flex justify-between py-2 border-t text-sm"><span>{t.title} · {t.occurrences} payments</span><b>{inr(t.amount)}</b></div>)}
        <div className="flex justify-between py-2 border-t font-bold"><span>Total per month</span><span>{inr(data.r.monthlyTotal)}</span></div></> : <p className="text-sm text-slate-500">None found yet. Needs the same payment in 3+ months.</p>}</Card>
    </div>
  </>);
}
