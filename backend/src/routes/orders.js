// ---------- ماژول سفارش‌ها: ثبت، پرداخت، پیگیری، نظرسنجی ----------
const express = require('express');
const db = require('../db');
const { authUser } = require('../middleware');
const { orderSummary, createOrder, applyPayment } = require('../services/order-service');

const router = express.Router();

// ثبت سفارش مشتری (روی میز یا بیرون‌بر)
router.post('/', (req, res) => {
  const user = authUser(req);
  const { cafeId, tableId, items, note, orderType, address, phone } = req.body || {};
  const customer = orderType === 'TAKEAWAY'
    ? { name: user ? user.name : undefined, phone: phone || (user ? user.phone : null), address }
    : undefined;

  const result = createOrder({
    cafeId,
    tableId,
    items,
    note,
    orderType: orderType || 'TABLE',
    customer,
    userId: user ? user.id : null,
  });
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result.order);
});

router.get('/:id', (req, res) => {
  const o = db.state.orders.find((x) => x.id === Number(req.params.id));
  if (!o) return res.status(404).json({ error: 'سفارش یافت نشد' });
  res.json(o);
});

// سفارش‌های یک کاربر
router.get('/users/:id/orders', (req, res) => {
  const list = db.state.orders
    .filter((o) => o.userId === Number(req.params.id))
    .map((o) => orderSummary(o.id));
  res.json(list);
});

// پرداخت آنلاین (شبیه‌سازی درگاه) — method: ONLINE | CARD
router.post('/:id/pay', (req, res) => {
  const o = db.state.orders.find((x) => x.id === Number(req.params.id));
  if (!o) return res.status(404).json({ error: 'سفارش یافت نشد' });
  if (o.paymentStatus === 'PAID') return res.status(400).json({ error: 'این سفارش قبلاً پرداخت شده است' });
  const { usePoints, method } = req.body || {};
  o.paymentMethod = method === 'CARD' ? 'CARD_READER' : 'ONLINE';
  const result = applyPayment(o, !!usePoints);
  res.json(result);
});

// پرداخت با کارتخوان (شبیه‌سازی اتصال دستگاه)
router.post('/:id/pay-card', (req, res) => {
  const o = db.state.orders.find((x) => x.id === Number(req.params.id));
  if (!o) return res.status(404).json({ error: 'سفارش یافت نشد' });
  if (o.paymentStatus === 'PAID') return res.status(400).json({ error: 'این سفارش قبلاً پرداخت شده است' });
  o.paymentMethod = 'CARD_READER';
  const result = applyPayment(o, false);
  res.json({ ...result, message: '💳 پرداخت با کارتخوان موفق بود' });
});

// نظرسنجی مشتری پس از تکمیل سفارش
router.post('/:id/survey', (req, res) => {
  const o = db.state.orders.find((x) => x.id === Number(req.params.id));
  if (!o) return res.status(404).json({ error: 'سفارش یافت نشد' });
  const { rating, comment } = req.body || {};
  const r = Math.min(5, Math.max(1, Number(rating) || 5));
  o.survey = { rating: r, comment: comment || '', at: new Date().toISOString() };
  db.save();
  res.json({ success: true, survey: o.survey });
});

module.exports = router;
