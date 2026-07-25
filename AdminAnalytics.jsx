import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await adminLogin(form.email, form.password);
      navigate('/admin/dashboard');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md rounded-xl2 bg-white p-8 shadow-2xl animate-fadeUp">
        <div className="text-center">
          <p className="font-display text-2xl font-bold text-brand-600">Dostivox</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">Admin Panel</p>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><label className="label">Admin Email</label><input type="email" required className="input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
          <div><label className="label">Password</label><input type="password" required className="input" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>
        <p className="mt-6 rounded-lg bg-slate-50 p-3 text-center text-xs text-slate-400">Demo: admin@store.com / Admin@123</p>
      </div>
    </div>
  );
}
