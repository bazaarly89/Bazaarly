import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

const PLACEMENTS = ['home_top', 'home_mid', 'sidebar', 'product_page'];

export default function AdminAdvertisements() {
  const [ads, setAds] = useState([]);
  const [form, setForm] = useState({ title: '', image: '', link: '', placement: 'home_top' });

  const load = () => AdminApi.advertisements().then((r) => setAds(r.advertisements));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await AdminApi.createAd(form);
    setForm({ title: '', image: '', link: '', placement: 'home_top' });
    load();
  };

  const remove = async (id) => { if (!confirm('Delete this ad?')) return; await AdminApi.deleteAd(id); load(); };

  return (
    <div>
      <h1 className="section-title mb-6">Advertisements</h1>
      <form onSubmit={submit} className="card mb-6 grid gap-3 p-6 sm:grid-cols-2">
        <input required placeholder="Title" className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        <select className="input" value={form.placement} onChange={(e) => setForm((f) => ({ ...f, placement: e.target.value }))}>
          {PLACEMENTS.map((p) => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
        </select>
        <input required placeholder="Image URL" className="input sm:col-span-2" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} />
        <input placeholder="Link" className="input sm:col-span-2" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} />
        <button className="btn-primary sm:col-span-2">Add Advertisement</button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        {ads.map((a) => (
          <div key={a.id} className="card p-4">
            <img src={a.image} alt={a.title} className="aspect-video w-full rounded-lg object-cover" />
            <div className="mt-3 flex items-center justify-between">
              <div><p className="font-semibold">{a.title}</p><p className="text-xs text-slate-500 capitalize">{a.placement.replace(/_/g, ' ')}</p></div>
              <button onClick={() => remove(a.id)} className="text-sm text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
