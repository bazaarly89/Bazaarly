// backend/utils/security.js
// Small shared security helpers used across routes.

const sanitizeHtml = require('sanitize-html');

// Escape regex special characters so user-supplied search terms can never be
// interpreted as regex syntax (prevents ReDoS / unintended wildcard matches).
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Only allow http(s) URLs — blocks javascript:, data:, vbscript:, file: etc.
// Used for affiliate links, banner links, ad links, hero CTA links.
// `allowRelative` lets internal paths like "/products" through (used for
// on-site links such as banners/hero CTAs that often point within the site).
function isSafeUrl(url, { allowRelative = false } = {}) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (allowRelative && trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

// Allowlist-based HTML sanitizer for admin-authored rich text (article
// content, product descriptions) that gets rendered on the storefront via
// dangerouslySetInnerHTML. Strips scripts, event handlers, iframes, and any
// dangerous URLs (javascript:, data:, etc.) while keeping normal formatting.
function sanitizeRichHtml(html) {
  if (!html || typeof html !== 'string') return html || '';
  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
      'ul', 'ol', 'li', 'b', 'i', 'strong', 'em', 'u', 's',
      'blockquote', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'span', 'div', 'code', 'pre',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'width', 'height'],
      '*': ['class'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
    },
  });
}

module.exports = { escapeRegex, isSafeUrl, sanitizeRichHtml };
