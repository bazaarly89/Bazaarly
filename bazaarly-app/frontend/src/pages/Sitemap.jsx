import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Api } from '../api/client';

const STATIC_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Shop' },
  { to: '/categories', label: 'Categories' },
  { to: '/blog', label: 'Buying Guides & Blog' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact Us' },
  { to: '/help', label: 'Help Center' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/affiliate-disclosure', label: 'Affiliate Disclosure' },
  { to: '/disclaimer', label: 'Disclaimer' },
  { to: '/cookie-policy', label: 'Cookie Policy' },
];

export default function Sitemap() {
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    Api.categories().then((r) => setCategories(r.categories || [])).catch(() => {});
    Api.articles({ limit: 50 }).then((r) => setArticles(r.articles || [])).catch(() => {});
  }, []);

  return (
    <div className="container-app py-14">
      <div className="mx-auto max-w-3xl">
        <h1 className="section-title">Sitemap</h1>
        <p className="mt-2 text-slate-500">All the pages on Dostivox, in one place.</p>

        <div className="mt-8">
          <h2 className="font-semibold text-lg text-slate-800">Pages</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {STATIC_LINKS.map((l) => (
              <li key={l.to}><Link to={l.to} className="text-brand-600 hover:underline">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        {categories.length > 0 && (
          <div className="mt-10">
            <h2 className="font-semibold text-lg text-slate-800">Categories</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {categories.map((c) => (
                <li key={c.id}><Link to={`/products?category=${c.slug}`} className="text-brand-600 hover:underline">{c.name}</Link></li>
              ))}
            </ul>
          </div>
        )}

        {articles.length > 0 && (
          <div className="mt-10">
            <h2 className="font-semibold text-lg text-slate-800">Buying Guides &amp; Articles</h2>
            <ul className="mt-3 space-y-2">
              {articles.map((a) => (
                <li key={a.id}><Link to={`/blog/${a.slug}`} className="text-brand-600 hover:underline">{a.title}</Link></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
