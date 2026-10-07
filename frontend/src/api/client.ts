// ---------- کلاینت HTTP (fetch + توکن) ----------
// نکته: از 127.0.0.1 استفاده می‌کنیم چون DNS بعضی VPNها حتی localhost را خراب می‌کند
export const BASE_URL = 'http://127.0.0.1:4000';

let authToken: string | null = null;
export const setToken = (t: string | null) => { authToken = t; };
export const getToken = () => authToken;

async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'خطای سرور');
  return data;
}

export const http = {
  get: (path: string) => request(path),
  post: (path: string, body?: any) => request(path, { method: 'POST', body: JSON.stringify(body || {}) }),
  put: (path: string, body?: any) => request(path, { method: 'PUT', body: JSON.stringify(body || {}) }),
  delete: (path: string) => request(path, { method: 'DELETE' }),
};
