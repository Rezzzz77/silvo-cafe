// ---------- سرویس سفارش‌ها: خلاصه، ساخت و وضعیت ----------
const db = require('../db');
const { now, findItem } = require('../utils');

function orderSummary(id) {
  const o = db.state.orders.find((x) => x.id === id);
  if (!o) return null;
  return {
    id: o.id,
    tableNumber: o.tableNumber,
    customerName: o.customerName,
    totalAmount: o.totalAmount,
    status: o.status,
    paymentStatus: o.paymentStatus,
    itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
    createdAt: o.createdAt,
  };
}

// ساخت سفارش (مشترک بین سفارش مشتری و ثبت دستی پرسنل)
// ورودی: { cafeId, tableId?, items, note?, orderType?, customer?, userId? }
// خروجی: { order } یا { error }
function createOrder(input) {
  const { cafeId, tableId, items, note, orderType = 'TABLE', customer, userId } = input;
  const isTakeaway = orderType === 'TAKEAWAY';

  if (!Array.isArray(items) || items.length === 0) return { error: 'سبد خرید خالی است' };

  let table = null;
  if (!isTakeaway) {
    table = db.state.tables.find((t) => t.id === Number(tableId));
    if (!table) return { error: 'میز نامعتبر است' };
    if (table.activeOrder) return { error: `میز ${table.number} سفارش فعال دارد` };
  }

  // بررسی موجودی انبار و کسر خودکار
  const orderItems = [];
  for (const it of items) {
    const menuItem = findItem(it.menuItemId);
    if (!menuItem) continue;
    const qty = it.quantity || 1;
    const stock = db.state.inventory[menuItem.id];
    if (stock !== undefined && stock < qty) {
      return { error: `موجودی «${menuItem.name}» کافی نیست (موجود: ${stock})` };
    }
    if (stock !== undefined) db.state.inventory[menuItem.id] = stock - qty;
    orderItems.push({ menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: qty });
  }
  if (orderItems.length === 0) return { error: 'آیتم‌های سفارش نامعتبر هستند' };

  const totalAmount = orderItems.reduce((s, it) => s + it.price * it.quantity, 0);
  const order = {
    id: db.state.seq.order++,
    cafeId: Number(cafeId) || 1,
    orderType: isTakeaway ? 'TAKEAWAY' : 'TABLE',
    tableId: table ? table.id : null,
    tableNumber: table ? table.number : null,
    userId: userId || null,
    customerName: (customer && customer.name) || (userId ? undefined : 'مهمان'),
    customerPhone: customer ? customer.phone : null,
    address: customer ? customer.address : null,
    items: orderItems,
    totalAmount,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    paymentMethod: null,
    note: note || '',
    prints: null,
    survey: null,
    createdAt: now(),
    statusHistory: [{ status: 'PENDING', at: now() }],
  };
  if (!order.customerName) {
    const u = db.state.users.find((x) => x.id === userId);
    order.customerName = u ? u.name : 'مهمان';
    order.customerPhone = u ? u.phone : null;
  }
  db.state.orders.push(order);
  if (table) table.activeOrder = order.id;
  db.save();
  return { order };
}

// اعمال تخفیف تولد/امتیاز و پرداخت
function applyPayment(order, usePoints) {
  let discount = 0;
  const pointsEarned = Math.floor(order.totalAmount / 10000);

  if (usePoints && order.userId) {
    const u = db.state.users.find((x) => x.id === order.userId);
    if (u && u.loyaltyPoints > 0) {
      const maxUse = Math.min(u.loyaltyPoints, Math.floor(order.totalAmount / 100) * 2);
      discount = Math.min(maxUse * 100, order.totalAmount * 0.3);
      const usedPoints = Math.floor(discount / 100);
      u.loyaltyPoints -= usedPoints;
      order.pointsUsed = usedPoints;
    }
  }

  let birthdayApplied = false;
  if (order.userId) {
    const u = db.state.users.find((x) => x.id === order.userId);
    if (u && u.birthdate) {
      const today = new Date();
      const b = new Date(u.birthdate);
      if (b.getMonth() === today.getMonth() && b.getDate() === today.getDate()) {
        const bd = Math.floor(order.totalAmount * 0.2);
        if (bd > discount) { discount = bd; birthdayApplied = true; }
      }
    }
  }

  order.paymentStatus = 'PAID';
  order.paidAt = now();
  order.discount = discount;
  order.finalAmount = order.totalAmount - discount;
  order.birthdayApplied = birthdayApplied;

  if (order.userId) {
    const u = db.state.users.find((x) => x.id === order.userId);
    if (u) {
      u.loyaltyPoints += pointsEarned;
      u.tier =
        u.loyaltyPoints >= 5000 ? 'Platinum' :
        u.loyaltyPoints >= 2000 ? 'Gold' :
        u.loyaltyPoints >= 500 ? 'Silver' : 'Bronze';
    }
  }
  db.save();
  return {
    success: true,
    order,
    pointsEarned,
    birthdayApplied,
    message: birthdayApplied ? '🎂 تخفیف تولد ۲۰٪ برای شما اعمال شد!' : 'پرداخت با موفقیت انجام شد',
  };
}

module.exports = { orderSummary, createOrder, applyPayment };
