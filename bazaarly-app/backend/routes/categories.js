const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY name').all();
  res.json({ categories });
});

router.get('/:slug', (req, res) => {
  const category = db.prepare('SELECT * FROM categories WHERE slug = ? AND is_active = 1').get(req.params.slug);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json({ category });
});

module.exports = router;
