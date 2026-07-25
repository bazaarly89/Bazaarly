import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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

const emptyForm = { title: '', description: '', categoryId: '', brand: '', price: '', mrp: '', stock: '', sku: '', images: [], imageSize: 'medium', attributes: [] };

const FONT_SIZES = ['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];
const Size = ReactQuill.Quill.import('attributors/style/size');
Size.whitelist = FONT_SIZES;
ReactQuill.Quill.register(Size, true);

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    [{ size: FONT_SIZES }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

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
    setForm({
      title: p.title, description: p.description, categoryId: p.category_id, brand: p.brand,
      price: p.price, mrp: p.mrp, stock: p.stock, sku: p.sku, images: p.images || [], imageSize: p.image_size || 'medium',
      attributes: (p.attributes || []).map((a) => ({ key: a.attr_key, value: a.attr_value })),
    });
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

  const addSpecRow = () => setForm((f) => ({ ...f, attributes: [...(f.attributes || []), { key: '', value: '' }] }));
  const updateSpecRow = (i, field, val) => setForm((f) => ({
    ...f,
    attributes: f.attributes.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)),
  }));
  const removeSpecRow = (i) => setForm((f) => ({ ...f, attributes: f.attributes.filter((_, idx) => idx !== i) }));

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

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-500">Description</label>
            <ReactQuill
              theme="snow"
              value={form.description}
              onChange={(value) => setForm((f) => ({ ...f, description: value }))}
              modules={quillModules}
            />
          </div>

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

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-500">Specifications (shown as a details table on the product page)</label>
            <div className="space-y-2">
              {(form.attributes || []).map((row, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    placeholder="Label (e.g. Battery Life)"
                    className="input flex-1"
                    value={row.key}
                    onChange={(e) => updateSpecRow(i, 'key', e.target.value)}
                  />
                  <input
                    placeholder="Value (e.g. 40 hours)"
                    className="input flex-1"
                    value={row.value}
                    onChange={(e) => updateSpecRow(i, 'value', e.target.value)}
                  />
                  <button type="button" onClick={() => removeSpecRow(i)} className="shrink-0 rounded-full bg-red-50 px-3 text-red-500 hover:bg-red-100">×</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addSpecRow} className="btn-ghost mt-2">+ Add Specification</button>
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
