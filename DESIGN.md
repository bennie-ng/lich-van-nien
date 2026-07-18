# Lịch Vạn Niên Design System

*Modern Human Interface (Apple-inspired)*

> A modern Vietnamese lunar calendar should feel calm, elegant, and premium —
> not bright red and gold everywhere. Color communicates meaning and subtle
> cultural identity; the layout follows Apple's Human Interface Guidelines.
> The app should suit daily use all year, not just festivals.

Implemented in `apps/mobile/src/design/`:

```
palette.ts       # primitive values (raw hex — never imported by components)
tokens.ts        # semantic tokens: light & dark themes, spacing, radii, type, faces
ThemeContext.tsx # ThemeProvider + useTheme() (follows system, in-app override)
index.ts         # public API
```

## Principles

Minimal and clean · spacious layout · rounded corners (12–30px) · high
readability · soft shadows · glass effects only on navigation/floating
controls · consistent 8pt spacing · dynamic light & dark mode · WCAG AA.

## 1. Color

### Primary — Jade Green (prosperity, harmony, growth)

| Token | Value |
|---|---|
| `accent.solid` / Primary | `#1E9E73` |
| Hover | `#1A8C66` |
| `accent.strong` / Pressed | `#167D5C` |
| `bg.accentSoft` / Primary Light | `#DDF7EE` |
| Dark-surface lift (`text.accent` dark) | `#2EB584` |

### Secondary — Imperial Gold (sparing, premium accents)

| Token | Value |
|---|---|
| Accent | `#D4A72C` |
| `bg.goldSoft` / Accent Light | `#F8EFD0` |
| `text.lunar` (light) | `#8F6F14` — darkened for 4.5:1 text contrast |
| `text.lunar` (dark) | `#E8C55A` |

### Lunar Blue (moon layer, selected dates)

`selected.solid #4F7BFF` · `selected.soft #E8EEFF` (dark `#1B2440`).

### Semantic

Success `#1DB954` · Error `#E34B4B` · Warning `#F59E0B` · Info `#3B82F6`.

### Themes

| Token | Light | Dark |
|---|---|---|
| `bg.canvas` | `#F7F8FA` | `#0B0D10` |
| `bg.surface` (cards) | `#FFFFFF` | `#171A1F` |
| `bg.elevated` (inputs, chips) | `#F2F4F7` | `#23272F` |
| `border.subtle` (divider) | `#E5E7EB` | `#31363F` |
| `border.strong` | `#D6DAE1` | `#3D4350` |
| `text.primary` | `#111827` | `#F8FAFC` |
| `text.secondary` | `#6B7280` | `#AAB2C0` |
| `text.tertiary` | `#9CA3AF` | `#808998` |
| `text.disabled` | `#B7BDC8` | `#626B78` |

### Calendar colors

| Item | Token → value |
|---|---|
| Today | jade ring + `bg.accentSoft` wash |
| Selected day | `selected.solid #4F7BFF` |
| Weekend (T7 & CN) | `weekend.* #F59E0B` |
| Holiday number | `holiday.day #E34B4B` |
| Mùng 1 / rằm cell | `bg.goldSoft` wash, `text.lunar` figure |
| Hoàng đạo dot | `state.good` (jade) |

### Badges

| Badge | Background | Text |
|---|---|---|
| Good day (hoàng đạo) | `#DDF7EE` | `#1E9E73` |
| Bad day (hắc đạo) | `#FDEAEA` | `#E34B4B` |
| Holiday | `#FFF2E2` | `#B45309` (darkened from `#F59E0B` for AA) |

### Ngũ hành (Five Elements) — muted

Kim `#B9A56B` · Mộc `#3FA66B` · Thủy `#4A7DFF` · Hỏa `#E85D5D` · Thổ `#B68C58`
(`color.element.*`, reserved for the day-detail element display).

### Zodiac indicators

Lucky `#22C55E` · Neutral `#64748B` · Caution `#EF4444` (`color.zodiac.*`).

## 2. Typography

Platform-native per spec: **SF Pro** on iOS, **Roboto** on Android (system
font — no bundle), **Inter** on web (loaded via `@expo-google-fonts/inter`).

Weight is expressed through `face.*` tokens — on native they resolve to
`fontWeight` on the system family, on web to a weight-specific Inter family.
Components never write raw `fontFamily`/`fontWeight`.

| Token | Size / face | Spec name |
|---|---|---|
| `display` | 48–64 / bold | Large Date |
| `titleXL` | 34 / bold | Large Title |
| `title` | 22 / bold | Title 2 |
| `headline` | 17 / semibold | Body-emphasized |
| `body` | 15 / regular | Subheadline |
| `label` | 13 / semibold | — |
| `caption` | 13 / medium | Caption |
| `micro` | 11 / semibold, caps | Small |

## 3. Shape, space, elevation

- **Radius**: cell 12 · input 14 · button/segment 16 · card 20 · modal/hero 28
  · floating panel 30 · chips 999.
- **Spacing**: 8pt grid — 4, 8, 12, 16, 24, 32, 48.
- **Shadows**: card `0 6 20 rgba(0,0,0,0.08)`; floating `0 12 32 rgba(0,0,0,0.12)`
  (opacity raised in dark mode).

## 4. Glass (blur) usage

Blur is applied **only** to the floating tab bar (`expo-blur`, 80–90%-opacity
surface tint over blur). Calendar cells, cards, lists, and forms stay opaque —
clean and performant, per spec.

## 5. Navigation

Floating pill tab bar: translucent blurred background, active tab = filled
jade pill with white icon/label, inactive icons `text.tertiary`. Minimal app
bar (micro-caps wordmark + theme toggle).

## 6. Accessibility

- Touch targets ≥ 44×44pt on interactive controls.
- Text contrast ≥ 4.5:1 — where spec accent values fall short as *text*
  (imperial gold, holiday amber), the token darkens them (`#8F6F14`,
  `#B45309`) while washes/dots keep the spec hue.
- Color never carries meaning alone: hoàng đạo has dot + badge + label,
  holidays have the banner card, today has ring + wash.
- Light/dark follow the system scheme automatically.

## 7. Motion (to implement)

150–250 ms, ease-out; month switching, date selection, sheet presentation.
Respect Reduce Motion.
