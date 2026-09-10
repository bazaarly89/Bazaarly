const express = require('express');
const { Category } = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  res.json({ categories: categories.map((c) => ({ ...c, id: c._id })) });
});

router.get('/:slug', async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json({ category: { ...category, id: category._id } });
});

module.exports = router;
