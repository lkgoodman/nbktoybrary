"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { useAuth } from "./AuthContext";

const MAX_CART_SIZE = 3;

interface CartContextValue {
  cartIds: string[];
  addToCart: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  countInCart: (id: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const { user } = useAuth();
  const [cartIds, setCartIds] = useState<string[]>([]);

  const storageKey = user !== null ? `nbktoybrary_cart_${user.id}` : null;

  // Reload cart from localStorage whenever the logged-in user changes
  useEffect(() => {
    if (storageKey === null) {
      setCartIds([]);
      return;
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        const parsed: unknown = JSON.parse(stored);
        setCartIds(Array.isArray(parsed) ? (parsed as string[]) : []);
      } else {
        setCartIds([]);
      }
    } catch {
      setCartIds([]);
    }
  }, [storageKey]);

  const addToCart = useCallback((id: string): void => {
    setCartIds((prev) => {
      if (prev.length >= MAX_CART_SIZE) return prev;
      const next = [...prev, id];
      if (storageKey !== null) localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const removeFromCart = useCallback((id: string): void => {
    setCartIds((prev) => {
      const lastIndex = prev.lastIndexOf(id);
      if (lastIndex === -1) return prev;
      const next = [...prev.slice(0, lastIndex), ...prev.slice(lastIndex + 1)];
      if (storageKey !== null) localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  const clearCart = useCallback((): void => {
    if (storageKey !== null) localStorage.setItem(storageKey, JSON.stringify([]));
    setCartIds([]);
  }, [storageKey]);

  const isInCart = useCallback((id: string): boolean => cartIds.includes(id), [cartIds]);
  const countInCart = useCallback((id: string): number => cartIds.filter((x) => x === id).length, [cartIds]);

  return (
    <CartContext.Provider value={{ cartIds, addToCart, removeFromCart, clearCart, isInCart, countInCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (ctx === null) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
