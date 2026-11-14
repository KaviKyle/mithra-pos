/**
 * Core type definitions for Mithra POS
 * All monetary values stored as number (LKR cents would be overkill for this shop)
 */

export interface Product {
  id: string;
  barcode: string | null;
  name: string;
  category: "grocery" | "hardware" | "clothing";
  sellPrice: number;
  stockQty: number;
  reorderLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  lineTotal: number;
}

export type PaymentMethod = "cash" | "lankaqr" | "card";

export interface Sale {
  id: string;
  timestamp: string;
  total: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  changeAmount?: number;
  items: SaleItem[];
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface DailyClosure {
  id: string;
  date: string;
  totalSales: number;
  totalCash: number;
  totalLankaqr: number;
  totalCard: number;
  physicalCash?: number;
  variance?: number;
  isClosed: boolean;
  closedAt?: string;
}

export type Screen = "home" | "sell" | "stock" | "stockCount" | "addProduct" | "dayClose";
