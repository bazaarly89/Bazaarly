const express = require('express');
const crypto = require('crypto');
const { v4: uuid } = require('uuid');
const Razorpay = require('razorpay');
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

function computeCartTotals(userId, couponCode) {
  const items = db.prepare(`
    SELECT ci.quantity, p.id, p.title, p.price, p.stock
    FROM cart_items ci JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?`).all(userId);

  if (!items.length) return { error: 'Cart is empty' };

  for (const it of items) {
    if (it.stock < it.quantity) return { error: `${it.title} is out of stock` };
  }

  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  let discount = 0;
  if (couponCode) {
    const coupon = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(couponCode.toUpperCase());
    if (coupon && subtotal >= coupon.min_order_value) {
      discount = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
      if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
    }
  }
  const settings = Object.fromEntries(db.prepare('SELECT key,value FROM settings').all().map(s => [s.key, s.value]));
  const freeShippingAbove = Number(settings.free_shipping_above || 999);
  const baseShipping = Number(settings.shipping_fee || 49);
  const shipping = subtotal >= freeShippingAbove ? 0 : baseShipping;

  const total = Math.round((subtotal - discount + shipping) * 100) / 100;
  return { items, subtotal, discount, shipping, total };
}

// Create a Razorpay order (call before showing Razorpay checkout widget)
router.post('/razorpay/create', authRequired, async (req, res) => {
  const { couponCode } = req.body;
  const calc = computeCartTotals(req.user.id, couponCode);
  if (calc.error) return res.status(400).json({ error: calc.error });

  try {
    const rpOrder = await razorpay.orders.create({
      amount: Math.round(calc.total * 100), // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });
    res.json({ razorpayOrderId: rpOrder.id, amount: rpOrder.amount, currency: rpOrder.currency, keyId: process.env.RAZORPAY_KEY_ID, calc });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create Razorpay order', detail: e.message });
  }
});

// Verify signature + finalize order after Razorpay payment success
router.post('/razorpay/verify', authRequired, (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, addressId, couponCode } = req.body;

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
  if (expected !== razorpay_signature) {
    return res.status(400).json({ error: 'Payment verification failed' });
  }

  const order = placeOrderFromCart(req.user.id, {
    addressId, couponCode, paymentMethod: 'razorpay',
    paymentStatus: 'paid', razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id,
  });
  if (order.error) return res.status(400).json({ error: order.error });
  res.status(201).json({ order: order.order });
});

// Cash on Delivery checkout
router.post('/cod', authRequired, (req, res) => {
  const { addressId, couponCode } = req.body;
  const order = placeOrderFromCart(req.user.id, {
    addressId, couponCode, paymentMethod: 'cod', paymentStatus: 'pending',
  });
  if (order.error) return res.status(400).json({ error: order.error });
  res.status(201).json({ order: order.order });
});

function placeOrderFromCart(userId, opts) {
  const calc = computeCartTotals(userId, opts.couponCode);
  if (calc.error) return { error: calc.error };
  if (!opts.addressId) return { error: 'Shipping address is required' };

  const orderId = uuid();
  db.prepare(`INSERT INTO orders
    (id,user_id,address_id,subtotal,discount,shipping_fee,total,coupon_code,payment_method,payment_status,
     razorpay_order_id,razorpay_payment_id,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(orderId, userId, opts.addressId, calc.subtotal, calc.discount, calc.shipping, calc.total,
      opts.couponCode || null, opts.paymentMethod, opts.paymentStatus,
      opts.razorpayOrderId || null, opts.razorpayPaymentId || null, 'placed');

  const insertItem = db.prepare('INSERT INTO order_items (id,order_id,product_id,title,image,price,quantity) VALUES (?,?,?,?,?,?,?)');
  calc.items.forEach(it => {
    const thumb = db.prepare('SELECT url FROM product_images WHERE product_id = ? ORDER BY position LIMIT 1').get(it.id);
    insertItem.run(uuid(), orderId, it.id, it.title, thumb ? thumb.url : null, it.price, it.quantity);
    db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(it.quantity, it.id);
  });

  if (opts.couponCode) {
    db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE code = ?').run(opts.couponCode.toUpperCase());
  }

  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
  db.prepare('INSERT INTO order_tracking (id,order_id,status,note) VALUES (?,?,?,?)')
    .run(uuid(), orderId, 'placed', 'Your order has been placed successfully.');
  db.prepare('INSERT INTO notifications (id,user_id,title,message) VALUES (?,?,?,?)')
    .run(uuid(), userId, 'Order Placed', `Your order #${orderId.slice(0, 8)} has been placed.`);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  return { order: { ...order, items } };
}

// List my orders
router.get('/', authRequired, (req, res) => {
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  const withItems = orders.map(o => ({
    ...o, items: db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id),
  }));
  res.json({ orders: withItems });
});

// Order details + tracking timeline
router.get('/:id', authRequired, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  const tracking = db.prepare('SELECT * FROM order_tracking WHERE order_id = ? ORDER BY created_at ASC').all(order.id);
  const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(order.address_id);
  res.json({ order: { ...order, items, tracking, address } });
});

// Cancel order (only if not yet shipped)
router.post('/:id/cancel', authRequired, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (['shipped', 'out_for_delivery', 'delivered', 'cancelled'].includes(order.status)) {
    return res.status(400).json({ error: 'Order can no longer be cancelled' });
  }
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('cancelled', order.id);
  db.prepare('INSERT INTO order_tracking (id,order_id,status,note) VALUES (?,?,?,?)')
    .run(uuid(), order.id, 'cancelled', 'Order cancelled by customer.');
  res.json({ message: 'Order cancelled' });
});

module.exports = router;
