// backend/routes/trustCards.js
// Public, read-only endpoint — the homepage "Why Choose Dostivox?" section
// calls this to display the current trust cards. No login required.
const express = require('express');
const { TrustCard } = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  const cards = await TrustCard.find({ isActive: true }).sort({ position: 1 }).lean();
  res.json({ cards: cards.map((c) => ({ ...c, id: c._id })) });
});

module.exports = router;
