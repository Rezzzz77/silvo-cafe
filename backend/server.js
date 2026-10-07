// ============================================================
//  کافه سیلو پلازا — نقطه ورود سرور
//  ساختار ماژولار: src/config, src/db, src/data, src/routes
// ============================================================
const express = require('express');
const { cors } = require('./src/middleware');
const routes = require('./src/routes');
const { PORT } = require('./src/config');
const menu = require('./src/data/menu');
const db = require('./src/db');

const app = express();
app.use(express.json());
app.use(cors);

// همه APIها زیر پیشوند /api
app.use('/api', routes);

// سلامت سرویس
app.get('/api/health', (req, res) =>
  res.json({ ok: true, orders: db.state.orders.length, users: db.state.users.length, time: new Date().toISOString() })
);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`☕ کافه سیلو پلازا — سرور روی پورت ${PORT} اجرا شد`);
  console.log(`   آدرس: http://127.0.0.1:${PORT}`);
  console.log(`   منو: ${menu.length} دسته، ${menu.reduce((s, c) => s + c.items.length, 0)} آیتم | میزها: ${db.state.tables.length}`);
});
