import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Api } from '../api/client';
import SEO from '../components/SEO';

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

  const category = searchParams.get('category') || '';
  const q = searchParams.get('q') || '';
  const page = Number(searchParams.get('page') || 1);

  useEffect(() => { Api.articleCategories().then((r) => setCategories(r.categories)); }, []);

  useEffect(() => {
    setLoading(true);
    Api.articles({ category: category || undefined, search: q || undefined, page, limit: 9 })
      .then((r) => { setArticles(r.articles); setTotal(r.total); setTotalPages(r.totalPages); })
      .finally(() => setLoading(false));
  }, [category, q, page]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.set('page', '1');
    setSearchParams(next);
  };

  return (
    <div className="container-app py-10">
      <SEO
        title="Buying Guides, Comparisons & Tech Blog — Dostivox"
        description="Honest buying guides, comparisons, how-tos and the latest tech, gaming, creator and AI tool recommendations from the Dostivox team."
        canonical={`${window.location.origin}/blog`}
        ogType="website"
      />

      <div className="mb-8">
        <h1 className="section-title">Buying Guides &amp; Blog</h1>
        <p className="mt-2 text-slate-500">Honest comparisons, how-tos and buying advice to help you choose better.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => updateParam('category', '')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${!category ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => updateParam('category', c)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${category === c ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); updateParam('q', searchInput); }}
        className="mb-8 max-w-md"
      >
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search articles..."
          className="input"
        />
      </form>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-xl2 bg-slate-100" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-slate-300 py-20 text-center text-slate-400">
          No articles found{q ? ` for "${q}"` : ''}.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Link key={a.id} to={`/blog/${a.slug}`} className="card group overflow-hidden animate-fadeUp">
              <div className="aspect-[16/10] overflow-hidden rounded-t-xl2 bg-slate-100">
                <img
                  src={a.featuredImage || 'https://picsum.photos/seed/placeholder/800/500'}
                  alt={a.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-500">{a.category}</span>
                <h3 className="mt-1 line-clamp-2 font-medium text-slate-800">{a.title}</h3>
                <p className="mt-2 text-xs text-slate-400">
                  {a.author ? `By ${a.author} · ` : ''}
                  {new Date(a.publishedAt).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => updateParam('page', String(i + 1))}
              className={`h-9 w-9 rounded-full text-sm font-medium ${page === i + 1 ? 'bg-brand-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {!loading && total > 0 && (
        <p className="mt-4 text-center text-xs text-slate-400">{total} article{total === 1 ? '' : 's'}</p>
      )}
    </div>
  );
}
