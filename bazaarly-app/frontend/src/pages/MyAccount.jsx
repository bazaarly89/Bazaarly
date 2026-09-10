import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function MyAccount() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', phone: '' });
  const [addresses, setAddresses] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => { Api.getAddresses().then((r) => setAddresses(r.addresses)); }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    const { user } = await Api.updateMe(profile);
    setUser(user);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const removeAddress = async (id) => {
    const { addresses } = await Api.deleteAddress(id);
    setAddresses(addresses);
  };

  return (
    <div className="container-app py-10">
      <h1 className="section-title mb-8">My Account</h1>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-1">
          <Link to="/account" className="block rounded-lg bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700">Profile</Link>
          <Link to="/orders" className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">My Orders</Link>
          <Link to="/wishlist" className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Wishlist</Link>
        </aside>

        <div className="space-y-8">
          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-lg">Profile Information</h2>
            <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
              <div><label className="label">Full Name</label><input className="input" value={profile.name} onChange={(e) => setProfile((f) => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="label">Email</label><input className="input bg-slate-50" value={user?.email} disabled /></div>
              <div><label className="label">Phone</label><input className="input" value={profile.phone} onChange={(e) => setProfile((f) => ({ ...f, phone: e.target.value }))} /></div>
              <div className="sm:col-span-2 flex items-center gap-3">
                <button className="btn-primary">Save Changes</button>
                {saved && <span className="text-sm text-green-600">Saved!</span>}
              </div>
            </form>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-lg">Saved Addresses</h2>
            {addresses.length === 0 && <p className="text-sm text-slate-400">No addresses saved yet. Add one at checkout.</p>}
            <div className="space-y-3">
              {addresses.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-sm">
                  <div><span className="font-semibold">{a.label}</span> — {a.full_name}, {a.line1}, {a.city}, {a.state} {a.pincode} {a.is_default ? <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">Default</span> : null}</div>
                  <button onClick={() => removeAddress(a.id)} className="text-red-500 hover:underline">Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
