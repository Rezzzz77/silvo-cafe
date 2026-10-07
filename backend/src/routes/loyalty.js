// ---------- ماژول وفاداری: چرخ شانس، پروفایل، سطوح ----------
const express = require('express');
const db = require('../db');
const { now, publicUser } = require('../utils');
const { orderSummary } = require('../services/order-service');

const router = express.Router();

// چرخ شانس روزانه (هر کاربر یک بار در روز)
router.post('/spin', (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId لازم است' });

  const today = now().slice(0, 10);
  const already = db.state.spins.find((s) => s.userId === userId && s.date === today);
  if (already) {
    return res.status(400).json({ error: 'امروز قبلاً شانس خود را امتحان کرده‌اید!', spin: already });
  }

  const roll = Math.random() * 100;
  let rewardType, rewardValue, label;
  if (roll < 40) { rewardType = 'POINTS'; rewardValue = 500; label = '۵۰۰ امتیاز'; }
  else if (roll < 65) { rewardType = 'POINTS'; rewardValue = 1000; label = '۱۰۰۰ امتیاز'; }
  else if (roll < 82) { rewardType = 'DISCOUNT'; rewardValue = 10; label = 'کوپن ۱۰٪ تخفیف'; }
  else if (roll < 95) { rewardType = 'DISCOUNT'; rewardValue = 20; label = 'کوپن ۲۰٪ تخفیف'; }
  else { rewardType = 'DISCOUNT'; rewardValue = 50; label = 'کوپن ۵۰٪ تخفیف 🎉'; }

  const spin = {
    id: db.state.spins.length + 1,
    userId, date: today, rewardType, rewardValue, label, at: now(),
  };
  db.state.spins.push(spin);

  if (rewardType === 'POINTS') {
    const u = db.state.users.find((x) => x.id === userId);
    if (u) {
      u.loyaltyPoints += rewardValue;
      u.tier =
        u.loyaltyPoints >= 5000 ? 'Platinum' :
        u.loyaltyPoints >= 2000 ? 'Gold' :
        u.loyaltyPoints >= 500 ? 'Silver' : 'Bronze';
    }
  }
  db.save();
  res.json(spin);
});

// پروفایل کاربر + تاریخچه
router.get('/profile/:id', (req, res) => {
  const u = db.state.users.find((x) => x.id === Number(req.params.id));
  if (!u) return res.status(404).json({ error: 'کاربر یافت نشد' });
  const spins = db.state.spins.filter((s) => s.userId === u.id).slice(-10).reverse();
  const orders = db.state.orders.filter((o) => o.userId === u.id).map((o) => orderSummary(o.id));
  res.json({ ...publicUser(u), spins, orders });
});

// ویرایش پروفایل (نام / تاریخ تولد)
router.post('/profile/:id', (req, res) => {
  const u = db.state.users.find((x) => x.id === Number(req.params.id));
  if (!u) return res.status(404).json({ error: 'کاربر یافت نشد' });
  const { name, birthdate } = req.body || {};
  if (name !== undefined && String(name).trim()) u.name = String(name).trim();
  if (birthdate !== undefined) u.birthdate = birthdate || null;
  db.save();
  res.json(publicUser(u));
});

// سطوح وفاداری
router.get('/loyalty/tiers', (req, res) => {
  res.json([
    { name: 'Bronze', minPoints: 0, discountPct: 0, fa: 'برنزی' },
    { name: 'Silver', minPoints: 500, discountPct: 5, fa: 'نقره‌ای' },
    { name: 'Gold', minPoints: 2000, discountPct: 10, fa: 'طلایی' },
    { name: 'Platinum', minPoints: 5000, discountPct: 15, fa: 'پلاتینیوم' },
  ]);
});

module.exports = router;
