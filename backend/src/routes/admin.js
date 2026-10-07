// ============================================================
//  ماژول پنل مدیریت — داشبورد، سفارش دستی، منو، انبار، پرسنل،
//  باشگاه مشتریان + پیامک، گزارش‌ها، نظرسنجی، بکاپ، میزها
// ============================================================
const express = require('express');
const fs = require('fs');
const path = require('path');
const https = require('https');
const db = require('../db');
const { now } = require('../utils');
const { KAVENEGAR_API_KEY, KAVENEGAR_SENDER, ZARINPAL_MERCHANT_ID } = require('../config');
const { orderSummary, createOrder } = require('../services/order-service');

const router = express.Router();

const ALLOWED = ['CONFIRMED', 'PREPARING', 'SERVED', 'COMPLETED', 'CANCELLED'];
const ROLES_FA = { MANAGER: 'مدیر', CASHIER: 'صندوق‌دار', WAITER: 'گارسون', CHEF: 'آشپز' };

// ================= داشبورد =================

router.get('/tables', (req, res) => {
  res.json(db.state.tables.map((t) => ({
    id: t.id, number: t.number, section: t.section, capacity: t.capacity,
    activeOrder: t.activeOrder ? orderSummary(t.activeOrder) : null,
    waiterCalls: db.state.waiterCalls.filter((c) => c.tableId === t.id && !c.resolved).length,
  })));
});

router.get('/stats', (req, res) => {
  const today = now().slice(0, 10);
  const todays = db.state.orders.filter((o) => o.createdAt.slice(0, 10) === today);
  const paid = todays.filter((o) => o.paymentStatus === 'PAID');
  const revenue = paid.reduce((s, o) => s + (o.finalAmount ?? o.totalAmount), 0);
  res.json({
    activeTables: db.state.tables.filter((t) => t.activeOrder).length,
    totalTables: db.state.tables.length,
    ordersToday: todays.length,
    paidToday: paid.length,
    revenueToday: revenue,
    avgOrder: paid.length ? Math.round(revenue / paid.length) : 0,
    pendingCount: todays.filter((o) => o.status === 'PENDING').length,
    totalUsers: db.state.users.length,
    activeWaiterCalls: db.state.waiterCalls.filter((c) => !c.resolved).length,
  });
});

router.post('/orders/:id/status', (req, res) => {
  const o = db.state.orders.find((x) => x.id === Number(req.params.id));
  if (!o) return res.status(404).json({ error: 'سفارش یافت نشد' });
  const { status } = req.body || {};
  if (!ALLOWED.includes(status)) return res.status(400).json({ error: 'وضعیت نامعتبر است' });

  o.status = status;
  o.statusHistory.push({ status, at: now() });

  // چاپ دوگانه خودکار هنگام تایید: صندوق + آشپزخانه
  if (status === 'CONFIRMED' && !o.prints) {
    o.prints = { cashier: now(), kitchen: now() };
  }

  if (status === 'COMPLETED' || status === 'CANCELLED') {
    const t = db.state.tables.find((x) => x.id === o.tableId);
    if (t && t.activeOrder === o.id) t.activeOrder = null;
  }
  db.save();
  res.json(o);
});

// ================= سفارش دستی پرسنل =================

router.post('/orders', (req, res) => {
  const { cafeId, tableId, items, note, orderType, customerName, customerPhone, address } = req.body || {};
  const result = createOrder({
    cafeId,
    tableId,
    items,
    note,
    orderType: orderType || 'TABLE',
    customer: { name: customerName, phone: customerPhone, address },
    userId: null,
  });
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result.order);
});

// ================= میزها (نامحدود) =================

router.post('/tables', (req, res) => {
  const { section, capacity } = req.body || {};
  const id = db.state.tables.length + 1;
  const table = {
    id,
    number: ++db.state.seq.table,
    section: section || 'سالن اصلی',
    capacity: Number(capacity) || 4,
    activeOrder: null,
  };
  db.state.tables.push(table);
  db.save();
  res.json(table);
});

router.delete('/tables/:id', (req, res) => {
  const t = db.state.tables.find((x) => x.id === Number(req.params.id));
  if (!t) return res.status(404).json({ error: 'میز یافت نشد' });
  if (t.activeOrder) return res.status(400).json({ error: 'این میز سفارش فعال دارد' });
  db.state.tables = db.state.tables.filter((x) => x.id !== t.id);
  db.save();
  res.json({ success: true });
});

// ================= مدیریت منو =================

router.post('/menu/items', (req, res) => {
  const { categoryId, name, price, desc } = req.body || {};
  if (!name || !price) return res.status(400).json({ error: 'نام و قیمت لازم است' });
  const cat = db.state.menu.find((c) => c.id === Number(categoryId));
  if (!cat) return res.status(400).json({ error: 'دسته‌بندی نامعتبر است' });
  const item = { id: db.state.seq.item++, name, price: Number(price), desc: desc || '', available: true };
  cat.items.push(item);
  db.state.inventory[item.id] = 50;
  db.save();
  res.json(item);
});

router.put('/menu/items/:id', (req, res) => {
  const item = db.state.menu.flatMap((c) => c.items).find((i) => i.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'آیتم یافت نشد' });
  const { name, price, desc, available } = req.body || {};
  if (name !== undefined) item.name = name;
  if (price !== undefined) item.price = Number(price);
  if (desc !== undefined) item.desc = desc;
  if (available !== undefined) item.available = !!available;
  db.save();
  res.json(item);
});

router.delete('/menu/items/:id', (req, res) => {
  const id = Number(req.params.id);
  for (const cat of db.state.menu) {
    const before = cat.items.length;
    cat.items = cat.items.filter((i) => i.id !== id);
    if (cat.items.length !== before) {
      delete db.state.inventory[id];
      db.save();
      return res.json({ success: true });
    }
  }
  res.status(404).json({ error: 'آیتم یافت نشد' });
});

router.post('/menu/categories', (req, res) => {
  const { title } = req.body || {};
  if (!title) return res.status(400).json({ error: 'عنوان لازم است' });
  const cat = { id: db.state.menu.length + 1, title, items: [] };
  db.state.menu.push(cat);
  db.save();
  res.json(cat);
});

// ================= انبارداری =================

router.get('/inventory', (req, res) => {
  const list = [];
  db.state.menu.forEach((cat) => {
    cat.items.forEach((it) => {
      const stock = db.state.inventory[it.id] ?? 0;
      list.push({
        itemId: it.id, name: it.name, price: it.price,
        category: cat.title, stock,
        low: stock < 10,
        out: stock <= 0,
      });
    });
  });
  res.json(list);
});

router.post('/inventory/:itemId', (req, res) => {
  const id = Number(req.params.itemId);
  const { stock } = req.body || {};
  if (stock === undefined) return res.status(400).json({ error: 'موجودی لازم است' });
  db.state.inventory[id] = Math.max(0, Number(stock));
  db.save();
  res.json({ itemId: id, stock: db.state.inventory[id] });
});

// ================= مدیریت پرسنل =================

router.get('/staff', (req, res) => res.json(db.state.staff));

router.post('/staff', (req, res) => {
  const { name, role } = req.body || {};
  if (!name || !role) return res.status(400).json({ error: 'نام و نقش لازم است' });
  if (!ROLES_FA[role]) return res.status(400).json({ error: 'نقش نامعتبر است' });
  const s = { id: db.state.seq.staff++, name, role };
  db.state.staff.push(s);
  db.save();
  res.json(s);
});

router.delete('/staff/:id', (req, res) => {
  const id = Number(req.params.id);
  const s = db.state.staff.find((x) => x.id === id);
  if (!s) return res.status(404).json({ error: 'پرسنل یافت نشد' });
  if (s.role === 'MANAGER') return res.status(400).json({ error: 'مدیر اصلی قابل حذف نیست' });
  db.state.staff = db.state.staff.filter((x) => x.id !== id);
  db.save();
  res.json({ success: true });
});

// ================= باشگاه مشتریان + پیامک =================

router.get('/customers', (req, res) => {
  const list = db.state.users.map((u) => {
    const orders = db.state.orders.filter((o) => o.userId === u.id);
    const spent = orders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((s, o) => s + (o.finalAmount ?? o.totalAmount), 0);
    return {
      id: u.id, name: u.name, phone: u.phone, birthdate: u.birthdate,
      loyaltyPoints: u.loyaltyPoints, tier: u.tier,
      ordersCount: orders.length, totalSpent: spent,
    };
  });
  res.json(list);
});

// ---------- ارسال پیامک از طریق کاوه‌نگار (یا شبیه‌سازی اگر کلید نباشد) ----------
function kavenegarSend(phones, message) {
  return new Promise((resolve, reject) => {
    const url = `https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/sms/send.json`;
    const payload = JSON.stringify({
      receptor: phones.join(','),
      sender: KAVENEGAR_SENDER,
      message,
    });
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      timeout: 12000,
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch { reject(new Error('پاسخ نامعتبر از کاوه‌نگار')); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('اتصال به کاوه‌نگار زمان برد')));
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

router.post('/sms', async (req, res) => {
  const { message, target } = req.body || {};
  if (!message) return res.status(400).json({ error: 'متن پیامک لازم است' });

  let recipients = [];
  if (target === 'birthday') {
    const today = new Date();
    recipients = db.state.users.filter((u) => {
      if (!u.birthdate) return false;
      const b = new Date(u.birthdate);
      return b.getMonth() === today.getMonth() && b.getDate() === today.getDate();
    });
  } else {
    recipients = db.state.users;
  }

  const log = {
    id: db.state.seq.sms++,
    message,
    target: target === 'birthday' ? 'متولدین امروز' : 'همه مشتریان',
    count: recipients.length,
    channel: KAVENEGAR_API_KEY ? 'KAVENEGAR' : 'SIMULATION',
    at: now(),
  };

  // ارسال واقعی اگر کلید کاوه‌نگار تنظیم شده باشد
  if (KAVENEGAR_API_KEY && recipients.length > 0) {
    try {
      const resp = await kavenegarSend(recipients.map((u) => u.phone), message);
      if (resp?.return?.status === 200) {
        log.status = 'SENT';
        log.messageIds = resp.entries ? resp.entries.map((e) => e.messageid) : [];
        log.cost = resp.entries ? resp.entries.reduce((s, e) => s + (e.cost || 0), 0) : 0;
      } else {
        log.status = 'FAILED';
        log.error = resp?.return?.message || 'خطای کاوه‌نگار';
      }
    } catch (e) {
      log.status = 'FAILED';
      log.error = e.message;
    }
  } else {
    log.status = 'SIMULATED';
  }

  db.state.smsLog.push(log);
  db.save();
  res.json({
    ...log,
    message: KAVENEGAR_API_KEY
      ? (log.status === 'SENT' ? `پیامک واقعی به ${recipients.length} مشتری ارسال شد 📨` : `خطای ارسال: ${log.error}`)
      : `پیامک به ${recipients.length} مشتری ارسال شد (شبیه‌سازی — برای ارسال واقعی کلید کاوه‌نگار را تنظیم کنید)`,
  });
});

router.get('/sms-log', (req, res) => res.json(db.state.smsLog.slice(-20).reverse()));

// وضعیت اتصال‌ها (برای نمایش نشان در UI)
router.get('/config', (req, res) => {
  res.json({
    gateway: ZARINPAL_MERCHANT_ID ? 'zarinpal' : 'demo',
    sms: KAVENEGAR_API_KEY ? 'kavenegar' : 'simulation',
  });
});

// ================= گزارش‌ها (پایان شیفت) =================

router.get('/report', (req, res) => {
  const today = now().slice(0, 10);
  const y = new Date(Date.now() - 86400000);
  const yesterday = y.toISOString().slice(0, 10);

  const sum = (day) => {
    const os = db.state.orders.filter((o) => o.createdAt.slice(0, 10) === day);
    const paid = os.filter((o) => o.paymentStatus === 'PAID');
    const revenue = paid.reduce((s, o) => s + (o.finalAmount ?? o.totalAmount), 0);
    return { orders: os.length, paid: paid.length, revenue, avg: paid.length ? Math.round(revenue / paid.length) : 0 };
  };

  const byStatus = {};
  ALLOWED.concat(['PENDING']).forEach((st) => { byStatus[st] = db.state.orders.filter((o) => o.status === st).length; });

  const topItems = {};
  db.state.orders.forEach((o) => o.items.forEach((it) => {
    topItems[it.name] = (topItems[it.name] || 0) + it.quantity;
  }));
  const top = Object.entries(topItems).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, qty]) => ({ name, qty }));

  const byCategory = {};
  db.state.menu.forEach((cat) => {
    let sold = 0;
    db.state.orders.forEach((o) => o.items.forEach((it) => {
      if (cat.items.find((i) => i.id === it.menuItemId)) sold += it.quantity;
    }));
    byCategory[cat.title] = sold;
  });

  const totalPointsGiven = db.state.users.reduce((s, u) => s + u.loyaltyPoints, 0);

  res.json({
    today: sum(today),
    yesterday: sum(yesterday),
    byStatus,
    topItems: top,
    byCategory,
    totalUsers: db.state.users.length,
    totalPointsGiven,
    lowStockCount: Object.values(db.state.inventory).filter((v) => v < 10).length,
  });
});

// ================= نظرسنجی‌ها =================

router.get('/surveys', (req, res) => {
  const list = db.state.orders
    .filter((o) => o.survey)
    .map((o) => ({ orderId: o.id, customerName: o.customerName, tableNumber: o.tableNumber, ...o.survey }))
    .reverse();
  const avg = list.length ? (list.reduce((s, x) => s + x.rating, 0) / list.length).toFixed(1) : '0';
  res.json({ avg: Number(avg), count: list.length, list });
});

// ================= پشتیبان‌گیری هوشمند =================

const BACKUP_DIR = path.join(__dirname, '..', '..', 'backups');

router.post('/backup', (req, res) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const ts = now().replace(/[:.]/g, '-');
    const file = `backup-${ts}.json`;
    fs.writeFileSync(path.join(BACKUP_DIR, file), JSON.stringify(db.state, null, 2));
    const meta = { file, at: now(), size: fs.statSync(path.join(BACKUP_DIR, file)).size };
    db.state.backups.push(meta);
    db.save();
    res.json({ ...meta, message: 'پشتیبان‌گیری با موفقیت انجام شد' });
  } catch (e) {
    res.status(500).json({ error: 'خطا در پشتیبان‌گیری: ' + e.message });
  }
});

router.get('/backups', (req, res) => res.json(db.state.backups.slice(-20).reverse()));

// ================= صدا زدن گارسون =================

router.get('/waiter-calls', (req, res) => {
  res.json(db.state.waiterCalls.filter((c) => !c.resolved).reverse());
});

router.post('/waiter-calls/:id/resolve', (req, res) => {
  const c = db.state.waiterCalls.find((x) => x.id === Number(req.params.id));
  if (!c) return res.status(404).json({ error: 'درخواست یافت نشد' });
  c.resolved = true;
  c.resolvedAt = now();
  db.save();
  res.json({ success: true });
});

module.exports = router;
