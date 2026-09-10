const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, Otp } = require('../db');
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
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { name, email, password, phone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const user = await User.create({ name, email, password: hash, phone: phone || null, role: 'customer' });

    const userPayload = { id: user._id, name: user.name, email: user.email, role: 'customer' };
    res.status(201).json({ token: signUserToken(userPayload), user: userPayload });
  });

// ---------- LOGIN ----------
router.post('/login', body('email').isEmail(), body('password').notEmpty(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

  const { email, password } = req.body;
  const user = await User.findOne({ email, role: 'customer' });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const userPayload = { id: user._id, name: user.name, email: user.email, role: user.role };
  res.json({ token: signUserToken(userPayload), user: userPayload });
});

// ---------- FORGOT PASSWORD (sends a 6-digit OTP to the user's email) ----------
router.post('/forgot-password', body('email').isEmail(), async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way to avoid revealing whether an email is registered
  const genericMessage = { message: 'If that email exists, an OTP has been sent.' };
  if (!user) return res.json(genericMessage);

  const code = generateOtp();
  const expiry = Date.now() + 1000 * 60 * 10; // 10 minutes
  await Otp.create({ email, code, purpose: 'reset_password', expiresAt: expiry });

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
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { email, otp, password } = req.body;

    const record = await Otp.findOne({ email, code: otp, purpose: 'reset_password', used: false })
      .sort({ createdAt: -1 });

    if (!record || record.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'OTP is invalid or expired' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'OTP is invalid or expired' });

    const hash = bcrypt.hashSync(password, 10);
    user.password = hash;
    await user.save();
    record.used = true;
    await record.save();

    res.json({ message: 'Password updated successfully' });
  });

// ---------- CURRENT USER ----------
router.get('/me', authRequired, async (req, res) => {
  const user = await User.findById(req.user.id).select('name email phone role createdAt').lean();
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { ...user, id: user._id } });
});

router.put('/me', authRequired, async (req, res) => {
  const { name, phone } = req.body;
  const update = {};
  if (name !== undefined) update.name = name;
  if (phone !== undefined) update.phone = phone;
  const user = await User.findByIdAndUpdate(req.user.id, update, { new: true }).select('name email phone role').lean();
  res.json({ user: { ...user, id: user._id } });
});

// ---------- ADMIN LOGIN ----------
router.post('/admin/login', body('email').isEmail(), body('password').notEmpty(), async (req, res) => {
  const { email, password } = req.body;
  const admin = await User.findOne({ email, role: 'admin' });
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  const token = jwt.sign({ id: admin._id, email: admin.email, role: 'admin', name: admin.name },
    process.env.JWT_ADMIN_SECRET, { expiresIn: '12h' });
  res.json({ token, admin: { id: admin._id, name: admin.name, email: admin.email } });
});

module.exports = router;
