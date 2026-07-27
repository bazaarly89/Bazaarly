import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Api } from '../api/client';

export default function ForgotPassword() {
  const [step, setStep] = useState('request'); // request | reset | done
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestReset = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await Api.forgotPassword(email);
      setMessage(res.message);
      if (res.demo_reset_token) setToken(res.demo_reset_token); // demo only — real apps email this link
      setStep('reset');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await Api.resetPassword({ email, otp: token, password });
      setStep('done');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="container-app flex min-h-[70vh] items-center justify-center py-16">
      <div className="card w-full max-w-md p-8 animate-fadeUp">
        {step === 'request' && (
          <>
            <h1 className="font-display text-2xl font-semibold text-center">Forgot Password</h1>
            <p className="mt-1 text-center text-sm text-slate-500">Enter your email and we'll send you a reset link</p>
            <form onSubmit={requestReset} className="mt-6 space-y-4">
              <input type="email" required className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button className="btn-primary w-full" disabled={loading}>{loading ? 'Sending…' : 'Send Reset Link'}</button>
            </form>
          </>
        )}

        {step === 'reset' && (
          <>
            <h1 className="font-display text-2xl font-semibold text-center">Reset Password</h1>
            <p className="mt-1 text-center text-sm text-slate-500">{message}</p>
            <form onSubmit={resetPassword} className="mt-6 space-y-4">
              <div><label className="label">Enter OTP</label><input required className="input" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Enter the 6-digit OTP sent to your email" /></div>
              <div><label className="label">New Password</label><input type="password" required minLength={6} className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button className="btn-primary w-full" disabled={loading}>{loading ? 'Resetting…' : 'Reset Password'}</button>
            </form>
          </>
        )}

        {step === 'done' && (
          <div className="text-center">
            <h1 className="font-display text-2xl font-semibold">Password Updated</h1>
            <p className="mt-2 text-slate-500">You can now sign in with your new password.</p>
            <Link to="/login" className="btn-primary mt-6 inline-flex">Go to Sign In</Link>
          </div>
        )}
      </div>
    </div>
  );
}
