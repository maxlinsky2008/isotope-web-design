# Isotope Web Design — Design System

## Color Tokens

| Token | Value | Use |
|---|---|---|
| `--green` | `oklch(0.71 0.19 143)` | Primary brand green. CTAs, active states, accents. |
| `--green-dark` | `oklch(0.52 0.16 143)` | Hover/pressed on green elements. Email links. |
| `--green-tint` | `oklch(0.95 0.04 143)` | Section backgrounds, badges, input focus rings. |
| `--green-mid` | `oklch(0.85 0.09 143)` | Dividers within tint sections, trust strip bullets. |
| `--ink` | `oklch(0.13 0.005 143)` | Body text, dark section backgrounds. |
| `--surface` | `oklch(0.99 0.002 143)` | Page background, card fills. |
| `--mid` | `oklch(0.50 0.003 143)` | Secondary text, captions, placeholders. |
| `--border` | `oklch(0.88 0.003 143)` | Dividers, input borders. |
| `--shadow` | `oklch(0.13 0.005 143 / 0.07)` | Subtle drop shadows. |

Color strategy: **Committed.** Green is used with intent on 30–45% of accent surfaces — not sprinkled, not restrained.

## Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Display / Headings | Urbanist | 800 | clamp scale (see below) |
| Body | Plus Jakarta Sans | 400–600 | 1rem / 1.65 |
| Labels / Nav | Urbanist | 700 | 0.75–0.9375rem |

**Heading scale:**
- `h1`: `clamp(2.75rem, 6vw, 4.75rem)`
- `h2`: `clamp(2rem, 4vw, 3.125rem)`
- `h3`: `clamp(1.125rem, 2vw, 1.375rem)`

Letter-spacing: `-0.025em` on all headings.

## Spacing

| Token | Value | Use |
|---|---|---|
| `--section-y` | `clamp(5rem, 10vw, 9rem)` | Vertical padding on all major sections |
| `--nav-h` | `72px` | Nav height, body padding-top offset |
| `--max-w` | `1200px` | Max container width |
| `--radius` | `12px` | Standard border-radius |
| `--radius-lg` | `24px` | Larger cards, visual containers |

## Components

### Buttons
- `.btn--green` — Primary CTA: green fill, white text
- `.btn--outline` — Secondary: transparent, ink border, fills ink on hover
- `.btn--white` — On green backgrounds: white fill, green text, inverts on hover
- `.btn--outline-ghost` — On dark (ink) backgrounds: subtle border, light text
- `.btn--sm` — Reduced padding variant for nav

### Sections
- Dark sections use `background: var(--ink)` with adjusted text/border colors
- Tint sections use `background: var(--green-tint)` with `border: 1px solid var(--green-mid)`
- Standard sections have no background modifier

### Scroll Reveal
- `.reveal` — fade up (default)
- `.reveal--right` — fade from right
- `.reveal--d1` through `.reveal--d5` — stagger delays (0.08s increments)
- Hero elements trigger on page load; all others trigger via IntersectionObserver

## Fonts (Google Fonts CDN)
```
https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap
```
