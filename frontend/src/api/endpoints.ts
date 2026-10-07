// ---------- توابع API دامنه‌محور (تایپ‌شده) ----------
import { http } from './client';

// --- احراز هویت ---
export const login = (name: string, phone: string, birthdate?: string) =>
  http.post('/api/auth/login', { name, phone, birthdate });

// --- کافه‌ها و منو ---
export const getCafes = () => http.get('/api/cafes');
export const getCafeMenu = (cafeId: number) => http.get(`/api/cafes/${cafeId}`);
export const getTables = (cafeId = 1) => http.get(`/api/cafes/${cafeId}/tables`);

// --- سفارش‌ها و پرداخت ---
export const createOrder = (payload: {
  cafeId: number; tableId?: number;
  items: { menuItemId: number; quantity: number }[];
  note?: string; orderType?: 'TABLE' | 'TAKEAWAY'; address?: string;
}) => http.post('/api/orders', payload);

export const payOrder = (orderId: number, usePoints: boolean, method: 'ONLINE' | 'CARD' = 'ONLINE') =>
  http.post(`/api/orders/${orderId}/pay`, { usePoints, method });

export const payOrderWithCard = (orderId: number) => http.post(`/api/orders/${orderId}/pay-card`);

export const submitSurvey = (orderId: number, rating: number, comment: string) =>
  http.post(`/api/orders/${orderId}/survey`, { rating, comment });

export const getOrder = (orderId: number) => http.get(`/api/orders/${orderId}`);

// --- پنل مدیریت ---
export const adminGetTables = () => http.get('/api/admin/tables');
export const adminGetStats = () => http.get('/api/admin/stats');
export const adminSetOrderStatus = (orderId: number, status: string) =>
  http.post(`/api/admin/orders/${orderId}/status`, { status });

export const adminManualOrder = (payload: any) => http.post('/api/admin/orders', payload);

export const adminAddTable = (section: string, capacity: number) =>
  http.post('/api/admin/tables', { section, capacity });
export const adminDeleteTable = (tableId: number) =>
  http.delete(`/api/admin/tables/${tableId}`);

export const adminAddMenuItem = (payload: { categoryId: number; name: string; price: number; desc?: string }) =>
  http.post('/api/admin/menu/items', payload);
export const adminUpdateMenuItem = (itemId: number, patch: any) =>
  http.put(`/api/admin/menu/items/${itemId}`, patch);
export const adminDeleteMenuItem = (itemId: number) =>
  http.delete(`/api/admin/menu/items/${itemId}`);
export const adminAddCategory = (title: string) =>
  http.post('/api/admin/menu/categories', { title });

export const adminGetInventory = () => http.get('/api/admin/inventory');
export const adminSetStock = (itemId: number, stock: number) =>
  http.post(`/api/admin/inventory/${itemId}`, { stock });

export const adminGetStaff = () => http.get('/api/admin/staff');
export const adminAddStaff = (name: string, role: string) =>
  http.post('/api/admin/staff', { name, role });
export const adminDeleteStaff = (staffId: number) =>
  http.delete(`/api/admin/staff/${staffId}`);

export const adminGetCustomers = () => http.get('/api/admin/customers');
export const adminSendSms = (message: string, target: string) =>
  http.post('/api/admin/sms', { message, target });
export const adminGetSmsLog = () => http.get('/api/admin/sms-log');

export const adminGetReport = () => http.get('/api/admin/report');
export const adminGetSurveys = () => http.get('/api/admin/surveys');

export const adminBackup = () => http.post('/api/admin/backup');
export const adminGetBackups = () => http.get('/api/admin/backups');

export const adminGetWaiterCalls = () => http.get('/api/admin/waiter-calls');
export const adminResolveWaiterCall = (callId: number) =>
  http.post(`/api/admin/waiter-calls/${callId}/resolve`);

export const adminGetConfig = () => http.get('/api/admin/config');

export const callWaiter = (tableId: number) => http.post('/api/waiter/call', { tableId });

// --- درگاه پرداخت ---
export const paymentRequest = (orderId: number) => http.post('/api/payment/request', { orderId });
export const paymentVerify = (orderId: number, authority: string) =>
  http.post('/api/payment/verify', { orderId, authority });

// --- KDS آشپزخانه ---
export const kitchenGetQueue = () => http.get('/api/kitchen/queue');
export const kitchenSetStatus = (orderId: number, status: 'PREPARING' | 'SERVED') =>
  http.post(`/api/kitchen/orders/${orderId}/status`, { status });

// --- پلن‌ها و تعرفه‌ها ---
export const getPlans = () => http.get('/api/plans');

// --- وفاداری ---
export const spinWheel = (userId: number) => http.post('/api/spin', { userId });
export const getProfile = (userId: number) => http.get(`/api/profile/${userId}`);
export const updateProfile = (userId: number, patch: { name?: string; birthdate?: string | null }) =>
  http.post(`/api/profile/${userId}`, patch);
export const getTiers = () => http.get('/api/loyalty/tiers');
