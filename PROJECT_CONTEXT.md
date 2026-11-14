# Mithra POS — Project Context
# Paste this at the TOP of every Kimi Web Chat prompt when building this project.
# Then run: python kimi_bridge.py pack . and paste the file contents below this.

═══════════════════════════════════════════════════════════════════════════════
PROJECT OVERVIEW
═══════════════════════════════════════════════════════════════════════════════

Mithra (මිත්‍ර, meaning "a friend") is a POS system for a single-branch grocery/
hardware/clothing shop in Sri Lanka. The shop has operated for 40 years with only
cash and paper ledgers. Dad is the only operator. The system must be:

- Offline-capable but online-first (shop has internet)
- Minimal UI — big buttons, Sinhala labels, no clutter
- Static LankaQR sticker payment (customer scans, enters amount, pays)
- One daily notification digest only (no real-time alerts)
- No email — push notifications or SMS only
- Keyboard shortcuts for everything (F1-F6)

═══════════════════════════════════════════════════════════════════════════════
TECH STACK
═══════════════════════════════════════════════════════════════════════════════

Frontend:     React 18 + Vite + TypeScript + Tailwind CSS
Backend:      Supabase (PostgreSQL + auto-REST API + Auth)
Offline:      Service Worker + IndexedDB (Dexie.js) — queue sales, sync when online
Desktop:      Chrome fullscreen (F11) or Tauri wrapper
Mobile:       PWA (Progressive Web App) — add to home screen
Notifications: Firebase Cloud Messaging (free, unlimited)
Hosting:      Vercel (free tier, auto-deploy from GitHub)
Testing:      Vitest + React Testing Library
Validation:   Zod for form/input validation

═══════════════════════════════════════════════════════════════════════════════
FOLDER STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

mithra-pos/
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Screen router (home, sell, stock, dayClose, etc.)
│   ├── types/
│   │   └── index.ts          # Product, CartItem, Sale, SaleItem, DailyClosure, Screen
│   ├── lib/
│   │   └── supabase.ts       # Supabase client + CRUD helpers
│   ├── hooks/
│   │   └── useCart.ts        # Core cart state logic (add, remove, update qty, clear)
│   ├── components/
│   │   ├── HomeScreen.tsx    # 3 big buttons + reorder banner + shortcuts legend
│   │   ├── SellScreen.tsx    # Barcode input, cart table, 3 payment buttons, cash modal
│   │   └── BarcodeInput.tsx  # Auto-focused input, barcode lookup, name search dropdown
│   └── styles/
│       └── index.css         # Tailwind + custom button styles + print styles
├── tests/
│   └── cart.test.ts          # Vitest tests for useCart hook
├── supabase/
│   └── schema.sql            # Full PostgreSQL schema + indexes + RLS + sample data
├── public/                   # PWA icons, manifest assets
├── package.json
├── vite.config.ts            # Vite + PWA plugin config
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── .env.example              # Supabase URL + anon key

═══════════════════════════════════════════════════════════════════════════════
DATABASE SCHEMA (Supabase PostgreSQL)
═══════════════════════════════════════════════════════════════════════════════

Tables:
  products        — id, barcode, name, category, sell_price, stock_qty, reorder_level
  sales           — id, timestamp, total, payment_method, cash_received, change_amount
  sale_items      — id, sale_id, product_id, quantity, unit_price, line_total
  daily_closures  — id, date, total_sales, total_cash, total_lankaqr, total_card, physical_cash, variance
  stock_counts    — id, product_id, previous_qty, new_qty, counted_at

RLS: All tables have "Allow all" policy (single user shop).
Indexes: barcode, name (trigram), category, reorder alert composite, sale timestamps.

═══════════════════════════════════════════════════════════════════════════════
DESIGN SYSTEM RULES (MUST FOLLOW)
═══════════════════════════════════════════════════════════════════════════════

Typography:
  - Base: 16px minimum
  - Headings: 20-28px, weight 500
  - Big numbers (prices): tabular-nums
  - Sinhala sub-labels: 12px, muted gray

Colors:
  - Black (#1a1a1a) = primary buttons, totals
  - Gray = borders, secondary text
  - Red (#dc2626) = low stock, mismatch
  - Green (#16a34a) = match, healthy
  - Yellow (#f59e0b) = reorder banner
  - Blue (#0055a4) = LankaQR only

Spacing:
  - Button height: min 56px (payment buttons min 64px)
  - Input height: 48px
  - Card padding: 12-16px
  - 4px grid system

Interaction:
  - Keyboard shortcuts ALWAYS shown (F1-F6)
  - Active input has visible focus ring (black)
  - Buttons have :active scale(0.98)
  - NO hover states (touch + mouse hybrid shop)

Offline:
  - Yellow banner: "Will sync when online."
  - Green on sync. Silent — dad never acts.

Language:
  - Sinhala PRIMARY, English secondary
  - Every button has Sinhala sub-label
  - All user-facing text in Sinhala

═══════════════════════════════════════════════════════════════════════════════
KEYBOARD SHORTCUTS
═══════════════════════════════════════════════════════════════════════════════

F1  → New Sale (Sell screen)
F2  → Check Stock
F3  → Cash payment (inside Sell screen)
F4  → LankaQR payment (inside Sell screen)
F5  → Card payment (inside Sell screen)
F6  → Day Close
Esc → Back to Home

═══════════════════════════════════════════════════════════════════════════════
PAYMENT METHODS
═══════════════════════════════════════════════════════════════════════════════

Cash:
  - Tap Cash button → show cash received input modal
  - Calculate balance automatically
  - Record cash_received and change_amount
  - Trigger receipt print (future)

LankaQR:
  - Static sticker on counter (printed by bank, free)
  - Customer scans, enters amount, pays
  - Dad gets SMS confirmation
  - Dad taps "Confirm" in POS → records sale
  - Zero merchant fees for ≤LKR 5,000

Card:
  - Bank mPOS device (separate hardware: HNB Solo, BOC SmartPay)
  - Dad taps "Card" in POS → records amount
  - Swipes on mPOS device → mPOS prints mini receipt
  - POS prints full receipt (future)
  - ~2.5% fee + device rental

═══════════════════════════════════════════════════════════════════════════════
BARCODE STRATEGY
═══════════════════════════════════════════════════════════════════════════════

- Existing barcodes: Scan and use directly (EAN/UPC)
- No barcode: Auto-generate 9000000+ range, print sticker, stick on shelf
- Custom range 9000000-9999999 reserved for internal use (no EAN conflict)
- After launch: Everything scannable. Sell = scan or type 2-3 letters.

═══════════════════════════════════════════════════════════════════════════════
MODULE BUILD STATUS
═══════════════════════════════════════════════════════════════════════════════

[✅ DONE] Day 1 — Foundation & Sell Screen
  - Project scaffold (Vite + React + TS + Tailwind)
  - Supabase client + DB mappers
  - useCart hook with full test coverage
  - BarcodeInput component (scan + search)
  - SellScreen (cart table, qty controls, 3 payment buttons, cash modal)
  - HomeScreen (3 buttons, reorder banner, shortcuts)
  - App router with keyboard shortcuts
  - Database schema + sample data

[⏳ PENDING] Day 2 — Stock Screens
  - Stock list screen (search, low stock highlight)
  - Stock Count walk mode (scan → see "Was: X" → type new count)
  - Add Product screen (6 fields, barcode auto-generate)

[⏳ PENDING] Day 3 — Day Close
  - Auto-generated totals by payment method
  - Physical cash count input
  - Variance display (green = match, red = mismatch)
  - Reorder list auto-generation
  - Close & Print Summary button
  - Time lock (after 6 PM or password override)

[⏳ PENDING] Day 4 — Offline Mode
  - Service Worker + IndexedDB (Dexie.js)
  - Queue offline sales
  - Auto-sync when online
  - Conflict resolution

[⏳ PENDING] Day 5 — Mobile PWA & Notifications
  - Responsive layout
  - PWA manifest + installability
  - Firebase Cloud Messaging
  - Daily digest Edge Function (8 PM)

[⏳ PENDING] Day 6 — Production Hardening
  - Error boundaries
  - Loading states + Zod validation
  - Sentry logging
  - Environment configs

[⏳ PENDING] Day 7 — CI/CD & Deploy
  - GitHub Actions
  - Vercel deploy
  - End-to-end tests
  - Lighthouse audit

═══════════════════════════════════════════════════════════════════════════════
CODING STANDARDS
═══════════════════════════════════════════════════════════════════════════════

1. TypeScript strict mode — no `any` unless absolutely necessary
2. All Supabase DB calls in lib/supabase.ts (no inline queries in components)
3. All monetary values as `number` (LKR whole numbers, no cents needed)
4. Error handling: toast notifications for user, console.error for dev
5. Loading states on all async operations
6. Keyboard shortcuts on all screens
7. Sinhala primary language on all UI text
8. Responsive: works on 1080p desktop AND mobile PWA
9. No external UI libraries — Tailwind only
10. Vitest tests for all hooks and pure functions

═══════════════════════════════════════════════════════════════════════════════
HOW TO OUTPUT CODE (CRITICAL — KIMI MUST FOLLOW)
═══════════════════════════════════════════════════════════════════════════════

When modifying or creating files, use this EXACT format:

### FILE: src/components/NewScreen.tsx
```tsx
// full file content here
// do NOT use "..." or "// rest of file" — include everything
```

### FILE: src/hooks/useNewHook.ts
```ts
// full file content here
```

If a file is UNCHANGED, do NOT include it.
Only output files that were created or modified.
Always include the complete file — no partials, no placeholders.

═══════════════════════════════════════════════════════════════════════════════
ENVIRONMENT SETUP (for local dev)
═══════════════════════════════════════════════════════════════════════════════

1. npm install
2. Copy .env.example → .env.local, fill in Supabase credentials
3. Run supabase/schema.sql in Supabase SQL Editor
4. npm run dev
5. npm run test (runs Vitest)

═══════════════════════════════════════════════════════════════════════════════
