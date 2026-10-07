// ---------- ماژول کافه‌ها: لیست کافه‌ها، منو و میزها ----------
const express = require('express');
const db = require('../db');
const { orderSummary } = require('../services/order-service');

const router = express.Router();

const menuCount = () => db.state.menu.reduce((s, cat) => s + cat.items.length, 0);

router.get('/', (req, res) => {
  res.json(db.state.cafes.map((c) => ({ ...c, menuCount: menuCount() })));
});

router.get('/:id', (req, res) => {
  const cafe = db.state.cafes.find((c) => c.id === Number(req.params.id));
  if (!cafe) return res.status(404).json({ error: 'کافه یافت نشد' });
  res.json({ ...cafe, menuCategories: db.state.menu });
});

router.get('/:id/tables', (req, res) => {
  res.json(db.state.tables.map((t) => ({
    ...t,
    activeOrder: t.activeOrder ? orderSummary(t.activeOrder) : null,
  })));
});

module.exports = router;
