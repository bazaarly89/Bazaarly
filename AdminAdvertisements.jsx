import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', image: '' });

  const load = () => AdminApi.categories().then((r) => setCategories(r.categories));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    await AdminApi.createCategory(form);
    setForm({ name: '', image: '' });
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this category?')) return;
    await AdminApi.deleteCategory(id);
    load();
  };

  return (
    <div>
      <h1 className="section-title mb-6">Categories</h1>
      <form onSubmit={submit} className="card mb-6 flex flex-wrap gap-3 p-6">
        <input required placeholder="Category name" className="input flex-1 min-w-[200px]" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <input placeholder="Image URL" className="input flex-1 min-w-[200px]" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} />
        <button className="btn-primary">Add Category</button>
      </form>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c) => (
          <div key={c.id} className="card overflow-hidden">
            <img src={c.image} alt={c.name} className="aspect-video w-full object-cover" />
            <div className="flex items-center justify-between p-3">
              <p className="text-sm font-semibold">{c.name}</p>
              <button onClick={() => remove(c.id)} className="text-xs text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
