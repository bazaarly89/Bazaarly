// backend/routes/footer.js
// Public, read-only endpoint — the site footer calls this to display
// its columns and links. No login required.
const express = require('express');
const { FooterColumn, FooterLink } = require('../db');
const router = express.Router();

router.get('/', async (req, res) => {
  const columns = await FooterColumn.find({ isActive: true }).sort({ position: 1 }).lean();
  const links = await FooterLink.find().sort({ position: 1 }).lean();
  res.json({
    columns: columns.map((c) => ({
      ...c,
      id: c._id,
      links: links.filter((l) => l.columnId === c._id).map((l) => ({ ...l, id: l._id })),
    })),
  });
});

module.exports = router;
