import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => { AdminApi.settings().then((r) => setSettings(r.settings)); }, []);

  const submit = async (e) => {
    e.preventDefault();
    const { settings: updated } = await AdminApi.updateSettings(settings);
    setSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1 className="section-title mb-6">Store Settings</h1>
      <form onSubmit={submit} className="card max-w-lg space-y-4 p-6">
        <div>
          <label className="label">Store Name</label>
          <input className="input" value={settings.store_name || ''} onChange={(e) => setSettings((s) => ({ ...s, store_name: e.target.value }))} />
        </div>
        <div>
          <label className="label">Standard Shipping Fee (₹)</label>
          <input type="number" className="input" value={settings.shipping_fee || ''} onChange={(e) => setSettings((s) => ({ ...s, shipping_fee: e.target.value }))} />
        </div>
        <div>
          <label className="label">Free Shipping Above (₹)</label>
          <input type="number" className="input" value={settings.free_shipping_above || ''} onChange={(e) => setSettings((s) => ({ ...s, free_shipping_above: e.target.value }))} />
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary">Save Settings</button>
          {saved && <span className="text-sm text-green-600">Saved!</span>}
        </div>
      </form>

      <div className="card mt-6 max-w-lg p-6">
        <h2 className="mb-2 font-semibold">Payment Gateway</h2>
        <p className="text-sm text-slate-500">Razorpay keys are configured via the backend <code>.env</code> file (<code>RAZORPAY_KEY_ID</code> / <code>RAZORPAY_KEY_SECRET</code>) and are not editable from this panel for security reasons.</p>
      </div>
    </div>
  );
}
