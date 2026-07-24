import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Api } from '../api/client';
import ProductCard from '../components/ProductCard';

export default function ProductListing() {
  const { slug } = useParams(); // present when viewing /categories/:slug
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = searchParams.get('q') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const brand = searchParams.get('brand') || '';
  const rating = searchParams.get('rating') || '';
  const sort = searchParams.get('sort') || '';
  const page = Number(searchParams.get('page') || 1);

  useEffect(() => { Api.brands().then((r) => setBrands(r.brands)); }, []);

  useEffect(() => {
    setLoading(true);
    Api.products({ search: q || undefined, category: slug, minPrice: minPrice || undefined, maxPrice: maxPrice || undefined, brand: brand || undefined, rating: rating || undefined, sort: sort || undefined, page, limit: 12 })
      .then((r) => { setProducts(r.products); setTotal(r.total); setTotalPages(r.totalPages); })
      .finally(() => setLoading(false));
  }, [slug, q, minPrice, maxPrice, brand, rating, sort, page]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.set('page', '1');
    setSearchParams(next);
  };

  const heading = slug ? slug.replace(/-/g, ' ') : (q ? `Results for "${q}"` : 'All Products');

  return (
    <div className="container-app py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="section-title capitalize">{heading}</h1>
        <button onClick={() => setFiltersOpen((o) => !o)} className="btn-outline text-sm py-2 px-4 lg:hidden">Filters</button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Filters sidebar */}
        <aside className={`space-y-6 ${filtersOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="card p-5">
            <h3 className="mb-3 font-semibold">Price Range</h3>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" defaultValue={minPrice} onBlur={(e) => updateParam('minPrice', e.target.value)} className="input" />
              <input type="number" placeholder="Max" defaultValue={maxPrice} onBlur={(e) => updateParam('maxPrice', e.target.value)} className="input" />
            </div>
          </div>
          <div className="card p-5">
            <h3 className="mb-3 font-semibold">Brand</h3>
            <select value={brand} onChange={(e) => updateParam('brand', e.target.value)} className="input">
              <option value="">All Brands</option>
              {brands.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="card p-5">
            <h3 className="mb-3 font-semibold">Minimum Rating</h3>
            <div className="space-y-2">
              {[4, 3, 2].map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="rating" checked={rating === String(r)} onChange={() => updateParam('rating', String(r))} />
                  {r}★ & above
                </label>
              ))}
              <button onClick={() => updateParam('rating', '')} className="text-xs text-brand-600 hover:underline">Clear</button>
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">{total} products found</p>
            <select value={sort} onChange={(e) => updateParam('sort', e.target.value)} className="input w-auto">
              <option value="">Sort: Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-xl2 bg-slate-100" />)}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl2 border border-dashed border-slate-300 py-20 text-center text-slate-400">No products match your filters.</div>
          ) : (
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => updateParam('page', String(i + 1))}
                  className={`h-9 w-9 rounded-full text-sm font-medium ${page === i + 1 ? 'bg-brand-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
