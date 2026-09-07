// backend/routes/heroSlides.js
// Public, read-only endpoint — the homepage HeroCarousel calls this to get
// the current slides. No login required.
const express = require('express');
const { HeroSlide } = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  const rows = await HeroSlide.find({ isActive: true }).sort({ position: 1 }).lean();
  const slides = rows.map((r) => ({
    id: r._id,
    mode: r.mode,
    image: r.image,
    eyebrow: r.eyebrow,
    title: r.title,
    subtitle: r.subtitle,
    specs: r.specs || [],
    imageFit: r.imageFit || 'cover',
    ctaText: r.ctaText,
    ctaLink: r.ctaLink,
  }));
  res.json({ slides });
});

module.exports = router;
