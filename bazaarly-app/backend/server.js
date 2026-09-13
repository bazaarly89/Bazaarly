require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// ---- Fail fast if critical secrets are missing (never run with an undefined
// JWT secret, which would make tokens forgeable/unverifiable) ----
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_ADMIN_SECRET', 'MONGO_URI'];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length) {
  console.error(`❌ Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

require('./db'); // initializes + seeds database on first run

const app = express();

// Behind Railway's proxy — needed so express-rate-limit reads the real client IP
app.set('trust proxy', 1);

// ---- Security headers ----
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // API is consumed by a separate frontend origin
}));

// ---- CORS: explicit allowlist instead of a wildcard (required for credentials) ----
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow same-origin/non-browser requests (no Origin header, e.g. curl, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

// ---- Strip any Mongo operator keys ($gt, $where, etc.) from user input ----
app.use(mongoSanitize());

// ---- Rate limiting ----
// General API limiter
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}));

// Stricter limiter for auth-sensitive endpoints (login, register, OTP, password reset)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/admin/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/hero-slides', require('./routes/heroSlides'));
app.use('/api/trust-cards', require('./routes/trustCards'));
app.use('/api/navigation', require('./routes/navigation'));
app.use('/api/footer', require('./routes/footer'));
app.use('/api/home-sections', require('./routes/homeSections'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/content', require('./routes/content'));   // ← ye naya
app.use('/api/articles', require('./routes/articles')); // ← Buying Guides / Blog (public)
app.use('/api/subscribe', require('./routes/subscribe')); // ← Newsletter / deal alerts (public)
// 404 handler
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Global error handler — never leak stack traces / internal error details to clients
app.use((err, req, res, next) => {
  console.error(err);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ API server running on http://localhost:${PORT}`));
