import { useState } from 'react';
import api, { msg } from '../api';
import { Card, Btn, Alert, Tag, inp, inr } from '../ui';

export default function Goals() {
  const [f, setF] = useState({ target: 50000, months: 6 }), [r, setR] = useState(null), [err, setErr] = useState('');
  const go = async (e) => { e.preventDefault(); setErr(''); try { setR((await api.post('/ai/goal', f)).data.data); } catch (x) { setErr(msg(x)); } };
  return (<>
    <h1 className="text-2xl font-bold">Goal planner</h1>
    <Card><form onSubmit={go} className="flex gap-2 flex-wrap items-end">
      <label className="text-sm">Target (₹)<input type="number" min="1" className={inp} value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} /></label>
      <label className="text-sm">Months<input type="number" min="1" max="120" className={inp} value={f.months} onChange={(e) => setF({ ...f, months: e.target.value })} /></label><Btn type="submit">Plan</Btn></form><div className="mt-2"><Alert>{err}</Alert></div></Card>
    {r && <Card title="Your plan"><p>Save <b>{inr(r.monthlyNeeded)}</b> a month. Your current surplus is {inr(r.currentSurplus)}, leaving a gap of <b>{inr(r.gap)}</b>.</p>
      <div className="my-3">{r.cuts.map((c) => <div key={c.category} className="flex justify-between py-2 border-t text-sm"><span>Cut {c.category}</span><b>−{inr(c.cut)} / month</b></div>)}</div>
      <Tag>{r.feasible ? 'Achievable with these cuts' : 'Needs a longer timeline or more income'}</Tag></Card>}
  </>);
}
