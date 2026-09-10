import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Api } from '../api/client';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';

const BUDGET_TIERS = [500, 1000, 5000, 10000, 25000, 50000];

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [trending, setTrending] = useState([]);
  const [deals, setDeals] = useState([]);
  const [compareProducts, setCompareProducts] = useState([]);
  const [guides, setGuides] = useState([]);
  const [trustCards, setTrustCards] = useState([]);
  const [homeSections, setHomeSections] = useState([]);
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  const [budgetTier, setBudgetTier] = useState(BUDGET_TIERS[1]);
  const [budgetProducts, setBudgetProducts] = useState([]);
  const [budgetLoading, setBudgetLoading] = useState(false);

  const [tools, setTools] = useState([]);

  const [subEmail, setSubEmail] = useState('');
  const [subPrefs, setSubPrefs] = useState({ wantsDeals: true, wantsGuides: false, wantsPriceAlerts: false });
  const [subStatus, setSubStatus] = useState(''); // '', 'sending', 'done', 'error'

  useEffect(() => {
    let mounted = true;
    Promise.all([
      Api.categories().catch(() => ({ categories: [] })),
      Api.products({ sort: 'popular', limit: 8 }).catch(() => ({ products: [] })),
      Api.products({ deal: true, limit: 8 }).catch(() => ({ products: [] })),
      Api.products({ comparisonEnabled: true, limit: 4 }).catch(() => ({ products: [] })),
      Api.articles({ category: 'Buying Guides', limit: 4 }).catch(() => ({ articles: [] })),
      Api.trustCards().catch(() => ({ cards: [] })),
      Api.homeSections().catch(() => ({ sections: [] })),
      Api.siteContent().catch(() => ({ content: {} })),
    ]).then(([catRes, trendRes, dealRes, cmpRes, guideRes, trustRes, sectionRes, contentRes]) => {
      if (!mounted) return;
      setCategories((catRes.categories || []).filter((c) => c.is_active !== false && c.is_active !== 0));
      setTrending(trendRes.products || []);
      setDeals(dealRes.products || []);
      setCompareProducts(cmpRes.products || []);
      setGuides(guideRes.articles || []);
      setTrustCards(trustRes.cards || []);
      setHomeSections(sectionRes.sections || []);
      setContent(contentRes.content || {});
      try {
        const parsedTools = JSON.parse(contentRes.content?.home_tools || '[]');
        setTools(Array.isArray(parsedTools) ? parsedTools : []);
      } catch { setTools([]); }
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setBudgetLoading(true);
    Api.products({ maxPrice: budgetTier, sort: 'popular', limit: 8 })
      .then((r) => setBudgetProducts(r.products || []))
      .catch(() => setBudgetProducts([]))
      .finally(() => setBudgetLoading(false));
  }, [budgetTier]);

  const c = (key, fallback = '') => content[key] || fallback;
  const sec = (key, fallbackTitle) => homeSections.find((s) => s.key === key) || { title: fallbackTitle, subtitle: '', buttonText: '', buttonLink: '', isEnabled: true };
  const sectionOrder = homeSections.length
    ? [...homeSections].sort((a, b) => a.position - b.position).map((s) => s.key)
    : ['categories', 'trending', 'deals', 'budget', 'compare', 'buying_guides', 'tools', 'trust_cards'];

  const submitSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
  };

  const submitSubscribe = async (e) => {
    e.preventDefault();
    if (!subEmail.trim()) return;
    setSubStatus('sending');
    try {
      await Api.subscribe({ email: subEmail.trim(), ...subPrefs });
      setSubStatus('done');
      setSubEmail('');
    } catch {
      setSubStatus('error');
    }
  };

  if (loading) {
    return <div className="container-app py-24 text-center text-slate-400">Loading Dostivox…</div>;
  }

  return (
    <div>
      <SEO
        title="Dostivox — Shop Smarter. Compare Better. Save More."
        description={c('home_hero_subtitle', 'Discover the best products, deals and buying recommendations in one place.')}
        canonical={window.location.origin}
        ogType="website"
      />

      {/* ---------------- HERO ---------------- */}
      <section
        className="relative overflow-hidden px-4 py-12 text-white sm:py-16"
        style={{ background: `linear-gradient(135deg, ${c('home_hero_bg_from', '#2c31ab')}, ${c('home_hero_bg_to', '#4a5cf0')})` }}
      >
        <div className="container-app relative text-center">
          {c('home_hero_badge') && (
            <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide backdrop-blur">
              {c('home_hero_badge')}
            </span>
          )}
          <h1
            className="mx-auto mt-4 max-w-2xl font-display text-3xl font-bold leading-tight sm:text-4xl"
            dangerouslySetInnerHTML={{ __html: c('home_hero_title', 'Shop Smarter. Compare Better. Save More.') }}
          />
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/85 sm:text-base">
            {c('home_hero_subtitle', 'Discover the best products, deals and buying recommendations in one place.')}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href={c('home_hero_cta1_link', '/products?deal=true')} className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-brand-700 shadow-lg transition hover:-translate-y-0.5">
              {c('home_hero_cta1_text', 'Explore Deals')}
            </a>
            <a href={c('home_hero_cta2_link', '/products?comparisonEnabled=true')} className="rounded-full border border-white/40 bg-white/10 px-6 py-2.5 text-sm font-semibold backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20">
              {c('home_hero_cta2_text', 'Compare Products')}
            </a>
          </div>
        </div>
      </section>

      {/* ---------------- SEARCH ---------------- */}
      <section className="border-b border-slate-100 bg-white px-4 py-6">
        <form onSubmit={submitSearch} className="container-app">
          <div className="relative mx-auto max-w-xl">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={c('home_search_placeholder', 'What are you looking for?')}
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-5 pr-14 text-sm shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <button type="submit" className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-brand-500 text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            </button>
          </div>
        </form>
      </section>

      <div className="container-app py-10 space-y-14">
        {sectionOrder.map((key) => {
          const s = sec(key);
          if (s.isEnabled === false) return null;

          // -------- Today's Best Deals --------
          if (key === 'deals') {
            return (
              <section key="deals" id="deals">
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <h2 className="section-title">{s.title || "Today's Best Deals"}</h2>
                    {s.subtitle && <p className="mt-1 text-sm text-slate-500">{s.subtitle}</p>}
                  </div>
                  {deals.length > 0 && <Link to={s.buttonLink || '/products?deal=true'} className="text-sm font-medium text-brand-600 hover:underline">{s.buttonText || 'View All ›'}</Link>}
                </div>
                {deals.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {deals.map((p) => <ProductCard key={p.id} product={p} />)}
                  </div>
                ) : (
                  <div className="rounded-xl2 border border-dashed border-slate-300 py-14 text-center text-sm text-slate-400">
                    No live deals right now — check back soon, or browse <Link to="/products" className="text-brand-600 hover:underline">all products</Link>.
                  </div>
                )}
              </section>
            );
          }

          // -------- Popular Categories --------
          if (key === 'categories' && categories.length > 0) {
            return (
              <section key="categories">
                <div className="mb-5">
                  <h2 className="section-title">{s.title || 'Popular Categories'}</h2>
                  {s.subtitle && <p className="mt-1 text-sm text-slate-500">{s.subtitle}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/products?category=${cat.slug}`}
                      className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100 shadow-card"
                    >
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl">🛍</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent" />
                      <span className="absolute bottom-2 left-2 right-2 text-sm font-semibold text-white">{cat.name}</span>
                    </Link>
                  ))}
                </div>
              </section>
            );
          }

          // -------- Trending Products --------
          if (key === 'trending' && trending.length > 0) {
            return (
              <section key="trending">
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <h2 className="section-title">{s.title || 'Trending Products'}</h2>
                    {s.subtitle && <p className="mt-1 text-sm text-slate-500">{s.subtitle}</p>}
                  </div>
                  <Link to={s.buttonLink || '/products'} className="text-sm font-medium text-brand-600 hover:underline">{s.buttonText || 'View All ›'}</Link>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {trending.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              </section>
            );
          }

          // -------- Best Under Budget --------
          if (key === 'budget') {
            return (
              <section key="budget">
                <div className="mb-5">
                  <h2 className="section-title">{s.title || 'Best Under Budget'}</h2>
                  {s.subtitle && <p className="mt-1 text-sm text-slate-500">{s.subtitle}</p>}
                </div>
                <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                  {BUDGET_TIERS.map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setBudgetTier(tier)}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${budgetTier === tier ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      Under ₹{tier.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
                {budgetLoading ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="aspect-[3/4] animate-pulse rounded-xl2 bg-slate-100" />)}
                  </div>
                ) : budgetProducts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {budgetProducts.map((p) => <ProductCard key={p.id} product={p} />)}
                  </div>
                ) : (
                  <div className="rounded-xl2 border border-dashed border-slate-300 py-14 text-center text-sm text-slate-400">
                    No products under ₹{budgetTier.toLocaleString('en-IN')} yet.
                  </div>
                )}
              </section>
            );
          }

          // -------- Compare Products --------
          if (key === 'compare') {
            return (
              <section key="compare" className="rounded-2xl bg-slate-50 p-6 sm:p-10">
                <div className="mx-auto max-w-2xl text-center">
                  <h2 className="section-title">{s.title || 'Compare Products'}</h2>
                  <p className="mt-2 text-sm text-slate-500">{s.subtitle || 'Weigh real options side by side before you buy.'}</p>
                </div>
                {compareProducts.length >= 2 && (
                  <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {compareProducts.map((p) => <ProductCard key={p.id} product={p} />)}
                  </div>
                )}
                <div className="mt-6 text-center">
                  <Link to={s.buttonLink || '/products?comparisonEnabled=true'} className="btn-primary inline-flex">
                    {s.buttonText || 'Compare Products'}
                  </Link>
                </div>
              </section>
            );
          }

          // -------- Buying Guides --------
          if (key === 'buying_guides') {
            return (
              <section key="buying_guides">
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <h2 className="section-title">{s.title || 'Buying Guides'}</h2>
                    {s.subtitle && <p className="mt-1 text-sm text-slate-500">{s.subtitle}</p>}
                  </div>
                  <Link to={s.buttonLink || '/blog?category=Buying%20Guides'} className="text-sm font-medium text-brand-600 hover:underline">{s.buttonText || 'View All ›'}</Link>
                </div>
                {guides.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {guides.map((g) => (
                      <Link key={g.id} to={`/blog/${g.slug}`} className="card group overflow-hidden">
                        <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                          <img src={g.featuredImage || 'https://picsum.photos/seed/guide/600/375'} alt={g.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                        </div>
                        <div className="p-4">
                          <span className="text-xs font-semibold uppercase tracking-wide text-brand-500">Buying Guide</span>
                          <h3 className="mt-1 line-clamp-2 font-medium text-slate-800">{g.title}</h3>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl2 border border-dashed border-slate-300 py-14 text-center text-sm text-slate-400">
                    Buying guides coming soon — check the <Link to="/blog" className="text-brand-600 hover:underline">full blog</Link> in the meantime.
                  </div>
                )}
              </section>
            );
          }

          // -------- Free Tools --------
          if (key === 'tools') {
            return (
              <section key="tools" className="rounded-2xl bg-gradient-to-br from-brand-50 to-white p-6 sm:p-10">
                <div className="mb-5 text-center">
                  <h2 className="section-title">{s.title || 'Free Tools by Dostivox'}</h2>
                  {s.subtitle && <p className="mt-1 text-sm text-slate-500">{s.subtitle}</p>}
                </div>
                {tools.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tools.map((t, i) => (
                      <Link key={i} to={t.link} className="card flex items-start gap-3 p-4">
                        <span className="text-2xl">{t.icon || '🛠'}</span>
                        <div>
                          <p className="font-semibold text-slate-800">{t.title}</p>
                          {t.description && <p className="mt-0.5 text-sm text-slate-500">{t.description}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-slate-400">More free tools coming soon.</p>
                )}
              </section>
            );
          }

          // -------- Why Dostivox --------
          if (key === 'trust_cards' && trustCards.length > 0) {
            return (
              <section key="trust_cards">
                <div className="mb-5 text-center">
                  <h2 className="section-title">{s.title || 'Why Dostivox?'}</h2>
                  {s.subtitle && <p className="mt-1 text-sm text-slate-500">{s.subtitle}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {trustCards.map((card) => (
                    <div key={card.id} className="card p-5 text-center">
                      <div className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-xl">{card.icon}</div>
                      <p className="font-semibold text-slate-800">{card.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{card.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          return null;
        })}

        {/* ---------------- NEWSLETTER / DEAL ALERTS ---------------- */}
        <section className="rounded-2xl bg-slate-900 p-6 text-center text-white sm:p-10">
          <h2 className="font-display text-2xl font-bold">Never miss a good deal</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">
            Get occasional emails about new deals, buying guides, or price drops on things you care about — you choose what, and you can unsubscribe anytime.
          </p>
          {subStatus === 'done' ? (
            <p className="mt-6 font-semibold text-green-400">You're subscribed — thanks!</p>
          ) : (
            <form onSubmit={submitSubscribe} className="mx-auto mt-6 max-w-md">
              <div className="flex gap-2">
                <input
                  type="email" required value={subEmail} onChange={(e) => setSubEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button disabled={subStatus === 'sending'} className="shrink-0 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold hover:bg-brand-600">
                  {subStatus === 'sending' ? '...' : 'Subscribe'}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-4 text-xs text-slate-300">
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={subPrefs.wantsDeals} onChange={(e) => setSubPrefs((p) => ({ ...p, wantsDeals: e.target.checked }))} /> Deals</label>
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={subPrefs.wantsGuides} onChange={(e) => setSubPrefs((p) => ({ ...p, wantsGuides: e.target.checked }))} /> Buying guides</label>
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={subPrefs.wantsPriceAlerts} onChange={(e) => setSubPrefs((p) => ({ ...p, wantsPriceAlerts: e.target.checked }))} /> Price alerts</label>
              </div>
              {subStatus === 'error' && <p className="mt-2 text-xs text-red-400">Something went wrong — please try again.</p>}
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
