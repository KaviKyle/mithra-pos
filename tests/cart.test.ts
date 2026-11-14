import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCart } from "../src/hooks/useCart";
import { Product } from "../src/types";

const mockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: "test-1",
  barcode: "9000001",
  name: "Test Product",
  category: "grocery",
  sellPrice: 100,
  stockQty: 10,
  reorderLevel: 5,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("useCart", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.items).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.canCheckout).toBe(false);
  });

  it("adds a new item", () => {
    const { result } = renderHook(() => useCart());
    const product = mockProduct();

    act(() => result.current.addItem(product));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(1);
    expect(result.current.items[0].lineTotal).toBe(100);
    expect(result.current.total).toBe(100);
    expect(result.current.itemCount).toBe(1);
    expect(result.current.canCheckout).toBe(true);
  });

  it("increments quantity when adding same product", () => {
    const { result } = renderHook(() => useCart());
    const product = mockProduct();

    act(() => result.current.addItem(product));
    act(() => result.current.addItem(product));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.items[0].lineTotal).toBe(200);
    expect(result.current.total).toBe(200);
  });

  it("caps quantity at stock limit", () => {
    const { result } = renderHook(() => useCart());
    const product = mockProduct({ stockQty: 3 });

    act(() => result.current.addItem(product));
    act(() => result.current.addItem(product));
    act(() => result.current.addItem(product));
    act(() => result.current.addItem(product));

    expect(result.current.items[0].quantity).toBe(3);
  });

  it("removes an item", () => {
    const { result } = renderHook(() => useCart());
    const product = mockProduct();

    act(() => result.current.addItem(product));
    act(() => result.current.removeItem(product.id));

    expect(result.current.items).toHaveLength(0);
    expect(result.current.canCheckout).toBe(false);
  });

  it("updates quantity", () => {
    const { result } = renderHook(() => useCart());
    const product = mockProduct();

    act(() => result.current.addItem(product));
    act(() => result.current.updateQuantity(product.id, 5));

    expect(result.current.items[0].quantity).toBe(5);
    expect(result.current.items[0].lineTotal).toBe(500);
  });

  it("removes item when quantity set to 0", () => {
    const { result } = renderHook(() => useCart());
    const product = mockProduct();

    act(() => result.current.addItem(product));
    act(() => result.current.updateQuantity(product.id, 0));

    expect(result.current.items).toHaveLength(0);
  });

  it("caps updated quantity at stock limit", () => {
    const { result } = renderHook(() => useCart());
    const product = mockProduct({ stockQty: 5 });

    act(() => result.current.addItem(product));
    act(() => result.current.updateQuantity(product.id, 100));

    expect(result.current.items[0].quantity).toBe(5);
  });

  it("calculates total for multiple items", () => {
    const { result } = renderHook(() => useCart());
    const p1 = mockProduct({ id: "p1", sellPrice: 100 });
    const p2 = mockProduct({ id: "p2", sellPrice: 250 });

    act(() => result.current.addItem(p1));
    act(() => result.current.addItem(p1));
    act(() => result.current.addItem(p2));

    expect(result.current.total).toBe(450);
    expect(result.current.itemCount).toBe(3);
  });

  it("clears cart", () => {
    const { result } = renderHook(() => useCart());
    const p1 = mockProduct({ id: "p1" });
    const p2 = mockProduct({ id: "p2" });

    act(() => result.current.addItem(p1));
    act(() => result.current.addItem(p2));
    act(() => result.current.clearCart());

    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });
});
