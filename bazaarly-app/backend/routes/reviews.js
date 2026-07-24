const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

router.post('/', authRequired, (req, res) => {
  const { productId, rating, title, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

  db.prepare('INSERT INTO reviews (id,product_id,user_id,rating,title,comment) VALUES (?,?,?,?,?,?)')
    .run(uuid(), productId, req.user.id, rating, title || '', comment || '');

  const agg = db.prepare('SELECT AVG(rating) avgRating, COUNT(*) cnt FROM reviews WHERE product_id = ?').get(productId);
  db.prepare('UPDATE products SET rating = ?, rating_count = ? WHERE id = ?')
    .run(Number(agg.avgRating).toFixed(1), agg.cnt, productId);

  const reviews = db.prepare(`
    SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ? ORDER BY r.created_at DESC`).all(productId);
  res.status(201).json({ reviews });
});

module.exports = router;
