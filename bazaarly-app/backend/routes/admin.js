const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { Product, Category, Merchant, Order, User, Coupon, Banner, Advertisement, Notification, Setting, HeroSlide, TrustCard, NavItem, FooterColumn, FooterLink, HomeSection, Article, ARTICLE_CATEGORIES } = require('../db');
const { adminRequired } = require('../middleware/auth');
const router = express.Router();

router.use(adminRequired);

// ---------------- CHANGE ADMIN PASSWORD (also lets admin update their email) ----------------
router.put('/change-password', async (req, res) => {
  const { currentPassword, newPassword, newEmail } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const admin = await User.findById(req.admin.id);
  if (!admin || admin.role !== 'admin') {
    return res.status(404).json({ error: 'Admin account not found' });
  }

  if (!bcrypt.compareSync(currentPassword, admin.password)) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  admin.password = bcrypt.hashSync(newPassword, 10);
  if (newEmail && newEmail !== admin.email) {
    const existing = await User.findOne({ email: newEmail });
    if (existing) return res.status(400).json({ error: 'That email is already in use' });
    admin.email = newEmail;
  }
  await admin.save();

  res.json({ message: 'Password updated successfully', email: admin.email });
});

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
    // affiliate-product fields — one or more merchant offers
    offers = [],
    pros = [], cons = [], editorScore, comparisonEnabled,
    // specifications (shared attributes field)
    attributes = [],
  } = req.body;

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

  const productData = {
    title, slug, description: description || '', shortDescription: shortDescription || '',
    categoryId, brand: brand || '', productType,
    images: images.map((url, i) => ({ url, position: i })),
    attributes,
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
    const cleanOffers = offers.filter((o) => o && o.affiliateUrl);
    if (!cleanOffers.length) return res.status(400).json({ error: 'At least one merchant offer with an affiliate link is required' });
    productData.offers = cleanOffers.map((o) => ({
      merchant: o.merchant || '',
      merchantLogo: o.merchantLogo || '',
      currentPrice: o.currentPrice,
      originalPrice: o.originalPrice,
      discountPercentage: o.discountPercentage,
      affiliateUrl: o.affiliateUrl,
      regularUrl: o.regularUrl || '',
      ctaText: o.ctaText || 'Check Deal',
    }));
    // Mirror the first offer into the legacy flat fields for backward compatibility
    const primary = productData.offers[0];
    productData.currentPrice = primary.currentPrice;
    productData.originalPrice = primary.originalPrice;
    productData.discountPercentage = primary.discountPercentage;
    productData.merchant = primary.merchant;
    productData.affiliateUrl = primary.affiliateUrl;
    productData.regularUrl = primary.regularUrl;
    productData.ctaText = primary.ctaText;

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
    offers, pros, cons, editorScore, comparisonEnabled, attributes,
  } = req.body;

  const update = { updatedAt: new Date() };
  if (title !== undefined) update.title = title;
  if (description !== undefined) update.description = description;
  if (shortDescription !== undefined) update.shortDescription = shortDescription;
  if (categoryId !== undefined) update.categoryId = categoryId;
  if (brand !== undefined) update.brand = brand;
  if (isActive !== undefined) update.isActive = isActive;
  if (Array.isArray(images)) update.images = images.map((url, i) => ({ url, position: i }));
  if (Array.isArray(attributes)) update.attributes = attributes;
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

  // affiliate-product fields — one or more merchant offers
  if (Array.isArray(offers)) {
    const cleanOffers = offers.filter((o) => o && o.affiliateUrl);
    update.offers = cleanOffers.map((o) => ({
      merchant: o.merchant || '',
      merchantLogo: o.merchantLogo || '',
      currentPrice: o.currentPrice,
      originalPrice: o.originalPrice,
      discountPercentage: o.discountPercentage,
      affiliateUrl: o.affiliateUrl,
      regularUrl: o.regularUrl || '',
      ctaText: o.ctaText || 'Check Deal',
    }));
    // Mirror the first offer into the legacy flat fields for backward compatibility
    const primary = update.offers[0] || {};
    update.currentPrice = primary.currentPrice;
    update.originalPrice = primary.originalPrice;
    update.discountPercentage = primary.discountPercentage;
    update.merchant = primary.merchant || '';
    update.affiliateUrl = primary.affiliateUrl || '';
    update.regularUrl = primary.regularUrl || '';
    update.ctaText = primary.ctaText || 'Check Deal';
  }
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

// ---------------- MERCHANTS (Amazon, Flipkart, etc. — reusable logo directory) ----------------
router.get('/merchants', async (req, res) => {
  const merchants = await Merchant.find().sort({ name: 1 }).lean();
  res.json({ merchants: merchants.map((m) => ({ ...m, id: m._id })) });
});

router.post('/merchants', async (req, res) => {
  const { name, logo } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Merchant name is required' });
  const existing = await Merchant.findOne({ name: name.trim() });
  if (existing) return res.status(400).json({ error: 'A merchant with this name already exists' });
  const merchant = await Merchant.create({ name: name.trim(), logo: logo || '' });
  res.status(201).json({ merchant: { ...merchant.toObject(), id: merchant._id } });
});

router.put('/merchants/:id', async (req, res) => {
  const { name, logo, isActive } = req.body;
  const update = {};
  if (name !== undefined) update.name = name;
  if (logo !== undefined) update.logo = logo;
  if (isActive !== undefined) update.isActive = isActive;
  const merchant = await Merchant.findByIdAndUpdate(req.params.id, update, { new: true });
  res.json({ merchant: { ...merchant.toObject(), id: merchant._id } });
});

router.delete('/merchants/:id', async (req, res) => {
  await Merchant.findByIdAndDelete(req.params.id);
  res.json({ message: 'Merchant deleted' });
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

// ---------------- NAVIGATION MENU ----------------
router.get('/nav-items', async (req, res) => {
  const items = await NavItem.find().sort({ position: 1 }).lean();
  res.json({ items: items.map((i) => ({ ...i, id: i._id })) });
});

router.post('/nav-items', async (req, res) => {
  const { label, url, icon, isExternal, isVisible, position, parentId } = req.body;
  if (!label || !url) return res.status(400).json({ error: 'Label and URL are required' });
  const item = await NavItem.create({
    label, url, icon: icon || '', isExternal: !!isExternal,
    isVisible: isVisible !== false, position: position || 0, parentId: parentId || null,
  });
  res.status(201).json({ item: { ...item.toObject(), id: item._id } });
});

router.put('/nav-items/:id', async (req, res) => {
  const update = { ...req.body };
  delete update._id;
  const item = await NavItem.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!item) return res.status(404).json({ error: 'Nav item not found' });
  res.json({ item: { ...item.toObject(), id: item._id } });
});

router.delete('/nav-items/:id', async (req, res) => {
  await NavItem.findByIdAndDelete(req.params.id);
  res.json({ message: 'Nav item deleted' });
});

// ---------------- FOOTER MANAGEMENT ----------------
router.get('/footer-columns', async (req, res) => {
  const columns = await FooterColumn.find().sort({ position: 1 }).lean();
  const links = await FooterLink.find().sort({ position: 1 }).lean();
  res.json({
    columns: columns.map((c) => ({
      ...c,
      id: c._id,
      links: links.filter((l) => l.columnId === c._id).map((l) => ({ ...l, id: l._id })),
    })),
  });
});

router.post('/footer-columns', async (req, res) => {
  const { title, position } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const col = await FooterColumn.create({ title, position: position || 0 });
  res.status(201).json({ column: { ...col.toObject(), id: col._id } });
});

router.put('/footer-columns/:id', async (req, res) => {
  const update = { ...req.body };
  delete update._id;
  const col = await FooterColumn.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!col) return res.status(404).json({ error: 'Footer column not found' });
  res.json({ column: { ...col.toObject(), id: col._id } });
});

router.delete('/footer-columns/:id', async (req, res) => {
  await FooterColumn.findByIdAndDelete(req.params.id);
  await FooterLink.deleteMany({ columnId: req.params.id });
  res.json({ message: 'Footer column deleted' });
});

router.post('/footer-links', async (req, res) => {
  const { columnId, label, url, position } = req.body;
  if (!columnId || !label || !url) return res.status(400).json({ error: 'Column, label and URL are required' });
  const link = await FooterLink.create({ columnId, label, url, position: position || 0 });
  res.status(201).json({ link: { ...link.toObject(), id: link._id } });
});

router.put('/footer-links/:id', async (req, res) => {
  const update = { ...req.body };
  delete update._id;
  const link = await FooterLink.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!link) return res.status(404).json({ error: 'Footer link not found' });
  res.json({ link: { ...link.toObject(), id: link._id } });
});

router.delete('/footer-links/:id', async (req, res) => {
  await FooterLink.findByIdAndDelete(req.params.id);
  res.json({ message: 'Footer link deleted' });
});

// ---------------- HOMEPAGE SECTIONS (title/subtitle/enable/reorder) ----------------
router.get('/home-sections', async (req, res) => {
  const sections = await HomeSection.find().sort({ position: 1 }).lean();
  res.json({ sections: sections.map((s) => ({ ...s, id: s._id })) });
});

router.put('/home-sections/:id', async (req, res) => {
  const { title, subtitle, buttonText, buttonLink, isEnabled, position } = req.body;
  const update = {};
  if (title !== undefined) update.title = title;
  if (subtitle !== undefined) update.subtitle = subtitle;
  if (buttonText !== undefined) update.buttonText = buttonText;
  if (buttonLink !== undefined) update.buttonLink = buttonLink;
  if (isEnabled !== undefined) update.isEnabled = isEnabled;
  if (position !== undefined) update.position = position;
  const section = await HomeSection.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!section) return res.status(404).json({ error: 'Section not found' });
  res.json({ section: { ...section.toObject(), id: section._id } });
});

// Reorder helper: accepts [{id, position}, ...] and updates all at once
router.put('/home-sections-reorder', async (req, res) => {
  const { order } = req.body; // [{ id, position }]
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array' });
  await Promise.all(order.map((o) => HomeSection.findByIdAndUpdate(o.id, { position: o.position })));
  const sections = await HomeSection.find().sort({ position: 1 }).lean();
  res.json({ sections: sections.map((s) => ({ ...s, id: s._id })) });
});

// ---------------- BUYING GUIDES / BLOG ARTICLES ----------------
function slugifyArticle(str) {
  return String(str).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

router.get('/articles', async (req, res) => {
  const rows = await Article.find().sort({ updatedAt: -1 }).lean();
  res.json({ articles: rows.map((a) => ({ ...a, id: a._id })), categories: ARTICLE_CATEGORIES });
});

router.get('/articles/:id', async (req, res) => {
  const article = await Article.findById(req.params.id).lean();
  if (!article) return res.status(404).json({ error: 'Article not found' });
  res.json({ article: { ...article, id: article._id } });
});

router.post('/articles', async (req, res) => {
  const {
    title, slug, featuredImage, author, category, content,
    faq = [], relatedProductIds = [],
    seoTitle, seoDescription, canonicalUrl, ogImage,
    isPublished = true, publishedAt,
  } = req.body;

  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!content || !content.trim()) return res.status(400).json({ error: 'Content is required' });

  let finalSlug = slugifyArticle(slug || title);
  if (!finalSlug) return res.status(400).json({ error: 'Could not generate a valid slug — please set one manually' });
  if (await Article.findOne({ slug: finalSlug })) finalSlug = `${finalSlug}-${Date.now().toString(36)}`;

  const article = await Article.create({
    title: title.trim(),
    slug: finalSlug,
    featuredImage: featuredImage || '',
    author: author || 'Dostivox Team',
    category: ARTICLE_CATEGORIES.includes(category) ? category : 'Buying Guides',
    content,
    faq: (faq || []).filter((f) => f && f.question && f.answer),
    relatedProductIds: Array.isArray(relatedProductIds) ? relatedProductIds : [],
    seoTitle: seoTitle || title,
    seoDescription: seoDescription || '',
    canonicalUrl: canonicalUrl || '',
    ogImage: ogImage || featuredImage || '',
    isPublished: !!isPublished,
    publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
  });
  res.status(201).json({ article: { ...article.toObject(), id: article._id } });
});

router.put('/articles/:id', async (req, res) => {
  const {
    title, slug, featuredImage, author, category, content,
    faq, relatedProductIds,
    seoTitle, seoDescription, canonicalUrl, ogImage,
    isPublished, publishedAt,
  } = req.body;

  const update = { updatedAt: new Date() };
  if (title !== undefined) update.title = title;
  if (slug !== undefined && slug.trim()) {
    const finalSlug = slugifyArticle(slug);
    if (!finalSlug) return res.status(400).json({ error: 'Invalid slug' });
    const clash = await Article.findOne({ slug: finalSlug, _id: { $ne: req.params.id } });
    if (clash) return res.status(400).json({ error: 'That slug is already used by another article' });
    update.slug = finalSlug;
  }
  if (featuredImage !== undefined) update.featuredImage = featuredImage;
  if (author !== undefined) update.author = author;
  if (category !== undefined) update.category = ARTICLE_CATEGORIES.includes(category) ? category : 'Buying Guides';
  if (content !== undefined) update.content = content;
  if (Array.isArray(faq)) update.faq = faq.filter((f) => f && f.question && f.answer);
  if (Array.isArray(relatedProductIds)) update.relatedProductIds = relatedProductIds;
  if (seoTitle !== undefined) update.seoTitle = seoTitle;
  if (seoDescription !== undefined) update.seoDescription = seoDescription;
  if (canonicalUrl !== undefined) update.canonicalUrl = canonicalUrl;
  if (ogImage !== undefined) update.ogImage = ogImage;
  if (isPublished !== undefined) update.isPublished = isPublished;
  if (publishedAt !== undefined) update.publishedAt = new Date(publishedAt);

  const article = await Article.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!article) return res.status(404).json({ error: 'Article not found' });
  res.json({ article: { ...article.toObject(), id: article._id } });
});

router.delete('/articles/:id', async (req, res) => {
  await Article.findByIdAndDelete(req.params.id);
  res.json({ message: 'Article deleted' });
});

module.exports = router;
