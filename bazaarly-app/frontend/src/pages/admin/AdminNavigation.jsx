import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

const emptyForm = { label: '', url: '', icon: '', isExternal: false, position: 0, parentId: '' };

export default function AdminNavigation() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => AdminApi.navItems().then((r) => setItems(r.items));
  useEffect(() => { load(); }, []);

  const startNew = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };

  const startEdit = (i) => {
    setEditingId(i.id);
    setForm({
      label: i.label || '',
      url: i.url || '',
      icon: i.icon || '',
      isExternal: !!i.isExternal,
      position: i.position ?? 0,
      parentId: i.parentId || '',
    });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, parentId: form.parentId || null };
    if (editingId) await AdminApi.updateNavItem(editingId, payload);
    else await AdminApi.createNavItem(payload);
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this menu item?')) return;
    await AdminApi.deleteNavItem(id);
    load();
  };

  const toggleVisible = async (i) => {
    await AdminApi.updateNavItem(i.id, { isVisible: i.isVisible ? false : true });
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="section-title">Navigation Menu</h1>
        <button onClick={startNew} className="btn-primary">+ Add Menu Item</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card mb-6 grid gap-3 p-6 sm:grid-cols-2">
          <input required placeholder="Label (e.g. Mobiles)" className="input" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
          <input required placeholder="URL (e.g. /categories/mobiles)" className="input" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
          <input placeholder="Icon (optional, e.g. emoji or icon name)" className="input" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} />
          <input type="number" placeholder="Menu order (0, 1, 2...)" className="input" value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} />
          <select className="input" value={form.parentId} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}>
            <option value="">No parent (top-level item)</option>
            {items.filter((i) => !i.parentId && i.id !== editingId).map((i) => (
              <option key={i.id} value={i.id}>Under: {i.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={form.isExternal} onChange={(e) => setForm((f) => ({ ...f, isExternal: e.target.checked }))} />
            Opens in a new tab (external link)
          </label>

          <div className="flex gap-3 sm:col-span-2">
            <button className="btn-primary">{editingId ? 'Update Item' : 'Add Item'}</button>
            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {items.map((i) => (
          <div key={i.id} className={`card flex items-center gap-4 p-4 ${!i.isVisible ? 'opacity-50' : ''}`}>
            <div className="flex-1">
              <p className="font-semibold">{i.icon ? `${i.icon} ` : ''}{i.label}{i.parentId ? ' (submenu)' : ''}</p>
              <p className="text-sm text-slate-500">Links to {i.url} · Position {i.position}{i.isExternal ? ' · Opens in new tab' : ''}</p>
              <span className={`text-xs font-semibold ${i.isVisible ? 'text-green-600' : 'text-slate-400'}`}>
                {i.isVisible ? 'Visible in menu' : 'Hidden'}
              </span>
            </div>
            <div className="space-x-3 text-sm">
              <button onClick={() => startEdit(i)} className="text-brand-600 hover:underline">Edit</button>
              <button onClick={() => toggleVisible(i)} className="text-slate-500 hover:underline">
                {i.isVisible ? 'Hide' : 'Show'}
              </button>
              <button onClick={() => remove(i.id)} className="text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-500">No menu items yet. Add one to get started.</p>}
      </div>
    </div>
  );
}
