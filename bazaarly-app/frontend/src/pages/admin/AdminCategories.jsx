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

const emptyForm = { name: '', image: '' };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () => AdminApi.categories().then((r) => setCategories(r.categories));
  useEffect(() => { load(); }, []);

  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({ name: c.name, image: c.image || '' });
    setShowForm(true);
  };

  const startNew = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };

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
    if (editingId) await AdminApi.updateCategory(editingId, form);
    else await AdminApi.createCategory(form);
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this category?')) return;
    await AdminApi.deleteCategory(id);
    load();
  };

  const toggleActive = async (c) => {
    await AdminApi.updateCategory(c.id, { isActive: c.is_active ? false : true });
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="section-title">Categories</h1>
        <button onClick={startNew} className="btn-primary">+ Add Category</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card mb-6 grid gap-3 p-6 sm:grid-cols-2">
          <input required placeholder="Category name" className="input sm:col-span-2" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-500">Category Image</label>
            <input type="file" accept="image/*" onChange={handleImageSelect} disabled={uploading} className="input" />
            {uploading && <p className="mt-1 text-sm text-brand-600">Uploading...</p>}
            {form.image && (
              <div className="relative mt-2 inline-block">
                <img src={form.image} alt="" className="h-20 w-20 rounded object-cover" />
                <button type="button" onClick={() => setForm((f) => ({ ...f, image: '' }))} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">×</button>
              </div>
            )}
          </div>
          <div className="flex gap-3 sm:col-span-2">
            <button className="btn-primary" disabled={uploading}>{editingId ? 'Update Category' : 'Create Category'}</button>
            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => (
          <div key={c.id} className={`card overflow-hidden ${!c.is_active ? 'opacity-50' : ''}`}>
            <img src={c.image} alt={c.name} className="aspect-video w-full object-cover" />
            <div className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{c.name}</p>
                <span className={`text-xs font-semibold ${c.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                  {c.is_active ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <div className="space-x-3">
                  <button onClick={() => startEdit(c)} className="text-brand-600 hover:underline">Edit</button>
                  <button onClick={() => remove(c.id)} className="text-red-500 hover:underline">Delete</button>
                </div>
                <button onClick={() => toggleActive(c)} className="text-slate-500 hover:underline">
                  {c.is_active ? 'Hide from customers' : 'Show to customers'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
