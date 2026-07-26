import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

// Same Cloudinary unsigned upload used for category/product/banner images —
// so hero slide images upload the exact same way, no URL typing needed.
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

const emptyForm = {
  mode: 'text', image: '', eyebrow: '', title: '', subtitle: '',
  specsText: '', ctaText: '', ctaLink: '', position: 0, imageFit: 'cover',
};

export default function AdminHeroSlides() {
  const [slides, setSlides] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () => AdminApi.heroSlides().then((r) => setSlides(r.slides));
  useEffect(() => { load(); }, []);

  const startNew = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };

  const startEdit = (s) => {
    setEditingId(s.id);
    setForm({
      mode: s.mode || 'text',
      image: s.image || '',
      eyebrow: s.eyebrow || '',
      title: s.title || '',
      subtitle: s.subtitle || '',
      specsText: (s.specs || []).join(', '),
      ctaText: s.cta_text || '',
      ctaLink: s.cta_link || '',
      position: s.position ?? 0,
imageFit: s.image_fit || 'cover',
    });
    setShowForm(true);
  };

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
    if (!form.image) { alert('Please upload a slide image first.'); return; }
    const payload = {
      mode: form.mode,
      image: form.image,
      eyebrow: form.eyebrow,
      title: form.title,
      subtitle: form.subtitle,
      specs: form.specsText.split(',').map((s) => s.trim()).filter(Boolean),
      ctaText: form.ctaText,
      ctaLink: form.ctaLink,
      position: form.position,
imageFit: form.imageFit,
    };
    if (editingId) await AdminApi.updateHeroSlide(editingId, payload);
    else await AdminApi.createHeroSlide(payload);
    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this slide?')) return;
    await AdminApi.deleteHeroSlide(id);
    load();
  };

  const toggleActive = async (s) => {
    await AdminApi.updateHeroSlide(s.id, { isActive: s.is_active ? false : true });
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="section-title">Homepage Hero Slideshow</h1>
        <button onClick={startNew} className="btn-primary">+ Add Slide</button>
      </div>
      <p className="mb-4 text-sm text-slate-500">
        These are the auto-playing slides at the very top of the homepage. Slides show in "Position" order (0 first) and rotate automatically every few seconds.
      </p>

      {showForm && (
        <form onSubmit={submit} className="card mb-6 grid gap-3 p-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-500">Slide type</label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={form.mode === 'text'} onChange={() => setForm((f) => ({ ...f, mode: 'text' }))} />
                Image + text overlay
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={form.mode === 'banner'} onChange={() => setForm((f) => ({ ...f, mode: 'banner' }))} />
                Image only (poster/pamphlet, no text)
              </label>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-500">Slide Image</label>
            <input type="file" accept="image/*" onChange={handleImageSelect} disabled={uploading} className="input" />
            {uploading && <p className="mt-1 text-sm text-brand-600">Uploading...</p>}
            {form.image && (
              <div className="relative mt-2 inline-block">
                <img src={form.image} alt="" className="h-24 w-40 rounded object-cover" />
                <button type="button" onClick={() => setForm((f) => ({ ...f, image: '' }))} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">×</button>
              </div>
            )}
         
<label className="mt-3 block text-sm text-slate-500">Image fit</label>
<select className="input" value={form.imageFit} onChange={(e) => setForm((f) => ({ ...f, imageFit: e.target.value }))}>
  <option value="cover">Fill box (may crop image)</option>
  <option value="contain">Show full image (may leave empty space)</option>
</select>
</div>

{form.mode === 'text' && (
            <>
              <input placeholder="Eyebrow (e.g. New Launch)" className="input" value={form.eyebrow} onChange={(e) => setForm((f) => ({ ...f, eyebrow: e.target.value }))} />
              <input placeholder="Slide order (0, 1, 2...)" type="number" className="input" value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} />
              <input required placeholder="Title" className="input sm:col-span-2" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              <input placeholder="Subtitle" className="input sm:col-span-2" value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
              <input placeholder="Spec chips, comma separated (e.g. 40Hrs Battery, ANC, Up to 25% Off)" className="input sm:col-span-2" value={form.specsText} onChange={(e) => setForm((f) => ({ ...f, specsText: e.target.value }))} />
              <input placeholder="Button text (e.g. Shop Headphones)" className="input" value={form.ctaText} onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))} />
              <input placeholder="Button link (e.g. /categories/electronics)" className="input" value={form.ctaLink} onChange={(e) => setForm((f) => ({ ...f, ctaLink: e.target.value }))} />
            </>
          )}

          {form.mode === 'banner' && (
            <>
              <input placeholder="Slide order (0, 1, 2...)" type="number" className="input" value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} />
              <input placeholder="Link when clicked (optional)" className="input" value={form.ctaLink} onChange={(e) => setForm((f) => ({ ...f, ctaLink: e.target.value }))} />
            </>
          )}

          <div className="flex gap-3 sm:col-span-2">
            <button className="btn-primary" disabled={uploading}>{editingId ? 'Update Slide' : 'Add Slide'}</button>
            <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {slides.map((s) => (
          <div key={s.id} className={`card flex items-center gap-4 p-4 ${!s.is_active ? 'opacity-50' : ''}`}>
            <img src={s.image} alt={s.title} className="h-20 w-32 rounded-lg object-cover" />
            <div className="flex-1">
              <p className="font-semibold">{s.title || '(image only banner)'}</p>
              <p className="text-sm text-slate-500">{s.mode === 'banner' ? 'Image-only slide' : s.subtitle} · Position {s.position}</p>
              <span className={`text-xs font-semibold ${s.is_active ? 'text-green-600' : 'text-slate-400'}`}>
                {s.is_active ? 'Visible on homepage' : 'Hidden'}
              </span>
            </div>
            <div className="space-x-3 text-sm">
              <button onClick={() => startEdit(s)} className="text-brand-600 hover:underline">Edit</button>
              <button onClick={() => toggleActive(s)} className="text-slate-500 hover:underline">
                {s.is_active ? 'Hide' : 'Show'}
              </button>
              <button onClick={() => remove(s.id)} className="text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
