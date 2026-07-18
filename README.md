# Lịch Vạn Niên

Vietnamese perpetual calendar (lịch vạn niên) — one TypeScript monorepo producing
an iOS + Android app and a web app from the same codebase.

## Structure

```
packages/lunar-core   # Calendar engine: pure TypeScript, no dependencies
apps/mobile           # Expo app (iOS, Android, web) consuming lunar-core
```

### `lunar-core`

The heart of the app. Implements the Vietnamese lunisolar calendar using the
astronomical algorithm published by Hồ Ngọc Đức, computed at **UTC+7** (which is
why Vietnamese lunar dates occasionally differ from Chinese ones — e.g. Tết
1985). Provides:

- Solar ↔ lunar conversion incl. leap months (tháng nhuận), 1800–2199
- Can chi (Thiên can – Địa chi) for day, month, year and first hour
- Giờ hoàng đạo (auspicious hours) per the classical table
- Ngày hoàng đạo / hắc đạo via the Thanh Long 12-star cycle
- Tiết khí (24 solar terms) from the sun's ecliptic longitude
- Vietnamese holidays, solar and lunar
- `getDayInfo(d, m, y)` — everything the app shows about a day, in one call

Tested against known reference dates (Tết 1985–2026, leap months 2020/2023,
can chi anchors) plus a round-trip test over every day from 1990 to 2049.

### `apps/mobile`

Expo SDK 57 app with three screens: month grid (dual solar/lunar dates,
hoàng đạo markers, holidays), day detail (can chi, giờ hoàng đạo, tiết khí),
and a solar ↔ lunar date converter. Styled by the token-based design
system documented in [DESIGN.md](./DESIGN.md), with light and dark themes.

## Development

```bash
npm install            # installs all workspaces

npm test               # lunar-core test suite
npm run typecheck      # lunar-core type check

npm run web            # run the app in a browser
npm run start          # Expo dev server (scan QR with Expo Go for iOS/Android)
```

Static web build: `cd apps/mobile && npx expo export --platform web` → `dist/`.

## Roadmap

- [ ] Personal events on lunar dates (ngày giỗ) with recurring notifications
- [ ] Mùng 1 / rằm reminders
- [ ] Year view + Tết countdown
- [ ] Home-screen widgets (iOS/Android)
- [ ] Xem ngày tốt xấu chi tiết (trực, nhị thập bát tú, hướng xuất hành)
- [ ] EAS build + store deployment; static web hosting
