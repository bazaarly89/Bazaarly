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

// Reusable merchant directory — admin uploads each merchant's logo once here
// (e.g. Amazon, Flipkart, Myntra) and picks it on any affiliate product/offer
// instead of re-uploading every time.
const merchantSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  name: { type: String, required: true, unique: true },
  logo: String, // Cloudinary URL, uploaded by admin — never a bundled/hard-coded asset
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const productImageSchema = new mongoose.Schema({
  url: String,
  position: { type: Number, default: 0 },
}, { _id: false });

const attributeSchema = new mongoose.Schema({
  key: String,
  value: String,
}, { _id: false });

// One "offer" = one merchant's listing for this product (Amazon, Flipkart, etc).
// A single affiliate product can carry several offers so the customer can pick
// whichever store has it cheaper.
const offerSchema = new mongoose.Schema({
  merchant: String,               // merchant name, e.g. "Amazon", "Flipkart"
  merchantLogo: String,           // logo snapshot (from the Merchant directory, or a custom upload)
  currentPrice: Number,           // price shown on the merchant site
  originalPrice: Number,          // pre-discount price on the merchant site
  discountPercentage: Number,
  affiliateUrl: String,           // outbound affiliate/tracking link — configurable from admin, never hard-coded
  regularUrl: String,             // optional non-affiliate/plain link to the same listing (fallback/reference)
  ctaText: { type: String, default: 'Check Deal' },
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
  // Editorial flag — shows a "Dostivox Recommended" badge on the product
  // card. Independent of featured/trending/deal (those control homepage
  // placement; this is a genuine quality/value endorsement).
  isRecommended: { type: Boolean, default: false },
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
  // One product can have MULTIPLE merchant offers (Amazon, Flipkart, etc.) —
  // the storefront shows all of them so the customer can pick the cheapest.
  offers: [offerSchema],
  pros: [String],
  cons: [String],
  editorScore: Number,
  comparisonEnabled: { type: Boolean, default: false },

  // Legacy single-offer fields — kept only so older products (created before
  // multi-offer support) keep working; new saves always go through `offers`.
  currentPrice: Number,
  originalPrice: Number,
  discountPercentage: Number,
  merchant: String,
  affiliateUrl: String,
  regularUrl: String,
  ctaText: { type: String, default: 'Check Deal' },

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

// ---------------- NEWSLETTER / DEAL ALERT SUBSCRIBERS ----------------
// One opt-in form (homepage) — email plus which kinds of updates they want.
// No spam: this only stores intent, sending itself happens outside this app.
const subscriberSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  email: { type: String, required: true, unique: true },
  wantsDeals: { type: Boolean, default: true },
  wantsGuides: { type: Boolean, default: false },
  wantsPriceAlerts: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
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

// ---------------- BUYING GUIDES / BLOG ARTICLES ----------------
// Fixed category list used everywhere (admin form, public filters, seed data).
// Exported below as ARTICLE_CATEGORIES so routes/frontend never hardcode it twice.
const ARTICLE_CATEGORIES = ['Buying Guides', 'Comparisons', 'How-To', 'Deals', 'Tech', 'Gaming', 'Creator', 'AI & Tools'];

const articleFaqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
}, { _id: false });

const articleSchema = new mongoose.Schema({
  _id: { type: String, default: uuid },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  featuredImage: String,
  author: { type: String, default: 'Dostivox Team' },
  category: { type: String, enum: ARTICLE_CATEGORIES, default: 'Buying Guides' },
  content: { type: String, default: '' }, // rich HTML from the admin editor
  faq: [articleFaqSchema],
  relatedProductIds: [{ type: String, ref: 'Product' }],
  // SEO — every field admin-editable, all optional (sensible defaults applied on save)
  seoTitle: String,
  seoDescription: String,
  canonicalUrl: String,
  ogImage: String,
  isPublished: { type: Boolean, default: true },
  publishedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
articleSchema.index({ category: 1, isPublished: 1, publishedAt: -1 });
articleSchema.index({ title: 'text', content: 'text', seoDescription: 'text' });

// ---------------- MODELS ----------------

const User = mongoose.model('User', userSchema);
const Address = mongoose.model('Address', addressSchema);
const Category = mongoose.model('Category', categorySchema);
const Merchant = mongoose.model('Merchant', merchantSchema);
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
const Subscriber = mongoose.model('Subscriber', subscriberSchema);
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
    // Safer, honest claims — never promise something we can't guarantee.
    await TrustCard.create([
      { icon: '⚖', title: 'Compare Before You Buy', description: 'See real prices across stores', position: 0 },
      { icon: '✓', title: 'Curated Recommendations', description: 'Hand-picked, not auto-generated', position: 1 },
      { icon: '📖', title: 'Useful Buying Guides', description: 'Written to actually help', position: 2 },
      { icon: '🔗', title: 'Transparent Affiliate Links', description: 'Clearly disclosed, always', position: 3 },
    ]);
    console.log('✅ Trust cards seeded');
  }
  const homeSectionCount = await HomeSection.countDocuments();
  if (homeSectionCount === 0) {
    await HomeSection.create([
      { key: 'categories', title: 'Shop by Category', subtitle: '', buttonText: '', buttonLink: '', isEnabled: true, position: 0 },
      { key: 'trending', title: 'Trending Products', subtitle: '', buttonText: 'View All ›', buttonLink: '/products', isEnabled: true, position: 1 },
      { key: 'deals', title: "Today's Best Deals", subtitle: '', buttonText: 'View All ›', buttonLink: '/products?sort=price_asc', isEnabled: true, position: 2 },
      { key: 'budget', title: 'Best Under Budget', subtitle: '', buttonText: '', buttonLink: '', isEnabled: true, position: 3 },
      { key: 'compare', title: 'Compare Products', subtitle: 'Weigh real options side by side before you buy.', buttonText: 'Compare Products', buttonLink: '/products?comparisonEnabled=true', isEnabled: true, position: 4 },
      { key: 'buying_guides', title: 'Buying Guides', subtitle: '', buttonText: 'View All ›', buttonLink: '/blog?category=Buying%20Guides', isEnabled: true, position: 5 },
      { key: 'tools', title: 'Free Tools by Dostivox', subtitle: '', buttonText: '', buttonLink: '', isEnabled: true, position: 6 },
      { key: 'trust_cards', title: 'Why Choose Dostivox?', subtitle: '', buttonText: '', buttonLink: '', isEnabled: true, position: 7 },
    ]);
    console.log('✅ Homepage sections seeded');
  } else {
    // Existing site — add any NEW section keys introduced later without
    // touching sections the admin may have already customized.
    const NEW_SECTION_DEFAULTS = [
      { key: 'budget', title: 'Best Under Budget', subtitle: '', buttonText: '', buttonLink: '', isEnabled: true, position: 10 },
      { key: 'compare', title: 'Compare Products', subtitle: 'Weigh real options side by side before you buy.', buttonText: 'Compare Products', buttonLink: '/products?comparisonEnabled=true', isEnabled: true, position: 11 },
      { key: 'buying_guides', title: 'Buying Guides', subtitle: '', buttonText: 'View All ›', buttonLink: '/blog?category=Buying%20Guides', isEnabled: true, position: 12 },
      { key: 'tools', title: 'Free Tools by Dostivox', subtitle: '', buttonText: '', buttonLink: '', isEnabled: true, position: 13 },
    ];
    for (const def of NEW_SECTION_DEFAULTS) {
      await HomeSection.findOneAndUpdate({ key: def.key }, { $setOnInsert: def }, { upsert: true });
    }
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

  // Seed a couple of starter merchants (no logo — admin uploads their own
  // from Merchants page) if none exist yet. Runs independently of the
  // userCount check above so it also applies to an already-live database.
  if ((await Merchant.countDocuments()) === 0) {
    await Merchant.create([{ name: 'Amazon' }, { name: 'Flipkart' }]);
    console.log('✅ Starter merchants seeded (Amazon, Flipkart — add logos from Admin → Merchants)');
  }

  // One real, substantive example article so /blog isn't empty on first run.
  // Admins should replace/expand this — see the SEO note in the admin Articles
  // page about writing genuinely useful, non-thin content.
  if ((await Article.countDocuments()) === 0) {
    await Article.create({
      title: 'How to Choose the Right Wireless Headphones in 2026',
      slug: 'how-to-choose-wireless-headphones-2026',
      featuredImage: 'https://picsum.photos/seed/headphones-guide/1200/675',
      author: 'Dostivox Team',
      category: 'Buying Guides',
      content: `<h2>Start with how you'll actually use them</h2>
<p>The "best" headphones depend entirely on your use case. Commuting on noisy trains calls for strong active noise cancellation (ANC). Working out needs a secure, sweat-resistant fit. Working from home all day rewards comfort over almost everything else.</p>
<h2>Battery life and charging</h2>
<p>Look for at least 20-30 hours of battery on a single charge if you travel often, and fast-charge support (5 minutes of charging for 1-2 hours of playback) for emergencies.</p>
<h2>Sound signature</h2>
<p>Bass-heavy tuning suits pop, hip-hop and EDM; a flatter, more neutral signature suits podcasts, classical and mixing/production work. Try to check an EQ-adjustable model if you're unsure what you prefer.</p>
<h2>Comfort for long sessions</h2>
<p>Over-ear headphones are generally more comfortable for multi-hour use than in-ear buds, but they're bulkier to carry. If you wear glasses, look for softer earcup padding to avoid pressure points.</p>
<h2>Our recommendation</h2>
<p>For most people, a mid-range over-ear pair with ANC, 25+ hour battery life and a companion app for EQ tuning offers the best balance of comfort, sound and price. Check the comparison table below for current top picks.</p>`,
      faq: [
        { question: 'Do I really need active noise cancellation?', answer: 'If you commute, fly often, or work in a noisy environment, ANC makes a noticeable difference. For quiet home use, it matters less and you can save money by skipping it.' },
        { question: 'Are expensive headphones always better?', answer: 'Not necessarily. Sound quality gains flatten out significantly above the mid-range price tier — you\'re often paying more for brand, build materials and extra features like multipoint Bluetooth.' },
        { question: 'Bluetooth or wired — which lasts longer?', answer: 'Wired headphones have no battery to degrade over time, but Bluetooth models offer far more convenience. If longevity matters most, check whether the Bluetooth model also supports a wired fallback cable.' },
      ],
      seoTitle: 'How to Choose the Right Wireless Headphones in 2026 — Buying Guide',
      seoDescription: 'A practical guide to picking wireless headphones: battery life, ANC, comfort and sound signature explained, with our current top pick.',
      canonicalUrl: '',
      ogImage: '',
      isPublished: true,
    });
    console.log('✅ Sample buying-guide article seeded (edit/replace from Admin → Buying Guides)');
  }

  // Homepage hero / search copy — added for the redesigned single-hero
  // homepage. Uses upsert-if-missing so it fills in on both fresh installs
  // AND existing sites, without ever overwriting text an admin already
  // customized via Admin → Settings.
  const HERO_DEFAULTS = {
    home_hero_badge: 'Smart Shopping',
    home_hero_title: 'Shop Smarter. Compare Better. Save More.',
    home_hero_subtitle: 'Discover the best products, deals and buying recommendations in one place.',
    home_hero_cta1_text: 'Explore Deals',
    home_hero_cta1_link: '/products?deal=true',
    home_hero_cta2_text: 'Compare Products',
    home_hero_cta2_link: '/products?comparisonEnabled=true',
    home_search_placeholder: 'What are you looking for?',
  };
  for (const [key, value] of Object.entries(HERO_DEFAULTS)) {
    await Setting.findOneAndUpdate({ _id: key }, { $setOnInsert: { _id: key, value } }, { upsert: true });
  }
}

seed().catch((err) => console.error('Seeding failed:', err));

module.exports = {
  User, Address, Category, Merchant, Product, Review, Wishlist, CartItem,
  Coupon, Order, Banner, Advertisement, Notification, Setting, Otp, HeroSlide, Article, TrustCard,
  NavItem, FooterColumn, FooterLink, HomeSection, ARTICLE_CATEGORIES, Subscriber,
};
