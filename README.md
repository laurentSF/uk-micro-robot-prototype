# UK micro-business robot — clickable HTML prototype

Demo brand: **River Lane Coffee**, Shoreditch, London.

Self-contained front-end prototype of a no-code merchant console, guest WhatsApp ordering, and a light Owner-like mini-site — with a shared menu of record and virtual loyalty stamp card (9 → 1 free coffee).

## How to open

1. Open **`index.html`** in a browser (no server required), or use GitHub Pages if enabled on this repo.
2. Surfaces:
   - `merchant.html` — merchant console
   - `guest-whatsapp.html` — phone-frame WhatsApp mock
   - `guest-site.html` — guest mini-site

State is shared via **`localStorage`** key `rlc_proto_v1` in the same browser origin. Use **Reset demo data** on the landing page to clear orders, stamps, and queue decisions.

**Suggested loop:** place an order in Guest WhatsApp → open Merchant → Live orders → Mark ready → check Loyalty members for stamps.

## Files

| File | Role |
|------|------|
| `index.html` | Landing / portal picker |
| `merchant.html` | No-code console |
| `guest-whatsapp.html` | WhatsApp chat mock (phone frame) |
| `guest-site.html` | Owner-like mini-site |
| `styles.css` | Shared styles (system fonts, no CDN) |
| `app.js` | Shared menu, orders, loyalty, agents |

## What’s mocked vs real

**Mocked:** WhatsApp Business API/Catalog, card payments & pay links (pay-at-pickup only), POS feed, FreeAgent/Xero, Google Business Profile posts, agent LLM drafts, PECR consent, kitchen tickets.

**Real here:** clickable multi-page HTML/CSS/JS; shared editable menu; guest order → merchant inbox → loyalty stamps; agent toggles and approve/reject queue (persisted locally).

## Product notes

- Customer: UK coffee shop / indie restaurant that **already has card payments** — do not replace the terminal.
- Agents: Sales, Insights, Accountant, Marketing, Orders, Loyalty.
- Guests order via WhatsApp-style catalog or light web site; no mandatory consumer app.
- Loyalty: virtual stamp card (WhatsApp first; Wallet later).

## Not in scope

Live integrations, real auth, multi-tenant SaaS, or production design system.
