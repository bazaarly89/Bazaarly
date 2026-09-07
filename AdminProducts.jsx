import React, { useEffect, useState } from 'react';
import { AdminApi } from '../../api/client';

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
  title: '', description: '', shortDescription: '', categoryId: '', brand: '', images: [],
  // own-product fields
  price: '', mrp: '', stock: '', sku: '',
  // affiliate-product fields
  currentPrice: '', originalPrice: '', merchant: '', affiliateUrl: '', ctaText: 'Check Deal',
  pros: '', cons: '',
  featured: false, deal: false,
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () => AdminApi.products().then((r) => setProducts(r.products));
  useEffect(() => { load(); AdminApi.categories().then((r) => setCategories(r.categories)); }, []);

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      productType: p.productType || 'own',
      title: p.title, description: p.description, shortDescription: p.shortDescription || '',
      categoryId: p.category_id || p.categoryId, brand: p.brand, images: p.images || [],
      price: p.price ?? '', mrp: p.mrp ?? '', stock: p.stock ?? '', sku: p.sku || '',
      currentPrice: p.currentPrice ?? '', originalPrice: p.originalPrice ?? '',
      merchant: p.merchant || '', affiliateUrl: p.affiliateUrl || '', ctaText: p.ctaText || 'Check Deal',
      pros: (p.pros || []).join('\n'), cons: (p.cons || []).join('\n'),
      featured: !!p.featured, deal: !!p.deal,
    });
    setShowForm(true);
  };

  const startNew = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };

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

  const submit = async (e) => {
    e.preventDefault();
    const isAffiliate = form.productType === 'affiliate';

    if (isAffiliate && !form.affiliateUrl) {
      alert('Affiliate Link is required for an affiliate product.');
      return;
    }

    const payload = {
      productType: form.productType,
      title: form.title,
      description: form.description,
      shortDescription: form.shortDescription,
      categoryId: form.categoryId,
      brand: form.brand,
      images: form.images && form.images.length ? form.images : undefined,
      featured: form.featured,
      deal: form.deal,
    };

    if (isAffiliate) {
      payload.currentPrice = Number(form.currentPrice);
      payload.originalPrice = form.originalPrice ? Number(form.originalPrice) : undefined;
      payload.merchant = form.merchant;
      payload.affiliateUrl = form.affiliateUrl;
      payload.ctaText = form.ctaText || 'Check Deal';
      payload.pros = form.pros ? form.pros.split('\n').map((s) => s.trim()).filter(Boolean) : [];
      payload.cons = form.cons ? form.cons.split('\n').map((s) => s.trim()).filter(Boolean) : [];
    } else {
      payload.price = Number(form.price);
      payload.mrp = Number(form.mrp);
      payload.stock = Number(form.stock);
      payload.sku = form.sku;
    }

    if (editingId) await AdminApi.updateProduct(editingId, payload);
    else await AdminApi.createProduct(payload);
    setShowForm(false);
    load();
  };

  const toggleActive = async (p) => {
    await AdminApi.updateProduct(p.id, { isActive: p.is_active ? false : true });
    load();
  };

  const remove = async (id) => {
    if (!confirm('Delete this product?')) return;
    await AdminApi.deleteProduct(id);
    load();
  };

  const isAffiliate = form.productType === 'affiliate';

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="section-title">Products</h1>
        <button onClick={startNew} className="btn-primary">+ Add Product</button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="card mb-6 grid gap-3 p-6 sm:grid-cols-2">
          {/* Product type toggle */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-slate-600">Product Type</label>
            <div className="flex gap-3">
              <label className={`flex-1 cursor-pointer rounded-xl2 border p-3 text-center text-sm font-medium ${!isAffiliate ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500'}`}>
                <input type="radio" name="productType" value="own" checked={!isAffiliate}
                  onChange={() => setForm((f) => ({ ...f, productType: 'own' }))} className="mr-2" />
                Own Product (I sell it — cart & checkout)
              </label>
              <label className={`flex-1 cursor-pointer rounded-xl2 border p-3 text-center text-sm font-medium ${isAffiliate ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-500'}`}>
                <input type="radio" name="productType" value="affiliate" checked={isAffiliate}
                  onChange={() => setForm((f) => ({ ...f, productType: 'affiliate' }))} className="mr-2" />
                Affiliate Product (refer to merchant)
              </label>
            </div>
          </div>

          <input required placeholder="Title" className="input sm:col-span-2" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <textarea placeholder="Short summary (shown on product cards)" className="input sm:col-span-2" value={form.shortDescription} onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))} />
          <textarea placeholder="Full Description" className="input sm:col-span-2" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <select required className="input" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
            <option value="">Select Category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input placeholder="Brand" className="input" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />

          {!isAffiliate ? (
            <>
              <input required type="number" placeholder="Price" className="input" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
              <input required type="number" placeholder="MRP" className="input" value={form.mrp} onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))} />
              <input required type="number" placeholder="Stock" className="input" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
              <input placeholder="SKU" className="input" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
            </>
          ) : (
            <>
              <input required type="number" placeholder="Current Price (on merchant site)" className="input" value={form.currentPrice} onChange={(e) => setForm((f) => ({ ...f, currentPrice: e.target.value }))} />
              <input type="number" placeholder="Original Price (before discount)" className="input" value={form.originalPrice} onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))} />
              <input placeholder="Merchant (e.g. Amazon, Flipkart)" className="input" value={form.merchant} onChange={(e) => setForm((f) => ({ ...f, merchant: e.target.value }))} />
              <input required placeholder="Affiliate Link (full URL)" className="input" value={form.affiliateUrl} onChange={(e) => setForm((f) => ({ ...f, affiliateUrl: e.target.value }))} />
              <input placeholder="Button Text (default: Check Deal)" className="input sm:col-span-2" value={form.ctaText} onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))} />
              <textarea placeholder="Pros (one per line)" className="input" value={form.pros} onChange={(e) => setForm((f) => ({ ...f, pros: e.target.value }))} />
              <textarea placeholder="Cons (one per line)" className="input" value={form.cons} onChange={(e) => setForm((f) => ({ ...f, cons: e.target.value }))} />
              <p className="text-xs text-slate-400 sm:col-span-2">
                Affiliate disclosure will be shown automatically on the product page: "We may earn a commission if you purchase through this link."
              </p>
            </>
          )}

          <div className="flex items-center gap-4 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.deal} onChange={(e) => setForm((f) => ({ ...f, deal: e.target.checked }))} />
              Show in Deals
            </label>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-500">Product Images</label>
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
          <div className="flex gap-3 sm:col-span-2">
            <button className="btn-primary">{editingId ? 'Update Product' : 'Create Product'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto p-6">
        <table className="w-full min-w-[700px] text-sm">
          <thead><tr className="text-left text-slate-400"><th className="pb-2">Product</th><th>Type</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="py-2">{p.title}</td>
                <td>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.productType === 'affiliate' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {p.productType === 'affiliate' ? 'Affiliate' : 'Own'}
                  </span>
                </td>
                <td>{p.category_name}</td>
                <td>₹{p.productType === 'affiliate' ? p.currentPrice : p.price}</td>
                <td className={p.productType !== 'affiliate' && p.stock <= 5 ? 'text-red-500 font-semibold' : ''}>
                  {p.productType === 'affiliate' ? '—' : p.stock}
                </td>
                <td>{p.is_active ? 'Active' : 'Hidden'}</td>
                <td className="space-x-3 text-right">
                  <button onClick={() => startEdit(p)} className="text-brand-600 hover:underline">Edit</button>
                  <button onClick={() => toggleActive(p)} className="text-slate-500 hover:underline">
                    {p.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => remove(p.id)} className="text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
