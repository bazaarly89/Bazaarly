const express = require('express');
const { CartItem, Product } = require('../db');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

async function getCart(userId) {
  const items = await CartItem.find({ userId }).lean();
  const results = [];
  for (const item of items) {
    const product = await Product.findById(item.productId).lean();
    if (!product) continue; // product may have been deleted
    const sortedImages = (product.images || []).slice().sort((a, b) => a.position - b.position);
    results.push({
      ...product,
      id: product._id,
      cart_item_id: item._id,
      quantity: item.quantity,
      thumbnail: sortedImages[0]?.url || null,
    });
  }
  return results;
}

router.get('/', authRequired, async (req, res) => {
  res.json({ items: await getCart(req.user.id) });
});

router.post('/', authRequired, async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.productType === 'affiliate') return res.status(400).json({ error: 'This product cannot be added to cart — use the Check Deal link instead' });

  const existing = await CartItem.findOne({ userId: req.user.id, productId });
  if (existing) {
    existing.quantity += quantity;
    await existing.save();
  } else {
    await CartItem.create({ userId: req.user.id, productId, quantity });
  }
  res.status(201).json({ items: await getCart(req.user.id) });
});

router.put('/:cartItemId', authRequired, async (req, res) => {
  const { quantity } = req.body;
  if (quantity <= 0) {
    await CartItem.deleteOne({ _id: req.params.cartItemId, userId: req.user.id });
  } else {
    await CartItem.updateOne({ _id: req.params.cartItemId, userId: req.user.id }, { quantity });
  }
  res.json({ items: await getCart(req.user.id) });
});

router.delete('/:cartItemId', authRequired, async (req, res) => {
  await CartItem.deleteOne({ _id: req.params.cartItemId, userId: req.user.id });
  res.json({ items: await getCart(req.user.id) });
});

router.delete('/', authRequired, async (req, res) => {
  await CartItem.deleteMany({ userId: req.user.id });
  res.json({ items: [] });
});

module.exports = router;
