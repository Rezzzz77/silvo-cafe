// ---------- توابع کمکی مشترک ----------
const crypto = require('crypto');

const genToken = () => crypto.randomBytes(24).toString('hex');
const now = () => new Date().toISOString();

const findItem = (id) => {
  const db = require('./db'); // lazy برای جلوگیری از circular import
  const menu = db.state.menu || require('./data/menu');
  for (const cat of menu) {
    const it = cat.items.find((i) => i.id === id);
    if (it) return it;
  }
  return null;
};

const publicUser = (u) => ({
  id: u.id, name: u.name, phone: u.phone,
  birthdate: u.birthdate, loyaltyPoints: u.loyaltyPoints, tier: u.tier,
});

const fmt = (n) => Number(n || 0).toLocaleString('fa-IR');

module.exports = { genToken, now, findItem, publicUser, fmt };
