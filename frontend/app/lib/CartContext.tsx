"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "nbktoybrary_cart";
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
  const [cartIds, setCartIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCartIds(parsed as string[]);
        }
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  function persist(ids: string[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    setCartIds(ids);
  }

  const addToCart = useCallback((id: string): void => {
    setCartIds((prev) => {
      if (prev.length >= MAX_CART_SIZE) return prev;
      const next = [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromCart = useCallback((id: string): void => {
    setCartIds((prev) => {
      const lastIndex = prev.lastIndexOf(id);
      if (lastIndex === -1) return prev;
      const next = [...prev.slice(0, lastIndex), ...prev.slice(lastIndex + 1)];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearCart = useCallback((): void => {
    persist([]);
  }, []);

  const isInCart = useCallback((id: string): boolean => {
    return cartIds.includes(id);
  }, [cartIds]);

  const countInCart = useCallback((id: string): number => {
    return cartIds.filter((x) => x === id).length;
  }, [cartIds]);

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
