const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { CartItem, Product, Coupon, Setting, Order, Notification, Address } = require('../db');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function computeCartTotals(userId, couponCode) {
  const cartItems = await CartItem.find({ userId }).lean();
  const items = [];
  for (const ci of cartItems) {
    const p = await Product.findById(ci.productId).lean();
    if (!p) continue;
    items.push({ quantity: ci.quantity, id: p._id, title: p.title, price: p.price, stock: p.stock, images: p.images });
  }

  if (!items.length) return { error: 'Cart is empty' };

  for (const it of items) {
    if (it.stock < it.quantity) return { error: `${it.title} is out of stock` };
  }

  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  let discount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon && subtotal >= coupon.minOrderValue) {
      discount = coupon.type === 'percent' ? (subtotal * coupon.value) / 100 : coupon.value;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    }
  }

  const settingsRows = await Setting.find().lean();
  const settings = Object.fromEntries(settingsRows.map((s) => [s._id, s.value]));
  const freeShippingAbove = Number(settings.free_shipping_above || 999);
  const baseShipping = Number(settings.shipping_fee || 49);
  const shipping = subtotal >= freeShippingAbove ? 0 : baseShipping;

  const total = Math.round((subtotal - discount + shipping) * 100) / 100;
  return { items, subtotal, discount, shipping, total };
}

// Create a Razorpay order (call before showing Razorpay checkout widget)
router.post('/razorpay/create', authRequired, async (req, res) => {
  const { couponCode } = req.body;
  const calc = await computeCartTotals(req.user.id, couponCode);
  if (calc.error) return res.status(400).json({ error: calc.error });

  try {
    const rpOrder = await razorpay.orders.create({
      amount: Math.round(calc.total * 100), // paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });
    res.json({ razorpayOrderId: rpOrder.id, amount: rpOrder.amount, currency: rpOrder.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create Razorpay order', detail: e.message });
  }
});

// Verify signature + finalize order after Razorpay payment success
router.post('/razorpay/verify', authRequired, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, addressId, couponCode } = req.body;

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
  if (expected !== razorpay_signature) {
    return res.status(400).json({ error: 'Payment verification failed' });
  }

  const order = await placeOrderFromCart(req.user.id, {
    addressId, couponCode, paymentMethod: 'razorpay',
    paymentStatus: 'paid', razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id,
  });
  if (order.error) return res.status(400).json({ error: order.error });
  res.status(201).json({ order: order.order });
});

// Cash on Delivery checkout
router.post('/cod', authRequired, async (req, res) => {
  const { addressId, couponCode } = req.body;
  const order = await placeOrderFromCart(req.user.id, {
    addressId, couponCode, paymentMethod: 'cod', paymentStatus: 'pending',
  });
  if (order.error) return res.status(400).json({ error: order.error });
  res.status(201).json({ order: order.order });
});

async function placeOrderFromCart(userId, opts) {
  const calc = await computeCartTotals(userId, opts.couponCode);
  if (calc.error) return { error: calc.error };
  if (!opts.addressId) return { error: 'Shipping address is required' };

  const orderItems = calc.items.map((it) => {
    const sortedImages = (it.images || []).slice().sort((a, b) => a.position - b.position);
    return { productId: it.id, title: it.title, image: sortedImages[0]?.url || null, price: it.price, quantity: it.quantity };
  });

  const orderDoc = await Order.create({
    userId,
    addressId: opts.addressId,
    subtotal: calc.subtotal,
    discount: calc.discount,
    shippingFee: calc.shipping,
    total: calc.total,
    couponCode: opts.couponCode || null,
    paymentMethod: opts.paymentMethod,
    paymentStatus: opts.paymentStatus,
    razorpayOrderId: opts.razorpayOrderId || null,
    razorpayPaymentId: opts.razorpayPaymentId || null,
    status: 'placed',
    items: orderItems,
    tracking: [{ status: 'placed', note: 'Your order has been placed successfully.', createdAt: new Date() }],
  });

  for (const it of calc.items) {
    await Product.findByIdAndUpdate(it.id, { $inc: { stock: -it.quantity } });
  }

  if (opts.couponCode) {
    await Coupon.updateOne({ code: opts.couponCode.toUpperCase() }, { $inc: { usedCount: 1 } });
  }

  await CartItem.deleteMany({ userId });

  await Notification.create({
    userId,
    title: 'Order Placed',
    message: `Your order #${orderDoc._id.slice(0, 8)} has been placed.`,
  });

  return { order: { ...orderDoc.toObject(), id: orderDoc._id } };
}

// List my orders
router.get('/', authRequired, async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json({ orders: orders.map((o) => ({ ...o, id: o._id })) });
});

// Order details + tracking timeline
router.get('/:id', authRequired, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user.id }).lean();
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const address = order.addressId ? await Address.findById(order.addressId).lean() : null;
  res.json({ order: { ...order, id: order._id, address: address ? { ...address, id: address._id } : null } });
});

// Cancel order (only if not yet shipped)
router.post('/:id/cancel', authRequired, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (['shipped', 'out_for_delivery', 'delivered', 'cancelled'].includes(order.status)) {
    return res.status(400).json({ error: 'Order can no longer be cancelled' });
  }
  order.status = 'cancelled';
  order.tracking.push({ status: 'cancelled', note: 'Order cancelled by customer.', createdAt: new Date() });
  await order.save();
  res.json({ message: 'Order cancelled' });
});

module.exports = router;
