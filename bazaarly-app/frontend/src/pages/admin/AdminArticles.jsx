import React, { useEffect, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { AdminApi } from '../../api/client';

// Same Cloudinary unsigned upload used everywhere else in the admin panel
// (banners, products, categories) — so article images upload the same way.
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

const CATEGORIES = ['Buying Guides', 'Comparisons', 'How-To', 'Deals', 'Tech', 'Gaming', 'Creator', 'AI & Tools'];

// Full toolbar — articles need headings, links and images, not just bold/italic.
const contentModules = {
  toolbar: [
    [{ header: [false, 1, 2, 3] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image', 'blockquote'],
    ['clean'],
  ],
};

const emptyForm = {
  title: '', slug: '', featuredImage: '', author: 'Dostivox Team', category: 'Buying Guides',
  content: '', faq: [{ question: '', answer: '' }], relatedProductIds: [],
  seoTitle: '', seoDescription: '', canonicalUrl: '', ogImage: '',
  isPublished: true, publishedAt: new Date().toISOString().slice(0, 10),
};

function slugPreview(str) {
  return String(str).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function wordCount(html) {
  const text = String(html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
  return text ? text.split(/\s+/).length : 0;
}

export default function AdminArticles() {
  const [articles, setArticles] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const load = () => AdminApi.articles().then((r) => setArticles(r.articles));
  useEffect(() => { load(); AdminApi.products().then((r) => setProducts(r.products)); }, []);

  const startNew = () => { setEditingId(null); setForm(emptyForm); setError(''); setShowForm(true); };

  const startEdit = (a) => {
    setEditingId(a.id);
    setForm({
      title: a.title || '', slug: a.slug || '', featuredImage: a.featuredImage || '',
      author: a.author || 'Dostivox Team', category: a.category || 'Buying Guides',
      content: a.content || '', faq: a.faq?.length ? a.faq : [{ question: '', answer: '' }],
      relatedProductIds: a.relatedProductIds || [],
      seoTitle: a.seoTitle || '', seoDescription: a.seoDescription || '',
      canonicalUrl: a.canonicalUrl || '', ogImage: a.ogImage || '',
      isPublished: a.isPublished !== false,
      publishedAt: a.publishedAt ? new Date(a.publishedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
    setError('');
    setShowForm(true);
  };

  const handleImageSelect = (field) => async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadingField(field);
    try {
      const url = await uploadImageToCloudinary(file);
      setForm((f) => ({ ...f, [field]: url }));
    } catch (err) {
      alert('Image upload failed: ' + err.message);
    } finally {
      setUploadingField(null);
      e.target.value = '';
    }
  };

  const updateFaq = (i, key, value) => {
    setForm((f) => ({ ...f, faq: f.faq.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)) }));
  };
  const addFaqRow = () => setForm((f) => ({ ...f, faq: [...f.faq, { question: '', answer: '' }] }));
  const removeFaqRow = (i) => setForm((f) => ({ ...f, faq: f.faq.filter((_, idx) => idx !== i) }));

  const toggleRelatedProduct = (id) => {
    setForm((f) => ({
      ...f,
      relatedProductIds: f.relatedProductIds.includes(id)
        ? f.relatedProductIds.filter((pid) => pid !== id)
        : [...f.relatedProductIds, id],
    }));
  };

  const contentWords = useMemo(() => wordCount(form.content), [form.content]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) return setError('Title is required.');
    if (!form.content.trim() || contentWords < 20) return setError('Please write real article content — thin, near-empty pages hurt SEO and won\'t be indexed well by Google.');

    setSaving(true);
    try {
      const payload = {
        ...form,
        faq: form.faq.filter((f) => f.question.trim() && f.answer.trim()),
      };
      if (editingId) await AdminApi.updateArticle(editingId, payload);
      else await AdminApi.createArticle(payload);
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this article? This cannot be undone.')) return;
    await AdminApi.deleteArticle(id);
    load();
  };

  const togglePublished = async (a) => {
    await AdminApi.updateArticle(a.id, { isPublished: !a.isPublished });
    load();
  };

  const filteredArticles = filter ? articles.filter((a) => a.category === filter) : articles;
  const filteredProducts = productSearch
    ? products.filter((p) => p.title.toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="section-title">Buying Guides / Blog</h1>
          <p className="mt-1 text-sm text-slate-500">Write genuinely useful articles — avoid thin, keyword-stuffed pages. Quality over quantity keeps this eligible for Google search.</p>
        </div>
        <button onClick={startNew} className="btn-primary shrink-0">+ New Article</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card mb-8 space-y-6 p-6">
          {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          {/* ---- Core fields ---- */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Title</label>
              <input
                required
                className="input"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, slug: f.slug || slugPreview(e.target.value) }))}
              />
            </div>
            <div>
              <label className="label">Slug (URL)</label>
              <input
                className="input"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder={slugPreview(form.title)}
              />
              <p className="mt-1 text-xs text-slate-400">/blog/{form.slug || slugPreview(form.title) || 'your-article-slug'}</p>
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Author</label>
              <input className="input" value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} />
            </div>
            <div>
              <label className="label">Publish Date</label>
              <input type="date" className="input" value={form.publishedAt} onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))} />
            </div>
          </div>

          {/* ---- Featured image ---- */}
          <div>
            <label className="label">Featured Image</label>
            <input type="file" accept="image/*" onChange={handleImageSelect('featuredImage')} disabled={uploadingField === 'featuredImage'} className="input" />
            {uploadingField === 'featuredImage' && <p className="mt-1 text-sm text-brand-600">Uploading...</p>}
            {form.featuredImage && (
              <div className="relative mt-2 inline-block">
                <img src={form.featuredImage} alt="" className="h-28 w-48 rounded-lg object-cover" />
                <button type="button" onClick={() => setForm((f) => ({ ...f, featuredImage: '' }))} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">×</button>
              </div>
            )}
          </div>

          {/* ---- Content ---- */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="label mb-0">Content</label>
              <span className={`text-xs ${contentWords < 300 ? 'text-amber-600' : 'text-green-600'}`}>
                {contentWords} words {contentWords < 300 && '— aim for 300+ for genuinely useful, search-friendly content'}
              </span>
            </div>
            <ReactQuill
              theme="snow"
              modules={contentModules}
              value={form.content}
              onChange={(html) => setForm((f) => ({ ...f, content: html }))}
            />
          </div>

          {/* ---- FAQ ---- */}
          <div>
            <label className="label">FAQ</label>
            <div className="space-y-3">
              {form.faq.map((row, i) => (
                <div key={i} className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_auto]">
                  <input placeholder="Question" className="input" value={row.question} onChange={(e) => updateFaq(i, 'question', e.target.value)} />
                  <textarea placeholder="Answer" rows={2} className="input" value={row.answer} onChange={(e) => updateFaq(i, 'answer', e.target.value)} />
                  <button type="button" onClick={() => removeFaqRow(i)} className="text-sm text-red-500 hover:underline sm:self-start">Remove</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addFaqRow} className="btn-ghost mt-2 text-sm">+ Add FAQ</button>
          </div>

          {/* ---- Related products ---- */}
          <div>
            <label className="label">Related Products</label>
            <input
              placeholder="Search products to link..."
              className="input mb-2"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
              {filteredProducts.slice(0, 100).map((p) => (
                <label key={p.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
                  <input type="checkbox" checked={form.relatedProductIds.includes(p.id)} onChange={() => toggleRelatedProduct(p.id)} />
                  {p.title}
                </label>
              ))}
              {filteredProducts.length === 0 && <p className="px-2 py-1 text-sm text-slate-400">No products match.</p>}
            </div>
            {form.relatedProductIds.length > 0 && <p className="mt-1 text-xs text-slate-400">{form.relatedProductIds.length} product(s) linked</p>}
          </div>

          {/* ---- SEO ---- */}
          <div className="rounded-lg border border-slate-200 p-4">
            <h3 className="mb-3 font-semibold">SEO</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">SEO Title <span className="text-xs font-normal text-slate-400">({form.seoTitle.length}/60)</span></label>
                <input className="input" value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} placeholder={form.title} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">SEO Description <span className="text-xs font-normal text-slate-400">({form.seoDescription.length}/160)</span></label>
                <textarea rows={2} className="input" value={form.seoDescription} onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))} />
              </div>
              <div>
                <label className="label">Canonical URL</label>
                <input className="input" value={form.canonicalUrl} onChange={(e) => setForm((f) => ({ ...f, canonicalUrl: e.target.value }))} placeholder={`https://yourdomain.com/blog/${form.slug || 'slug'}`} />
              </div>
              <div>
                <label className="label">OG Image</label>
                <input type="file" accept="image/*" onChange={handleImageSelect('ogImage')} disabled={uploadingField === 'ogImage'} className="input" />
                {uploadingField === 'ogImage' && <p className="mt-1 text-sm text-brand-600">Uploading...</p>}
                {(form.ogImage || form.featuredImage) && (
                  <img src={form.ogImage || form.featuredImage} alt="" className="mt-2 h-16 w-28 rounded object-cover" />
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))} />
              Published (visible on the site)
            </label>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }} className="btn-ghost">Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : (editingId ? 'Update Article' : 'Publish Article')}</button>
            </div>
          </div>
        </form>
      )}

      {/* ---- List ---- */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setFilter('')} className={`rounded-full px-3 py-1.5 text-xs font-medium ${!filter ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilter(c)} className={`rounded-full px-3 py-1.5 text-xs font-medium ${filter === c ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{c}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredArticles.map((a) => (
          <div key={a.id} className={`card flex flex-wrap items-center gap-4 p-4 ${!a.isPublished ? 'opacity-60' : ''}`}>
            <img src={a.featuredImage || 'https://picsum.photos/seed/placeholder/200/140'} alt="" className="h-16 w-24 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{a.title}</p>
              <p className="text-sm text-slate-500">{a.category} · /blog/{a.slug}</p>
              <span className={`text-xs font-semibold ${a.isPublished ? 'text-green-600' : 'text-slate-400'}`}>
                {a.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="space-x-3 text-sm">
              <button onClick={() => startEdit(a)} className="text-brand-600 hover:underline">Edit</button>
              <button onClick={() => togglePublished(a)} className="text-slate-500 hover:underline">{a.isPublished ? 'Unpublish' : 'Publish'}</button>
              <button onClick={() => remove(a.id)} className="text-red-500 hover:underline">Delete</button>
            </div>
          </div>
        ))}
        {filteredArticles.length === 0 && (
          <div className="rounded-xl2 border border-dashed border-slate-300 py-16 text-center text-slate-400">No articles yet.</div>
        )}
      </div>
    </div>
  );
}
