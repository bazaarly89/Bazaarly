// db.js - SQLite database setup, schema creation and demo seed data
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

const DB_PATH = process.env.DB_PATH || './data/store.db';
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'customer', -- customer | admin
  reset_token TEXT,
  reset_token_expiry INTEGER,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT,
  full_name TEXT,
  phone TEXT,
  line1 TEXT,
  line2 TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  country TEXT DEFAULT 'India',
  is_default INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image TEXT,
  parent_id TEXT REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id TEXT REFERENCES categories(id),
  brand TEXT,
  price REAL NOT NULL,
  mrp REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  sku TEXT,
  rating REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  image_size TEXT DEFAULT 'medium',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_attributes (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attr_key TEXT,
  attr_value TEXT
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL,
  title TEXT,
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wishlist (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- percent | flat
  value REAL NOT NULL,
  min_order_value REAL DEFAULT 0,
  max_discount REAL,
  expires_at TEXT,
  usage_limit INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  address_id TEXT REFERENCES addresses(id),
  subtotal REAL NOT NULL,
  discount REAL DEFAULT 0,
  shipping_fee REAL DEFAULT 0,
  total REAL NOT NULL,
  coupon_code TEXT,
  payment_method TEXT, -- razorpay | cod
  payment_status TEXT DEFAULT 'pending', -- pending | paid | failed
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  status TEXT DEFAULT 'placed', -- placed | confirmed | shipped | out_for_delivery | delivered | cancelled
  created_at TEXT DEFAULT (datetime('now'))
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
`);

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
      `${p.title} - premium quality product with fast delivery and easy returns. Designed for everyday performance and durability.`,
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
  insertBanner.run(uuid(), 'Big Season Sale - Up to 50% Off', 'https://picsum.photos/seed/banner1/1600/500', '/products', 0);
  insertBanner.run(uuid(), 'New Electronics Arrivals', 'https://picsum.photos/seed/banner2/1600/500', '/categories/electronics', 1);

  const insertSetting = db.prepare(`INSERT INTO settings (key,value) VALUES (?,?)`);
  insertSetting.run('store_name', 'Dostivox');
  insertSetting.run('shipping_fee', '49');
  insertSetting.run('free_shipping_above', '999');
}

module.exports = db;
