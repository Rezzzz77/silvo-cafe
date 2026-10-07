// ---------- پیکربندی سرور ----------
const path = require('path');

module.exports = {
  PORT: process.env.PORT || 4000,
  DATA_FILE: path.join(__dirname, '..', 'data.json'),
  // درگاه زرین‌پال — اگر خالی باشد، درگاه دمو (داخل خود سرور) فعال می‌شود
  ZARINPAL_MERCHANT_ID: process.env.ZARINPAL_MERCHANT_ID || '',
  // پیامک کاوه‌نگار — اگر خالی باشد، شبیه‌سازی فعال می‌شود
  KAVENEGAR_API_KEY: process.env.KAVENEGAR_API_KEY || '',
  KAVENEGAR_SENDER: process.env.KAVENEGAR_SENDER || '10004346',
};
