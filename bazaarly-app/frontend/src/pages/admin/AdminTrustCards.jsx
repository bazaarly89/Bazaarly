import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

const emptyForm = { icon: '%', title: '', description: '', position: 0 };

export default function AdminTrustCards() {
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => AdminApi.trustCards().then((r) => setCards(r.cards));
  useEffect(() => { load(); }, []);

  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({ icon: c.icon, title: c.title, description: c.description, position: c.position });
    setShowForm(true);
  };

  const startNew = () => { setEditingId(null); setForm({ ...emptyForm, position: cards.length }); setShowForm(true); };

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) await AdminApi.updateTrustCard(editingId, form);
    else await AdminApi.createTrustCard(form);
    setShowForm(false);
    load();
  };

  const toggleActive = async (c) => {
    await AdminApi.updateTrustCard(c.id, { isActive: !c.isActive });
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this card?')) return;
    await AdminApi.deleteTrustCard(id);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="section-title">"Why Choose Dostivox?" Cards</h1>
          <p className="text-sm text-slate-500">These 4 cards appear on the homepage. Edit the text or icon anytime — no code needed.</p>
        </div>
        <button onClick={startNew} className="btn-primary">+ Add Card</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card mb-6 grid gap-3 p-6 sm:grid-cols-2">
          <input placeholder="Icon (emoji or symbol, e.g. % ✓ 🚚)" className="input" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} />
          <input required placeholder="Title (e.g. Best Prices)" className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <input placeholder="Description (e.g. Guaranteed)" className="input sm:col-span-2" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <input type="number" placeholder="Display order (0 = first)" className="input" value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: Number(e.target.value) }))} />
          <div className="flex gap-3 sm:col-span-2">
            <button className="btn-primary">{editingId ? 'Update Card' : 'Create Card'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <div key={c.id} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-lg">{c.icon}</span>
                <div>
                  <p className="font-semibold text-slate-800">{c.title}</p>
                  <p className="text-sm text-slate-500">{c.description}</p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {c.isActive ? 'Visible' : 'Hidden'}
              </span>
            </div>
            <div className="mt-4 flex gap-3 text-sm">
              <button onClick={() => startEdit(c)} className="text-brand-600 hover:underline">Edit</button>
              <button onClick={() => toggleActive(c)} className="text-slate-500 hover:underline">{c.isActive ? 'Hide' : 'Show'}</button>
              <button onClick={() => remove(c.id)} className="text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
