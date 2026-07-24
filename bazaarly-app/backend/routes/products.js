const express = require('express');
const db = require('../db');
const router = express.Router();

function attachImages(product) {
  const images = db.prepare('SELECT url FROM product_images WHERE product_id = ? ORDER BY position').all(product.id).map(i => i.url);
  return { ...product, images };
}

// GET /api/products?search=&category=&minPrice=&maxPrice=&brand=&rating=&sort=&page=&limit=
router.get('/', (req, res) => {
  const { search, category, minPrice, maxPrice, brand, rating, sort, page = 1, limit = 12 } = req.query;
  let where = 'WHERE p.is_active = 1';
  const params = [];

  if (search) {
    where += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (category) {
    where += ' AND c.slug = ?';
    params.push(category);
  }
  if (brand) {
    where += ' AND p.brand = ?';
    params.push(brand);
  }
  if (minPrice) { where += ' AND p.price >= ?'; params.push(Number(minPrice)); }
  if (maxPrice) { where += ' AND p.price <= ?'; params.push(Number(maxPrice)); }
  if (rating) { where += ' AND p.rating >= ?'; params.push(Number(rating)); }

  let orderBy = 'p.created_at DESC';
  if (sort === 'price_asc') orderBy = 'p.price ASC';
  if (sort === 'price_desc') orderBy = 'p.price DESC';
  if (sort === 'rating') orderBy = 'p.rating DESC';
  if (sort === 'popular') orderBy = 'p.rating_count DESC';

  const offset = (Number(page) - 1) * Number(limit);

  const total = db.prepare(`
    SELECT COUNT(*) c FROM products p LEFT JOIN categories c ON p.category_id = c.id ${where}
  `).get(...params).c;

  const rows = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  const products = rows.map(r => {
    const thumb = db.prepare('SELECT url FROM product_images WHERE product_id = ? ORDER BY position LIMIT 1').get(r.id);
    return { ...r, thumbnail: thumb ? thumb.url : null };
  });

  res.json({ products, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) });
});

// GET /api/products/brands - distinct brands for filter UI
router.get('/brands', (req, res) => {
  const brands = db.prepare('SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL').all().map(b => b.brand);
  res.json({ brands });
});

// GET /api/products/:slug
router.get('/:slug', (req, res) => {
  const product = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.slug = ? AND p.is_active = 1
  `).get(req.params.slug);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const attributes = db.prepare('SELECT attr_key, attr_value FROM product_attributes WHERE product_id = ?').all(product.id);
  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ? ORDER BY r.created_at DESC
  `).all(product.id);

  res.json({ product: attachImages(product), attributes, reviews });
});

module.exports = router;
