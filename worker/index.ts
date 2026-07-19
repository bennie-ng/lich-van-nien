/**
 * Cloudflare Worker: serves the static app plus server-rendered,
 * crawlable per-day pages at /am-lich/YYYY-MM-DD, computed on the edge
 * with lunar-core. Also serves a dynamic sitemap covering the date pages.
 */

import {
  CHI,
  getDayInfo,
  jdFromDate,
  jdToDate,
  type DayInfo,
} from 'lunar-core';

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const SITE_URL = 'https://astrologik.app';
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (d: number, m: number, y: number) => `${y}-${pad(m)}-${pad(d)}`;
const vn = (d: number, m: number, y: number) => `${d}/${m}/${y}`;

/** Today in Vietnam (UTC+7). */
function todayVN(): { day: number; month: number; year: number } {
  const t = new Date(Date.now() + 7 * 3600 * 1000);
  return { day: t.getUTCDate(), month: t.getUTCMonth() + 1, year: t.getUTCFullYear() };
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function dayPage(info: DayInfo): string {
  const { solar, lunar, canChi, element, dayStar, auspiciousHours, solarTerm, holidays } = info;
  const dateVN = vn(solar.day, solar.month, solar.year);
  const lunarLabel = `${lunar.day}/${lunar.month}${lunar.leap ? ' nhuận' : ''} năm ${canChi.year.name}`;
  const title = `Âm lịch ${dateVN} – ${lunarLabel}, ngày ${canChi.day.name}`;
  const goodBad = dayStar.auspicious ? 'hoàng đạo' : 'hắc đạo';
  const description =
    `${WEEKDAYS[solar.weekday]} ${dateVN} nhằm ngày ${lunarLabel} âm lịch. ` +
    `Ngày ${canChi.day.name} (${element.day.name}), ngày ${goodBad} (sao ${dayStar.star}), tiết ${solarTerm}. ` +
    `Giờ hoàng đạo: ${auspiciousHours.map((h) => h.chi).join(', ')}.`;
  const prev = jdToDate(jdFromDate(solar.day, solar.month, solar.year) - 1);
  const next = jdToDate(jdFromDate(solar.day, solar.month, solar.year) + 1);
  const url = `${SITE_URL}/am-lich/${iso(solar.day, solar.month, solar.year)}`;

  const holidayHtml = holidays.length
    ? `<section><h2>Ngày lễ</h2><ul>${holidays
        .map((h) => `<li>${esc(h.name)}${h.publicHoliday ? ' (nghỉ lễ)' : ''}</li>`)
        .join('')}</ul></section>`
    : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${url}" />
<link rel="icon" href="/favicon.ico" />
<meta name="theme-color" content="#8A4B3C" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="Astrologik" />
<meta property="og:locale" content="vi_VN" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${SITE_URL}/og-image.png" />
<style>
  body{font-family:system-ui,sans-serif;margin:0;background:#F7F8FA;color:#111827;line-height:1.6}
  main{max-width:640px;margin:0 auto;padding:24px 16px 48px}
  header.hero{background:linear-gradient(135deg,#8A4B3C,#A96B52);color:#fff;border-radius:20px;padding:24px;text-align:center}
  header.hero .d{font-size:56px;font-weight:800;line-height:1.1}
  header.hero .l{opacity:.92;margin-top:6px}
  h1{font-size:22px}
  h2{font-size:17px;margin:24px 0 8px;color:#8A4B3C}
  .chip{display:inline-block;background:#fff;border:1px solid #E5E7EB;border-radius:999px;padding:6px 14px;margin:3px 4px 3px 0;font-size:14px}
  .good{color:#1E9E73;font-weight:600}.bad{color:#E34B4B;font-weight:600}
  nav.pn{display:flex;justify-content:space-between;margin-top:32px;font-size:15px}
  a{color:#8A4B3C}
  .app{display:block;text-align:center;background:#8A4B3C;color:#fff;text-decoration:none;border-radius:16px;padding:14px;margin-top:28px;font-weight:600}
</style>
</head>
<body>
<main>
  <p><a href="/">Astrologik – Lịch Vạn Niên</a></p>
  <header class="hero">
    <div>${WEEKDAYS[solar.weekday]}</div>
    <div class="d">${solar.day}</div>
    <div>Tháng ${solar.month} năm ${solar.year}</div>
    <div class="l">Âm lịch: ${esc(lunarLabel)}</div>
  </header>
  <h1>${esc(title)}</h1>
  ${holidayHtml}
  <section>
    <h2>Can chi &amp; ngũ hành</h2>
    <span class="chip">Ngày ${canChi.day.name}</span>
    <span class="chip">Tháng ${canChi.month.name}</span>
    <span class="chip">Năm ${canChi.year.name}</span>
    <span class="chip">Mệnh ngày: ${esc(element.day.name)}</span>
    <span class="chip">Mệnh năm: ${esc(element.year.name)}</span>
    <span class="chip">Tiết ${esc(solarTerm)}</span>
  </section>
  <section>
    <h2>Ngày ${goodBad}</h2>
    <p>Ngày <span class="${dayStar.auspicious ? 'good' : 'bad'}">${goodBad}</span> (sao ${esc(dayStar.star)}).
    ${dayStar.auspicious ? 'Ngày tốt, thuận lợi cho các việc trọng đại.' : 'Ngày kém thuận lợi, nên cân nhắc việc trọng đại.'}</p>
  </section>
  <section>
    <h2>Giờ hoàng đạo</h2>
    ${auspiciousHours.map((h) => `<span class="chip">${h.chi} (${h.range})</span>`).join('')}
  </section>
  <nav class="pn">
    <a href="/am-lich/${iso(prev.day, prev.month, prev.year)}" rel="prev">← ${vn(prev.day, prev.month, prev.year)}</a>
    <a href="/am-lich/${iso(next.day, next.month, next.year)}" rel="next">${vn(next.day, next.month, next.year)} →</a>
  </nav>
  <a class="app" href="/">Mở lịch vạn niên đầy đủ</a>
</main>
</body>
</html>`;
}

function sitemap(): string {
  const { year } = todayVN();
  const urls: string[] = [`  <url><loc>${SITE_URL}/</loc><changefreq>monthly</changefreq></url>`];
  for (let y = year - 1; y <= year + 1; y++) {
    for (let m = 1; m <= 12; m++) {
      const days = jdFromDate(1, m === 12 ? 1 : m + 1, m === 12 ? y + 1 : y) - jdFromDate(1, m, y);
      for (let d = 1; d <= days; d++) {
        urls.push(`  <url><loc>${SITE_URL}/am-lich/${iso(d, m, y)}</loc></url>`);
      }
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
}

const HTML_HEADERS = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=3600' };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/am-lich' || path === '/am-lich/') {
      const t = todayVN();
      return Response.redirect(`${url.origin}/am-lich/${iso(t.day, t.month, t.year)}`, 302);
    }

    const m = path.match(/^\/am-lich\/(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const [, ys, ms, ds] = m;
      const y = Number(ys);
      const mo = Number(ms);
      const d = Number(ds);
      const valid =
        y >= MIN_YEAR &&
        y <= MAX_YEAR &&
        mo >= 1 &&
        mo <= 12 &&
        d >= 1 &&
        d <= jdFromDate(1, mo === 12 ? 1 : mo + 1, mo === 12 ? y + 1 : y) - jdFromDate(1, mo, y);
      if (!valid) {
        return new Response('<!DOCTYPE html><html lang="vi"><body><p>Ngày không hợp lệ. <a href="/">Về trang chủ</a></p></body></html>', {
          status: 404,
          headers: HTML_HEADERS,
        });
      }
      return new Response(dayPage(getDayInfo(d, mo, y)), { headers: HTML_HEADERS });
    }

    if (path === '/sitemap.xml') {
      return new Response(sitemap(), {
        headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=86400' },
      });
    }

    // Static assets; SPA fallback to the app shell for anything unknown.
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return asset;
    return env.ASSETS.fetch(new Request(`${url.origin}/`, { headers: request.headers }));
  },
};
