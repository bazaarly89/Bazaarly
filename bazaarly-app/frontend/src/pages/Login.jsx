import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/account');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="container-app flex min-h-[70vh] items-center justify-center py-16">
      <div className="card w-full max-w-md p-8 animate-fadeUp">
        <h1 className="font-display text-2xl font-semibold text-center">Welcome Back</h1>
        <p className="mt-1 text-center text-sm text-slate-500">Sign in to continue shopping</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@example.com" />
          </div>
          <div>
            <div className="flex justify-between"><label className="label">Password</label><Link to="/forgot-password" className="text-xs text-brand-600 hover:underline">Forgot password?</Link></div>
            <input type="password" required className="input" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Create one</Link>
        </p>
      
      </div>
    </div>
  );
}
