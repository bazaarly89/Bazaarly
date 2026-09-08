// backend/routes/navigation.js
// Public, read-only endpoint — the site header calls this to display
// the current navigation menu. No login required.
const express = require('express');
const { NavItem } = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  const items = await NavItem.find({ isVisible: true }).sort({ position: 1 }).lean();
  res.json({ items: items.map((i) => ({ ...i, id: i._id })) });
});

module.exports = router;
