# Aiven Design Tokens

The shared design language for our Switchboard / Vibe Deploy products. One file of
CSS custom properties — modeled on Aiven's public design system (aiven.io) — that
gives every project the **same colors, type, spacing, radii, and motion**, in both
light and dark.

It's plain CSS variables, so it works in **any** stack (React, Vue, Svelte, plain
HTML, Tailwind, CSS modules…) with no build step and no dependencies.

> **One file to share:** [`aiven-tokens.css`](./aiven-tokens.css). Everything below
> documents what's inside it.

---

## Quick start

**1. Copy the file** into your project (e.g. `src/aiven-tokens.css`).

**2. Import it _before_ your own styles** so your CSS can read the variables:

```ts
// Vite / React entry (main.tsx)
import "./aiven-tokens.css";
import "./styles.css";
```

```css
/* or from a CSS entry */
@import "./aiven-tokens.css";
```

**3. Load the brand fonts** (Funnel Display, Inter, Geist Mono) in your `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@500;600;700;800&family=Geist+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

**4. (Optional) turn on dark mode** by adding `class="dark"` to `<html>`:

```html
<html lang="en" class="dark">
```

That's it. Now build UI by referencing the **semantic** tokens:

```css
.card {
  background: var(--surface);
  color: var(--text-strong);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}
```

---

## The three tiers

Tokens are layered. **Always build against tier 2/3 — never hard-code a hex value
and never reference a tier-1 primitive directly in UI.** That's what keeps light
and dark in sync and lets us retheme everything from one place.

| Tier | What it is | Example | Use in UI? |
| --- | --- | --- | --- |
| **1 · Primitives** | Raw color ramps | `--color-green-40: #5ffa74` | ❌ never |
| **2 · Semantic** | Role-based, theme-aware | `--brand`, `--surface`, `--text-strong` | ✅ yes |
| **3 · Aliases** | Type / space / radius / motion scales | `--text-lg`, `--space-6`, `--radius-xl` | ✅ yes |

Dark mode works because the **semantic** tokens re-point to different primitives
under `.dark` — your components don't change at all.

---

## Color

### Brand — green (the signature is `--color-green-40` `#5ffa74`)

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--brand` | green-70 | green-40 | CTA fill / accent text |
| `--brand-strong` | green-80 | green-30 | hover |
| `--brand-bright` | green-40 | green-40 | signature accent |
| `--brand-soft` | green-0 | green-90 | tinted backgrounds |
| `--brand-soft-border` | green-30 | green-80 | soft borders |
| `--on-brand` | white | grey-100 | text on a brand fill |

> **Convention:** reserve brand green for the **logo and the primary action**.
> Everything else stays neutral — that restraint is the look.

### Accent — deep blue

| Token | Light | Dark |
| --- | --- | --- |
| `--accent` | deep-blue-50 `#6f64ff` | deep-blue-40 |
| `--accent-soft` | deep-blue-0 | deep-blue-90 |

### Surfaces, text & borders (semantic)

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--surface-canvas` | grey-0 | grey-100 | page background |
| `--surface` | white | grey-80 | cards / panels |
| `--surface-sunken` | grey-10 | black | insets, subtle fills |
| `--surface-inverse` | grey-100 | black | near-black code blocks |
| `--text-strong` | `#1a1a1a` | white | headings / body |
| `--text-muted` | grey-50 | grey-30 | secondary |
| `--text-faint` | grey-40 | grey-40 | tertiary / hints |
| `--border` | grey-20 | grey-70 | default border |
| `--border-strong` | grey-30 | grey-60 | emphasized border |
| `--fill-solid` | `#1a1a1a` | grey-0 | primary button / active pill |
| `--on-fill-solid` | white | grey-100 | text on the solid fill |

### State

| Token | Role |
| --- | --- |
| `--success` | success text / icons |
| `--warn-fg` / `--warn-soft` / `--warn-border` | warning foreground / tint / border |
| `--danger-fg` / `--danger-soft` / `--danger-border` | error foreground / tint / border |
| `--ring` | focus ring (`color-mix` of brand) |

### Product accents

Per-service marks, available as `--color-kafka`, `--color-postgres`,
`--color-clickhouse`, `--color-opensearch`, `--color-valkey`, `--color-mysql`,
`--color-grafana`.

---

## Dark mode

Light is the default. Add `class="dark"` to `<html>` (or any ancestor) and the
**entire** semantic layer flips — no per-component work:

```js
document.documentElement.classList.toggle("dark");
```

---

## Typography

| Token | Value |
| --- | --- |
| `--font-sans` | Inter (+ system fallback) |
| `--font-display` | Funnel Display → sans |
| `--font-mono` | Geist Mono → mono |

Type scale (`--text-*`): `xxs 12` · `xs 14` · `sm/base 16` · `md 20` · `lg 24` ·
`xl 30` · `2xl 38` · `3xl 48` · `4xl 72` · `5xl 96` (px).

Weights: `--font-weight-normal 400` · `medium 500` · `semibold 600` · `bold 700`.
Line height: `--leading-normal 1.5` · `--leading-relaxed 1.625`.
Tracking: `--tracking-tight -0.02em` · `--tracking-normal 0`.

---

## Spacing & layout

Component spacing (`--space-*`): `0 0` · `1 2` · `2 4` · `3 8` · `4 12` · `5 16` ·
`6 24` · `7 32` · `8 40` · `9 48` (px).

Page rhythm (`--layout-*`): `1 16` · `2 24` · `3 32` · `4 48` · `5 64` · `6 96` ·
`7 160` (px).

---

## Radii

`--radius-xs 2` · `--radius-sm 4` · `--radius-md 6` · `--radius-lg 8` ·
`--radius-xl 12` · `--radius-2xl 32` · `--radius-pill 999` (px).

---

## Elevation & motion

Shadows: `--shadow-sm` · `--shadow-md` · `--shadow-lg`.

Easings: `--ease-out` · `--ease-in` · `--ease-bounce`.
Ready-made animations: `--animate-fade-in`, `--animate-fade-in-scale` (their
keyframes `fadeIn` / `fadeInScale` ship inside the file).

```css
.toast { animation: var(--animate-fade-in-scale); }
```

---

## Example: a button from tokens only

```css
.btn-primary {
  font-family: var(--font-sans);
  font-weight: var(--font-weight-semibold);
  background: var(--fill-solid);
  color: var(--on-fill-solid);
  border: none;
  border-radius: var(--radius-pill);
  padding: var(--space-3) var(--space-6);
  transition: background-color 200ms var(--ease-out);
}
.btn-primary:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px var(--ring);
}
```

---

## Conventions

- **Build against tier 2/3 tokens**, never raw hex and never tier-1 primitives.
- **Brand green = logo + primary action only.** Keep the rest neutral.
- **Don't fork the file per project.** Keep this one canonical and pull updates so
  everyone stays on the same style.

A full working consumer of these tokens lives in
[`switchboard/src/styles.css`](../switchboard/src/styles.css) — handy as a reference
for how the tokens map onto a real UI.
