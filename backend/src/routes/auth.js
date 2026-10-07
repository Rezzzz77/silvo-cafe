// ---------- ماژول احراز هویت ----------
const express = require('express');
const db = require('../db');
const { genToken, now, publicUser } = require('../utils');

const router = express.Router();

// ورود / ثبت‌نام خودکار با نام و شماره موبایل
router.post('/login', (req, res) => {
  const { name, phone, birthdate } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: 'نام و شماره موبایل الزامی است' });

  let user = db.state.users.find((u) => u.phone === phone);
  if (!user) {
    user = {
      id: db.state.seq.user++,
      name, phone,
      birthdate: birthdate || null,
      loyaltyPoints: 0,
      tier: 'Bronze',
      createdAt: now(),
    };
    db.state.users.push(user);
  } else if (birthdate) {
    user.birthdate = birthdate;
  }

  const t = genToken();
  db.state.tokens[t] = user.id;
  db.save();
  res.json({ token: t, user: publicUser(user) });
});

router.post('/register', (req, res) => {
  const { name, phone, birthdate } = req.body || {};
  if (!name || !phone) return res.status(400).json({ error: 'نام و شماره موبایل الزامی است' });
  if (db.state.users.find((u) => u.phone === phone)) {
    return res.status(400).json({ error: 'این شماره قبلاً ثبت شده است' });
  }

  const user = {
    id: db.state.seq.user++,
    name, phone,
    birthdate: birthdate || null,
    loyaltyPoints: 0,
    tier: 'Bronze',
    createdAt: now(),
  };
  db.state.users.push(user);

  const t = genToken();
  db.state.tokens[t] = user.id;
  db.save();
  res.json({ token: t, user: publicUser(user) });
});

module.exports = router;
