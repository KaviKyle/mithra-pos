import { createClient } from "@supabase/supabase-js";
import { Product, Sale, DailyClosure } from "../types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Products ───────────────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data || []).map(fromDbProduct);
}

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("barcode", barcode)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data ? fromDbProduct(data) : null;
}

export async function searchProducts(query: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .ilike("name", `%${query}%`)
    .limit(10);
  if (error) throw error;
  return (data || []).map(fromDbProduct);
}

export async function createProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert(toDbProduct(product))
    .select()
    .single();
  if (error) throw error;
  return fromDbProduct(data);
}

export async function updateStock(productId: string, newQty: number): Promise<void> {
  const { error } = await supabase
    .from("products")
    .update({ stock_qty: newQty, updated_at: new Date().toISOString() })
    .eq("id", productId);
  if (error) throw error;
}

// ─── Sales ──────────────────────────────────────────────────────────

export async function createSale(
  sale: Omit<Sale, "id" | "timestamp" | "items">,
  items: Omit<SaleItem, "id">[]
): Promise<Sale> {
  const { data: saleData, error: saleError } = await supabase
    .from("sales")
    .insert({
      total: sale.total,
      payment_method: sale.paymentMethod,
      cash_received: sale.cashReceived,
      change_amount: sale.changeAmount,
    })
    .select()
    .single();
  if (saleError) throw saleError;

  const saleItems = items.map((item) => ({
    sale_id: saleData.id,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    line_total: item.lineTotal,
  }));

  const { error: itemsError } = await supabase.from("sale_items").insert(saleItems);
  if (itemsError) throw itemsError;

  // Decrement stock for each item
  for (const item of items) {
    const { data: product } = await supabase
      .from("products")
      .select("stock_qty")
      .eq("id", item.productId)
      .single();
    if (product) {
      await supabase
        .from("products")
        .update({ stock_qty: product.stock_qty - item.quantity })
        .eq("id", item.productId);
    }
  }

  return {
    id: saleData.id,
    timestamp: saleData.created_at,
    total: saleData.total,
    paymentMethod: saleData.payment_method,
    cashReceived: saleData.cash_received,
    changeAmount: saleData.change_amount,
    items,
  };
}

// ─── Daily Closures ─────────────────────────────────────────────────

export async function getTodayClosure(): Promise<DailyClosure | null> {
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("daily_closures")
    .select("*")
    .eq("date", today)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data ? fromDbClosure(data) : null;
}

// ─── DB Mappers ─────────────────────────────────────────────────────

function fromDbProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id),
    barcode: row.barcode ? String(row.barcode) : null,
    name: String(row.name),
    category: String(row.category) as Product["category"],
    sellPrice: Number(row.sell_price),
    stockQty: Number(row.stock_qty),
    reorderLevel: Number(row.reorder_level),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toDbProduct(product: Omit<Product, "id" | "createdAt" | "updatedAt">): Record<string, unknown> {
  return {
    barcode: product.barcode,
    name: product.name,
    category: product.category,
    sell_price: product.sellPrice,
    stock_qty: product.stockQty,
    reorder_level: product.reorderLevel,
  };
}

function fromDbClosure(row: Record<string, unknown>): DailyClosure {
  return {
    id: String(row.id),
    date: String(row.date),
    totalSales: Number(row.total_sales),
    totalCash: Number(row.total_cash),
    totalLankaqr: Number(row.total_lankaqr),
    totalCard: Number(row.total_card),
    physicalCash: row.physical_cash ? Number(row.physical_cash) : undefined,
    variance: row.variance ? Number(row.variance) : undefined,
    isClosed: Boolean(row.is_closed),
    closedAt: row.closed_at ? String(row.closed_at) : undefined,
  };
}
