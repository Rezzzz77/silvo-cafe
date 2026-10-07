// ---------- ماژول KDS: نمایشگر زنده آشپزخانه ----------
const express = require('express');
const db = require('../db');
const { now } = require('../utils');

const router = express.Router();

// صف آشپزخانه: سفارش‌های تاییدشده یا در حال آماده‌سازی
router.get('/queue', (req, res) => {
  const active = db.state.orders
    .filter((o) => o.status === 'CONFIRMED' || o.status === 'PREPARING')
    .map((o) => {
      // زمان شروع وضعیت فعلی از تاریخچه
      const since = [...o.statusHistory].reverse().find((h) => h.status === o.status);
      const startedAt = since ? since.at : o.createdAt;
      const elapsedSec = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
      return {
        orderId: o.id,
        tableNumber: o.tableNumber,
        orderType: o.orderType,
        customerName: o.customerName,
        status: o.status,
        items: o.items.map((it) => ({ name: it.name, quantity: it.quantity })),
        note: o.note || '',
        startedAt,
        elapsedSec,
      };
    })
    .sort((a, b) => a.elapsedSec - b.elapsedSec === 0 ? a.orderId - b.orderId : b.elapsedSec - a.elapsedSec);
  res.json(active);
});

// آشپزخانه وضعیت را جلو می‌برد: CONFIRMED → PREPARING → SERVED
router.post('/orders/:id/status', (req, res) => {
  const o = db.state.orders.find((x) => x.id === Number(req.params.id));
  if (!o) return res.status(404).json({ error: 'سفارش یافت نشد' });
  const { status } = req.body || {};
  const allowed = ['PREPARING', 'SERVED'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'وضعیت نامعتبر برای آشپزخانه' });
  if (status === 'PREPARING' && o.status !== 'CONFIRMED') {
    return res.status(400).json({ error: 'فقط سفارش تاییدشده وارد آماده‌سازی می‌شود' });
  }
  if (status === 'SERVED' && o.status !== 'PREPARING') {
    return res.status(400).json({ error: 'فقط سفارش در حال آماده‌سازی سرو می‌شود' });
  }
  o.status = status;
  o.statusHistory.push({ status, at: now() });
  db.save();
  res.json(o);
});

module.exports = router;
