import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Api } from '../api/client';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';

export default function ArticleDetails() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    window.scrollTo(0, 0);
    Api.article(slug)
      .then((r) => setData(r))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container-app py-16">
        <div className="mx-auto max-w-3xl animate-pulse space-y-4">
          <div className="h-6 w-32 rounded bg-slate-100" />
          <div className="h-10 w-full rounded bg-slate-100" />
          <div className="aspect-video w-full rounded-xl2 bg-slate-100" />
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="h-4 w-5/6 rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="container-app py-20 text-center">
        <p className="text-lg text-slate-500">Article not found.</p>
        <Link to="/blog" className="btn-primary mt-6 inline-flex">Back to Blog</Link>
      </div>
    );
  }

  const { article, relatedProducts, moreArticles } = data;
  const url = `${window.location.origin}/blog/${article.slug}`;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    image: article.featuredImage ? [article.featuredImage] : undefined,
    author: article.author ? { '@type': 'Person', name: article.author } : undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    mainEntityOfPage: url,
  };

  const faqJsonLd = article.faq?.length ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: article.faq.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  } : null;

  return (
    <div className="container-app py-10">
      <SEO
        title={article.seoTitle || article.title}
        description={article.seoDescription}
        canonical={article.canonicalUrl || url}
        ogImage={article.ogImage || article.featuredImage}
        jsonLd={faqJsonLd ? [articleJsonLd, faqJsonLd] : articleJsonLd}
      />

      <nav className="mb-4 text-sm text-slate-400">
        <Link to="/blog" className="hover:text-brand-600">Blog</Link>
        {' / '}
        <Link to={`/blog?category=${encodeURIComponent(article.category)}`} className="hover:text-brand-600">{article.category}</Link>
      </nav>

      <div className="mx-auto max-w-3xl">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-500">{article.category}</span>
        <h1 className="mt-2 font-display text-3xl font-bold text-slate-900 sm:text-4xl">{article.title}</h1>
        <p className="mt-3 text-sm text-slate-400">
          {article.author ? `By ${article.author} · ` : ''}
          Published {new Date(article.publishedAt).toLocaleDateString()}
          {article.updatedAt && new Date(article.updatedAt).toDateString() !== new Date(article.publishedAt).toDateString()
            ? ` · Updated ${new Date(article.updatedAt).toLocaleDateString()}`
            : ''}
        </p>

        {article.featuredImage && (
          <img src={article.featuredImage} alt={article.title} className="mt-6 aspect-video w-full rounded-xl2 object-cover" />
        )}

        <div className="article-content mt-8" dangerouslySetInnerHTML={{ __html: article.content }} />

        {article.faq?.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 font-display text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {article.faq.map((f, i) => (
                <div key={i} className="card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left font-medium text-slate-800"
                  >
                    <span>{f.question}</span>
                    <span className="shrink-0 text-brand-500">{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && (
                    <div className="border-t border-slate-100 p-4 text-sm text-slate-600">{f.answer}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {relatedProducts?.length > 0 && (
        <div className="mx-auto mt-16 max-w-5xl">
          <h2 className="section-title mb-6">Related Products</h2>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {moreArticles?.length > 0 && (
        <div className="mx-auto mt-16 max-w-5xl">
          <h2 className="section-title mb-6">More in {article.category}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {moreArticles.map((a) => (
              <Link key={a.id} to={`/blog/${a.slug}`} className="card overflow-hidden">
                <div className="aspect-[16/10] overflow-hidden rounded-t-xl2 bg-slate-100">
                  <img
                    src={a.featuredImage || 'https://picsum.photos/seed/placeholder/800/500'}
                    alt={a.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold text-slate-800">{a.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
