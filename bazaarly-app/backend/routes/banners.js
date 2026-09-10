// backend/routes/banners.js
// Public, read-only endpoint — the homepage calls this to display the
// currently active banner slides. No login required.
const express = require('express');
const { Banner } = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  const banners = await Banner.find({ isActive: true }).sort({ position: 1 }).lean();
  res.json({ banners: banners.map((b) => ({ ...b, id: b._id })) });
});

module.exports = router;
