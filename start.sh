#!/bin/bash
# راه‌اندازی کامل پروژه کافه سیلو پلازا
cd "$(dirname "$0")"

echo "☕ راه‌اندازی بک‌اند (پورت 4000)..."
cd backend
if ! pgrep -f "node server.js" > /dev/null; then
  nohup node server.js > server.log 2>&1 &
  echo "   بک‌اند اجرا شد (PID $!)"
else
  echo "   بک‌اند از قبل در حال اجراست"
fi

cd ../frontend
echo "📱 راه‌اندازی Expo (پورت 8081)..."
echo "   در گوشی: اپ Expo Go را باز کنید و exp://localhost:8081 را بزنید"
npx expo start --port 8081
