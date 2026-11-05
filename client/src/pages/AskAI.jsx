import { useState } from 'react';
import api, { msg } from '../api';
import { Card, Btn, Tag, inp } from '../ui';

const IDEAS = ['Can I afford a ₹30k phone this month?', 'Where am I spending the most?', 'Which subscriptions do I pay for?'];
export default function AskAI() {
  const [log, setLog] = useState([]), [q, setQ] = useState(''), [busy, setBusy] = useState(false);
  const ask = async (text) => {
    if (!text.trim() || busy) return;
    setLog((l) => [...l, { role: 'user', text }]); setQ(''); setBusy(true);
    try { const r = (await api.post('/ai/chat', { question: text })).data; setLog((l) => [...l, { role: 'ai', text: r.reply, tools: r.toolsUsed, provider: r.provider }]); }
    catch (e) { setLog((l) => [...l, { role: 'ai', text: msg(e), tools: [] }]); }
    setBusy(false);
  };
  return (<>
    <h1 className="text-2xl font-bold">Ask AI</h1>
    <Card>
      <div className="flex gap-2 flex-wrap mb-3">{IDEAS.map((i) => <button key={i} onClick={() => ask(i)} className="text-xs bg-emerald-50 text-emerald-900 rounded-full px-3 py-1.5">{i}</button>)}</div>
      <div className="space-y-3 min-h-[240px]">{log.map((m, i) => (
        <div key={i} className={m.role === 'user' ? 'text-right' : ''}><div className={`inline-block max-w-[85%] text-left rounded-2xl px-4 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-white' : 'bg-slate-100'}`}>{m.text}
          {m.role === 'ai' && <div className="mt-2">{m.tools?.map((t, k) => <Tag key={k}>Used {t}</Tag>)}{m.provider && <Tag>{m.provider}</Tag>}</div>}</div></div>))}{busy && <p className="text-sm text-slate-500">Thinking…</p>}</div>
      <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="flex gap-2 mt-4"><input aria-label="Ask about your finances" className={inp} placeholder="Ask about your spending…" value={q} onChange={(e) => setQ(e.target.value)} /><Btn type="submit" disabled={busy}>Send</Btn></form>
      <p className="text-xs text-slate-500 mt-2">The model only sees totals returned by server-side tools, never your raw transactions.</p>
    </Card>
  </>);
}
