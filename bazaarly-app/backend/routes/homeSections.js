// backend/routes/homeSections.js
// Public, read-only endpoint — the homepage reads this to decide which
// sections to show, in what order, and with what titles/buttons.
const express = require('express');
const { HomeSection } = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  const sections = await HomeSection.find({ isEnabled: true }).sort({ position: 1 }).lean();
  res.json({ sections: sections.map((s) => ({ ...s, id: s._id })) });
});

module.exports = router;
