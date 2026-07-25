import React, { useEffect, useState, useRef } from 'react';
import { AdminApi } from '../../api/client';

// Cloudinary unsigned upload config
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

const emptyForm = { title: '', description: '', categoryId: '', brand: '', price: '', mrp: '', stock: '', sku: '', images: [], imageSize: 'medium' };

// ---------- Simple rich text editor for the description field ----------
function DescriptionEditor({ value, onChange }) {
  const editorRef = useRef(null);

  // Load initial/edited value into the editor once
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (command, arg) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    onChange(editorRef.current.innerHTML);
  };

  const handleFontSize = (e) => {
    // execCommand fontSize uses 1-7 scale; map small/medium/large/xl to it
    const map = { small: '2', medium: '3', large: '5', xl: '7' };
    exec('fontSize', map[e.target.value] || '3');
    e.target.value = '';
  };

  return (
    <div className="sm:col-span-2">
      <label className="mb-1 block text-sm text-slate-500">Description</label>
      <div className="mb-1 flex flex-wrap gap-2 rounded-t-lg border border-b-0 border-slate-200 bg-slate-50 p-2">
        <button type="button" onClick={() => exec('bold')} className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-bold">B</button>
        <button type="button" onClick={() => exec('italic')} className="rounded border border-slate-300 bg-white px-2 py-1 text-xs italic">I</button>
        <select defaultValue="" onChange={handleFontSize} className="rounded border border-slate-300 bg-white px-2 py-1 text-xs">
          <option value="" disabled>Font Size</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="xl">Extra Large</option>
        </select>
        <button type="button" onClick={() => exec('insertUnorderedList')} className="rounded border border-slate-300 bg-white px-2 py-1 text-xs">• List</button>
        <button type="button" onClick={() => exec('removeFormat')} className="rounded border border-slate-300 bg-white px-2 py-1 text-xs">Clear</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className="input min-h-[140px] rounded-t-none"
        style={{ overflowY: 'auto' }}
      />
      <p className="mt-1 text-xs text-slate-400">Select text then click Bold/Italic/Font Size to format it.</p>
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () => AdminApi.products().then((r) => setProducts(r.products));
  useEffect(() => { load(); AdminApi.categories().then((r) => setCategories(r.categories)); }, []);

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({ title: p.title, description: p.description, categoryId: p.category_id, brand: p.brand, price: p.price, mrp: p.mrp, stock: p.stock, sku: p.sku, images: p.images || [], imageSize: p.image_size || 'medium' });
    setShowForm(true);
  };

  const startNew = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const url = await uploadImageToCloudinary(file);
        uploadedUrls.push(url);
      }
      setForm((f) => ({ ...f, images: [...(f.images || []), ...uploadedUrls] }));
    } catch (err) {
      alert('Image upload failed: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (url) => {
    setForm((f) => ({ ...f, images: f.images.filter((img) => img !== url) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price), mrp: Number(form.mrp), stock: Number(form.stock),
      images: form.images && form.images.length ? form.images : undefined,
    };
    if (editingId) await AdminApi.updateProduct(editingId, payload);
    else await AdminApi.createProduct(payload);
    setShowForm(false);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;
    await AdminApi.deleteProduct(id);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="section-title">Products</h1>
        <button onClick={startNew} className="btn-primary">+ Add Product</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card mb-6 grid gap-3 p-6 sm:grid-cols-2">
          <input required placeholder="Title" className="input sm:col-span-2" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />

          <DescriptionEditor value={form.description} onChange={(html) => setForm((f) => ({ ...f, description: html }))} />

          <select required className="input" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
            <option value="">Select Category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input placeholder="Brand" className="input" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
          <input required type="number" placeholder="Price" className="input" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
          <input required type="number" placeholder="MRP" className="input" value={form.mrp} onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))} />
          <input required type="number" placeholder="Stock" className="input" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
          <input placeholder="SKU" className="input" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-500">Product Images</label>
            <input type="file" accept="image/*" multiple onChange={handleImageSelect} disabled={uploading} className="input" />
            {uploading && <p className="mt-1 text-sm text-brand-600">Uploading...</p>}
            {form.images && form.images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.images.map((url) => (
                  <div key={url} className="relative">
                    <img src={url} alt="" className="h-16 w-16 rounded object-cover" />
                    <button type="button" onClick={() => removeImage(url)} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-500">Image Display Size (on product page)</label>
            <select className="input" value={form.imageSize} onChange={(e) => setForm((f) => ({ ...f, imageSize: e.target.value }))}>
              <option value="small">Small</option>
              <option value="medium">Medium (default)</option>
              <option value="large">Large</option>
              <option value="xl">Extra Large</option>
            </select>
          </div>

          <div className="flex gap-3 sm:col-span-2">
            <button className="btn-primary">{editingId ? 'Update Product' : 'Create Product'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto p-6">
        <table className="w-full min-w-[700px] text-sm">
          <thead><tr className="text-left text-slate-400"><th className="pb-2">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="py-2">{p.title}</td>
                <td>{p.category_name}</td>
                <td>₹{p.price}</td>
                <td className={p.stock <= 5 ? 'text-red-500 font-semibold' : ''}>{p.stock}</td>
                <td>{p.is_active ? 'Active' : 'Hidden'}</td>
                <td className="space-x-3 text-right">
                  <button onClick={() => startEdit(p)} className="text-brand-600 hover:underline">Edit</button>
                  <button onClick={() => remove(p.id)} className="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
