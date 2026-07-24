const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

router.get('/', authRequired, (req, res) => {
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC').all(req.user.id);
  res.json({ addresses });
});

router.post('/', authRequired, (req, res) => {
  const { label, full_name, phone, line1, line2, city, state, pincode, country, is_default } = req.body;
  const id = uuid();
  if (is_default) db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  db.prepare(`INSERT INTO addresses (id,user_id,label,full_name,phone,line1,line2,city,state,pincode,country,is_default)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, req.user.id, label, full_name, phone, line1, line2 || '', city, state, pincode, country || 'India', is_default ? 1 : 0);
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC').all(req.user.id);
  res.status(201).json({ addresses });
});

router.put('/:id', authRequired, (req, res) => {
  const { label, full_name, phone, line1, line2, city, state, pincode, country, is_default } = req.body;
  if (is_default) db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  db.prepare(`UPDATE addresses SET label=?,full_name=?,phone=?,line1=?,line2=?,city=?,state=?,pincode=?,country=?,is_default=?
    WHERE id = ? AND user_id = ?`)
    .run(label, full_name, phone, line1, line2 || '', city, state, pincode, country || 'India', is_default ? 1 : 0, req.params.id, req.user.id);
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC').all(req.user.id);
  res.json({ addresses });
});

router.delete('/:id', authRequired, (req, res) => {
  db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC').all(req.user.id);
  res.json({ addresses });
});

module.exports = router;
