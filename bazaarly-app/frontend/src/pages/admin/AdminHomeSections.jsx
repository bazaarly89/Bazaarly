import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

const LABELS = {
  categories: 'Shop by Category',
  trending: 'Trending Products',
  deals: "Today's Best Deals",
  budget: 'Best Under Budget',
  compare: 'Compare Products',
  buying_guides: 'Buying Guides',
  tools: 'Free Tools by Dostivox',
  trust_cards: 'Why Choose Us Cards',
};

export default function AdminHomeSections() {
  const [sections, setSections] = useState([]);
  const [saved, setSaved] = useState(null);

  const load = () => AdminApi.homeSections().then((r) => setSections(r.sections.sort((a, b) => a.position - b.position)));
  useEffect(() => { load(); }, []);

  const updateField = (id, field, value) => {
    setSections((list) => list.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const save = async (s) => {
    await AdminApi.updateHomeSection(s.id, {
      title: s.title, subtitle: s.subtitle, buttonText: s.buttonText, buttonLink: s.buttonLink, isEnabled: s.isEnabled,
    });
    setSaved(s.id);
    setTimeout(() => setSaved(null), 1500);
  };

  const toggleEnabled = async (s) => {
    const next = { ...s, isEnabled: !s.isEnabled };
    setSections((list) => list.map((x) => (x.id === s.id ? next : x)));
    await AdminApi.updateHomeSection(s.id, { isEnabled: next.isEnabled });
  };

  const move = async (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= sections.length) return;
    const reordered = [...sections];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    const withPositions = reordered.map((s, i) => ({ ...s, position: i }));
    setSections(withPositions);
    await AdminApi.reorderHomeSections(withPositions.map((s) => ({ id: s.id, position: s.position })));
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="section-title">Homepage Sections</h1>
        <p className="text-sm text-slate-500">
          Control the order, titles and visibility of the sections below the hero banner. Use the arrows to reorder.
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((s, i) => (
          <div key={s.id} className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <button disabled={i === 0} onClick={() => move(i, -1)} className="text-slate-400 hover:text-brand-600 disabled:opacity-30">▲</button>
                  <button disabled={i === sections.length - 1} onClick={() => move(i, 1)} className="text-slate-400 hover:text-brand-600 disabled:opacity-30">▼</button>
                </div>
                <h3 className="font-semibold text-slate-800">{LABELS[s.key] || s.key}</h3>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={s.isEnabled !== false} onChange={() => toggleEnabled(s)} />
                {s.isEnabled !== false ? 'Enabled' : 'Hidden'}
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Section Title</label>
                <input className="input" value={s.title || ''} onChange={(e) => updateField(s.id, 'title', e.target.value)} />
              </div>
              <div>
                <label className="label">Subtitle (optional)</label>
                <input className="input" value={s.subtitle || ''} onChange={(e) => updateField(s.id, 'subtitle', e.target.value)} />
              </div>
              <div>
                <label className="label">Button Text</label>
                <input className="input" value={s.buttonText || ''} onChange={(e) => updateField(s.id, 'buttonText', e.target.value)} />
              </div>
              <div>
                <label className="label">Button Link</label>
                <input className="input" value={s.buttonLink || ''} onChange={(e) => updateField(s.id, 'buttonLink', e.target.value)} />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <button onClick={() => save(s)} className="btn-primary text-sm py-1.5 px-4">Save</button>
              {saved === s.id && <span className="text-sm text-green-600">Saved!</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
