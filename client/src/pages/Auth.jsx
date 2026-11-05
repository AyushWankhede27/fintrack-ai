import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, signup } from '../authSlice';
import { Btn, Alert, inp } from '../ui';

export default function Auth({ signup: isSignup }) {
  const d = useDispatch(), { token, loading, error } = useSelector((s) => s.auth);
  const [f, setF] = useState({ name: '', email: '', password: '' });
  if (token) return <Navigate to="/" replace />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="min-h-screen grid place-items-center p-4">
      <form onSubmit={(e) => { e.preventDefault(); d((isSignup ? signup : login)(f)); }} className="bg-white border border-slate-200 rounded-xl p-6 w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-bold">{isSignup ? 'Create account' : 'Welcome back'}</h1>
        <Alert>{error}</Alert>
        {isSignup && <input aria-label="Name" className={inp} placeholder="Name" value={f.name} onChange={set('name')} required />}
        <input aria-label="Email" type="email" className={inp} placeholder="Email" value={f.email} onChange={set('email')} required />
        <input aria-label="Password" type="password" minLength={8} className={inp} placeholder="Password (8+ characters)" value={f.password} onChange={set('password')} required />
        <Btn type="submit" className="w-full" disabled={loading}>{loading ? 'Please wait…' : isSignup ? 'Sign up' : 'Log in'}</Btn>
        <p className="text-sm text-slate-600">{isSignup ? 'Already registered?' : 'New here?'} <Link className="text-primary font-semibold" to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Create an account'}</Link></p>
      </form>
    </div>
  );
}
