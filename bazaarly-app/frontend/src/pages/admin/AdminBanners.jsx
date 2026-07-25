import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

// Same Cloudinary unsigned upload used for category/product images —
// so banner images upload the exact same way, no URL typing needed.
const CLOUD_NAME = 'qqarhfg3';
const UPLOAD_PRESET = 'dostivox_products';

async function uploadImageToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Upload failed');
  return data.secure_url;
}

const emptyForm = { title: '', image: '', link: '', position: 0 };

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () => AdminApi.banners().then((r) => setBanners(r.banners));
  useEffect(() => { load(); }, []);

  const startNew = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };

  const startEdit = (b) => {
    setEditingId(b.id);
    setForm({ title: b.title || '', image: b.image || '', link: b.link || '', position: b.position ?? 0 });
    setShowForm(true);
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setForm((f) => ({ ...f, image: url }));
    } catch (err) {
      alert('Image upload failed: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.image) { alert('Please upload a banner image first.'); return; }
    if (editingId) await AdminApi.updateBanner(editingId, form);
    else await AdminApi.createBanner(form);
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this banner?')) return;
    await AdminApi.deleteBanner(id);
    load();
  };

  const toggleActive = async (b) => {
    await AdminApi.updateBanner(b.id, { isActive: b.is_active ? false : true });
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="section-title">Homepage Banners</h1>
        <button onClick={startNew} className="btn-primary">+ Add Banner</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card mb-6 grid gap-3 p-6 sm:grid-cols-2">
          <input required placeholder="Banner text / title" className="input sm:col-span-2" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <input placeholder="Link when clicked (e.g. /products)" className="input" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} />
          <input type="number" placeholder="Slide order (0, 1, 2...)" className="input" value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} />

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-500">Banner Image</label>
            <input type="file" accept="image/*" onChange={handleImageSelect} disabled={uploading} className="input" />
            {uploading && <p className="mt-1 text-sm text-brand-600">Uploading...</p>}
            {form.image && (
              <div className="relative mt-2 inline-block">
                <img src={form.image} alt="" className="h-24 w-40 rounded object-cover" />
                <button type="button" onClick={() => setForm((f) => ({ ...f, image: '' }))} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">×</button>
              </div>
            )}
          </div>

          <div className="flex gap-3 sm:col-span-2">
            <button className="btn-primary" disabled={uploading}>{editingId ? 'Update Banner' : 'Add Banner'}</button>
            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {banners.map((b) => (
          <div key={b.id} className={`card flex items-center gap-4 p-4 ${!b.is_active ? 'opacity-50' : ''}`}>
            <img src={b.image} alt={b.title} className="h-20 w-32 rounded-lg object-cover" />
            <div className="flex-1">
              <p className="font-semibold">{b.title}</p>
              <p className="text-sm text-slate-500">Links to {b.link || '—'} · Position {b.position}</p>
              <span className={`text-xs font-semibold ${b.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                {b.is_active ? 'Visible on homepage' : 'Hidden'}
              </span>
            </div>
            <div className="space-x-3 text-sm">
              <button onClick={() => startEdit(b)} className="text-brand-600 hover:underline">Edit</button>
              <button onClick={() => toggleActive(b)} className="text-slate-500 hover:underline">
                {b.is_active ? 'Hide' : 'Show'}
              </button>
              <button onClick={() => remove(b.id)} className="text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
