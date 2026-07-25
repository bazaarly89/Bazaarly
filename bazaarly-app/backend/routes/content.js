// backend/routes/content.js
// Public, read-only endpoint that exposes the site's editable text content
// (hero titles, about page text, etc.) that admins manage from the dashboard.
const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  res.json({ content: Object.fromEntries(rows.map((r) => [r.key, r.value])) });
});

module.exports = router;
