-- ═══════════════════════════════════════════════════════════════════════
-- Mithra POS — Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor to create all tables
-- ═══════════════════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══ PRODUCTS ══════════════════════════════════════════════════════════
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('grocery', 'hardware', 'clothing')),
  sell_price NUMERIC(12,2) NOT NULL CHECK (sell_price >= 0),
  stock_qty NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  reorder_level NUMERIC(12,2) NOT NULL DEFAULT 5 CHECK (reorder_level >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE products IS 'All sellable items in the shop';
COMMENT ON COLUMN products.barcode IS 'EAN/UPC or auto-generated 9000000+ range';
COMMENT ON COLUMN products.reorder_level IS 'Stock level that triggers reorder alert';

-- ═══ SALES (Header) ══════════════════════════════════════════════════
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  total NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'lankaqr', 'card')),
  cash_received NUMERIC(12,2),
  change_amount NUMERIC(12,2),
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sales IS 'One row per completed transaction';

-- ═══ SALE ITEMS (Lines) ══════════════════════════════════════════════
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sale_items IS 'Individual line items per sale';

-- ═══ DAILY CLOSURES ══════════════════════════════════════════════════
CREATE TABLE daily_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  total_sales NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_cash NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_lankaqr NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_card NUMERIC(12,2) NOT NULL DEFAULT 0,
  physical_cash NUMERIC(12,2),
  variance NUMERIC(12,2),
  is_closed BOOLEAN DEFAULT FALSE,
  closed_at TIMESTAMPTZ
);

COMMENT ON TABLE daily_closures IS 'End-of-day summary, one per calendar day';
COMMENT ON COLUMN daily_closures.variance IS 'physical_cash - total_cash (positive = over, negative = short)';

-- ═══ STOCK COUNTS ════════════════════════════════════════════════════
CREATE TABLE stock_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  previous_qty NUMERIC(12,2) NOT NULL,
  new_qty NUMERIC(12,2) NOT NULL,
  counted_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE stock_counts IS 'Audit trail for every stock count walk';

-- ═══ INDEXES ═════════════════════════════════════════════════════════
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_name ON products USING gin (name gin_trgm_ops);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_reorder ON products(stock_qty, reorder_level) WHERE stock_qty <= reorder_level;
CREATE INDEX idx_sales_timestamp ON sales(timestamp);
CREATE INDEX idx_sales_date ON sales(DATE(timestamp));
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_daily_closures_date ON daily_closures(date);

-- ═══ ROW LEVEL SECURITY (RLS) ════════════════════════════════════════
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_counts ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (single user shop)
CREATE POLICY "Allow all" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON sale_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON daily_closures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON stock_counts FOR ALL USING (true) WITH CHECK (true);

-- ═══ FUNCTIONS ═══════════════════════════════════════════════════════
-- Auto-update updated_at on products
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══ SAMPLE DATA (for testing) ═══════════════════════════════════════
INSERT INTO products (barcode, name, category, sell_price, stock_qty, reorder_level) VALUES
  ('9000001', 'සීනි 1kg', 'grocery', 280.00, 45, 10),
  ('9000002', 'සීනි 5kg', 'grocery', 1250.00, 20, 5),
  ('9000003', 'පරිප්පු 1kg', 'grocery', 320.00, 30, 10),
  ('9000004', 'සම්බාර් 400g', 'grocery', 180.00, 15, 5),
  ('9000005', 'තේ පැකට් 200g', 'grocery', 450.00, 25, 8),
  ('9000006', 'කිරි පැකට් 1L', 'grocery', 380.00, 40, 12),
  ('9000007', 'බටර් 200g', 'grocery', 520.00, 12, 4),
  ('9000008', 'ආප්ප හුලං 500g', 'grocery', 220.00, 18, 6),
  ('9000009', 'සෝයා සෝස් 300ml', 'grocery', 190.00, 22, 7),
  ('9000010', 'මැල්බර්ග් බල්බ් 20W', 'hardware', 350.00, 8, 3),
  ('9000011', 'ප්ලග් සොකට්', 'hardware', 120.00, 35, 10),
  ('9000012', 'වයර් 10m', 'hardware', 450.00, 6, 2),
  ('9000013', 'ටේප් මීටර්', 'hardware', 280.00, 14, 5),
  ('9000014', 'Hammer 1lb', 'hardware', 650.00, 5, 2),
  ('9000015', 'Screwdriver Set', 'hardware', 480.00, 9, 3),
  ('9000016', 'T-Shirt L', 'clothing', 850.00, 20, 5),
  ('9000017', 'T-Shirt XL', 'clothing', 850.00, 15, 5),
  ('9000018', 'Shorts M', 'clothing', 720.00, 12, 4),
  ('9000019', 'Shorts L', 'clothing', 720.00, 10, 4),
  ('9000020', 'Socks Pair', 'clothing', 180.00, 50, 15);
