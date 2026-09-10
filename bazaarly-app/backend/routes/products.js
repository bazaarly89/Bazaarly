const express = require('express');
const { Product, Category, Review, User } = require('../db');
const router = express.Router();

function formatProduct(p, categoryDoc) {
  const obj = p.toObject ? p.toObject() : p;
  const sortedImages = (obj.images || []).slice().sort((a, b) => a.position - b.position).map((i) => i.url);
  return {
    ...obj,
    id: obj._id,
    category_name: categoryDoc?.name,
    category_slug: categoryDoc?.slug,
    images: sortedImages,
    thumbnail: sortedImages[0] || null,
  };
}

// GET /api/products?search=&category=&minPrice=&maxPrice=&brand=&rating=&sort=&page=&limit=
router.get('/', async (req, res) => {
  const { search, category, minPrice, maxPrice, brand, rating, sort, deal, comparisonEnabled, page = 1, limit = 12 } = req.query;
  const filter = { isActive: true };
  const andConditions = [];

  if (deal === 'true') filter.deal = true;
  if (comparisonEnabled === 'true') filter.comparisonEnabled = true;

  if (search) {
    const regex = new RegExp(search, 'i');
    andConditions.push({ $or: [{ title: regex }, { description: regex }, { brand: regex }] });
  }
  if (category) {
    const cat = await Category.findOne({ slug: category });
    filter.categoryId = cat ? cat._id : '__none__'; // no matching category => no results
  }
  if (brand) filter.brand = brand;

  // Price filter must work across own products (price) and affiliate products (currentPrice)
  if (minPrice || maxPrice) {
    const priceFilter = {};
    if (minPrice) priceFilter.$gte = Number(minPrice);
    if (maxPrice) priceFilter.$lte = Number(maxPrice);
    andConditions.push({ $or: [{ price: priceFilter }, { currentPrice: priceFilter }] });
  }

  if (rating) filter.rating = { $gte: Number(rating) };
  if (andConditions.length) filter.$and = andConditions;

  let sortSpec = { createdAt: -1 };
  if (sort === 'price_asc') sortSpec = { price: 1 };
  if (sort === 'price_desc') sortSpec = { price: -1 };
  if (sort === 'rating') sortSpec = { rating: -1 };
  if (sort === 'popular') sortSpec = { ratingCount: -1 };

  const skip = (Number(page) - 1) * Number(limit);

  const total = await Product.countDocuments(filter);
  const rows = await Product.find(filter).sort(sortSpec).skip(skip).limit(Number(limit)).lean();

  const categoryIds = [...new Set(rows.map((r) => r.categoryId).filter(Boolean))];
  const categoryDocs = await Category.find({ _id: { $in: categoryIds } }).lean();
  const categoryMap = Object.fromEntries(categoryDocs.map((c) => [c._id, c]));

  const products = rows.map((r) => formatProduct(r, categoryMap[r.categoryId]));

  res.json({ products, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
});

// GET /api/products/brands - distinct brands for filter UI
router.get('/brands', async (req, res) => {
  const brands = await Product.distinct('brand', { brand: { $nin: [null, ''] } });
  res.json({ brands });
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const categoryDoc = product.categoryId ? await Category.findById(product.categoryId).lean() : null;

  const attributes = (product.attributes || []).map((a) => ({ attr_key: a.key, attr_value: a.value }));

  const reviewDocs = await Review.find({ productId: product._id }).sort({ createdAt: -1 }).lean();
  const reviews = await Promise.all(reviewDocs.map(async (r) => {
    const user = await User.findById(r.userId).lean();
    return { ...r, id: r._id, user_name: user?.name };
  }));

  res.json({ product: formatProduct(product, categoryDoc), attributes, reviews });
});

module.exports = router;

