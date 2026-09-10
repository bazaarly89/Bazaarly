// backend/routes/subscribe.js
// Public newsletter / deal-alert signup — one email field, a few optional
// checkboxes. No spam: this only records intent, it never sends mail itself.
const express = require('express');
const { Subscriber } = require('../db');
const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', async (req, res) => {
  const { email, wantsDeals, wantsGuides, wantsPriceAlerts } = req.body;
  if (!email || !EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  await Subscriber.findOneAndUpdate(
    { email: cleanEmail },
    {
      email: cleanEmail,
      wantsDeals: wantsDeals !== false,
      wantsGuides: !!wantsGuides,
      wantsPriceAlerts: !!wantsPriceAlerts,
    },
    { upsert: true }
  );

  res.status(201).json({ message: "You're subscribed." });
});

module.exports = router;
