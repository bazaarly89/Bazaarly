import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { AdminApi } from '../../api/client';
import MerchantBadge from '../../components/MerchantBadge';

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

// Toolbar for the description editor — bold/italic/underline, headings, text &
// highlight color, alignment, lists and links, so descriptions can be styled
// (not just plain text) without needing any design tool.
const descriptionModules = {
  toolbar: [
    [{ header: [false, 1, 2, 3] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'blockquote'],
    ['clean'],
  ],
};

const emptyOffer = { merchant: '', merchantLogo: '', customMerchant: '', affiliateUrl: '', regularUrl: '', ctaText: 'Check Deal', currentPrice: '', originalPrice: '', discountPercentage: '' };

const emptyForm = {
  productType: 'own',
  title: '', description: '', shortDescription: '', categoryId: '', brand: '',
  images: [], tags: '',
  featured: false, trending: false, deal: false, isRecommended: false,
  specs: [{ key: '', value: '' }],

  // own-product fields
  price: '', mrp: '', stock: '', sku: '',

  // affiliate-product fields
  offers: [{ ...emptyOffer }],
  pros: '', cons: '', editorScore: '', comparisonEnabled: false,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editingMeta, setEditingMeta] = useState(null); // { updatedAt }
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingLogoFor, setSavingLogoFor] = useState(null); // offer index currently uploading a custom logo
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all | own | affiliate

  const load = () => AdminApi.products().then((r) => setProducts(r.products));
  useEffect(() => {
    load();
    AdminApi.categories().then((r) => setCategories(r.categories));
    AdminApi.merchants().then((r) => setMerchants(r.merchants));
  }, []);

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditingMeta({ updatedAt: p.updatedAt });
    const rawOffers = p.offers?.length ? p.offers : (p.productType === 'affiliate' ? [{
      merchant: p.merchant, merchantLogo: p.merchantLogo, affiliateUrl: p.affiliateUrl,
      regularUrl: p.regularUrl, ctaText: p.ctaText, currentPrice: p.currentPrice,
      originalPrice: p.originalPrice, discountPercentage: p.discountPercentage,
    }] : []);
    const offers = rawOffers.length ? rawOffers.map((o) => {
      const isKnown = merchants.some((m) => m.name.toLowerCase() === (o.merchant || '').toLowerCase());
      return {
        merchant: isKnown ? o.merchant : (o.merchant ? '__other__' : ''),
        merchantLogo: o.merchantLogo || '',
        customMerchant: isKnown ? '' : (o.merchant || ''),
        affiliateUrl: o.affiliateUrl || '', regularUrl: o.regularUrl || '', ctaText: o.ctaText || 'Check Deal',
        currentPrice: o.currentPrice ?? '', originalPrice: o.originalPrice ?? '', discountPercentage: o.discountPercentage ?? '',
      };
    }) : [{ ...emptyOffer }];

    setForm({
      productType: p.productType || 'own',
      title: p.title || '', description: p.description || '', shortDescription: p.shortDescription || '',
      categoryId: p.category_id || p.categoryId || '', brand: p.brand || '', images: p.images || [],
      tags: (p.tags || []).join(', '),
      featured: !!p.featured, trending: !!p.trending, deal: !!p.deal, isRecommended: !!p.isRecommended,
      specs: (p.attributes || []).length ? p.attributes.map((a) => ({ key: a.key ?? a.attr_key ?? '', value: a.value ?? a.attr_value ?? '' })) : [{ key: '', value: '' }],

      price: p.price ?? '', mrp: p.mrp ?? '', stock: p.stock ?? '', sku: p.sku || '',

      offers,
      pros: (p.pros || []).join('\n'), cons: (p.cons || []).join('\n'),
      editorScore: p.editorScore ?? '', comparisonEnabled: !!p.comparisonEnabled,
    });
    setShowForm(true);
  };

  const startNew = () => { setEditingId(null); setEditingMeta(null); setForm(emptyForm); setShowForm(true); };

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

  // ---- specifications (key/value) editor helpers ----
  const updateSpec = (i, field, value) => {
    setForm((f) => {
      const specs = f.specs.slice();
      specs[i] = { ...specs[i], [field]: value };
      return { ...f, specs };
    });
  };
  const addSpecRow = () => setForm((f) => ({ ...f, specs: [...f.specs, { key: '', value: '' }] }));
  const removeSpecRow = (i) => setForm((f) => ({ ...f, specs: f.specs.filter((_, idx) => idx !== i) }));

  // ---- offers (one row per merchant: Amazon, Flipkart, etc.) ----
  const updateOffer = (i, field, value) => {
    setForm((f) => {
      const offers = f.offers.slice();
      offers[i] = { ...offers[i], [field]: value };
      return { ...f, offers };
    });
  };
  const pickOfferMerchant = (i, merchantName) => {
    const m = merchants.find((mm) => mm.name === merchantName);
    setForm((f) => {
      const offers = f.offers.slice();
      offers[i] = { ...offers[i], merchant: merchantName, merchantLogo: m?.logo || '', customMerchant: '' };
      return { ...f, offers };
    });
  };
  const addOfferRow = () => setForm((f) => ({ ...f, offers: [...f.offers, { ...emptyOffer }] }));
  const removeOfferRow = (i) => setForm((f) => ({ ...f, offers: f.offers.filter((_, idx) => idx !== i) }));

  const handleOfferLogoSelect = async (i, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setSavingLogoFor(i);
    try {
      const url = await uploadImageToCloudinary(file);
      updateOffer(i, 'merchantLogo', url);
    } catch (err) {
      alert('Logo upload failed: ' + err.message);
    } finally {
      setSavingLogoFor(null);
      e.target.value = '';
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const isAffiliate = form.productType === 'affiliate';

    const attributes = form.specs
      .filter((s) => s.key.trim() || s.value.trim())
      .map((s) => ({ key: s.key.trim(), value: s.value.trim() }));

    const payload = {
      productType: form.productType,
      title: form.title,
      description: form.description,
      shortDescription: form.shortDescription,
      categoryId: form.categoryId,
      brand: form.brand,
      images: form.images && form.images.length ? form.images : undefined,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      featured: form.featured, trending: form.trending, deal: form.deal, isRecommended: form.isRecommended,
      attributes,
    };

    if (isAffiliate) {
      const resolvedOffers = form.offers.map((o) => ({
        merchant: o.merchant === '__other__' ? o.customMerchant.trim() : o.merchant,
        merchantLogo: o.merchantLogo,
        affiliateUrl: o.affiliateUrl.trim(),
        regularUrl: o.regularUrl.trim(),
        ctaText: o.ctaText || 'Check Deal',
        currentPrice: o.currentPrice === '' ? undefined : Number(o.currentPrice),
        originalPrice: o.originalPrice === '' ? undefined : Number(o.originalPrice),
        discountPercentage: o.discountPercentage === '' ? undefined : Number(o.discountPercentage),
      })).filter((o) => o.affiliateUrl);

      if (!resolvedOffers.length) {
        alert('Add at least one store with an affiliate link.');
        return;
      }
      const missingMerchant = resolvedOffers.find((o) => !o.merchant);
      if (missingMerchant) {
        alert('Please select or name a merchant for every store you added.');
        return;
      }

      payload.offers = resolvedOffers;
      payload.pros = form.pros.split('\n').map((s) => s.trim()).filter(Boolean);
      payload.cons = form.cons.split('\n').map((s) => s.trim()).filter(Boolean);
      payload.editorScore = form.editorScore === '' ? undefined : Number(form.editorScore);
      payload.comparisonEnabled = form.comparisonEnabled;
    } else {
      payload.price = Number(form.price);
      payload.mrp = Number(form.mrp);
      payload.stock = Number(form.stock);
      payload.sku = form.sku;
    }

    setSaving(true);
    try {
      if (editingId) await AdminApi.updateProduct(editingId, payload);
      else await AdminApi.createProduct(payload);
      setShowForm(false);
      load();
    } catch (err) {
      alert('Save failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p) => {
    await AdminApi.updateProduct(p.id, { isActive: p.isActive ? false : true });
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;
    await AdminApi.deleteProduct(id);
    load();
  };

  const isAffiliate = form.productType === 'affiliate';
  const visibleProducts = products.filter((p) => filterType === 'all' || (p.productType || 'own') === filterType);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="section-title">Products</h1>
        <button onClick={startNew} className="btn-primary">+ Add Product</button>
      </div>

      {categories.length === 0 && (
        <div className="mb-6 rounded-xl2 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You haven't added any categories yet, so the category dropdown below will be empty.{' '}
          <Link to="/admin/categories" className="font-semibold underline">Add a category first</Link>, then come back here.
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="card mb-6 grid gap-3 p-6 sm:grid-cols-2">
          {/* Product type toggle */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Product Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, productType: 'own' }))}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${!isAffiliate ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500'}`}
              >
                Own Product <span className="font-normal text-slate-400">(cart & checkout)</span>
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, productType: 'affiliate' }))}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${isAffiliate ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500'}`}
              >
                Affiliate Product <span className="font-normal text-slate-400">(redirects out)</span>
              </button>
            </div>
          </div>

          <input required placeholder="Title" className="input sm:col-span-2" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <input placeholder="Short description (shown in listing cards)" className="input sm:col-span-2" value={form.shortDescription} onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))} />

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-500">Full Description — select text to make it bold, colored, headed, etc.</label>
            <ReactQuill
              theme="snow"
              value={form.description}
              onChange={(html) => setForm((f) => ({ ...f, description: html }))}
              modules={descriptionModules}
            />
          </div>

          <select required className="input" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
            <option value="">Select Category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input placeholder="Brand" className="input" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
          <input placeholder="Tags (comma separated)" className="input sm:col-span-2" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />

          {!isAffiliate ? (
            <>
              <input required type="number" placeholder="Price" className="input" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              <input required type="number" placeholder="MRP" className="input" value={form.mrp} onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))} />
              <input required type="number" placeholder="Stock" className="input" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
              <input placeholder="SKU" className="input" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
            </>
          ) : (
            <div className="sm:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-600">Stores (add one row per merchant — Amazon, Flipkart, etc.)</label>
                <Link to="/admin/merchants" target="_blank" className="text-xs font-semibold text-brand-600 hover:underline">Manage merchant logos →</Link>
              </div>

              <div className="space-y-4">
                {form.offers.map((o, i) => (
                  <div key={i} className="rounded-xl2 border border-slate-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Store {i + 1}</span>
                      {form.offers.length > 1 && (
                        <button type="button" onClick={() => removeOfferRow(i)} className="text-xs font-semibold text-red-500 hover:underline">Remove store</button>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Merchant</label>
                      <div className="flex flex-wrap items-center gap-2">
                        {merchants.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => pickOfferMerchant(i, m.name)}
                            className={`rounded-lg border-2 p-1 transition ${o.merchant === m.name ? 'border-brand-500' : 'border-transparent'}`}
                          >
                            <MerchantBadge merchant={m.name} logo={m.logo} size="lg" />
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => updateOffer(i, 'merchant', '__other__')}
                          className={`rounded-lg border-2 p-1 transition ${o.merchant === '__other__' ? 'border-brand-500' : 'border-transparent'}`}
                        >
                          <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Other / Custom</span>
                        </button>
                      </div>
                      {o.merchant === '__other__' && (
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <input
                            placeholder="Merchant name (e.g. Myntra, Meesho)"
                            className="input"
                            value={o.customMerchant}
                            onChange={(e) => updateOffer(i, 'customMerchant', e.target.value)}
                          />
                          <div>
                            <input type="file" accept="image/*" onChange={(e) => handleOfferLogoSelect(i, e)} disabled={savingLogoFor === i} className="input" />
                            {savingLogoFor === i && <p className="mt-1 text-xs text-brand-600">Uploading logo...</p>}
                            {o.merchantLogo && <img src={o.merchantLogo} alt="" className="mt-1 h-8 w-auto max-w-[100px] object-contain" />}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <input required type="url" placeholder="Affiliate Link (your tracking/referral URL)" className="input sm:col-span-2" value={o.affiliateUrl} onChange={(e) => updateOffer(i, 'affiliateUrl', e.target.value)} />
                      <input type="url" placeholder="Regular URL (optional — plain link, no affiliate tag)" className="input sm:col-span-2" value={o.regularUrl} onChange={(e) => updateOffer(i, 'regularUrl', e.target.value)} />
                      <input placeholder="CTA Button Text (e.g. Check Deal, Buy on Amazon)" className="input sm:col-span-2" value={o.ctaText} onChange={(e) => updateOffer(i, 'ctaText', e.target.value)} />
                      <input type="number" placeholder="Current Price" className="input" value={o.currentPrice} onChange={(e) => updateOffer(i, 'currentPrice', e.target.value)} />
                      <input type="number" placeholder="Original Price (before discount)" className="input" value={o.originalPrice} onChange={(e) => updateOffer(i, 'originalPrice', e.target.value)} />
                      <input type="number" placeholder="Discount % (optional)" className="input" value={o.discountPercentage} onChange={(e) => updateOffer(i, 'discountPercentage', e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addOfferRow} className="mt-2 text-sm font-semibold text-brand-600 hover:underline">+ Add another store</button>
            </div>
          )}

          {isAffiliate && (
            <>
              <input type="number" step="0.1" min="0" max="10" placeholder="Editor Score (0-10)" className="input sm:col-span-2" value={form.editorScore} onChange={(e) => setForm((f) => ({ ...f, editorScore: e.target.value }))} />
              <textarea placeholder="Pros (one per line)" className="input" rows={4} value={form.pros} onChange={(e) => setForm((f) => ({ ...f, pros: e.target.value }))} />
              <textarea placeholder="Cons (one per line)" className="input" rows={4} value={form.cons} onChange={(e) => setForm((f) => ({ ...f, cons: e.target.value }))} />

              <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                <input type="checkbox" checked={form.comparisonEnabled} onChange={(e) => setForm((f) => ({ ...f, comparisonEnabled: e.target.checked }))} />
                Include in comparison tables
              </label>
            </>
          )}

          {/* Specifications editor — shared by both product types */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Specifications</label>
            <div className="space-y-2">
              {form.specs.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input placeholder="Spec name (e.g. RAM)" className="input" value={s.key} onChange={(e) => updateSpec(i, 'key', e.target.value)} />
                  <input placeholder="Value (e.g. 8 GB)" className="input" value={s.value} onChange={(e) => updateSpec(i, 'value', e.target.value)} />
                  <button type="button" onClick={() => removeSpecRow(i)} className="rounded-lg border border-slate-200 px-3 text-slate-400 hover:text-red-500">×</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addSpecRow} className="mt-2 text-sm font-semibold text-brand-600 hover:underline">+ Add specification</button>
          </div>

          <div className="flex flex-wrap gap-4 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} /> Featured
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.trending} onChange={(e) => setForm((f) => ({ ...f, trending: e.target.checked }))} /> Trending
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.deal} onChange={(e) => setForm((f) => ({ ...f, deal: e.target.checked }))} /> Deal
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-accent-600">
              <input type="checkbox" checked={form.isRecommended} onChange={(e) => setForm((f) => ({ ...f, isRecommended: e.target.checked }))} /> Dostivox Recommended
            </label>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-500">Product Images (first image = main thumbnail)</label>
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

          {editingMeta?.updatedAt && (
            <p className="text-xs text-slate-400 sm:col-span-2">
              Last updated: {new Date(editingMeta.updatedAt).toLocaleString()}
            </p>
          )}

          <div className="flex gap-3 sm:col-span-2">
            <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : (editingId ? 'Update Product' : 'Create Product')}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      <div className="mb-4 flex gap-2">
        {['all', 'own', 'affiliate'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${filterType === t ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}
          >
            {t === 'all' ? 'All' : t === 'own' ? 'Own Products' : 'Affiliate Products'}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto p-6">
        <table className="w-full min-w-[800px] text-sm">
          <thead><tr className="text-left text-slate-400"><th className="pb-2">Product</th><th>Type</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {visibleProducts.map((p) => {
              const affiliate = (p.productType || 'own') === 'affiliate';
              const offers = p.offers?.length ? p.offers : (affiliate ? [{ merchant: p.merchant, merchantLogo: p.merchantLogo, currentPrice: p.currentPrice }] : []);
              const cheapest = offers.reduce((best, o) => (!best || (o.currentPrice ?? Infinity) < (best.currentPrice ?? Infinity) ? o : best), null);
              return (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="py-2">{p.title}</td>
                  <td>
                    {affiliate
                      ? (cheapest?.merchant ? <MerchantBadge merchant={cheapest.merchant} logo={cheapest.merchantLogo} /> : <span className="text-slate-400">—</span>)
                      : <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Own</span>}
                    {affiliate && offers.length > 1 && <span className="ml-1 text-[10px] text-slate-400">+{offers.length - 1} more</span>}
                  </td>
                  <td>{p.category_name}</td>
                  <td>₹{affiliate ? cheapest?.currentPrice : p.price}</td>
                  <td className={!affiliate && p.stock <= 5 ? 'text-red-500 font-semibold' : ''}>{affiliate ? '—' : p.stock}</td>
                  <td>{p.isActive ? 'Active' : 'Hidden'}</td>
                  <td className="space-x-3 text-right">
                    <button onClick={() => startEdit(p)} className="text-brand-600 hover:underline">Edit</button>
                    <button onClick={() => toggleActive(p)} className="text-slate-500 hover:underline">
                      {p.isActive ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => remove(p.id)} className="text-red-500 hover:underline">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
