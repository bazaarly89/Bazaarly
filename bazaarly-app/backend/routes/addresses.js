const express = require('express');
const { Address } = require('../db');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

function format(a) {
  const obj = a.toObject ? a.toObject() : a;
  return { ...obj, id: obj._id, full_name: obj.fullName, is_default: obj.isDefault };
}

router.get('/', authRequired, async (req, res) => {
  const addresses = await Address.find({ userId: req.user.id }).sort({ isDefault: -1 }).lean();
  res.json({ addresses: addresses.map(format) });
});

router.post('/', authRequired, async (req, res) => {
  const { label, full_name, phone, line1, line2, city, state, pincode, country, is_default } = req.body;
  if (is_default) await Address.updateMany({ userId: req.user.id }, { isDefault: false });
  await Address.create({
    userId: req.user.id, label, fullName: full_name, phone, line1, line2: line2 || '',
    city, state, pincode, country: country || 'India', isDefault: !!is_default,
  });
  const addresses = await Address.find({ userId: req.user.id }).sort({ isDefault: -1 }).lean();
  res.status(201).json({ addresses: addresses.map(format) });
});

router.put('/:id', authRequired, async (req, res) => {
  const { label, full_name, phone, line1, line2, city, state, pincode, country, is_default } = req.body;
  if (is_default) await Address.updateMany({ userId: req.user.id }, { isDefault: false });
  await Address.updateOne(
    { _id: req.params.id, userId: req.user.id },
    { label, fullName: full_name, phone, line1, line2: line2 || '', city, state, pincode, country: country || 'India', isDefault: !!is_default }
  );
  const addresses = await Address.find({ userId: req.user.id }).sort({ isDefault: -1 }).lean();
  res.json({ addresses: addresses.map(format) });
});

router.delete('/:id', authRequired, async (req, res) => {
  await Address.deleteOne({ _id: req.params.id, userId: req.user.id });
  const addresses = await Address.find({ userId: req.user.id }).sort({ isDefault: -1 }).lean();
  res.json({ addresses: addresses.map(format) });
});

module.exports = router;
