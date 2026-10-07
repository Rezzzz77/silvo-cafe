// ---------- لایه ذخیره‌سازی: JSON فایل (بدون دیتابیس خارجی) ----------
const fs = require('fs');
const { DATA_FILE } = require('./config');
const seedData = require('./data/seed');

let db;

// مهاجرت فایل‌های قدیمی: فیلدهای جدید را اضافه کن
function migrate(d) {
  if (!d.seq.item) d.seq.item = 10000;
  if (!d.seq.table) d.seq.table = d.tables ? d.tables.length : 12;
  if (!d.seq.staff) d.seq.staff = (d.staff || []).length + 1;
  if (!d.seq.call) d.seq.call = 1;
  if (!d.seq.sms) d.seq.sms = 1;
  if (!d.menu) d.menu = require('./data/menu');
  if (!d.inventory) {
    d.inventory = {};
    d.menu.forEach((cat) => cat.items.forEach((it) => { if (d.inventory[it.id] === undefined) d.inventory[it.id] = 50; }));
  }
  if (!d.staff) d.staff = [{ id: 1, name: 'مدیر کافه', role: 'MANAGER' }, { id: 2, name: 'صندوق‌دار', role: 'CASHIER' }];
  if (!d.waiterCalls) d.waiterCalls = [];
  if (!d.smsLog) d.smsLog = [];
  if (!d.backups) d.backups = [];
  if (!d.payments) d.payments = []; // تراکنش‌های درگاه پرداخت
  return d;
}

function load() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      db = migrate(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
      save();
      return;
    } catch (e) { /* فایل خراب → seed مجدد */ }
  }
  db = seedData();
  save();
}

function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

load();

module.exports = {
  // دسترسی مستقیم به state (تغییرات درجا انجام می‌شود)
  get state() { return db; },
  save,
};
