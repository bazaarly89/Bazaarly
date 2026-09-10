import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

const emptyColumnForm = { title: '', position: 0 };
const emptyLinkForm = { columnId: '', label: '', url: '', position: 0 };

export default function AdminFooter() {
  const [columns, setColumns] = useState([]);
  const [columnForm, setColumnForm] = useState(emptyColumnForm);
  const [editingColumnId, setEditingColumnId] = useState(null);
  const [showColumnForm, setShowColumnForm] = useState(false);

  const [linkForm, setLinkForm] = useState(emptyLinkForm);
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [showLinkFormFor, setShowLinkFormFor] = useState(null);

  const load = () => AdminApi.footerColumns().then((r) => setColumns(r.columns));
  useEffect(() => { load(); }, []);

  // ---- Columns ----
  const startNewColumn = () => { setEditingColumnId(null); setColumnForm(emptyColumnForm); setShowColumnForm(true); };
  const startEditColumn = (c) => { setEditingColumnId(c.id); setColumnForm({ title: c.title || '', position: c.position ?? 0 }); setShowColumnForm(true); };

  const submitColumn = async (e) => {
    e.preventDefault();
    if (editingColumnId) await AdminApi.updateFooterColumn(editingColumnId, columnForm);
    else await AdminApi.createFooterColumn(columnForm);
    setShowColumnForm(false);
    setColumnForm(emptyColumnForm);
    setEditingColumnId(null);
    load();
  };

  const removeColumn = async (id) => {
    if (!confirm('Delete this column and all its links?')) return;
    await AdminApi.deleteFooterColumn(id);
    load();
  };

  // ---- Links ----
  const startNewLink = (columnId) => { setEditingLinkId(null); setLinkForm({ ...emptyLinkForm, columnId }); setShowLinkFormFor(columnId); };
  const startEditLink = (l) => { setEditingLinkId(l.id); setLinkForm({ columnId: l.columnId, label: l.label || '', url: l.url || '', position: l.position ?? 0 }); setShowLinkFormFor(l.columnId); };

  const submitLink = async (e) => {
    e.preventDefault();
    if (editingLinkId) await AdminApi.updateFooterLink(editingLinkId, linkForm);
    else await AdminApi.createFooterLink(linkForm);
    setShowLinkFormFor(null);
    setLinkForm(emptyLinkForm);
    setEditingLinkId(null);
    load();
  };

  const removeLink = async (id) => {
    if (!confirm('Delete this link?')) return;
    await AdminApi.deleteFooterLink(id);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="section-title">Footer Menu</h1>
        <button onClick={startNewColumn} className="btn-primary">+ Add Column</button>
      </div>

      {showColumnForm && (
        <form onSubmit={submitColumn} className="card mb-6 grid gap-3 p-6 sm:grid-cols-2">
          <input required placeholder="Column title (e.g. Company)" className="input" value={columnForm.title} onChange={(e) => setColumnForm((f) => ({ ...f, title: e.target.value }))} />
          <input type="number" placeholder="Column order (0, 1, 2...)" className="input" value={columnForm.position} onChange={(e) => setColumnForm((f) => ({ ...f, position: e.target.value }))} />
          <div className="flex gap-3 sm:col-span-2">
            <button className="btn-primary">{editingColumnId ? 'Update Column' : 'Add Column'}</button>
            <button type="button" onClick={() => { setShowColumnForm(false); setColumnForm(emptyColumnForm); setEditingColumnId(null); }} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {columns.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">{c.title}</p>
                <p className="text-sm text-slate-500">Position {c.position}</p>
              </div>
              <div className="space-x-3 text-sm">
                <button onClick={() => startEditColumn(c)} className="text-brand-600 hover:underline">Edit</button>
                <button onClick={() => startNewLink(c.id)} className="text-brand-600 hover:underline">+ Add Link</button>
                <button onClick={() => removeColumn(c.id)} className="text-red-500 hover:underline">Delete</button>
              </div>
            </div>

            {showLinkFormFor === c.id && (
              <form onSubmit={submitLink} className="mb-3 grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
                <input required placeholder="Link label (e.g. About Us)" className="input" value={linkForm.label} onChange={(e) => setLinkForm((f) => ({ ...f, label: e.target.value }))} />
                <input required placeholder="URL (e.g. /about)" className="input" value={linkForm.url} onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))} />
                <input type="number" placeholder="Link order" className="input" value={linkForm.position} onChange={(e) => setLinkForm((f) => ({ ...f, position: e.target.value }))} />
                <div className="flex gap-3 sm:col-span-2">
                  <button className="btn-primary">{editingLinkId ? 'Update Link' : 'Add Link'}</button>
                  <button type="button" onClick={() => { setShowLinkFormFor(null); setLinkForm(emptyLinkForm); setEditingLinkId(null); }} className="btn-ghost">Cancel</button>
                </div>
              </form>
            )}

            <ul className="space-y-1">
              {(c.links || []).map((l) => (
                <li key={l.id} className="flex items-center justify-between text-sm">
                  <span>{l.label} <span className="text-slate-400">→ {l.url}</span></span>
                  <span className="space-x-3">
                    <button onClick={() => startEditLink(l)} className="text-brand-600 hover:underline">Edit</button>
                    <button onClick={() => removeLink(l.id)} className="text-red-500 hover:underline">Delete</button>
                  </span>
                </li>
              ))}
              {(!c.links || c.links.length === 0) && <li className="text-sm text-slate-400">No links yet.</li>}
            </ul>
          </div>
        ))}
        {columns.length === 0 && <p className="text-sm text-slate-500">No footer columns yet. Add one to get started.</p>}
      </div>
    </div>
  );
}
