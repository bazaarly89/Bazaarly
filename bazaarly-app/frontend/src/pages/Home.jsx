import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Api } from '../api/client';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ categories }, { products }] = await Promise.all([
        Api.categories(),
        Api.products({ sort: 'popular', limit: 8 }),
      ]);
      setCategories(categories);
      setProducts(products);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500">
        <div className="container-app grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div className="animate-fadeUp text-white">
            <p className="mb-3 inline-block rounded-full bg-white/15 px-4 py-1 text-sm font-medium">New Season Arrivals</p>
            <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">Shop Premium.<br />Live Beautifully.</h1>
            <p className="mt-4 max-w-md text-brand-100">Curated electronics, fashion, home essentials and more — with fast delivery and easy returns.</p>
            <div className="mt-8 flex gap-4">
              <Link to="/products" className="btn-accent">Shop Now</Link>
              <Link to="/categories" className="btn border-2 border-white/60 text-white px-6 py-2.5 hover:bg-white/10">Browse Categories</Link>
            </div>
          </div>
          <div className="relative animate-scaleIn">
            <img src="https://picsum.photos/seed/hero-main/700/560" alt="Featured" className="w-full rounded-xl2 shadow-2xl" />
          </div>
        </div>
        <svg className="absolute -bottom-1 left-0 w-full text-[#faf9fc]" viewBox="0 0 1440 80" fill="currentColor"><path d="M0 40 C 360 100 1080 -20 1440 40 L1440 80 L0 80 Z" /></svg>
      </section>

      {/* Categories */}
      <section className="container-app py-14">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="section-title">Shop by Category</h2>
          <Link to="/categories" className="text-sm font-semibold text-brand-600 hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <Link key={c.id} to={`/categories/${c.slug}`} className="group card overflow-hidden text-center">
              <div className="aspect-square overflow-hidden">
                <img src={c.image} alt={c.name} className="h-full w-full object-cover transition group-hover:scale-110" />
              </div>
              <p className="py-3 text-sm font-semibold">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Promo banner */}
      <section className="container-app pb-14">
        <div className="relative overflow-hidden rounded-xl2 bg-gradient-to-r from-accent-500 to-accent-400 p-10 text-white shadow-card">
          <div className="max-w-lg">
            <h3 className="font-display text-3xl font-semibold">Season Sale — Up to 50% Off</h3>
            <p className="mt-2 text-white/90">Use code <span className="font-bold">WELCOME10</span> at checkout for an extra 10% off.</p>
            <Link to="/products" className="btn mt-6 bg-white text-accent-600 px-6 py-2.5 hover:bg-white/90">Explore Deals</Link>
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="container-app pb-20">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="section-title">Trending Now</h2>
          <Link to="/products" className="text-sm font-semibold text-brand-600 hover:underline">View all</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-xl2 bg-slate-100" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
