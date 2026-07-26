// backend/routes/heroSlides.js
// Public, read-only endpoint — the homepage HeroCarousel calls this to get
// the current slides. No login required. `specs` is stored as a JSON
// string in the database and gets parsed back into an array here.
const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM hero_slides WHERE is_active = 1 ORDER BY position').all();
  const slides = rows.map((r) => ({
    id: r.id,
    mode: r.mode,
    image: r.image,
    eyebrow: r.eyebrow,
    title: r.title,
    subtitle: r.subtitle,
    specs: r.specs ? JSON.parse(r.specs) : [],
    ctaText: r.cta_text,
    ctaLink: r.cta_link,
  }));
  res.json({ slides });
});

module.exports = router;
