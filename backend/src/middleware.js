// ---------- میدل‌ورها: CORS و احراز هویت ----------
const db = require('./db');

function cors(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
}

// استخراج کاربر از هدر Authorization: Bearer <token>
function authUser(req) {
  const h = req.headers.authorization;
  if (!h) return null;
  const id = db.state.tokens[h.replace('Bearer ', '')];
  return id ? db.state.users.find((u) => u.id === id) : null;
}

module.exports = { cors, authUser };
