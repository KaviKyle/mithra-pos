import { useState, useCallback } from "react";
import { Product, CartItem, PaymentMethod } from "../types";

export interface UseCartReturn {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  canCheckout: boolean;
}

/**
 * Core cart logic for Mithra POS.
 * All monetary calculations use simple number arithmetic.
 * No floating point tricks needed — LKR prices are whole numbers.
 */
export function useCart(): UseCartReturn {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        // Increment quantity, cap at available stock
        const newQty = Math.min(existing.quantity + 1, product.stockQty);
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQty, lineTotal: newQty * product.sellPrice }
            : item
        );
      }
      // New item — add with qty 1
      return [
        ...prev,
        {
          product,
          quantity: 1,
          lineTotal: product.sellPrice,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const safeQty = Math.min(quantity, item.product.stockQty);
        return {
          ...item,
          quantity: safeQty,
          lineTotal: safeQty * item.product.sellPrice,
        };
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const canCheckout = items.length > 0;

  return {
    items,
    total,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    canCheckout,
  };
}
