import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';
import MerchantBadge, { KNOWN_MERCHANTS } from '../../components/MerchantBadge';

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

const emptyForm = {
  productType: 'own',
  title: '', description: '', shortDescription: '', categoryId: '', brand: '',
  images: [], tags: '',
  featured: false, trending: false, deal: false,
  specs: [{ key: '', value: '' }],

  // own-product fields
  price: '', mrp: '', stock: '', sku: '',

  // affiliate-product fields
  currentPrice: '', originalPrice: '', discountPercentage: '',
  merchant: 'Amazon', customMerchant: '',
  affiliateUrl: '', regularUrl: '', ctaText: 'Check Deal',
  pros: '', cons: '', editorScore: '', comparisonEnabled: false,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editingMeta, setEditingMeta] = useState(null); // { updatedAt }
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all | own | affiliate

  const load = () => AdminApi.products().then((r) => setProducts(r.products));
  useEffect(() => { load(); AdminApi.categories().then((r) => setCategories(r.categories)); }, []);

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditingMeta({ updatedAt: p.updatedAt });
    const isKnown = KNOWN_MERCHANTS.some((m) => m.value.toLowerCase() === (p.merchant || '').toLowerCase());
    setForm({
      productType: p.productType || 'own',
      title: p.title || '', description: p.description || '', shortDescription: p.shortDescription || '',
      categoryId: p.category_id || p.categoryId || '', brand: p.brand || '', images: p.images || [],
      tags: (p.tags || []).join(', '),
      featured: !!p.featured, trending: !!p.trending, deal: !!p.deal,
      specs: (p.attributes || []).length ? p.attributes.map((a) => ({ key: a.key ?? a.attr_key ?? '', value: a.value ?? a.attr_value ?? '' })) : [{ key: '', value: '' }],

      price: p.price ?? '', mrp: p.mrp ?? '', stock: p.stock ?? '', sku: p.sku || '',

      currentPrice: p.currentPrice ?? '', originalPrice: p.originalPrice ?? '', discountPercentage: p.discountPercentage ?? '',
      merchant: isKnown ? p.merchant : (p.merchant ? 'Other' : 'Amazon'),
      customMerchant: isKnown ? '' : (p.merchant || ''),
      affiliateUrl: p.affiliateUrl || '', regularUrl: p.regularUrl || '', ctaText: p.ctaText || 'Check Deal',
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

  const submit = async (e) => {
    e.preventDefault();
    const isAffiliate = form.productType === 'affiliate';
    const resolvedMerchant = form.merchant === 'Other' ? form.customMerchant.trim() : form.merchant;

    if (isAffiliate && !form.affiliateUrl.trim()) {
      alert('Affiliate Link is required for an affiliate product.');
      return;
    }
    if (isAffiliate && form.merchant === 'Other' && !resolvedMerchant) {
      alert('Please enter the merchant name.');
      return;
    }

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
      featured: form.featured, trending: form.trending, deal: form.deal,
      attributes,
    };

    if (isAffiliate) {
      payload.currentPrice = form.currentPrice === '' ? undefined : Number(form.currentPrice);
      payload.originalPrice = form.originalPrice === '' ? undefined : Number(form.originalPrice);
      payload.discountPercentage = form.discountPercentage === '' ? undefined : Number(form.discountPercentage);
      payload.merchant = resolvedMerchant;
      payload.affiliateUrl = form.affiliateUrl.trim();
      payload.regularUrl = form.regularUrl.trim();
      payload.ctaText = form.ctaText || 'Check Deal';
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
          <textarea placeholder="Full Description" className="input sm:col-span-2" rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
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
            <>
              {/* Merchant picker with brand badges */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-600">Merchant</label>
                <div className="flex flex-wrap items-center gap-2">
                  {KNOWN_MERCHANTS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, merchant: m.value }))}
                      className={`rounded-lg border-2 p-1 transition ${form.merchant === m.value ? 'border-brand-500' : 'border-transparent'}`}
                    >
                      {m.value === 'Other'
                        ? <span className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Other / Custom</span>
                        : <MerchantBadge merchant={m.value} size="lg" />}
                    </button>
                  ))}
                </div>
                {form.merchant === 'Other' && (
                  <input
                    placeholder="Merchant name (e.g. Myntra, Meesho)"
                    className="input mt-2"
                    value={form.customMerchant}
                    onChange={(e) => setForm((f) => ({ ...f, customMerchant: e.target.value }))}
                  />
                )}
              </div>

              <input required type="url" placeholder="Affiliate Link (your tracking/referral URL — never hard-coded in the app)" className="input sm:col-span-2" value={form.affiliateUrl} onChange={(e) => setForm((f) => ({ ...f, affiliateUrl: e.target.value }))} />
              <input type="url" placeholder="Regular URL (optional — plain product link without affiliate tag)" className="input sm:col-span-2" value={form.regularUrl} onChange={(e) => setForm((f) => ({ ...f, regularUrl: e.target.value }))} />
              <input placeholder="CTA Button Text (e.g. Check Deal, Buy on Amazon)" className="input sm:col-span-2" value={form.ctaText} onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))} />

              <input type="number" placeholder="Current Price (on merchant site)" className="input" value={form.currentPrice} onChange={(e) => setForm((f) => ({ ...f, currentPrice: e.target.value }))} />
              <input type="number" placeholder="Original Price (before discount)" className="input" value={form.originalPrice} onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))} />
              <input type="number" placeholder="Discount % (optional — auto shown if left blank)" className="input" value={form.discountPercentage} onChange={(e) => setForm((f) => ({ ...f, discountPercentage: e.target.value }))} />
              <input type="number" step="0.1" min="0" max="10" placeholder="Editor Score (0-10)" className="input" value={form.editorScore} onChange={(e) => setForm((f) => ({ ...f, editorScore: e.target.value }))} />

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
              return (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="py-2">{p.title}</td>
                  <td>
                    {affiliate
                      ? <MerchantBadge merchant={p.merchant} />
                      : <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Own</span>}
                  </td>
                  <td>{p.category_name}</td>
                  <td>₹{affiliate ? p.currentPrice : p.price}</td>
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
