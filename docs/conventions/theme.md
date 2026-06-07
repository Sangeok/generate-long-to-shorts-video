# LongformShorts AI - Theme & Design System

This file is the **source of truth** for the visual language of LongformShorts AI. Any agent or
contributor styling UI **must** read and follow these rules before writing markup or CSS.
The tokens themselves live in `app/globals.css` (`:root` and `.dark`).

## Identity

Editorial / cinematic — think "video studio", not "techy SaaS". Confident, human, restrained.
A dark stage where a single warm accent does the talking.

**Dark-only product.** There is no light theme and no theme toggle. `next-themes` is configured
with `forcedTheme="dark"`. Do **not** add light-mode variants or a toggle.

## Color Tokens

Always use semantic tokens via Tailwind utilities (`bg-card`, `text-muted-foreground`,
`border-border`, …). **Never** hardcode hex/oklch values in components.

| Token                    | Value (oklch)            | Use for |
| ------------------------ | ------------------------ | ------- |
| `background`             | `0.135 0.004 285`        | Page background (near-black, never pure `#000`). |
| `foreground`             | `0.97 0 0`               | Primary text. |
| `card`                   | `0.175 0.004 285`        | Raised surfaces, cards, panels. |
| `popover`                | `0.165 0.004 285`        | Menus, sheets, dialogs. |
| `primary`                | `0.78 0.155 66` (amber)  | The one accent — primary CTAs, key highlights, the "live" dot. |
| `primary-foreground`     | `0.2 0.03 60`            | Text/icons on top of `primary`. |
| `secondary`              | `0.24 0.004 285`         | Subtle fills, icon chips, inactive controls. |
| `muted` / `muted-foreground` | `0.215` / `0.66`     | Quiet surfaces / secondary text. |
| `destructive`            | `0.62 0.2 25` (red)      | Errors and rare, deliberate emphasis only. |
| `border`                 | `1 0 0 / 9%`             | Hairline borders — the default separator. |
| `ring`                   | amber                    | Focus rings. |

### Accent discipline (most important rule)

`primary` (amber) is a **spotlight, not a wash**. Per viewport it should appear in roughly
**1–3 places**: the primary CTA, one highlighted element (e.g. the "Most popular" plan or a
detected-moment marker), and small mono accents (timecodes, the live dot). If amber is
everywhere, it's nowhere — pull it back.

## Typography

Three roles, three fonts. Do not introduce others.

| Role     | Font (CSS var)            | Usage |
| -------- | ------------------------- | ----- |
| Display  | Fraunces (`font-display`) | Headlines, section titles, plan names, numerals. High-contrast editorial serif. Use `tracking-tight`. |
| Body     | Inter (`font-sans`)       | Paragraphs, descriptions, UI labels, buttons. |
| Mono     | Geist Mono (`font-mono`)  | Eyebrow labels, timecodes, tags, metadata **only**. Uppercase with `tracking-[0.2em]`. |

- Headlines lean **large** with tight leading (`leading-[0.98]`–`leading-tight`) for editorial impact.
- Use the `.eyebrow` utility (in `globals.css`) for the mono section labels.
- Keep mono for labels/timecodes — never set body copy in mono.

## Surfaces, Borders, Radius

- Layer depth with surface tokens (`background` → `card/40` → `card`), **not** shadows or glows.
- Separators and card outlines are **hairline** `border-border`. No heavy 2px borders.
- Radius scale derives from `--radius: 0.5rem`. Cards `rounded-xl`/`rounded-2xl`, chips `rounded-md`/`rounded-lg`, badges/pills `rounded-full`.

## Texture & Atmosphere

- A fixed film-grain layer (`.grain-overlay`) and a faint top vignette on `body` give the
  near-black depth. Keep them subtle (grain opacity ≈ 0.04). Don't crank them up.
- Motion: one orchestrated entrance via `.animate-rise` with staggered `animation-delay`.
  Prefer a single well-timed reveal over scattered micro-animations.

## Motifs

Lean into the **video-editing language**: timecodes (`04:12 — 04:41`), aspect labels (`9:16`),
waveform/timeline bars, "signal" scores. These carry the cinematic identity — reuse them.

## ⛔ Hard "Don't"s (generic-AI guardrails)

This product was explicitly briefed to **avoid generic AI aesthetics**. Never:

- Use **purple/violet gradients**, especially on light backgrounds.
- Use **glassmorphism** as a primary surface, **glowing orbs**, or blurred gradient blobs as decoration.
- Add **decorative gradients** for their own sake (functional, near-invisible radial depth on `body` is fine).
- Introduce **Space Grotesk** or other over-used "AI" display fonts. Stick to the three fonts above.
- Hardcode colors — always use tokens.
- Add a **light theme** or theme switcher.
- Spray the amber accent across the page — respect accent discipline.
- Reach for heavy drop-shadows/neon glows to create depth — use surface layering and hairlines.

## File Structure

- Theme tokens: `app/globals.css`
- Fonts + `ThemeProvider`: `app/layout.tsx`
- Landing sections: `components/landing/*` (one component per section)
- shadCN primitives (base-ui based): `components/ui/*`
