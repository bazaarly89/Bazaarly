const express = require('express');
const { Wishlist, Product } = require('../db');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

async function getWishlist(userId) {
  const wishItems = await Wishlist.find({ userId }).sort({ createdAt: -1 }).lean();
  const results = [];
  for (const w of wishItems) {
    const product = await Product.findById(w.productId).lean();
    if (!product) continue;
    const sortedImages = (product.images || []).slice().sort((a, b) => a.position - b.position);
    results.push({ ...product, id: product._id, wishlist_id: w._id, thumbnail: sortedImages[0]?.url || null });
  }
  return results;
}

router.get('/', authRequired, async (req, res) => {
  res.json({ items: await getWishlist(req.user.id) });
});

router.post('/', authRequired, async (req, res) => {
  const { productId } = req.body;
  try {
    await Wishlist.create({ userId: req.user.id, productId });
  } catch (e) { /* already in wishlist - ignore duplicate key error */ }
  res.status(201).json({ items: await getWishlist(req.user.id) });
});

router.delete('/:productId', authRequired, async (req, res) => {
  await Wishlist.deleteOne({ userId: req.user.id, productId: req.params.productId });
  res.json({ items: await getWishlist(req.user.id) });
});

module.exports = router;
