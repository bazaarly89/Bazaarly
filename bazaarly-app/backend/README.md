# Bazaarly E-Commerce — Backend API

Node.js + Express + SQLite (better-sqlite3) REST API.

## Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env and fill in RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET and strong JWT secrets
npm run dev
```

The database file is created automatically at `./data/store.db` on first run,
with the schema and demo seed data (categories, products, coupons, banners, an
admin account and a demo customer account).

Server runs on `http://localhost:5000` by default.

## Demo accounts (seeded)

- **Admin:** admin@store.com / Admin@123
- **Customer:** customer@store.com / Customer@123

## Razorpay

This uses Razorpay's standard Checkout flow:
1. Frontend calls `POST /api/orders/razorpay/create` to get a Razorpay order id.
2. Frontend opens the Razorpay Checkout widget with that order id.
3. On success, frontend calls `POST /api/orders/razorpay/verify` with the
   payment id + signature; the backend verifies the signature with HMAC
   SHA256 before creating the order record.

You need a real Razorpay account (test mode is fine) and API keys for this to
work end to end — get them from the Razorpay Dashboard under Settings > API Keys.

## Notes

- Passwords are hashed with bcrypt.
- Customer and admin auth use separate JWT secrets/tokens so an admin token can
  never be replayed against customer-only routes and vice versa.
- Forgot-password returns the reset token directly in the API response for demo
  purposes (`demo_reset_token`) — in production this must be emailed instead,
  never returned in the response.
- Product images in the seed data are placeholders from picsum.photos; replace
  with real product photography and swap in real upload storage (e.g. S3) for
  production use, along with the `multer` dependency already included for
  handling multipart uploads.
