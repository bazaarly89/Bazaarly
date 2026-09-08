const express = require('express');
const { v4: uuid } = require('uuid');
const { Product, Category, Order, User, Coupon, Banner, Advertisement, Notification, Setting, HeroSlide, TrustCard } = require('../db');
const { adminRequired } = require('../middleware/auth');
const router = express.Router();

router.use(adminRequired);

// ---------------- DASHBOARD ----------------
router.get('/dashboard', async (req, res) => {
  const paidOrDelivered = await Order.find({ $or: [{ paymentStatus: 'paid' }, { paymentMethod: 'cod' }] });
  const totalSales = paidOrDelivered.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = await Order.countDocuments();
  const totalCustomers = await User.countDocuments({ role: 'customer' });
  const totalProducts = await Product.countDocuments();
  const pendingOrders = await Order.countDocuments({ status: { $in: ['placed', 'confirmed'] } });
  const lowStock = await Product.countDocuments({ stock: { $lte: 5 } });

  const recentOrdersRaw = await Order.find().sort({ createdAt: -1 }).limit(8).lean();
  const recentOrders = await Promise.all(recentOrdersRaw.map(async (o) => {
    const user = await User.findById(o.userId).lean();
    return { ...o, id: o._id, customer_name: user?.name };
  }));

  const salesByDayAgg = await Order.aggregate([
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, amount: { $sum: '$total' } } },
    { $sort: { _id: -1 } },
    { $limit: 14 },
  ]);
  const salesByDay = salesByDayAgg.reverse().map((r) => ({ day: r._id, amount: r.amount }));

  const topProductsAgg = await Order.aggregate([
    { $unwind: '$items' },
    { $group: { _id: '$items.productId', sold: { $sum: '$items.quantity' } } },
    { $sort: { sold: -1 } },
    { $limit: 5 },
  ]);
  const topProducts = await Promise.all(topProductsAgg.map(async (r) => {
    const p = await Product.findById(r._id).lean();
    return { title: p?.title, sold: r.sold };
  }));

  res.json({ totalSales, totalOrders, totalCustomers, totalProducts, pendingOrders, lowStock, recentOrders, salesByDay, topProducts });
});

// ---------------- PRODUCTS ----------------
router.get('/products', async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 }).lean();
  const withCategory = await Promise.all(products.map(async (p) => {
    const cat = p.categoryId ? await Category.findById(p.categoryId).lean() : null;
    return { ...p, id: p._id, category_name: cat?.name, images: (p.images || []).sort((a, b) => a.position - b.position).map((i) => i.url) };
  }));
  res.json({ products: withCategory });
});

router.post('/products', async (req, res) => {
  const {
    title, description, shortDescription, categoryId, brand, images = [], tags = [],
    featured, trending, deal,
    productType = 'own',
    // own-product fields
    price, mrp, stock, sku,
    // affiliate-product fields
    currentPrice, originalPrice, discountPercentage, merchant, affiliateUrl, ctaText,
    pros = [], cons = [], editorScore, comparisonEnabled,
  } = req.body;

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

  const productData = {
    title, slug, description: description || '', shortDescription: shortDescription || '',
    categoryId, brand: brand || '', productType,
    images: images.map((url, i) => ({ url, position: i })),
    tags, featured: !!featured, trending: !!trending, deal: !!deal,
  };

  if (productType === 'own') {
    // Own products need price/mrp/stock — affiliate-only fields are left blank
    productData.price = price;
    productData.mrp = mrp;
    productData.stock = stock || 0;
    productData.sku = sku || '';
  } else if (productType === 'affiliate') {
    // Affiliate products never touch cart/stock — they only redirect out
    if (!affiliateUrl) return res.status(400).json({ error: 'affiliateUrl is required for affiliate products' });
    productData.currentPrice = currentPrice;
    productData.originalPrice = originalPrice;
    productData.discountPercentage = discountPercentage;
    productData.merchant = merchant || '';
    productData.affiliateUrl = affiliateUrl;
    productData.ctaText = ctaText || 'Check Deal';
    productData.pros = pros;
    productData.cons = cons;
    productData.editorScore = editorScore;
    productData.comparisonEnabled = !!comparisonEnabled;
  }

  const product = await Product.create(productData);
  res.status(201).json({ product: { ...product.toObject(), id: product._id } });
});

router.put('/products/:id', async (req, res) => {
  const {
    title, description, shortDescription, categoryId, brand, isActive, images, tags,
    featured, trending, deal, productType,
    price, mrp, stock, sku,
    currentPrice, originalPrice, discountPercentage, merchant, affiliateUrl, ctaText,
    pros, cons, editorScore, comparisonEnabled,
  } = req.body;

  const update = { updatedAt: new Date() };
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (shortDescription !== undefined) update.shortDescription = shortDescription;
  if (categoryId !== undefined) update.categoryId = categoryId;
  if (brand !== undefined) update.brand = brand;
  if (isActive !== undefined) update.isActive = isActive;
  if (Array.isArray(images)) update.images = images.map((url, i) => ({ url, position: i }));
  if (Array.isArray(tags)) update.tags = tags;
  if (featured !== undefined) update.featured = featured;
  if (trending !== undefined) update.trending = trending;
  if (deal !== undefined) update.deal = deal;
  if (productType !== undefined) update.productType = productType;

  // own-product fields
  if (price !== undefined) update.price = price;
  if (mrp !== undefined) update.mrp = mrp;
  if (stock !== undefined) update.stock = stock;
  if (sku !== undefined) update.sku = sku;

  // affiliate-product fields
  if (currentPrice !== undefined) update.currentPrice = currentPrice;
  if (originalPrice !== undefined) update.originalPrice = originalPrice;
  if (discountPercentage !== undefined) update.discountPercentage = discountPercentage;
  if (merchant !== undefined) update.merchant = merchant;
  if (affiliateUrl !== undefined) update.affiliateUrl = affiliateUrl;
  if (ctaText !== undefined) update.ctaText = ctaText;
  if (Array.isArray(pros)) update.pros = pros;
  if (Array.isArray(cons)) update.cons = cons;
  if (editorScore !== undefined) update.editorScore = editorScore;
  if (comparisonEnabled !== undefined) update.comparisonEnabled = comparisonEnabled;

  const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ product: { ...product.toObject(), id: product._id } });
});

router.delete('/products/:id', async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Product deleted' });
});

// ---------------- INVENTORY ----------------
router.get('/inventory', async (req, res) => {
  const items = await Product.find().select('title sku stock price').sort({ stock: 1 }).lean();
  res.json({ items: items.map((i) => ({ ...i, id: i._id })) });
});

router.put('/inventory/:id', async (req, res) => {
  const { stock } = req.body;
  await Product.findByIdAndUpdate(req.params.id, { stock });
  res.json({ message: 'Stock updated' });
});

// ---------------- CATEGORIES ----------------
router.get('/categories', async (req, res) => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  res.json({ categories: categories.map((c) => ({ ...c, id: c._id })) });
});

router.post('/categories', async (req, res) => {
  const { name, image, parentId, isActive } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const category = await Category.create({ name, slug, image: image || '', parentId: parentId || null, isActive: isActive === false ? false : true });
  res.status(201).json({ category: { ...category.toObject(), id: category._id } });
});

router.put('/categories/:id', async (req, res) => {
  const { name, image, parentId, isActive } = req.body;
  const update = {};
  if (name !== undefined) update.name = name;
  if (image !== undefined) update.image = image;
  if (parentId !== undefined) update.parentId = parentId;
  if (isActive !== undefined) update.isActive = isActive;
  const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ category: { ...category.toObject(), id: category._id } });
});

router.delete('/categories/:id', async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Category deleted' });
});

// ---------------- ORDERS ----------------
router.get('/orders', async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
  const withCustomer = await Promise.all(orders.map(async (o) => {
    const user = await User.findById(o.userId).lean();
    return { ...o, id: o._id, customer_name: user?.name, customer_email: user?.email };
  }));
  res.json({ orders: withCustomer });
});

router.get('/orders/:id', async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const user = await User.findById(order.userId).lean();
  res.json({ order: { ...order, id: order._id, customer_name: user?.name, customer_email: user?.email } });
});

const VALID_STATUSES = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
router.put('/orders/:id/status', async (req, res) => {
  const { status, note } = req.body;
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status,
      $push: { tracking: { status, note: note || `Order status updated to ${status}`, createdAt: new Date() } },
    },
    { new: true }
  );

  if (order) {
    await Notification.create({
      userId: order.userId,
      title: 'Order Update',
      message: `Your order status is now: ${status.replace(/_/g, ' ')}`,
    });
  }
  res.json({ message: 'Order status updated' });
});

// ---------------- CUSTOMERS ----------------
router.get('/customers', async (req, res) => {
  const customers = await User.find({ role: 'customer' }).sort({ createdAt: -1 }).lean();
  const withStats = await Promise.all(customers.map(async (c) => {
    const orders = await Order.find({ userId: c._id }).lean();
    return {
      id: c._id, name: c.name, email: c.email, phone: c.phone, created_at: c.createdAt,
      order_count: orders.length,
      total_spent: orders.reduce((sum, o) => sum + o.total, 0),
    };
  }));
  res.json({ customers: withStats });
});

// ---------------- COUPONS ----------------
router.get('/coupons', async (req, res) => {
  const coupons = await Coupon.find().sort({ code: 1 }).lean();
  res.json({ coupons: coupons.map((c) => ({ ...c, id: c._id })) });
});

router.post('/coupons', async (req, res) => {
  const { code, type, value, minOrderValue, maxDiscount, expiresAt, usageLimit } = req.body;
  const coupon = await Coupon.create({
    code: code.toUpperCase(), type, value,
    minOrderValue: minOrderValue || 0, maxDiscount: maxDiscount || null,
    expiresAt: expiresAt || null, usageLimit: usageLimit || 0,
  });
  res.status(201).json({ coupon: { ...coupon.toObject(), id: coupon._id } });
});

router.put('/coupons/:id', async (req, res) => {
  const { isActive, value, minOrderValue, maxDiscount, expiresAt, usageLimit } = req.body;
  const update = {};
  if (isActive !== undefined) update.isActive = isActive;
  if (value !== undefined) update.value = value;
  if (minOrderValue !== undefined) update.minOrderValue = minOrderValue;
  if (maxDiscount !== undefined) update.maxDiscount = maxDiscount;
  if (expiresAt !== undefined) update.expiresAt = expiresAt;
  if (usageLimit !== undefined) update.usageLimit = usageLimit;
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ coupon: { ...coupon.toObject(), id: coupon._id } });
});

router.delete('/coupons/:id', async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ message: 'Coupon deleted' });
});

// ---------------- BANNERS ----------------
router.get('/banners', async (req, res) => {
  const banners = await Banner.find().sort({ position: 1 }).lean();
  res.json({ banners: banners.map((b) => ({ ...b, id: b._id })) });
});
router.post('/banners', async (req, res) => {
  const { title, image, link, position } = req.body;
  const banner = await Banner.create({ title, image, link: link || '', position: position || 0 });
  res.status(201).json({ banner: { ...banner.toObject(), id: banner._id } });
});
router.put('/banners/:id', async (req, res) => {
  const { title, image, link, position, isActive } = req.body;
  const update = {};
  if (title !== undefined) update.title = title;
  if (image !== undefined) update.image = image;
  if (link !== undefined) update.link = link;
  if (position !== undefined) update.position = position;
  if (isActive !== undefined) update.isActive = isActive;
  const banner = await Banner.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ banner: { ...banner.toObject(), id: banner._id } });
});
router.delete('/banners/:id', async (req, res) => {
  await Banner.findByIdAndDelete(req.params.id);
  res.json({ message: 'Banner deleted' });
});

// ---------------- ADVERTISEMENTS ----------------
router.get('/advertisements', async (req, res) => {
  const advertisements = await Advertisement.find().lean();
  res.json({ advertisements: advertisements.map((a) => ({ ...a, id: a._id })) });
});
router.post('/advertisements', async (req, res) => {
  const { title, image, link, placement } = req.body;
  const ad = await Advertisement.create({ title, image, link: link || '', placement: placement || 'home_top' });
  res.status(201).json({ advertisement: { ...ad.toObject(), id: ad._id } });
});
router.delete('/advertisements/:id', async (req, res) => {
  await Advertisement.findByIdAndDelete(req.params.id);
  res.json({ message: 'Advertisement deleted' });
});

// ---------------- REPORTS & ANALYTICS ----------------
router.get('/reports/sales', async (req, res) => {
  const { from, to } = req.query;
  const match = {};
  if (from && to) match.createdAt = { $gte: new Date(from), $lte: new Date(to) };
  const rows = await Order.aggregate([
    { $match: match },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
  res.json({ rows: rows.map((r) => ({ day: r._id, revenue: r.revenue, orders: r.orders })) });
});

router.get('/reports/top-products', async (req, res) => {
  const agg = await Order.aggregate([
    { $unwind: '$items' },
    { $group: { _id: '$items.productId', units_sold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } } } },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
  ]);
  const rows = await Promise.all(agg.map(async (r) => {
    const p = await Product.findById(r._id).lean();
    return { id: r._id, title: p?.title, units_sold: r.units_sold, revenue: r.revenue };
  }));
  res.json({ rows });
});

router.get('/analytics/overview', async (req, res) => {
  const totalUsers = await User.countDocuments({ role: 'customer' });
  const usersWithOrdersAgg = await Order.aggregate([{ $group: { _id: '$userId' } }]);
  const usersWithOrders = usersWithOrdersAgg.length;

  const catAgg = await Order.aggregate([
    { $unwind: '$items' },
    { $group: { _id: '$items.productId', items_sold: { $sum: 1 } } },
  ]);
  const categoryMap = {};
  for (const row of catAgg) {
    const product = await Product.findById(row._id).lean();
    if (!product) continue;
    const cat = await Category.findById(product.categoryId).lean();
    const name = cat?.name || 'Unknown';
    categoryMap[name] = (categoryMap[name] || 0) + row.items_sold;
  }
  const categoryBreakdown = Object.entries(categoryMap)
    .map(([name, items_sold]) => ({ name, items_sold }))
    .sort((a, b) => b.items_sold - a.items_sold);

  res.json({ conversionInputs: { totalUsers, usersWithOrders }, categoryBreakdown });
});

// ---------------- SETTINGS ----------------
router.get('/settings', async (req, res) => {
  const rows = await Setting.find().lean();
  res.json({ settings: Object.fromEntries(rows.map((r) => [r._id, r.value])) });
});
router.put('/settings', async (req, res) => {
  const updates = req.body; // { key: value, ... }
  for (const [k, v] of Object.entries(updates)) {
    await Setting.findByIdAndUpdate(k, { value: String(v) }, { upsert: true });
  }
  const rows = await Setting.find().lean();
  res.json({ settings: Object.fromEntries(rows.map((r) => [r._id, r.value])) });
});

// ---------------- HERO SLIDES ----------------
router.get('/hero-slides', async (req, res) => {
  const slides = await HeroSlide.find().sort({ position: 1 }).lean();
  res.json({ slides: slides.map((s) => ({ ...s, id: s._id })) });
});
router.post('/hero-slides', async (req, res) => {
  const { mode, image, eyebrow, title, subtitle, specs = [], ctaText, ctaLink, position = 0, imageFit } = req.body;
  const slide = await HeroSlide.create({
    mode: mode || 'image_text', image, eyebrow: eyebrow || '', title: title || '', subtitle: subtitle || '',
    specs, ctaText: ctaText || '', ctaLink: ctaLink || '', position, imageFit: imageFit || 'cover',
  });
  res.status(201).json({ slide: { ...slide.toObject(), id: slide._id } });
});
router.put('/hero-slides/:id', async (req, res) => {
  const { mode, image, eyebrow, title, subtitle, specs, ctaText, ctaLink, position, isActive, imageFit } = req.body;
  const update = {};
  if (mode !== undefined) update.mode = mode;
  if (image !== undefined) update.image = image;
  if (eyebrow !== undefined) update.eyebrow = eyebrow;
  if (title !== undefined) update.title = title;
  if (subtitle !== undefined) update.subtitle = subtitle;
  if (specs !== undefined) update.specs = specs;
  if (ctaText !== undefined) update.ctaText = ctaText;
  if (ctaLink !== undefined) update.ctaLink = ctaLink;
  if (position !== undefined) update.position = position;
  if (isActive !== undefined) update.isActive = isActive;
  if (imageFit !== undefined) update.imageFit = imageFit;
  const slide = await HeroSlide.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ slide: { ...slide.toObject(), id: slide._id } });
});

router.delete('/hero-slides/:id', async (req, res) => {
  await HeroSlide.findByIdAndDelete(req.params.id);
  res.json({ message: 'Slide deleted' });
});

// ---------------- TRUST CARDS ("Why Choose Dostivox?" section) ----------------
router.get('/trust-cards', async (req, res) => {
  const cards = await TrustCard.find().sort({ position: 1 }).lean();
  res.json({ cards: cards.map((c) => ({ ...c, id: c._id })) });
});
router.post('/trust-cards', async (req, res) => {
  const { icon, title, description, position } = req.body;
  const card = await TrustCard.create({ icon: icon || '%', title, description: description || '', position: position || 0 });
  res.status(201).json({ card: { ...card.toObject(), id: card._id } });
});
router.put('/trust-cards/:id', async (req, res) => {
  const { icon, title, description, position, isActive } = req.body;
  const update = {};
  if (icon !== undefined) update.icon = icon;
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (position !== undefined) update.position = position;
  if (isActive !== undefined) update.isActive = isActive;
  const card = await TrustCard.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ card: { ...card.toObject(), id: card._id } });
});
router.delete('/trust-cards/:id', async (req, res) => {
  await TrustCard.findByIdAndDelete(req.params.id);
  res.json({ message: 'Trust card deleted' });
});

module.exports = router;
