/**
 * Post-build SEO pass over the static web export (dist/).
 *
 * Expo's Metro export ships a bare <head> and an empty JS-only body.
 * This script injects Vietnamese-first metadata, Open Graph/Twitter
 * cards, JSON-LD structured data, and crawlable fallback content, and
 * emits robots.txt + sitemap.xml. Runs as part of `npm run build`, so
 * Cloudflare deploys the result automatically.
 *
 * Override the canonical origin with SITE_URL when a custom domain lands.
 */

import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const SITE_URL = process.env.SITE_URL || 'https://astrologik.app';

const TITLE = 'Astrologik – Lịch Vạn Niên, Lịch Âm Hôm Nay, Ngày Giờ Hoàng Đạo';
const DESCRIPTION =
  'Lịch vạn niên Astrologik: tra cứu lịch âm hôm nay, đổi ngày dương sang âm, xem ngày hoàng đạo – hắc đạo, ' +
  'giờ hoàng đạo, can chi, tiết khí và ngũ hành nạp âm. Miễn phí, nhanh, chính xác theo múi giờ Việt Nam.';

const htmlPath = join(dist, 'index.html');
let html = readFileSync(htmlPath, 'utf8');

html = html.replace('<html lang="en">', '<html lang="vi">');
html = html.replace(/<title>.*?<\/title>/, `<title>${TITLE}</title>`);

const head = `
    <meta name="description" content="${DESCRIPTION}" />
    <link rel="canonical" href="${SITE_URL}/" />
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#8A4B3C" />
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0B0D10" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Astrologik" />
    <meta property="og:locale" content="vi_VN" />
    <meta property="og:title" content="${TITLE}" />
    <meta property="og:description" content="${DESCRIPTION}" />
    <meta property="og:url" content="${SITE_URL}/" />
    <meta property="og:image" content="${SITE_URL}/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${TITLE}" />
    <meta name="twitter:description" content="${DESCRIPTION}" />
    <meta name="twitter:image" content="${SITE_URL}/og-image.png" />
    <script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Astrologik – Lịch Vạn Niên',
      url: `${SITE_URL}/`,
      description: DESCRIPTION,
      inLanguage: 'vi',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'VND' },
    })}</script>
`;
html = html.replace('</head>', `${head}</head>`);

// Crawlable fallback content: replaced by the app the moment it mounts,
// visible to no-JS crawlers and while the bundle loads.
const fallback = `<div id="root"><div style="font-family:system-ui,sans-serif;max-width:640px;margin:48px auto;padding:0 16px;color:#111827">
      <h1>Astrologik – Lịch Vạn Niên</h1>
      <p>${DESCRIPTION}</p>
      <h2>Tính năng</h2>
      <ul>
        <li>Lịch tháng với ngày âm – dương song song, ngày rằm và mùng 1</li>
        <li>Lịch năm với ngày lễ, Tết Nguyên Đán và các ngày lễ âm lịch</li>
        <li>Xem ngày hoàng đạo, hắc đạo và giờ hoàng đạo từng ngày</li>
        <li>Can chi ngày – tháng – năm, tiết khí, ngũ hành nạp âm</li>
        <li>Đổi ngày dương lịch sang âm lịch và ngược lại (1800–2199)</li>
      </ul>
      <p><a href="/am-lich/">Xem âm lịch hôm nay</a></p>
      <p>Đang tải ứng dụng…</p>
    </div></div>`;
html = html.replace('<div id="root"></div>', fallback);

writeFileSync(htmlPath, html);

writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

// sitemap.xml is served dynamically by the Worker (it lists the per-day
// /am-lich pages) — a static file here would shadow it, so none is written.

const ogSrc = join(root, 'web', 'og-image.png');
if (existsSync(ogSrc)) {
  copyFileSync(ogSrc, join(dist, 'og-image.png'));
}

console.log('SEO postbuild done:', htmlPath);
