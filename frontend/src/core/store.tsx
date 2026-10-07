import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { setToken } from '../api/client';
import { login as apiLogin } from '../api/endpoints';

export type User = {
  id: number; name: string; phone: string; birthdate: string | null;
  loyaltyPoints: number; tier: string;
};

export type CartItem = { menuItemId: number; name: string; price: number; quantity: number };

type Table = { id: number; number: number; section: string; capacity: number };

type AppState = {
  user: User | null;
  table: Table | null;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (menuItemId: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  login: (name: string, phone: string, birthdate?: string) => Promise<void>;
  logout: () => void;
  setTable: (t: Table | null) => void;
  updateUser: (patch: Partial<User>) => void;
};

const Ctx = createContext<AppState>(null as any);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [table, setTableState] = useState<Table | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.menuItemId === item.menuItemId);
      if (ex) return prev.map((i) => (i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i));
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((menuItemId: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const login = useCallback(async (name: string, phone: string, birthdate?: string) => {
    const res = await apiLogin(name, phone, birthdate);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setTableState(null);
    clearCart();
  }, [clearCart]);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const value: AppState = {
    user, table, cart,
    addToCart, removeFromCart, clearCart,
    cartTotal, cartCount,
    login, logout,
    setTable: setTableState,
    updateUser,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
