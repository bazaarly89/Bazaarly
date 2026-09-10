import { useEffect } from 'react';

// Lightweight SEO manager — sets document.title, meta description/OG tags,
// canonical link and JSON-LD structured data for the current page, then
// cleans everything back up when the page unmounts. No extra dependency
// (react-helmet etc.) needed for this.
export default function SEO({ title, description, canonical, ogImage, ogType = 'article', jsonLd }) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title;

    const createdMetaEls = [];
    const setMeta = (attr, key, value) => {
      if (!value) return;
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
        createdMetaEls.push(el);
      }
      el.setAttribute('content', value);
    };

    if (description) setMeta('name', 'description', description);
    if (ogType) setMeta('property', 'og:type', ogType);
    if (title) setMeta('property', 'og:title', title);
    if (description) setMeta('property', 'og:description', description);
    if (ogImage) setMeta('property', 'og:image', ogImage);
    if (canonical) setMeta('property', 'og:url', canonical);

    let canonicalEl = null;
    let canonicalCreated = false;
    if (canonical) {
      canonicalEl = document.querySelector('link[rel="canonical"]');
      if (!canonicalEl) {
        canonicalEl = document.createElement('link');
        canonicalEl.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalEl);
        canonicalCreated = true;
      }
      canonicalEl.setAttribute('href', canonical);
    }

    let jsonLdEl = null;
    if (jsonLd) {
      jsonLdEl = document.createElement('script');
      jsonLdEl.type = 'application/ld+json';
      jsonLdEl.text = JSON.stringify(jsonLd);
      document.head.appendChild(jsonLdEl);
    }

    return () => {
      document.title = prevTitle;
      createdMetaEls.forEach((el) => el.remove());
      if (canonicalCreated && canonicalEl) canonicalEl.remove();
      if (jsonLdEl) jsonLdEl.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, canonical, ogImage, ogType, JSON.stringify(jsonLd)]);

  return null;
}
