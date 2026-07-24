import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

const emptyForm = { title: '', description: '', categoryId: '', brand: '', price: '', mrp: '', stock: '', sku: '', images: '' };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => AdminApi.products().then((r) => setProducts(r.products));
  useEffect(() => { load(); AdminApi.categories().then((r) => setCategories(r.categories)); }, []);

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({ title: p.title, description: p.description, categoryId: p.category_id, brand: p.brand, price: p.price, mrp: p.mrp, stock: p.stock, sku: p.sku, images: '' });
    setShowForm(true);
  };

  const startNew = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: Number(form.price), mrp: Number(form.mrp), stock: Number(form.stock),
      images: form.images ? form.images.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
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
          <textarea placeholder="Description" className="input sm:col-span-2" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <select required className="input" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
            <option value="">Select Category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input placeholder="Brand" className="input" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
          <input required type="number" placeholder="Price" className="input" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
          <input required type="number" placeholder="MRP" className="input" value={form.mrp} onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))} />
          <input required type="number" placeholder="Stock" className="input" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
          <input placeholder="SKU" className="input" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
          <input placeholder="Image URLs (comma separated)" className="input sm:col-span-2" value={form.images} onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))} />
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
