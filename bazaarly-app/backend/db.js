// db.js - MongoDB (Mongoose) database setup, schema creation and demo seed data
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ---------------- SCHEMAS ----------------

const userSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  role: { type: String, default: 'customer' }, // customer | admin
  resetToken: String,
  resetTokenExpiry: Number,
  createdAt: { type: Date, default: Date.now },
});

const addressSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  userId: { type: String, required: true, ref: 'User' },
  label: String,
  fullName: String,
  phone: String,
  line1: String,
  line2: String,
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false },
});

const categorySchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  image: String,
  parentId: { type: String, default: null, ref: 'Category' },
  isActive: { type: Boolean, default: true },
});

const productImageSchema = new mongoose.Schema({
  url: String,
  position: { type: Number, default: 0 },
}, { _id: false });

const attributeSchema = new mongoose.Schema({
  key: String,
  value: String,
}, { _id: false });

// ---------------- PRODUCT (supports OWN products + AFFILIATE products) ----------------
const productSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },

  // Core fields (used by both own + affiliate products)
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  shortDescription: String,
  categoryId: { type: String, ref: 'Category' },
  brand: String,
  images: [productImageSchema],
  attributes: [attributeSchema],
  tags: [String],
  isActive: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  trending: { type: Boolean, default: false },
  deal: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },

  // ---- productType decides how this product behaves ----
  // 'own'       => Dostivox sells it directly (cart, checkout, stock apply)
  // 'affiliate' => Dostivox only refers to a merchant (no cart/stock, redirects out)
  productType: { type: String, enum: ['own', 'affiliate'], default: 'own' },

  // Own-product fields (ignored for affiliate products)
  price: { type: Number },        // selling price on Dostivox
  mrp: { type: Number },          // original price on Dostivox
  stock: { type: Number, default: 0 },
  sku: String,

  // Affiliate-product fields (ignored for own products)
  currentPrice: Number,           // price shown on the merchant site
  originalPrice: Number,          // pre-discount price on the merchant site
  discountPercentage: Number,
  merchant: String,               // e.g. "Amazon", "Flipkart"
  affiliateUrl: String,           // outbound link — configurable from admin, never hard-coded
  ctaText: { type: String, default: 'Check Deal' },
  pros: [String],
  cons: [String],
  editorScore: Number,
  comparisonEnabled: { type: Boolean, default: false },

  // Price tracking (architecture only — populated once a real price-check source exists)
  priceHistory: [{ price: Number, checkedAt: { type: Date, default: Date.now } }],
  lowestKnownPrice: Number,
  lastChecked: Date,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const reviewSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  productId: { type: String, required: true, ref: 'Product' },
  userId: { type: String, required: true, ref: 'User' },
  rating: { type: Number, required: true },
  title: String,
  comment: String,
  createdAt: { type: Date, default: Date.now },
});

const wishlistSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  userId: { type: String, required: true, ref: 'User' },
  productId: { type: String, required: true, ref: 'Product' },
  createdAt: { type: Date, default: Date.now },
});
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

const cartItemSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  userId: { type: String, required: true, ref: 'User' },
  productId: { type: String, required: true, ref: 'Product' },
  quantity: { type: Number, default: 1 },
});
cartItemSchema.index({ userId: 1, productId: 1 }, { unique: true });

const couponSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  code: { type: String, required: true, unique: true },
  type: { type: String, required: true }, // percent | flat
  value: { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount: Number,
  expiresAt: Date,
  usageLimit: { type: Number, default: 0 },
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, ref: 'Product' },
  title: String,
  image: String,
  price: Number,
  quantity: Number,
}, { _id: false });

const orderTrackingSchema = new mongoose.Schema({
  status: String,
  note: String,
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  userId: { type: String, required: true, ref: 'User' },
  addressId: { type: String, ref: 'Address' },
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  shippingFee: { type: Number, default: 0 },
  total: { type: Number, required: true },
  couponCode: String,
  paymentMethod: String, // razorpay | cod
  paymentStatus: { type: String, default: 'pending' }, // pending | paid | failed
  razorpayOrderId: String,
  razorpayPaymentId: String,
  status: { type: String, default: 'placed' },
  items: [orderItemSchema],
  tracking: [orderTrackingSchema],
  createdAt: { type: Date, default: Date.now },
});

const bannerSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  title: String,
  image: String,
  link: String,
  position: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

const advertisementSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  title: String,
  image: String,
  link: String,
  placement: String, // home_top | home_mid | sidebar | product_page
  isActive: { type: Boolean, default: true },
});

const notificationSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  userId: { type: String, ref: 'User' },
  title: String,
  message: String,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const settingSchema = new mongoose.Schema({
  _id: { type: String }, // this IS the key, e.g. "store_name"
  value: String,
});

const otpSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  email: { type: String, required: true },
  code: { type: String, required: true },
  purpose: { type: String, required: true }, // reset_password | login
  expiresAt: { type: Number, required: true },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const heroSlideSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  mode: { type: String, default: 'text' }, // text | banner
  image: String,
  eyebrow: String,
  title: String,
  subtitle: String,
  specs: [String],
  ctaText: String,
  ctaLink: String,
  position: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  imageFit: { type: String, default: 'cover' },
});

// ---------------- NEW: BUYING GUIDES / ARTICLES ----------------
const articleSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  featuredImage: String,
  author: String,
  category: String, // Buying Guides | Comparisons | How-To | Deals | Tech | Gaming | Creator | AI & Tools
  content: String,
  faq: [{ question: String, answer: String }],
  relatedProductIds: [{ type: String, ref: 'Product' }],
  seoTitle: String,
  seoDescription: String,
  canonicalUrl: String,
  ogImage: String,
  isPublished: { type: Boolean, default: true },
  publishedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ---------------- MODELS ----------------

const User = mongoose.model('User', userSchema);
const Address = mongoose.model('Address', addressSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const Review = mongoose.model('Review', reviewSchema);
const Wishlist = mongoose.model('Wishlist', wishlistSchema);
const CartItem = mongoose.model('CartItem', cartItemSchema);
const Coupon = mongoose.model('Coupon', couponSchema);
const Order = mongoose.model('Order', orderSchema);
const Banner = mongoose.model('Banner', bannerSchema);
const Advertisement = mongoose.model('Advertisement', advertisementSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Setting = mongoose.model('Setting', settingSchema);
const Otp = mongoose.model('Otp', otpSchema);
const HeroSlide = mongoose.model('HeroSlide', heroSlideSchema);
const Article = mongoose.model('Article', articleSchema);

// ---------------- SEED DEMO DATA (only if database is empty) ----------------

async function seed() {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    await User.create({ name: 'Admin User', email: 'admin@store.com', password: bcrypt.hashSync('Admin@123', 10), role: 'admin' });
    await User.create({ name: 'Demo Customer', email: 'customer@store.com', password: bcrypt.hashSync('Customer@123', 10), role: 'customer' });

    const categoriesData = [
      { name: 'Mobiles', slug: 'mobiles' },
      { name: 'Laptops', slug: 'laptops' },
      { name: 'PC & Components', slug: 'pc-components' },
      { name: 'Gaming', slug: 'gaming' },
      { name: 'Accessories', slug: 'accessories' },
      { name: 'Creator Gear', slug: 'creator-gear' },
      { name: 'Home & Kitchen', slug: 'home-kitchen' },
      { name: 'Fashion', slug: 'fashion' },
      { name: 'Beauty & Personal Care', slug: 'beauty' },
    ];
    const catDocs = {};
    for (const c of categoriesData) {
      const doc = await Category.create({ name: c.name, slug: c.slug, image: `https://picsum.photos/seed/${c.slug}/400/300` });
      catDocs[c.slug] = doc._id;
    }

    // Example OWN product (Dostivox sells this directly — cart/checkout applies)
    await Product.create({
      productType: 'own',
      title: 'Wireless Bluetooth Headphones',
      slug: 'wireless-bluetooth-headphones-own-0',
      description: 'Premium quality headphones sold directly by Dostivox — fast delivery, easy returns.',
      categoryId: catDocs['accessories'],
      brand: 'SoundMax',
      price: 2499,
      mrp: 3999,
      stock: 50,
      sku: 'SKU-1000',
      rating: 4.2,
      ratingCount: 34,
      images: [0, 1].map((i) => ({ url: `https://picsum.photos/seed/headphones-${i}/600/600`, position: i })),
    });

    // Example AFFILIATE product (Dostivox only refers out — no cart/stock)
    await Product.create({
      productType: 'affiliate',
      title: 'Smart Fitness Watch (Best Deal)',
      slug: 'smart-fitness-watch-affiliate-0',
      shortDescription: 'Top-rated fitness watch — compare and check the best current price.',
      categoryId: catDocs['accessories'],
      brand: 'FitPro',
      currentPrice: 3299,
      originalPrice: 4999,
      discountPercentage: 34,
      merchant: 'Amazon',
      affiliateUrl: '', // ⚠️ must be filled in from the admin panel — never hard-code this
      ctaText: 'Check Deal',
      pros: ['Long battery life', 'Accurate heart-rate tracking'],
      cons: ['App can be slow to sync'],
      images: [0].map((i) => ({ url: `https://picsum.photos/seed/fitwatch-${i}/600/600`, position: i })),
      featured: true,
      deal: true,
    });

    await Coupon.create({ code: 'WELCOME10', type: 'percent', value: 10, minOrderValue: 500, maxDiscount: 300, usageLimit: 1000 });

    await Banner.create({ title: 'Shop Smarter. Compare Better. Save More.', image: 'https://picsum.photos/seed/banner1/1600/500', link: '/deals', position: 0 });

    await Setting.create({ _id: 'store_name', value: 'Dostivox' });
    await Setting.create({ _id: 'shipping_fee', value: '49' });
    await Setting.create({ _id: 'free_shipping_above', value: '999' });

    console.log('✅ Demo data seeded (1 own product + 1 affiliate product example)');
  }

  const heroCount = await HeroSlide.countDocuments();
  if (heroCount === 0) {
    await HeroSlide.create({
      mode: 'text', image: 'https://picsum.photos/seed/hero-deals/1600/900',
      eyebrow: 'Smart Shopping', title: 'Shop Smarter. Compare Better. Save More.',
      subtitle: 'Discover the best products, deals and buying recommendations in one place.',
      specs: ['Curated Deals', 'Transparent Comparisons', 'Free Tools'],
      ctaText: 'Explore Deals', ctaLink: '/deals', position: 0,
    });
    console.log('✅ Hero slides seeded');
  }
}

seed().catch((err) => console.error('Seeding failed:', err));

module.exports = {
  User, Address, Category, Product, Review, Wishlist, CartItem,
  Coupon, Order, Banner, Advertisement, Notification, Setting, Otp, HeroSlide, Article,
};
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  title TEXT,
  image TEXT,
  price REAL,
  quantity INTEGER
);

CREATE TABLE IF NOT EXISTS order_tracking (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS banners (
  id TEXT PRIMARY KEY,
  title TEXT,
  image TEXT,
  link TEXT,
  position INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS advertisements (
  id TEXT PRIMARY KEY,
  title TEXT,
  image TEXT,
  link TEXT,
  placement TEXT, -- home_top | home_mid | sidebar | product_page
  is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  title TEXT,
  message TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS otps (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL, -- 'reset_password' | 'login'
  expires_at INTEGER NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS hero_slides (
  id TEXT PRIMARY KEY,
  mode TEXT DEFAULT 'text',   -- 'text' (image + title/subtitle overlay) or 'banner' (image only)
  image TEXT,
  eyebrow TEXT,
  title TEXT,
  subtitle TEXT,
  specs TEXT,                -- stored as JSON string, e.g. ["40Hrs Battery","ANC"]
  cta_text TEXT,
  cta_link TEXT,
  position INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);
`);

// ---- Safe migration: add image_fit to hero_slides if the table already existed without it ----
try {
  const heroCols = db.prepare("PRAGMA table_info(hero_slides)").all().map((c) => c.name);
  if (!heroCols.includes('image_fit')) {
    db.exec("ALTER TABLE hero_slides ADD COLUMN image_fit TEXT DEFAULT 'cover'");
  }
} catch (e) {
  console.error('hero_slides image_fit migration failed:', e);
}

// ---- Safe migration: add is_active to categories if the table already existed without it ----
try {
  const cols = db.prepare("PRAGMA table_info(categories)").all().map((c) => c.name);
  if (!cols.includes('is_active')) {
    db.exec('ALTER TABLE categories ADD COLUMN is_active INTEGER DEFAULT 1');
  }
  db.exec('UPDATE categories SET is_active = 1 WHERE is_active IS NULL');
} catch (err) {
  console.error('Category migration failed:', err.message);
}

// ---- Seed demo data only if empty ----
const userCount = db.prepare('SELECT COUNT(*) c FROM users').get().c;
if (userCount === 0) {
  const insertUser = db.prepare(`INSERT INTO users (id,name,email,password,role) VALUES (?,?,?,?,?)`);
  insertUser.run(uuid(), 'Admin User', 'admin@store.com', bcrypt.hashSync('Admin@123', 10), 'admin');
  insertUser.run(uuid(), 'Demo Customer', 'customer@store.com', bcrypt.hashSync('Customer@123', 10), 'customer');

  const categories = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Fashion', slug: 'fashion' },
    { name: 'Home & Kitchen', slug: 'home-kitchen' },
    { name: 'Beauty', slug: 'beauty' },
    { name: 'Sports', slug: 'sports' },
  ];
  const insertCat = db.prepare(`INSERT INTO categories (id,name,slug,image) VALUES (?,?,?,?)`);
  const catIds = {};
  categories.forEach(c => {
    const id = uuid();
    catIds[c.slug] = id;
    insertCat.run(id, c.name, c.slug, `https://picsum.photos/seed/${c.slug}/400/300`);
  });

  const insertProduct = db.prepare(`INSERT INTO products
    (id,title,slug,description,category_id,brand,price,mrp,stock,sku,rating,rating_count)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  const insertImage = db.prepare(`INSERT INTO product_images (id,product_id,url,position) VALUES (?,?,?,?)`);

  const demoProducts = [
    { title: 'Wireless Bluetooth Headphones', cat: 'electronics', brand: 'SoundMax', price: 2499, mrp: 3999 },
    { title: 'Smart Fitness Watch', cat: 'electronics', brand: 'FitPro', price: 3299, mrp: 4999 },
    { title: 'Men\'s Slim Fit Shirt', cat: 'fashion', brand: 'UrbanWear', price: 899, mrp: 1499 },
    { title: 'Women\'s Running Shoes', cat: 'sports', brand: 'StrideFit', price: 2199, mrp: 3499 },
    { title: 'Non-Stick Cookware Set', cat: 'home-kitchen', brand: 'HomeChef', price: 1799, mrp: 2999 },
    { title: 'Organic Face Serum', cat: 'beauty', brand: 'GlowLab', price: 649, mrp: 999 },
    { title: '4K Ultra HD Smart TV 43"', cat: 'electronics', brand: 'Visiona', price: 24999, mrp: 32999 },
    { title: 'Yoga Mat Premium', cat: 'sports', brand: 'FlexFit', price: 599, mrp: 999 },
    { title: 'Leather Wallet', cat: 'fashion', brand: 'CraftHide', price: 799, mrp: 1299 },
    { title: 'Electric Kettle 1.5L', cat: 'home-kitchen', brand: 'HomeChef', price: 999, mrp: 1599 },
    { title: 'Wireless Mouse', cat: 'electronics', brand: 'ClickTech', price: 499, mrp: 799 },
    { title: 'Matte Lipstick Combo', cat: 'beauty', brand: 'GlowLab', price: 449, mrp: 699 },
  ];

  demoProducts.forEach((p, idx) => {
    const id = uuid();
    const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + idx;
    insertProduct.run(
      id, p.title, slug,
      `${p.title} - premium quality product with fast delivery and easy returns. Designed for everyday performance and reliability.`,
      catIds[p.cat], p.brand, p.price, p.mrp, 50 + idx, `SKU-${1000 + idx}`,
      (3.8 + (idx % 5) * 0.2).toFixed(1), 20 + idx * 3
    );
    for (let i = 0; i < 4; i++) {
      insertImage.run(uuid(), id, `https://picsum.photos/seed/${slug}-${i}/600/600`, i);
    }
  });

  const insertCoupon = db.prepare(`INSERT INTO coupons (id,code,type,value,min_order_value,max_discount,usage_limit,is_active) VALUES (?,?,?,?,?,?,?,1)`);
  insertCoupon.run(uuid(), 'WELCOME10', 'percent', 10, 500, 300, 1000);
  insertCoupon.run(uuid(), 'FLAT100', 'flat', 100, 999, null, 1000);

  const insertBanner = db.prepare(`INSERT INTO banners (id,title,image,link,position,is_active) VALUES (?,?,?,?,?,1)`);
  insertBanner.run(uuid(), 'Big Season Sale - Up to 50% Off', 'https://picsum.photos/seed/banner1/1600/500', '/products', 0, 1);
  insertBanner.run(uuid(), 'New Electronics Arrivals', 'https://picsum.photos/seed/banner2/1600/500', '/categories/electronics', 1, 1);

  const insertSetting = db.prepare(`INSERT INTO settings (key,value) VALUES (?,?)`);
  insertSetting.run('store_name', 'Dostivox');
  insertSetting.run('shipping_fee', '49');
  insertSetting.run('free_shipping_above', '999');
}

// ---- Seed hero slides only if empty (runs even on an already-existing database) ----
const heroSlideCount = db.prepare('SELECT COUNT(*) c FROM hero_slides').get().c;
if (heroSlideCount === 0) {
  const insertSlide = db.prepare(`INSERT INTO hero_slides
    (id,mode,image,eyebrow,title,subtitle,specs,cta_text,cta_link,position,is_active)
    VALUES (?,?,?,?,?,?,?,?,?,?,1)`);
  insertSlide.run(uuid(), 'text', 'https://picsum.photos/seed/hero-audio/1600/900',
    'New Launch', 'Sound that moves with you', 'Premium wireless audio, engineered for everyday carry.',
    JSON.stringify(['40Hrs Battery', 'ANC', 'Up to 25% Off']), 'Shop Headphones', '/categories/electronics', 0);
  insertSlide.run(uuid(), 'text', 'https://picsum.photos/seed/hero-laptop/1600/900',
    'GeForce RTX', 'Up to 30% off gaming laptops', 'RTX powered performance for creators and gamers.',
    JSON.stringify(['RTX 4060', '16GB RAM', '165Hz Display']), 'Explore Laptops', '/categories/electronics', 1);
}

module.exports = db;
