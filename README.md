# මිත්‍ර POS (Mithra POS)

POS system for a single-branch grocery/hardware/clothing shop in Sri Lanka.
Built for dad — big buttons, Sinhala labels, offline-capable.

## Quick Start

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

## Supabase Setup

1. Create project at [supabase.com](https://supabase.com) (Singapore region)
2. Go to SQL Editor → New Query
3. Paste contents of `supabase/schema.sql`
4. Run query
5. Copy Project URL and Anon Key from Settings → API → Project API keys
6. Paste into `.env.local`

## Testing

```bash
npm run test        # Run Vitest
npm run test:ui     # Vitest with UI
```

## Build for Production

```bash
npm run build
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| F1 | New Sale |
| F2 | Check Stock |
| F3 | Cash Payment |
| F4 | LankaQR Payment |
| F5 | Card Payment |
| F6 | Day Close |
| Esc | Back to Home |

## Project Structure

See `PROJECT_CONTEXT.md` for full architecture, design system, and module status.
