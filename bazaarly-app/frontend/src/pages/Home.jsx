import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Api } from '../api/client';
import ProductCard from '../components/ProductCard';
import HeroCarousel from '../components/HeroCarousel';

// Fallback text used only until the content loads (or if a key was never set).
const DEFAULT_CONTENT = {
  home_hero_badge: 'New Season Arrivals',
  home_hero_title: '<p>Shop Premium.</p><p>Live Beautifully.</p>',
  home_hero_subtitle: 'Curated electronics, fashion, home essentials and more — with fast delivery and easy returns.',
  home_hero_bg_from: '#2c31ab',
  home_hero_bg_to: '#4a5cf0',
  home_hero_image: 'https://picsum.photos/seed/hero-main/700/560',
  home_promo_title: 'Season Sale — Up to 50% Off',
  home_promo_text: 'Use code WELCOME10 at checkout for an extra 10% off.',
  home_trending_title: 'Trending Now',
};

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(DEFAULT_CONTENT);

  useEffect(() => {
    (async () => {
      const [{ categories }, { products }, siteContent] = await Promise.all([
        Api.categories(),
        Api.products({ sort: 'popular', limit: 8 }),
        Promise.resolve({ content: {} }),
      ]);
      setCategories(categories);
      setProducts(products);
      const cleaned = Object.fromEntries(
        Object.entries(siteContent.content || {}).filter(([, v]) => v !== '' && v != null)
      );
      setContent({ ...DEFAULT_CONTENT, ...cleaned });
      setLoading(false);
    })();
  }, []);

  return (
    <div>
     <HeroCarousel/>
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
            <h3 className="font-display text-3xl font-semibold">{content.home_promo_title}</h3>
            <p className="mt-2 text-white/90">{content.home_promo_text}</p>
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
