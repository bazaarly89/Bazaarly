const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

function getWishlist(userId) {
  return db.prepare(`
    SELECT w.id as wishlist_id, p.* FROM wishlist w
    JOIN products p ON w.product_id = p.id
    WHERE w.user_id = ? ORDER BY w.created_at DESC
  `).all(userId).map(row => {
    const thumb = db.prepare('SELECT url FROM product_images WHERE product_id = ? ORDER BY position LIMIT 1').get(row.id);
    return { ...row, thumbnail: thumb ? thumb.url : null };
  });
}

router.get('/', authRequired, (req, res) => {
  res.json({ items: getWishlist(req.user.id) });
});

router.post('/', authRequired, (req, res) => {
  const { productId } = req.body;
  try {
    db.prepare('INSERT INTO wishlist (id,user_id,product_id) VALUES (?,?,?)').run(uuid(), req.user.id, productId);
  } catch (e) { /* already in wishlist - ignore unique constraint error */ }
  res.status(201).json({ items: getWishlist(req.user.id) });
});

router.delete('/:productId', authRequired, (req, res) => {
  db.prepare('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?').run(req.user.id, req.params.productId);
  res.json({ items: getWishlist(req.user.id) });
});

module.exports = router;
