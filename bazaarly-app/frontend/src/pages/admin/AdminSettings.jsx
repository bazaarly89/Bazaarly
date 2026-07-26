import React, { useEffect, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { AdminApi } from '../../api/client';

// Toolbar for the Hero Title editor — lets the admin select part of the
// text (e.g. just the word "Shop") and change its size and color.
const heroTitleModules = {
  toolbar: [
    [{ size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic'],
    [{ color: [] }],
    ['clean'],
  ],
};

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState(false);
  const [contentSaved, setContentSaved] = useState(false);

  useEffect(() => { AdminApi.settings().then((r) => setSettings(r.settings)); }, []);

  const field = (key) => settings[key] || '';
  const update = (key) => (e) => setSettings((s) => ({ ...s, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const { settings: updated } = await AdminApi.updateSettings(settings);
    setSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const submitContent = async (e) => {
    e.preventDefault();
    const contentKeys = [
      'home_hero_badge', 'home_hero_title', 'home_hero_subtitle',
      'home_hero_bg_from', 'home_hero_bg_to', 'home_hero_image',
      'home_promo_title', 'home_promo_text', 'home_trending_title',
      'about_heading', 'about_para1', 'about_para2',
      'about_stat1_num', 'about_stat1_label',
      'about_stat2_num', 'about_stat2_label',
      'about_stat3_num', 'about_stat3_label',
    ];
    const payload = Object.fromEntries(contentKeys.map((k) => [k, settings[k] || '']));
    const { settings: updated } = await AdminApi.updateSettings(payload);
    setSettings(updated);
    setContentSaved(true);
    setTimeout(() => setContentSaved(false), 2000);
  };

  return (
    <div>
      <h1 className="section-title mb-6">Store Settings</h1>
      <form onSubmit={submit} className="card max-w-lg space-y-4 p-6">
        <div>
          <label className="label">Store Name</label>
          <input className="input" value={settings.store_name || ''} onChange={(e) => setSettings((s) => ({ ...s, store_name: e.target.value }))} />
        </div>
        <div>
          <label className="label">Standard Shipping Fee (₹)</label>
          <input type="number" className="input" value={settings.shipping_fee || ''} onChange={(e) => setSettings((s) => ({ ...s, shipping_fee: e.target.value }))} />
        </div>
        <div>
          <label className="label">Free Shipping Above (₹)</label>
          <input type="number" className="input" value={settings.free_shipping_above || ''} onChange={(e) => setSettings((s) => ({ ...s, free_shipping_above: e.target.value }))} />
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary">Save Settings</button>
          {saved && <span className="text-sm text-green-600">Saved!</span>}
        </div>
      </form>

      {/* ---------------- WEBSITE CONTENT (Home / About text) ---------------- */}
      <form onSubmit={submitContent} className="card mt-6 max-w-lg space-y-4 p-6">
        <h2 className="font-semibold">Website Content — Home Page</h2>

        <div>
          <label className="label">Hero Badge (small pill text)</label>
          <input className="input" value={field('home_hero_badge')} onChange={update('home_hero_badge')} />
        </div>
        <div>
          <label className="label">Hero Title (select a word, then use the toolbar to resize / color it — e.g. make "Shop" big, "Live Beautifully" small)</label>
          <ReactQuill
            theme="snow"
            modules={heroTitleModules}
            value={field('home_hero_title')}
            onChange={(html) => setSettings((s) => ({ ...s, home_hero_title: html }))}
          />
        </div>
        <div>
          <label className="label">Hero Subtitle</label>
          <textarea className="input" rows={2} value={field('home_hero_subtitle')} onChange={update('home_hero_subtitle')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Background Color (top-left)</label>
            <input type="color" className="input h-10 p-1" value={field('home_hero_bg_from') || '#2c31ab'} onChange={update('home_hero_bg_from')} />
          </div>
          <div>
            <label className="label">Background Color (bottom-right)</label>
            <input type="color" className="input h-10 p-1" value={field('home_hero_bg_to') || '#4a5cf0'} onChange={update('home_hero_bg_to')} />
          </div>
        </div>
        <div>
          <label className="label">Hero Image (paste an image URL)</label>
          <input className="input" value={field('home_hero_image')} onChange={update('home_hero_image')} placeholder="https://..." />
          {field('home_hero_image') && (
            <img src={field('home_hero_image')} alt="Hero preview" className="mt-2 h-32 w-full rounded-lg object-cover" />
          )}
        </div>
        <div>
          <label className="label">Promo Banner Title</label>
          <input className="input" value={field('home_promo_title')} onChange={update('home_promo_title')} />
        </div>
        <div>
          <label className="label">Promo Banner Text</label>
          <textarea className="input" rows={2} value={field('home_promo_text')} onChange={update('home_promo_text')} />
        </div>
<div>
  <label className="label">Trending Section Title</label>
  <input className="input" value={field('home_trending_title')} onChange={update('home_trending_title')} />
</div>
        <h2 className="pt-2 font-semibold">Website Content — About Page</h2>

        <div>
          <label className="label">About Heading</label>
          <input className="input" value={field('about_heading')} onChange={update('about_heading')} />
        </div>
        <div>
          <label className="label">About Paragraph 1</label>
          <textarea className="input" rows={3} value={field('about_para1')} onChange={update('about_para1')} />
        </div>
        <div>
          <label className="label">About Paragraph 2</label>
          <textarea className="input" rows={3} value={field('about_para2')} onChange={update('about_para2')} />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Stat 1 Number</label>
            <input className="input" value={field('about_stat1_num')} onChange={update('about_stat1_num')} />
          </div>
          <div>
            <label className="label">Stat 2 Number</label>
            <input className="input" value={field('about_stat2_num')} onChange={update('about_stat2_num')} />
          </div>
          <div>
            <label className="label">Stat 3 Number</label>
            <input className="input" value={field('about_stat3_num')} onChange={update('about_stat3_num')} />
          </div>
          <div>
            <label className="label">Stat 1 Label</label>
            <input className="input" value={field('about_stat1_label')} onChange={update('about_stat1_label')} />
          </div>
          <div>
            <label className="label">Stat 2 Label</label>
            <input className="input" value={field('about_stat2_label')} onChange={update('about_stat2_label')} />
          </div>
          <div>
            <label className="label">Stat 3 Label</label>
            <input className="input" value={field('about_stat3_label')} onChange={update('about_stat3_label')} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-primary">Save Website Content</button>
          {contentSaved && <span className="text-sm text-green-600">Saved!</span>}
        </div>
      </form>

      <div className="card mt-6 max-w-lg p-6">
        <h2 className="mb-2 font-semibold">Payment Gateway</h2>
        <p className="text-sm text-slate-500">Razorpay keys are configured via the backend <code>.env</code> file (<code>RAZORPAY_KEY_ID</code> / <code>RAZORPAY_KEY_SECRET</code>) and are not editable from this panel for security reasons.</p>
      </div>
    </div>
  );
}
