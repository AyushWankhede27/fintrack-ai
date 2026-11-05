import { useState, useEffect, useCallback } from 'react';
import { msg } from './api';

export const inr = (v) => `₹${Math.round(v || 0).toLocaleString('en-IN')}`;
export const COLORS = ['#17735C', '#E8A33D', '#3B6EA8', '#B4537A', '#8A9A98', '#6B5B95'];
export const inp = 'border border-slate-300 rounded-lg px-3 py-2 w-full bg-white';
export const Card = ({ title, children, className = '' }) => (
  <section className={`bg-white border border-slate-200 rounded-xl p-5 ${className}`}>{title && <h2 className="font-semibold mb-3">{title}</h2>}{children}</section>
);
export const Stat = ({ label, value, tone = '' }) => (<Card><p className="text-sm text-slate-500">{label}</p><p className={`text-2xl font-bold mt-1 ${tone}`}>{value}</p></Card>);
export const Btn = ({ className = '', ...p }) => (<button type="button" {...p} className={`bg-primary text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-50 ${className}`} />);
export const Tag = ({ children }) => <span className="inline-block bg-emerald-50 text-emerald-900 text-xs font-semibold px-2.5 py-1 rounded-full mr-2">{children}</span>;
export const Alert = ({ children }) => children ? <p role="alert" className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-2 text-sm">{children}</p> : null;

export const useFetch = (fn, deps = []) => {
  const [data, setData] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true);
  const run = useCallback(() => { setLoading(true); fn().then((r) => { setData(r); setError(''); }).catch((e) => setError(msg(e))).finally(() => setLoading(false)); }, deps); // eslint-disable-line
  useEffect(run, [run]);
  return { data, error, loading, reload: run };
};
