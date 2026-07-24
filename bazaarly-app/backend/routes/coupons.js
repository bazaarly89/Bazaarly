const express = require('express');
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

router.post('/validate', authRequired, (req, res) => {
  const { code, orderValue } = req.body;
  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get((code || '').toUpperCase());
  if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' });
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return res.status(400).json({ error: 'Coupon has expired' });
  }
  if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
    return res.status(400).json({ error: 'Coupon usage limit reached' });
  }
  if (orderValue < coupon.min_order_value) {
    return res.status(400).json({ error: `Minimum order value of ₹${coupon.min_order_value} required` });
  }

  let discount = coupon.type === 'percent' ? (orderValue * coupon.value) / 100 : coupon.value;
  if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
  discount = Math.round(discount * 100) / 100;

  res.json({ coupon: { code: coupon.code, type: coupon.type, value: coupon.value }, discount });
});

module.exports = router;
