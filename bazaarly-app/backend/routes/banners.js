// backend/routes/banners.js
// Public, read-only endpoint — the homepage calls this to display the
// currently active banner slides. No login required.
const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const banners = db.prepare('SELECT * FROM banners WHERE is_active = 1 ORDER BY position').all();
  res.json({ banners });
});

module.exports = router;
