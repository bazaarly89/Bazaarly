import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

// Cloudinary unsigned upload config (same as product images)
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

const emptyForm = { name: '', logo: '' };

export default function AdminMerchants() {
  const [merchants, setMerchants] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => AdminApi.merchants().then((r) => setMerchants(r.merchants));
  useEffect(() => { load(); }, []);

  const startEdit = (m) => {
    setEditingId(m.id);
    setForm({ name: m.name, logo: m.logo || '' });
    setShowForm(true);
  };

  const startNew = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };

  const handleLogoSelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      setForm((f) => ({ ...f, logo: url }));
    } catch (err) {
      alert('Logo upload failed: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) await AdminApi.updateMerchant(editingId, form);
      else await AdminApi.createMerchant(form);
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      alert('Save failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this merchant? Products already using it will keep their saved logo.')) return;
    await AdminApi.deleteMerchant(id);
    load();
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="section-title">Merchants</h1>
        <button onClick={startNew} className="btn-primary">+ Add Merchant</button>
      </div>
      <p className="mb-6 text-sm text-slate-500">
        Upload each merchant's logo once here (Amazon, Flipkart, or any other store) — then pick it
        from a dropdown whenever you add an affiliate offer on a product, instead of uploading it again.
      </p>

      {showForm && (
        <form onSubmit={submit} className="card mb-6 grid gap-3 p-6 sm:grid-cols-2">
          <input required placeholder="Merchant name (e.g. Amazon, Flipkart, Myntra)" className="input sm:col-span-2" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-500">Merchant Logo</label>
            <input type="file" accept="image/*" onChange={handleLogoSelect} disabled={uploading} className="input" />
            {uploading && <p className="mt-1 text-sm text-brand-600">Uploading...</p>}
            {form.logo && (
              <div className="relative mt-2 inline-block rounded-lg border border-slate-200 bg-white p-2">
                <img src={form.logo} alt="" className="h-12 w-auto max-w-[160px] object-contain" />
                <button type="button" onClick={() => setForm((f) => ({ ...f, logo: '' }))} className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">×</button>
              </div>
            )}
          </div>
          <div className="flex gap-3 sm:col-span-2">
            <button className="btn-primary" disabled={saving || uploading}>{saving ? 'Saving…' : (editingId ? 'Update Merchant' : 'Create Merchant')}</button>
            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {merchants.map((m) => (
          <div key={m.id} className="card p-4">
            <div className="flex h-14 items-center justify-center rounded-lg bg-slate-50">
              {m.logo ? <img src={m.logo} alt={m.name} className="h-10 w-auto max-w-[80%] object-contain" /> : <span className="text-xs text-slate-400">No logo yet</span>}
            </div>
            <p className="mt-2 text-center text-sm font-semibold text-slate-700">{m.name}</p>
            <div className="mt-2 flex items-center justify-center gap-3 text-xs">
              <button onClick={() => startEdit(m)} className="text-brand-600 hover:underline">Edit</button>
              <button onClick={() => remove(m.id)} className="text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}
        {merchants.length === 0 && (
          <p className="col-span-full text-sm text-slate-400">No merchants yet — click "+ Add Merchant" to add Amazon, Flipkart, or any other store.</p>
        )}
      </div>
    </div>
  );
}
