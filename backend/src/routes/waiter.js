// ---------- ماژول صدا زدن گارسون ----------
const express = require('express');
const db = require('../db');
const { now } = require('../utils');

const router = express.Router();

// مشتری گارسون را صدا می‌زند
router.post('/call', (req, res) => {
  const { tableId } = req.body || {};
  const table = db.state.tables.find((t) => t.id === Number(tableId));
  if (!table) return res.status(400).json({ error: 'میز نامعتبر است' });

  // اگر درخواست فعالی برای همین میز هست، تکراری نزن
  const existing = db.state.waiterCalls.find((c) => c.tableId === table.id && !c.resolved);
  if (existing) return res.json({ ...existing, message: 'گارسون قبلاً خبردار شده است' });

  const call = {
    id: db.state.seq.call++,
    tableId: table.id,
    tableNumber: table.number,
    at: now(),
    resolved: false,
  };
  db.state.waiterCalls.push(call);
  db.save();
  res.json({ ...call, message: '🛎️ گارسون خبردار شد و به‌زودی می‌آید' });
});

// درخواست‌های فعال (برای پنل مدیریت)
router.get('/active', (req, res) => {
  res.json(db.state.waiterCalls.filter((c) => !c.resolved).reverse());
});

// حل شدن درخواست
router.post('/:id/resolve', (req, res) => {
  const c = db.state.waiterCalls.find((x) => x.id === Number(req.params.id));
  if (!c) return res.status(404).json({ error: 'درخواست یافت نشد' });
  c.resolved = true;
  c.resolvedAt = now();
  db.save();
  res.json({ success: true });
});

module.exports = router;
