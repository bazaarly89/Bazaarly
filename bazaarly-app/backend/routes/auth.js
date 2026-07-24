const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuid } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

function signUserToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET, { expiresIn: '7d' });
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

// ---------- FORGOT PASSWORD ----------
router.post('/forgot-password', body('email').isEmail(), (req, res) => {
  const { email } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  // Always respond success to avoid email enumeration
  if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = Date.now() + 1000 * 60 * 30; // 30 min
  db.prepare('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?').run(token, expiry, user.id);

  // In production this would be emailed. Returned here for demo purposes.
  res.json({ message: 'If that email exists, a reset link has been sent.', demo_reset_token: token });
});

router.post('/reset-password', body('token').notEmpty(), body('password').isLength({ min: 6 }), (req, res) => {
  const { token, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE reset_token = ?').get(token);
  if (!user || !user.reset_token_expiry || user.reset_token_expiry < Date.now()) {
    return res.status(400).json({ error: 'Reset link is invalid or expired' });
  }
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?')
    .run(hash, user.id);
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
