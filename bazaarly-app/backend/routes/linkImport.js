// backend/routes/linkImport.js
// Admin-only: paste a product link -> returns title, description, images, price, brand, tags.
// No extra npm package needed (uses Node's built-in fetch).

const express = require('express');
const dns = require('dns').promises;
const net = require('net');
const { adminRequired } = require('../middleware/auth');
const { isSafeUrl } = require('../utils/security');

const router = express.Router();
router.use(adminRequired);

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB of HTML is plenty
const TIMEOUT_MS = 12000;
const MAX_REDIRECTS = 5;

// ---------- safety: never let this endpoint reach private/internal addresses ----------
function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 10 || a === 127 || a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80') || v.startsWith('::ffff:');
  }
  return true;
}

async function assertPublicHost(urlStr) {
  const u = new URL(urlStr);
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Only http/https links allowed');
  const host = u.hostname;
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error('This address is not allowed');
    return;
  }
  const addrs = await dns.lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error('This address is not allowed');
}

async function fetchHtml(startUrl) {
  let current = startUrl;
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await assertPublicHost(current);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let res;
    try {
      res = await fetch(current, {
        redirect: 'manual',
        signal: ctrl.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
        },
      });
    } finally {
      clearTimeout(timer);
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      current = new URL(res.headers.get('location'), current).toString();
      continue;
    }
    if (!res.ok) throw new Error(`Site ne page dene se mana kar diya (status ${res.status})`);

    // read at most MAX_BYTES
    const reader = res.body.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      chunks.push(value);
      if (total > MAX_BYTES) { try { await reader.cancel(); } catch (e) { /* ignore */ } break; }
    }
    return { html: Buffer.concat(chunks).toString('utf8'), finalUrl: current };
  }
  throw new Error('Too many redirects');
}

// ---------- parsing helpers ----------
function decodeEntities(s) {
  if (!s) return '';
  return String(s)
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function clean(s) {
  return decodeEntities(s).replace(/\s+/g, ' ').trim();
}

function getMeta(html, keys) {
  for (const key of keys) {
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`, 'i');
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`, 'i');
    const m = html.match(re1) || html.match(re2);
    if (m && clean(m[1])) return clean(m[1]);
  }
  return '';
}

function getAllMeta(html, key) {
  const out = [];
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']`, 'gi');
  let m;
  while ((m = re.exec(html))) out.push(clean(m[1]));
  return out.filter(Boolean);
}

function getJsonLdProducts(html) {
  const products = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  const walk = (node) => {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (typeof node !== 'object') return;
    const t = node['@type'];
    const types = Array.isArray(t) ? t : [t];
    if (types.includes('Product')) products.push(node);
    if (node['@graph']) walk(node['@graph']);
  };
  while ((m = re.exec(html))) {
    try { walk(JSON.parse(m[1].trim())); } catch (e) { /* ignore bad JSON */ }
  }
  return products;
}

function toNumber(v) {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(String(v).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function absUrl(u, base) {
  try { return new URL(decodeEntities(u), base).toString(); } catch (e) { return ''; }
}

function guessMerchant(hostname) {
  const h = hostname.replace(/^www\./, '').toLowerCase();
  if (h.includes('amazon') || h === 'amzn.to' || h === 'amzn.in') return 'Amazon';
  if (h.includes('flipkart') || h === 'fkrt.it') return 'Flipkart';
  if (h.includes('myntra')) return 'Myntra';
  if (h.includes('meesho')) return 'Meesho';
  if (h.includes('ajio')) return 'Ajio';
  if (h.includes('nykaa')) return 'Nykaa';
  return '';
}

function parseProductPage(html, finalUrl) {
  const ld = getJsonLdProducts(html)[0] || {};

  // ---- title ----
  let title =
    clean(ld.name) ||
    getMeta(html, ['og:title', 'twitter:title']) ||
    clean((html.match(/<span[^>]+id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i) || [])[1]) ||
    clean((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]);
  title = title.replace(/^Amazon\.in\s*:\s*/i, '').replace(/\s*[|\-–]\s*(Amazon\.in|Flipkart\.com|Buy Online.*)$/i, '').trim();

  // ---- description ----
  let description = clean(typeof ld.description === 'string' ? ld.description : '') || getMeta(html, ['og:description', 'twitter:description', 'description']);

  // Amazon-style bullet points
  const bullets = [];
  const ulMatch = html.match(/<div[^>]+id=["']feature-bullets["'][\s\S]*?<\/ul>/i);
  if (ulMatch) {
    const re = /<span[^>]+class=["'][^"']*a-list-item[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi;
    let b;
    while ((b = re.exec(ulMatch[0])) && bullets.length < 8) {
      const t = clean(b[1].replace(/<[^>]+>/g, ' '));
      if (t && t.length > 5) bullets.push(t);
    }
  }

  // ---- images ----
  const imgs = [];
  const pushImg = (u) => { const a = absUrl(u, finalUrl); if (a && /^https?:/.test(a) && !imgs.includes(a)) imgs.push(a); };
  if (ld.image) (Array.isArray(ld.image) ? ld.image : [ld.image]).forEach((i) => pushImg(typeof i === 'string' ? i : i && i.url));
  getAllMeta(html, 'og:image').forEach(pushImg);
  getAllMeta(html, 'og:image:secure_url').forEach(pushImg);
  const twitterImg = getMeta(html, ['twitter:image']);
  if (twitterImg) pushImg(twitterImg);
  const hires = html.match(/data-old-hires=["']([^"']+)["']/i);
  if (hires) pushImg(hires[1]);

  // ---- brand ----
  let brand = '';
  if (ld.brand) brand = clean(typeof ld.brand === 'string' ? ld.brand : ld.brand.name);
  if (!brand) brand = getMeta(html, ['product:brand', 'og:brand']);

  // ---- price ----
  let price;
  let originalPrice;
  const offerNode = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;
  if (offerNode) {
    price = toNumber(offerNode.price) || toNumber(offerNode.lowPrice);
    originalPrice = toNumber(offerNode.highPrice);
  }
  if (!price) price = toNumber(getMeta(html, ['product:price:amount', 'og:price:amount']));
  if (!price) {
    const a = html.match(/class=["']a-price-whole["'][^>]*>([\d,]+)/i);
    if (a) price = toNumber(a[1]);
  }
  if (!originalPrice) {
    const mrp = html.match(/class=["'][^"']*a-text-price[^"']*["'][\s\S]{0,200}?₹\s*([\d,]+)/i);
    if (mrp) originalPrice = toNumber(mrp[1]);
  }
  if (originalPrice && price && originalPrice <= price) originalPrice = undefined;

  // ---- tags ----
  const keywords = getMeta(html, ['keywords']).split(',').map((k) => k.trim()).filter((k) => k && k.length < 40).slice(0, 8);
  const seen = new Set();
  const tags = [brand, ...keywords].filter((t) => {
    if (!t) return false;
    const k = t.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // ---- specs (only if the page gives structured ones) ----
  const specs = [];
  if (Array.isArray(ld.additionalProperty)) {
    ld.additionalProperty.slice(0, 15).forEach((p) => {
      if (p && p.name && p.value !== undefined) specs.push({ key: clean(p.name), value: clean(String(p.value)) });
    });
  }
  if (ld.color) specs.push({ key: 'Color', value: clean(String(ld.color)) });

  const hostname = new URL(finalUrl).hostname;
  return {
    title: title.slice(0, 200),
    description,
    bullets,
    images: imgs.slice(0, 5),
    brand,
    price,
    originalPrice,
    tags,
    specs,
    merchant: guessMerchant(hostname),
    finalUrl,
  };
}

// POST /api/admin/link-import  { url }
router.post('/', async (req, res) => {
  const url = String((req.body && req.body.url) || '').trim();
  if (!isSafeUrl(url)) return res.status(400).json({ error: 'Valid http/https product link daalo' });

  try {
    const { html, finalUrl } = await fetchHtml(url);
    const data = parseProductPage(html, finalUrl);
    if (!data.title && !data.images.length) {
      return res.status(422).json({ error: 'Is link se kuch data nahi mila (site ne automatic fetch roka hoga). Details haath se bharni padengi.' });
    }
    res.json({ data });
  } catch (err) {
    const msg = err && err.name === 'AbortError' ? 'Site ne bahut der lagayi, dobara try karo' : (err && err.message) || 'Link fetch nahi ho paya';
    res.status(422).json({ error: msg });
  }
});

module.exports = router;
module.exports.parseProductPage = parseProductPage; // for testing
