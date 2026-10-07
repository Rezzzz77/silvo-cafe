// ---------- داده اولیه (seed): کافه‌ها و میزها ----------
module.exports = function seedData() {
  const menu = require('./menu');
  const tables = [];
  for (let i = 1; i <= 12; i++) {
    tables.push({
      id: i,
      number: i,
      section: i <= 6 ? 'سالن اصلی' : 'تراس',
      capacity: i <= 4 ? 2 : 4,
      activeOrder: null,
    });
  }
  const inventory = {};
  menu.forEach((cat) => cat.items.forEach((it) => { inventory[it.id] = 50; }));
  return {
    seq: { user: 1, order: 1, item: 10000, table: 12, staff: 3, call: 1, sms: 1 },
    users: [],
    tokens: {},
    cafes: [
      { id: 1, name: 'کافه سیلو پلازا', address: 'مشهد، طرقبه، بلوار امام رضا، مجتمع تجاری پلازا', description: 'کافه‌ای مدرن با منظره باز دشت طرقبه', primaryColor: '#166534' },
      { id: 2, name: 'کافه لته گاردن', address: 'مشهد، بلوار وکیل‌آباد', description: 'کافه باغی دنج', primaryColor: '#7c2d12' },
      { id: 3, name: 'رستوران آسمان', address: 'مشهد، احمدآباد', description: 'رستوران پشت‌بامی با ویو شهر', primaryColor: '#1e3a8a' },
    ],
    tables,
    menu,          // منوی قابل ویرایش توسط مدیر
    inventory,     // موجودی انبار به ازای هر آیتم
    staff: [
      { id: 1, name: 'مدیر کافه', role: 'MANAGER' },
      { id: 2, name: 'صندوق‌دار', role: 'CASHIER' },
    ],
    waiterCalls: [],
    smsLog: [],
    backups: [],
    payments: [],
    orders: [],
    spins: [],
    birthdayCoupons: [],
  };
};
