const express = require('express');
const { Notification } = require('../db');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

router.get('/', authRequired, async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
  res.json({ notifications: notifications.map((n) => ({ ...n, id: n._id })) });
});

router.put('/:id/read', authRequired, async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, userId: req.user.id }, { isRead: true });
  res.json({ message: 'ok' });
});

router.put('/read-all', authRequired, async (req, res) => {
  await Notification.updateMany({ userId: req.user.id }, { isRead: true });
  res.json({ message: 'ok' });
});

module.exports = router;
