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

// ---------------- TRUST CARDS (the "Why Choose Dostivox?" section) ----------------
// ---------------- HOMEPAGE SECTIONS (title/subtitle/order/enable for each block) ----------------
const homeSectionSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  key: { type: String, required: true, unique: true }, // categories | trending | deals | trust_cards
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  buttonText: { type: String, default: '' },
  buttonLink: { type: String, default: '' },
  isEnabled: { type: Boolean, default: true },
  position: { type: Number, default: 0 },
});

// ---------------- NAVIGATION MENU (header links, admin-editable) ----------------
const navItemSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  label: { type: String, required: true },
  url: { type: String, required: true },
  icon: { type: String, default: '' },
  isExternal: { type: Boolean, default: false },
  isVisible: { type: Boolean, default: true },
  position: { type: Number, default: 0 },
  parentId: { type: String, default: null }, // for dropdown sub-items
});

// ---------------- FOOTER MANAGEMENT (columns + links, admin-editable) ----------------
const footerColumnSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  title: { type: String, required: true },
  position: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

const footerLinkSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  columnId: { type: String, required: true },
  label: { type: String, required: true },
  url: { type: String, required: true },
  position: { type: Number, default: 0 },
});

const trustCardSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  icon: { type: String, default: '%' }, // any short text/emoji shown as the icon
  title: { type: String, required: true },
  description: { type: String, default: '' },
  position: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
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
const TrustCard = mongoose.model('TrustCard', trustCardSchema);
const HomeSection = mongoose.model('HomeSection', homeSectionSchema);
const NavItem = mongoose.model('NavItem', navItemSchema);
const FooterColumn = mongoose.model('FooterColumn', footerColumnSchema);
const FooterLink = mongoose.model('FooterLink', footerLinkSchema);

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
  const trustCardCount = await TrustCard.countDocuments();
  if (trustCardCount === 0) {
    await TrustCard.create([
      { icon: '%', title: 'Best Prices', description: 'Guaranteed', position: 0 },
      { icon: '✓', title: 'Genuine Products', description: '100% Original', position: 1 },
      { icon: '🚚', title: 'Fast Delivery', description: 'Across India', position: 2 },
      { icon: '🎧', title: '24/7 Customer Support', description: "We're here to help", position: 3 },
    ]);
    console.log('✅ Trust cards seeded');
  }
  const homeSectionCount = await HomeSection.countDocuments();
  if (homeSectionCount === 0) {
    await HomeSection.create([
      { key: 'categories', title: 'Shop by Category', subtitle: '', buttonText: '', buttonLink: '', isEnabled: true, position: 0 },
      { key: 'trending', title: 'Trending Products', subtitle: '', buttonText: 'View All ›', buttonLink: '/products', isEnabled: true, position: 1 },
      { key: 'deals', title: "Today's Deals", subtitle: '', buttonText: 'View All ›', buttonLink: '/products?sort=price_asc', isEnabled: true, position: 2 },
      { key: 'trust_cards', title: 'Why Choose Dostivox?', subtitle: '', buttonText: '', buttonLink: '', isEnabled: true, position: 3 },
    ]);
    console.log('✅ Homepage sections seeded');
  }

  const navCount = await NavItem.countDocuments();
  if (navCount === 0) {
    await NavItem.create([
      { label: 'Home', url: '/', position: 0 },
      { label: 'Categories', url: '/categories', position: 1 },
      { label: 'Shop', url: '/products', position: 2 },
      { label: 'About', url: '/about', position: 3 },
      { label: 'Contact', url: '/contact', position: 4 },
    ]);
    console.log('✅ Nav menu seeded');
  }

  const footerColCount = await FooterColumn.countDocuments();
  if (footerColCount === 0) {
    const shop = await FooterColumn.create({ title: 'Shop', position: 0 });
    const support = await FooterColumn.create({ title: 'Support', position: 1 });
    const company = await FooterColumn.create({ title: 'Company', position: 2 });

    await FooterLink.create([
      { columnId: shop._id, label: 'All Products', url: '/products', position: 0 },
      { columnId: shop._id, label: 'Categories', url: '/categories', position: 1 },
      { columnId: shop._id, label: 'Wishlist', url: '/wishlist', position: 2 },
      { columnId: support._id, label: 'Help Center', url: '/help', position: 0 },
      { columnId: support._id, label: 'Contact Us', url: '/contact', position: 1 },
      { columnId: support._id, label: 'Track Order', url: '/orders', position: 2 },
      { columnId: company._id, label: 'About Us', url: '/about', position: 0 },
      { columnId: company._id, label: 'Privacy Policy', url: '/privacy', position: 1 },
      { columnId: company._id, label: 'Terms of Service', url: '/terms', position: 2 },
    ]);

    if (!(await Setting.findById('footer_description'))) {
      await Setting.create({ _id: 'footer_description', value: "Premium products, thoughtfully curated. Fast delivery, easy returns, and a shopping experience you'll love." });
    }
    if (!(await Setting.findById('footer_copyright'))) {
      await Setting.create({ _id: 'footer_copyright', value: `© ${new Date().getFullYear()} Dostivox. All rights reserved.` });
    }
    console.log('✅ Footer seeded');
  }
}

seed().catch((err) => console.error('Seeding failed:', err));

module.exports = {
  User, Address, Category, Product, Review, Wishlist, CartItem,
  Coupon, Order, Banner, Advertisement, Notification, Setting, Otp, HeroSlide, Article, TrustCard,
  NavItem, FooterColumn, FooterLink, HomeSection,
};
