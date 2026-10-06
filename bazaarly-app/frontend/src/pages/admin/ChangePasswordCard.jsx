import React, { useState } from 'react';
import { AdminApi } from '../../api/client';

// Admin password (and optional email) change card — shown at the top of Store Settings.
export default function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    if (newPassword.length < 6) { setIsError(true); setMsg('Naya password kam se kam 6 akshar ka rakho'); return; }
    if (newPassword !== confirmPassword) { setIsError(true); setMsg('Dono naye password same nahi hain'); return; }
    setSaving(true);
    try {
      const payload = { currentPassword, newPassword };
      if (newEmail.trim()) payload.newEmail = newEmail.trim();
      await AdminApi.changePassword(payload);
      setIsError(false);
      setMsg('✅ Password badal gaya. Agli baar naye password se login karna.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setNewEmail('');
    } catch (err) {
      setIsError(true);
      setMsg('❌ ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card mb-6 max-w-lg space-y-4 p-6">
      <h2 className="text-lg font-semibold text-slate-700">Admin password badlo</h2>
      <div>
        <label className="label">Abhi ka password</label>
        <input type="password" required className="input" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
      </div>
      <div>
        <label className="label">Naya password</label>
        <input type="password" required className="input" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      </div>
      <div>
        <label className="label">Naya password dobara</label>
        <input type="password" required className="input" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      </div>
      <div>
        <label className="label">Naya email (optional — khali chhodo to wahi rahega)</label>
        <input type="email" className="input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
      </div>
      {msg && <p className={`text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>}
      <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Password badlo'}</button>
    </form>
  );
}
