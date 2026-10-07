// ============================================================
//  ماژول پرداخت — درگاه زرین‌پال (واقعی) + درگاه دمو (داخل سرور)
//  نکته: طبق قانون تطابق دامنه شاپرک، درگاه فقط از سمت سرور
//  صدا زده می‌شود؛ اپ فقط authority می‌گیرد و کاربر را هدایت می‌کند.
// ============================================================
const express = require('express');
const crypto = require('crypto');
const https = require('https');
const db = require('../db');
const { now } = require('../utils');
const { ZARINPAL_MERCHANT_ID } = require('../config');

const router = express.Router();

const GATEWAY_LIVE = ZARINPAL_MERCHANT_ID.length > 0;
const ZP_REQUEST_URL = 'https://payment.zarinpal.com/pg/v4/payment/request.json';
const ZP_VERIFY_URL = 'https://payment.zarinpal.com/pg/v4/payment/verify.json';
const ZP_START_PAY = 'https://payment.zarinpal.com/pg/StartPay/';
const CALLBACK_URL = `http://127.0.0.1:${require('../config').PORT}/api/payment/callback`;

// ---------- ابزار ----------
function zpPost(url, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      timeout: 15000,
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch { reject(new Error('پاسخ نامعتبر از درگاه')); }
      });
    });
    req.on('timeout', () => { req.destroy(new Error('اتصال به درگاه زمان برد')); });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

const toRial = (toman) => Math.round(Number(toman) * 10);

// ---------- درخواست پرداخت (ساخت authority) ----------
router.post('/request', async (req, res) => {
  const { orderId } = req.body || {};
  const order = db.state.orders.find((o) => o.id === Number(orderId));
  if (!order) return res.status(404).json({ error: 'سفارش یافت نشد' });
  if (order.paymentStatus === 'PAID') return res.status(400).json({ error: 'این سفارش قبلاً پرداخت شده است' });

  const amount = order.totalAmount - (order.discount || 0);

  // تراکنش در انتظار قبلی؟ استفاده مجدد
  const pending = db.state.payments.find((p) => p.orderId === order.id && p.status === 'PENDING');
  if (pending) {
    return res.json({ authority: pending.authority, paymentUrl: pending.paymentUrl, demo: !GATEWAY_LIVE });
  }

  if (!GATEWAY_LIVE) {
    // ---------- درگاه دمو (بدون نیاز به حساب زرین‌پال) ----------
    const authority = 'DEMO-' + crypto.randomBytes(12).toString('hex');
    const payment = {
      id: db.state.payments.length + 1,
      orderId: order.id,
      authority,
      amount,
      status: 'PENDING',
      demo: true,
      createdAt: now(),
    };
    db.state.payments.push(payment);
    db.save();
    return res.json({
      authority,
      paymentUrl: `http://127.0.0.1:${require('../config').PORT}/api/payment/demo-gateway?authority=${authority}&orderId=${order.id}&amount=${amount}`,
      demo: true,
    });
  }

  // ---------- درگاه واقعی زرین‌پال ----------
  try {
    const resp = await zpPost(ZP_REQUEST_URL, {
      merchant_id: ZARINPAL_MERCHANT_ID,
      amount: toRial(amount),
      callback_url: CALLBACK_URL,
      description: `سفارش #${order.id} — کافه سیلو پلازا`,
    });
    if (resp?.data?.code === 100 && resp?.data?.authority) {
      const authority = resp.data.authority;
      const payment = {
        id: db.state.payments.length + 1,
        orderId: order.id,
        authority,
        amount,
        status: 'PENDING',
        demo: false,
        createdAt: now(),
      };
      db.state.payments.push(payment);
      db.save();
      return res.json({
        authority,
        paymentUrl: `${ZP_START_PAY}${authority}`,
        demo: false,
      });
    }
    return res.status(400).json({ error: `درگاه: ${resp?.errors?.message || 'خطای نامشخص'} (کد ${resp?.data?.code})` });
  } catch (e) {
    return res.status(502).json({ error: 'اتصال به درگاه ناموفق: ' + e.message });
  }
});

// ---------- تایید پرداخت (verify) ----------
router.post('/verify', async (req, res) => {
  const { orderId, authority } = req.body || {};
  const order = db.state.orders.find((o) => o.id === Number(orderId));
  if (!order) return res.status(404).json({ error: 'سفارش یافت نشد' });

  const payment = db.state.payments.find((p) => p.orderId === order.id && p.authority === authority);
  if (!payment) return res.status(404).json({ error: 'تراکنش یافت نشد' });

  if (payment.status === 'PAID') {
    return res.json({ success: true, refId: payment.refId, order, already: true });
  }

  if (payment.demo) {
    // درگاه دمو: اگر کاربر از صفحه دمو «پرداخت موفق» زده بود، همان‌جا صاف شده؛
    // وگرنه تایید را همین‌جا انجام بده
    if (payment.status === 'APPROVED' || payment.status === 'PENDING') {
      payment.status = 'PAID';
      payment.refId = 'DEMO-REF-' + crypto.randomBytes(6).toString('hex');
      payment.verifiedAt = now();
      if (order.paymentStatus !== 'PAID') {
        order.paymentStatus = 'PAID';
        order.paymentMethod = 'ONLINE';
        order.paidAt = now();
        order.finalAmount = order.finalAmount ?? (order.totalAmount - (order.discount || 0));
        order.discount = order.discount || 0;
      }
      db.save();
    }
    return res.json({ success: true, refId: payment.refId, order, demo: true });
  }

  // ---------- verify واقعی زرین‌پال ----------
  try {
    const resp = await zpPost(ZP_VERIFY_URL, {
      merchant_id: ZARINPAL_MERCHANT_ID,
      amount: toRial(payment.amount),
      authority,
    });
    if (resp?.data?.code === 100) {
      payment.status = 'PAID';
      payment.refId = String(resp.data.ref_id);
      payment.verifiedAt = now();
      order.paymentStatus = 'PAID';
      order.paymentMethod = 'ONLINE';
      order.paidAt = now();
      order.finalAmount = order.finalAmount ?? payment.amount;
      order.discount = order.discount || 0;
      db.save();
      return res.json({ success: true, refId: payment.refId, order, demo: false });
    }
    return res.status(400).json({ error: `تایید ناموفق: ${resp?.errors?.message || 'کد ' + resp?.data?.code}` });
  } catch (e) {
    return res.status(502).json({ error: 'اتصال به درگاه ناموفق: ' + e.message });
  }
});

// ---------- callback از درگاه (مرورگر داخل WebView به اینجا می‌رسد) ----------
router.get('/callback', (req, res) => {
  const { Authority, Status } = req.query;
  const payment = db.state.payments.find((p) => p.authority === Authority);
  if (payment && Status === 'OK') {
    if (payment.demo && payment.status !== 'PAID') {
      payment.status = 'APPROVED';
      const order = db.state.orders.find((o) => o.id === payment.orderId);
      if (order && order.paymentStatus !== 'PAID') {
        order.paymentStatus = 'PAID';
        order.paymentMethod = 'ONLINE';
        order.paidAt = now();
        order.finalAmount = order.finalAmount ?? payment.amount;
        order.discount = order.discount || 0;
      }
      db.save();
    }
    return res.send(`<html dir="rtl"><body style="font-family:sans-serif;background:#dcfce7;display:flex;align-items:center;justify-content:center;height:100vh">
      <div style="text-align:center"><h2 style="color:#166534">✅ پرداخت انجام شد</h2><p style="color:#444">به اپلیکیشن برگردید</p></div></body></html>`);
  }
  res.send(`<html dir="rtl"><body style="font-family:sans-serif;background:#fee2e2;display:flex;align-items:center;justify-content:center;height:100vh">
    <div style="text-align:center"><h2 style="color:#b91c1c">❌ پرداخت ناموفق بود</h2><p style="color:#444">به اپلیکیشن برگردید و دوباره تلاش کنید</p></div></body></html>`);
});

// ---------- درگاه دمو (صفحه HTML پرداخت) ----------
router.get('/demo-gateway', (req, res) => {
  const { authority, orderId, amount } = req.query;
  res.send(`<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>درگاه پرداخت دمو</title>
<style>
  body{font-family:sans-serif;background:#f5f5f4;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  .card{background:#fff;border-radius:16px;padding:28px;width:340px;box-shadow:0 4px 24px rgba(0,0,0,.1);text-align:center}
  .logo{font-size:44px}
  .title{font-size:18px;font-weight:bold;color:#166534;margin-top:8px}
  .amount{font-size:26px;font-weight:bold;color:#1c1917;margin:14px 0}
  .meta{font-size:12px;color:#78716c;margin-bottom:18px}
  .ok{display:block;background:#166534;color:#fff;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:bold;width:100%;cursor:pointer;margin-bottom:10px}
  .no{display:block;background:#fee2e2;color:#b91c1c;border:none;border-radius:12px;padding:12px;font-size:13px;font-weight:bold;width:100%;cursor:pointer}
  .note{font-size:11px;color:#a8a29e;margin-top:14px;line-height:1.8}
</style></head>
<body>
<div class="card">
  <div class="logo">💳</div>
  <div class="title">درگاه پرداخت آزمایشی</div>
  <div class="amount">${Number(amount || 0).toLocaleString('fa-IR')} تومان</div>
  <div class="meta">سفارش #${orderId} — کافه سیلو پلازا<br>این درگاه دمو است؛ با ثبت شناسه زرین‌پال، درگاه واقعی فعال می‌شود</div>
  <a class="ok" href="/api/payment/callback?Authority=${authority}&Status=OK">پرداخت موفق ✓</a>
  <a class="no" href="/api/payment/callback?Authority=${authority}&Status=NOK">انصراف از پرداخت</a>
  <div class="note">با اتصال حساب زرین‌پال، این صفحه با درگاه واقعی جایگزین می‌شود</div>
</div>
</body></html>`);
});

module.exports = router;
