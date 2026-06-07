# LongformShorts AI Landing Page - Design Spec

**Date:** 2026-06-07
**Status:** Approved
**Stack:** Next.js 16, React 19, Tailwind v4, shadCN (base-vega style), next-themes, lucide-react

## Goal

A single-page, dark-only landing page for LongformShorts AI - an AI tool that turns long videos
into short-form clips. The page must avoid generic AI aesthetics (no purple gradients,
glassmorphism, glowing orbs) and instead use an editorial/cinematic identity.

## Visual Identity

Anti-generic-AI is the core constraint. The aesthetic is "video studio / A24", not "techy SaaS".

- **Background:** near-black `oklch(0.13 0.004 280)` (~`#0B0B0D`). Layered surfaces use a
  lighter `card` at `oklch(0.17 0.004 280)`. Never pure `#000`.
- **Primary accent:** warm signal amber `oklch(0.78 0.16 65)`. Used sparingly — primary CTAs
  and a single "live" highlight only.
- **Secondary emphasis:** muted red `oklch(0.62 0.18 25)` for rare emphasis.
- **Foreground:** `oklch(0.97 0 0)` text; muted `oklch(0.70 0 0)`.
- **Borders:** hairline `oklch(1 0 0 / 8%)`.
- **Type:**
  - Body/headings: Inter (already loaded as `--font-sans`).
  - Eyebrow labels, timecodes: Geist Mono (`--font-geist-mono`) — leans into the editing motif.
  - Editorial scale: very large hero heading with tight tracking, small mono labels for contrast.
- **Texture:** subtle film-grain/noise overlay; hairline borders. No gradients-as-decoration,
  no glassmorphism.
- **Motif:** "timeline / clip" language — timecodes (`00:00 / 47:12`), a long-bar-splitting-into
  -short-cards visual in the hero.

## Sections (single-page scroll)

1. **Header** — sticky; transparent → solid background on scroll. Wordmark logo, nav
   (Features / Pricing / FAQ), `Sign in` ghost button + `Start free` amber button.
   Mobile: shadCN `Sheet` drawer.
2. **Hero** — mono eyebrow label, huge editorial headline ("Turn one long video into a month of
   shorts"), subcopy, two CTAs (`Start free` primary, `Watch demo` ghost), and a clip-slicing
   visual: a long timeline bar splitting into 3–4 vertical short cards with timecodes.
   Trust strip ("Trusted by N creators") below.
3. **Features** — asymmetric bento grid. Cards: AI moment detection, auto-captions, aspect
   reframing (16:9 → 9:16), one-click multi-platform export. Each with a mono label + lucide icon.
4. **How it works** — 3 numbered steps (Upload → AI finds clips → Export), timeline-styled.
5. **Pricing** — 2 cards (Free vs Pro) with a monthly/annual toggle (`Switch`). Pro highlighted
   with amber border + "Most popular" badge. Free: $0. Pro: ~$19/mo (annual discount shown).
6. **FAQ** — shadCN `Accordion`, ~5 questions.
7. **Footer** — wordmark, columns (Product / Company / Legal), copyright, social icons.

## Technical Approach

- **Theme:** rewrite `app/globals.css` `:root` and `.dark` token blocks with the palette above.
  Configure `next-themes` `ThemeProvider` with `defaultTheme="dark"`, `forcedTheme="dark"`
  (dark-only product — no toggle). Wrap `app/layout.tsx` body.
- **File structure:** one component per section in `components/landing/`:
  - `site-header.tsx`, `hero.tsx`, `features.tsx`, `how-it-works.tsx`, `pricing.tsx`,
    `faq.tsx`, `site-footer.tsx`
  - `app/page.tsx` composes them in order.
  - A small `noise-overlay.tsx` (or CSS-only) for the grain texture.
- **Reuse installed shadCN components:** `Button`, `Card`, `Badge`, `Switch`, `Accordion`,
  `Sheet`, `Separator`, `NavigationMenu` (optional). No new dependencies.
- **theme.md** at repo root documents:
  - Color tokens + when to use each.
  - Type scale and font-role rules (mono = labels/timecodes only).
  - Spacing/radius conventions.
  - **Agent rules:** never use raw hex (always tokens); accent only on primary CTAs; no
    gradients/glassmorphism/glowing orbs; mono font for labels only; maintain hairline borders;
    dark-only — do not add light-theme variants.

## Components / Units

| Unit | Purpose | Depends on |
|------|---------|-----------|
| `ThemeProvider` | Force dark theme app-wide | next-themes |
| `SiteHeader` | Sticky nav + mobile drawer | Button, Sheet |
| `Hero` | Headline + clip-slicing visual + CTAs | Button |
| `Features` | Bento feature grid | Card, lucide icons |
| `HowItWorks` | 3-step timeline | — |
| `Pricing` | 2-tier cards + billing toggle | Card, Switch, Badge, Button |
| `Faq` | Accordion Q&A | Accordion |
| `SiteFooter` | Footer links | Separator |

## Out of Scope (YAGNI)

- No light theme / theme toggle (dark-only).
- No real auth, backend, or working video upload — CTAs are visual/links only.
- No i18n.
- No blog/docs pages — single landing page only.

## Success Criteria

- Page builds and renders dark-only with the editorial palette.
- All 7 sections present, responsive (mobile drawer works).
- No generic-AI visual tropes (verified against theme.md agent rules).
- `theme.md` exists at repo root with tokens + agent rules.
- Uses only already-installed dependencies.
