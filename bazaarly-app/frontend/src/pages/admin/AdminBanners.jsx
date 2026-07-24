import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState({ title: '', image: '', link: '', position: 0 });

  const load = () => AdminApi.banners().then((r) => setBanners(r.banners));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await AdminApi.createBanner(form);
    setForm({ title: '', image: '', link: '', position: 0 });
    load();
  };

  const remove = async (id) => { if (!confirm('Delete this banner?')) return; await AdminApi.deleteBanner(id); load(); };

  return (
    <div>
      <h1 className="section-title mb-6">Homepage Banners</h1>
      <form onSubmit={submit} className="card mb-6 grid gap-3 p-6 sm:grid-cols-2">
        <input required placeholder="Title" className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        <input placeholder="Link (e.g. /products)" className="input" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} />
        <input required placeholder="Image URL" className="input sm:col-span-2" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} />
        <input type="number" placeholder="Position (order)" className="input" value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} />
        <button className="btn-primary sm:col-span-2">Add Banner</button>
      </form>

      <div className="space-y-4">
        {banners.map((b) => (
          <div key={b.id} className="card flex items-center gap-4 p-4">
            <img src={b.image} alt={b.title} className="h-20 w-32 rounded-lg object-cover" />
            <div className="flex-1">
              <p className="font-semibold">{b.title}</p>
              <p className="text-sm text-slate-500">Links to {b.link || '—'} · Position {b.position}</p>
            </div>
            <button onClick={() => remove(b.id)} className="text-red-500 hover:underline">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
