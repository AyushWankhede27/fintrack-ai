import api from '../api';
import { Card, Btn, Tag, Alert, inr, useFetch } from '../ui';

export default function Insights() {
  const { data, error, loading, reload } = useFetch(() => Promise.all([api.post('/ai/insights'), api.post('/ai/predict')]).then(([i, p]) => ({ i: i.data, p: p.data.data })), []);
  return (<>
    <h1 className="text-2xl font-bold">AI Insights</h1>
    <Alert>{error}</Alert>
    {data && <div className="grid gap-4 md:grid-cols-2">
      <Card title="Next month forecast"><p className="text-3xl font-bold">{inr(data.p.predictedExpense)}</p><p className="text-sm text-slate-500">Likely range {inr(data.p.low)} to {inr(data.p.high)} · confidence {data.p.confidence}%</p>
        <p className="mt-2"><Tag>{data.p.budgetRisk ? 'Over budget risk' : 'Within budget'}</Tag></p></Card>
      <Card title="Insight engine"><p className="mb-3"><Tag>{data.i.provider}</Tag></p><Btn onClick={reload} disabled={loading}>{loading ? 'Working…' : 'Regenerate'}</Btn></Card>
    </div>}
    {data && <Card title="Your insights">{data.i.insights.map((t, k) => <p key={k} className="py-2 border-t text-sm">{t}</p>)}</Card>}
    {!data && !error && <p>Loading…</p>}
  </>);
}
