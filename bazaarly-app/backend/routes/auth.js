const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const { sendOtpEmail } = require('../utils/mailer');

const router = express.Router();

function signUserToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET, { expiresIn: '7d' });
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit code
}

// ---------- REGISTER ----------
router.post('/register',
  body('name').notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { name, email, password, phone } = req.body;
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const id = uuid();
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (id,name,email,password,phone,role) VALUES (?,?,?,?,?,?)')
      .run(id, name, email, hash, phone || null, 'customer');

    const user = { id, name, email, role: 'customer' };
    res.status(201).json({ token: signUserToken(user), user });
  });

// ---------- LOGIN ----------
router.post('/login', body('email').isEmail(), body('password').notEmpty(), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND role = ?').get(email, 'customer');
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ token: signUserToken(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

// ---------- FORGOT PASSWORD (sends a 6-digit OTP to the user's email) ----------
router.post('/forgot-password', body('email').isEmail(), async (req, res) => {
  const { email } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  // Always respond the same way to avoid revealing whether an email is registered
  const genericMessage = { message: 'If that email exists, an OTP has been sent.' };
  if (!user) return res.json(genericMessage);

  const code = generateOtp();
  const expiry = Date.now() + 1000 * 60 * 10; // 10 minutes
  db.prepare('INSERT INTO otps (id, email, code, purpose, expires_at) VALUES (?,?,?,?,?)')
    .run(uuid(), email, code, 'reset_password', expiry);

  try {
    await sendOtpEmail(email, code, 'reset_password');
  } catch (e) {
    console.error('Failed to send OTP email:', e.message);
    return res.status(500).json({ error: 'Could not send OTP email. Please try again shortly.' });
  }

  res.json(genericMessage);
});

// ---------- RESET PASSWORD (verify OTP + set new password in one step) ----------
router.post('/reset-password',
  body('email').isEmail(),
  body('otp').notEmpty(),
  body('password').isLength({ min: 6 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { email, otp, password } = req.body;

    const record = db.prepare(
      `SELECT * FROM otps WHERE email = ? AND code = ? AND purpose = 'reset_password' AND used = 0
       ORDER BY created_at DESC LIMIT 1`
    ).get(email, otp);

    if (!record || record.expires_at < Date.now()) {
      return res.status(400).json({ error: 'OTP is invalid or expired' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(400).json({ error: 'OTP is invalid or expired' });

    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, user.id);
    db.prepare('UPDATE otps SET used = 1 WHERE id = ?').run(record.id);

    res.json({ message: 'Password updated successfully' });
  });

// ---------- CURRENT USER ----------
router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT id,name,email,phone,role,created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

router.put('/me', authRequired, (req, res) => {
  const { name, phone } = req.body;
  db.prepare('UPDATE users SET name = COALESCE(?,name), phone = COALESCE(?,phone) WHERE id = ?')
    .run(name, phone, req.user.id);
  const user = db.prepare('SELECT id,name,email,phone,role FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

// ---------- ADMIN LOGIN ----------
router.post('/admin/login', body('email').isEmail(), body('password').notEmpty(), (req, res) => {
  const { email, password } = req.body;
  const admin = db.prepare('SELECT * FROM users WHERE email = ? AND role = ?').get(email, 'admin');
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin', name: admin.name },
    process.env.JWT_ADMIN_SECRET, { expiresIn: '12h' });
  res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email } });
});

module.exports = router;
