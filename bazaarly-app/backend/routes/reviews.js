const express = require('express');
const { Review, Product, User } = require('../db');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

router.post('/', authRequired, async (req, res) => {
  const { productId, rating, title, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

  await Review.create({ productId, userId: req.user.id, rating, title: title || '', comment: comment || '' });

  const agg = await Review.aggregate([
    { $match: { productId } },
    { $group: { _id: '$productId', avgRating: { $avg: '$rating' }, cnt: { $sum: 1 } } },
  ]);
  if (agg.length) {
    await Product.findByIdAndUpdate(productId, {
      rating: Number(agg[0].avgRating.toFixed(1)),
      ratingCount: agg[0].cnt,
    });
  }

  const reviewDocs = await Review.find({ productId }).sort({ createdAt: -1 }).lean();
  const reviews = await Promise.all(reviewDocs.map(async (r) => {
    const user = await User.findById(r.userId).lean();
    return { ...r, id: r._id, user_name: user?.name };
  }));
  res.status(201).json({ reviews });
});

module.exports = router;
