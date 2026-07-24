# Bazaarly — Full-Stack E-Commerce Platform

A complete, modern e-commerce website: React (Vite + Tailwind) frontend,
Node.js/Express + SQLite backend, JWT authentication, Razorpay + Cash on
Delivery checkout, customer dashboard, and a full admin panel.

```
ecommerce-app/
├── backend/     Express API + SQLite database (auto-seeded on first run)
└── frontend/    React (Vite) + Tailwind CSS storefront + admin panel
```

## Quick Start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: set JWT_SECRET, JWT_ADMIN_SECRET, and Razorpay test keys
npm run dev
```

Runs on **http://localhost:5000**. The SQLite database is created and
seeded automatically on first run — no separate migration step needed.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Runs on **http://localhost:5173** and proxies `/api` requests to the
backend automatically (see `vite.config.js`).

### 3. Log in

- **Storefront:** http://localhost:5173 — demo customer: `customer@store.com` / `Customer@123`
- **Admin panel:** http://localhost:5173/admin/login — demo admin: `admin@store.com` / `Admin@123`

## What's included

**Pages:** Home, Categories, Product Listing, Product Details, Search, Cart,
Checkout, Login, Register, Forgot Password, My Account, My Orders, Wishlist,
Order Tracking, Contact, About, Privacy Policy, Terms, Help Center.

**Customer features:** filterable search, multi-image galleries with hover
zoom, reviews & ratings, wishlist, cart, buy now, coupon codes, multiple
saved addresses, Razorpay payment, Cash on Delivery, order tracking timeline,
in-app notifications.

**Admin panel:** secure separate admin login/JWT, dashboard with sales
charts, product/category/inventory CRUD, order management with status
updates, customer list, coupon management, homepage banners, ad placements,
sales & top-product reports, category analytics, store settings.

Fully responsive (mobile / tablet / desktop) with a custom Tailwind theme,
smooth transitions, and rounded-card design language throughout.

## Before going to production

- Replace the demo JWT secrets and Razorpay test keys in `backend/.env`
  with real production values.
- Swap the picsum.photos placeholder images for real product photography,
  and wire up real file storage (S3, Cloudinary, etc.) for admin-uploaded
  images — `multer` is already included in `backend/package.json` for this.
- Send password-reset emails via a transactional email service instead of
  returning the token in the API response (`backend/routes/auth.js`).
- Consider migrating from SQLite to Postgres/MySQL if you expect concurrent
  write-heavy traffic at scale — the schema in `backend/db.js` is plain SQL
  and translates over with minimal changes.
- Add HTTPS, rate limiting, and a WAF/reverse proxy (e.g. Nginx) in front of
  the Node process for production deployment.
