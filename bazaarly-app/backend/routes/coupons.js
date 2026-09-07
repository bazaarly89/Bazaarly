const express = require('express');
const { Coupon } = require('../db');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

router.post('/validate', authRequired, async (req, res) => {
  const { code, orderValue } = req.body;
  const coupon = await Coupon.findOne({ code: (code || '').toUpperCase(), isActive: true });
  if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' });
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return res.status(400).json({ error: 'Coupon has expired' });
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({ error: 'Coupon usage limit reached' });
  }
  if (orderValue < coupon.minOrderValue) {
    return res.status(400).json({ error: `Minimum order value of ₹${coupon.minOrderValue} required` });
  }

  let discount = coupon.type === 'percent' ? (orderValue * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.round(discount * 100) / 100;

  res.json({ coupon: { code: coupon.code, type: coupon.type, value: coupon.value }, discount });
});

module.exports = router;
