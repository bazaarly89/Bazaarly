const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

function getCart(userId) {
  return db.prepare(`
    SELECT ci.id as cart_item_id, ci.quantity, p.*
    FROM cart_items ci JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
  `).all(userId).map(row => {
    const thumb = db.prepare('SELECT url FROM product_images WHERE product_id = ? ORDER BY position LIMIT 1').get(row.id);
    return { ...row, thumbnail: thumb ? thumb.url : null };
  });
}

router.get('/', authRequired, (req, res) => {
  res.json({ items: getCart(req.user.id) });
});

router.post('/', authRequired, (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const existing = db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?').get(req.user.id, productId);
  if (existing) {
    db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (id,user_id,product_id,quantity) VALUES (?,?,?,?)')
      .run(uuid(), req.user.id, productId, quantity);
  }
  res.status(201).json({ items: getCart(req.user.id) });
});

router.put('/:cartItemId', authRequired, (req, res) => {
  const { quantity } = req.body;
  if (quantity <= 0) {
    db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.cartItemId, req.user.id);
  } else {
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?')
      .run(quantity, req.params.cartItemId, req.user.id);
  }
  res.json({ items: getCart(req.user.id) });
});

router.delete('/:cartItemId', authRequired, (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.cartItemId, req.user.id);
  res.json({ items: getCart(req.user.id) });
});

router.delete('/', authRequired, (req, res) => {
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  res.json({ items: [] });
});

module.exports = router;
