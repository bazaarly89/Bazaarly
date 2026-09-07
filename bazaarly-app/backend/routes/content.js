// backend/routes/content.js
// Public, read-only endpoint that exposes the site's editable text content
// (hero titles, about page text, etc.) that admins manage from the dashboard.
const express = require('express');
const { Setting } = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  const rows = await Setting.find().lean();
  res.json({ content: Object.fromEntries(rows.map((r) => [r._id, r.value])) });
});

module.exports = router;
