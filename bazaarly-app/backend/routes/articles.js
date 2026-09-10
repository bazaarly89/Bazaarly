// backend/routes/articles.js
// Public, read-only endpoints for the Buying Guides / Blog section.
// Everything here only ever returns published articles — drafts stay
// invisible to the storefront and only show up in the admin panel.
const express = require('express');
const { Article, Product, ARTICLE_CATEGORIES } = require('../db');
const router = express.Router();

function formatArticle(a) {
  const obj = a.toObject ? a.toObject() : a;
  return { ...obj, id: obj._id };
}

function formatProduct(p) {
  const obj = p.toObject ? p.toObject() : p;
  const sortedImages = (obj.images || []).slice().sort((a, b) => a.position - b.position).map((i) => i.url);
  return { ...obj, id: obj._id, images: sortedImages, thumbnail: sortedImages[0] || null };
}

// GET /api/articles/categories - the fixed category list (for filter tabs)
router.get('/categories', (req, res) => {
  res.json({ categories: ARTICLE_CATEGORIES });
});

// GET /api/articles?category=&search=&page=&limit=
router.get('/', async (req, res) => {
  const { category, search, page = 1, limit = 9 } = req.query;
  const filter = { isPublished: true };
  if (category) filter.category = category;
  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ title: regex }, { seoDescription: regex }, { content: regex }];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Article.countDocuments(filter);
  // Exclude the full HTML body from the list view — the listing only needs
  // a preview's worth of fields, keeping the payload small.
  const rows = await Article.find(filter)
    .select('-content')
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  res.json({
    articles: rows.map(formatArticle),
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

// GET /api/articles/:slug - full article + related products + more-in-category
router.get('/:slug', async (req, res) => {
  const article = await Article.findOne({ slug: req.params.slug, isPublished: true }).lean();
  if (!article) return res.status(404).json({ error: 'Article not found' });

  const relatedProducts = article.relatedProductIds?.length
    ? (await Product.find({ _id: { $in: article.relatedProductIds }, isActive: true }).lean()).map(formatProduct)
    : [];

  const moreArticles = (await Article.find({
    category: article.category,
    isPublished: true,
    _id: { $ne: article._id },
  }).select('title slug featuredImage category publishedAt').sort({ publishedAt: -1 }).limit(4).lean()).map(formatArticle);

  res.json({ article: formatArticle(article), relatedProducts, moreArticles });
});

module.exports = router;
