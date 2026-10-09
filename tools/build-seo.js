/* ============================================================
   AQARAT — static SEO pages + sitemap generator
   Usage:  node tools/build-seo.js
   Reads   data/listings.js
   Writes  unit/<id>.html  (one crawlable page per listing)
           sitemap.xml
           robots.txt
   The GitHub Action .github/workflows/build-seo.yml runs this
   automatically whenever data/listings.js changes.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT, 'data', 'listings.js');
const UNIT_DIR = path.join(ROOT, 'unit');

/* ---------- load data ---------- */
function loadData() {
  const text = fs.readFileSync(DATA_FILE, 'utf8');
  const m = text.match(/window\.LISTINGS_DATA\s*=\s*([\s\S]*?);?\s*$/);
  if (!m) throw new Error('data/listings.js: could not parse LISTINGS_DATA');
  return JSON.parse(m[1]);
}

/* ---------- helpers ---------- */
function esc(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function hasPrice(l) { return !!(l && Number(l.price) > 0); }
function fmtNum(n) { return Number(n).toLocaleString('en-US'); }
function typeLabel(type) { return type === 'rent' ? 'إيجار' : 'تمليك'; }
function priceNote(l) { return l.type === 'rent' ? 'جنيه / شهر' : 'جنيه'; }
function roomsLabel(rooms) {
  rooms = Number(rooms) || 0;
  if (rooms <= 0) return 'استديو';
  if (rooms === 1) return 'غرفة واحدة';
  if (rooms === 2) return 'غرفتين';
  if (rooms <= 10) return rooms + ' غرف';
  return rooms + ' غرفة';
}
function waNumber(raw) {
  let s = String(raw || '').replace(/[^0-9]/g, '');
  if (s.indexOf('00') === 0) s = s.slice(2);
  if (s.length === 11 && s[0] === '0') s = '2' + s;
  if (s.length === 10 && s[0] === '1') s = '2' + s;
  return s;
}
function waLink(number, text) {
  const n = waNumber(number);
  return 'https://wa.me/' + n + (text ? '?text=' + encodeURIComponent(text) : '');
}
function placeholder() {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="560" viewBox="0 0 800 560">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#E7E5E4"/><stop offset="1" stop-color="#D6D3D1"/></linearGradient></defs>' +
    '<rect width="800" height="560" fill="url(#g)"/>' +
    '<g fill="none" stroke="#A8A29E" stroke-width="6">' +
    '<path d="M400 160 L560 290 L560 440 L240 440 L240 290 Z"/>' +
    '<path d="M340 440 L340 330 L460 330 L460 440"/>' +
    '<path d="M280 300 L340 300 M460 300 L520 300"/></g></svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
function exists(rel) { try { return fs.existsSync(path.join(ROOT, rel)); } catch (e) { return false; } }
function firstBitmap(imgs) {
  for (const im of imgs) if (/\.(jpe?g|png|webp|gif)$/i.test(im) && exists(im)) return im;
  return null;
}
function cleanDesc(l) {
  const d = String(l.description || '').replace(/\s+/g, ' ').trim();
  if (d) return d.length > 300 ? d.slice(0, 297) + '…' : d;
  const bits = [typeLabel(l.type), 'شقة', roomsLabel(l.rooms), l.area ? l.area + ' م²' : '',
    'في ' + (l.district || l.city || 'مصر')].filter(Boolean);
  return bits.join(' ') + ' — ' + (l.title || '');
}
function iso(ms) { try { return new Date(Number(ms) || Date.now()).toISOString(); } catch (e) { return new Date().toISOString(); } }

/* ---------- one listing page ---------- */
function pageHTML(l, ctx) {
  const { base, siteName, tagline, whatsapp } = ctx;
  const id = l.id || l.ref;
  const imgs = (l.images && l.images.length ? l.images : []).filter(exists);
  const shown = imgs.length ? imgs : [placeholder()];
  const hero = shown[0];
  const rest = shown.slice(1);
  const canonical = base ? base + '/unit/' + encodeURIComponent(id) + '.html' : 'unit/' + encodeURIComponent(id) + '.html';
  const ogImg = base ? (firstBitmap(imgs) ? base + '/' + firstBitmap(imgs) : '') : '';
  const loc = (l.district || '') + (l.district && l.city ? ' — ' : '') + (l.city || '');
  const priceTxt = hasPrice(l) ? fmtNum(l.price) + ' ' + priceNote(l) : 'السعر عند الاتصال';
  const wa = waLink(whatsapp, 'السلام عليكم، مستفسر عن الشقة: ' + l.title + ' (كود ' + l.ref + ')\n' + (canonical || ''));

  const specs = [
    ['النوع', typeLabel(l.type) + (l.furnished ? ' — مفروش' : '')],
    ['المساحة', l.area ? l.area + ' متر' : '—'],
    ['غرف النوم', roomsLabel(l.rooms)],
    ['الحمامات', l.baths || 0],
    ['الدور', l.floor ? (l.floor === 0 ? 'أرضي' : l.floor) : '—'],
    ['الكود', l.ref || '—']
  ].map(s => '<div class="uspec"><span>' + esc(s[0]) + '</span><b>' + esc(s[1]) + '</b></div>').join('');

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: l.title,
    description: cleanDesc(l),
    url: canonical,
    image: imgs.filter(im => /\.(jpe?g|png|webp)$/i.test(im)).map(im => (base ? base + '/' : '') + im).slice(0, 8),
    datePosted: iso(l.createdAt),
    numberOfRooms: Number(l.rooms) || undefined,
    numberOfBathroomsTotal: Number(l.baths) || undefined,
    floorSize: l.area ? { '@type': 'QuantitativeValue', value: Number(l.area), unitCode: 'MTK' } : undefined,
    address: { '@type': 'PostalAddress', addressLocality: l.district || l.city || '', addressRegion: l.city || '', addressCountry: 'EG' },
    offers: hasPrice(l) ? { '@type': 'Offer', price: Number(l.price), priceCurrency: 'EGP', availability: l.status === 'available' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut', url: canonical } : undefined
  };
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: base ? base + '/' : 'index.html' },
      { '@type': 'ListItem', position: 2, name: 'شقق ' + (l.district || l.city || 'مصر'), item: base ? base + '/' : 'index.html' },
      { '@type': 'ListItem', position: 3, name: l.title }
    ]
  };

  const related = ctx.related.map(r => {
    const rim = (r.images && r.images.length && exists(r.images[0])) ? r.images[0] : placeholder();
    return '<a class="urel" href="' + esc(r.id) + '.html">' +
      '<span class="urel__img"><img src="' + esc(rim) + '" alt="' + esc(r.title) + '" loading="lazy"></span>' +
      '<span class="urel__t">' + esc(r.title) + '</span>' +
      '<span class="urel__p">' + esc(hasPrice(r) ? fmtNum(r.price) + ' ' + priceNote(r) : 'عند الاتصال') + '</span>' +
    '</a>';
  }).join('');

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(l.title)} — ${esc(typeLabel(l.type))} ${esc(l.district || l.city || '')} | ${esc(siteName)}</title>
<meta name="description" content="${esc(cleanDesc(l))}">
${canonical ? '<link rel="canonical" href="' + esc(canonical) + '">' : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(siteName)}">
<meta property="og:title" content="${esc(l.title)}">
<meta property="og:description" content="${esc(cleanDesc(l))}">
${canonical ? '<meta property="og:url" content="' + esc(canonical) + '">' : ''}
${ogImg ? '<meta property="og:image" content="' + esc(ogImg) + '">' : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0A0A0A">
<link rel="icon" href="../assets/app-icon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/style.css?v=6">
<link rel="stylesheet" href="../assets/css/unit.css?v=6">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<script type="application/ld+json">${JSON.stringify(crumbs)}</script>
</head>
<body>
<header class="hdr">
  <div class="wrap hdr__in">
    <a class="brand" href="../index.html">
      <span class="brand__mark">${esc((siteName || 'ع').trim().charAt(0) || 'ع')}</span>
      <span><span>${esc(siteName)}</span><small class="brand__sub">${esc((tagline || '').split('—')[0].trim())}</small></span>
    </a>
    <a class="hdr__wa" href="${esc(wa)}" target="_blank" rel="noopener">واتساب</a>
  </div>
</header>

<main class="wrap unit">
  <nav class="unit__crumbs" aria-label="مسار">
    <a href="../index.html">الرئيسية</a>
    <span>›</span>
    <a href="../index.html">شقق ${esc(l.district || l.city || 'مصر')}</a>
    <span>›</span>
    <b>${esc(l.ref || '')}</b>
  </nav>

  <div class="unit__grid">
    <div class="unit__gallery">
      <div class="unit__main"><img src="${esc(hero)}" alt="${esc(l.title)}"></div>
      ${rest.length ? '<div class="unit__thumbs">' + rest.map(im => '<span class="unit__thumb"><img src="' + esc(im) + '" alt="' + esc(l.title) + ' — صورة" loading="lazy"></span>').join('') + '</div>' : ''}
    </div>

    <div class="unit__info">
      <div class="unit__badges">
        <span class="badge badge--type">${esc(typeLabel(l.type))}</span>
        ${l.furnished ? '<span class="badge badge--furn">مفروش</span>' : ''}
        ${l.status === 'booked' ? '<span class="badge badge--warn">محجوز</span>' : l.status === 'sold' ? '<span class="badge badge--off">تم البيع</span>' : '<span class="badge badge--ok">متاح</span>'}
      </div>
      <h1 class="unit__title">${esc(l.title)}</h1>
      ${loc ? '<div class="unit__loc">📍 ' + esc(loc) + '</div>' : ''}
      <div class="unit__price${hasPrice(l) ? '' : ' is-na'}">${esc(priceTxt)}</div>
      <div class="unit__specs">${specs}</div>
      ${l.description ? '<h2 class="unit__h2">تفاصيل الشقة</h2><p class="unit__desc">' + esc(l.description).replace(/\n/g, '<br>') + '</p>' : ''}
      <div class="unit__actions">
        <a class="btn btn--wa" href="${esc(wa)}" target="_blank" rel="noopener">💬 كلّمنا واتساب</a>
        <a class="btn btn--ghost" href="../index.html">← رجوع للشقق</a>
      </div>
    </div>
  </div>

  ${related ? '<section class="unit__related"><h2 class="unit__h2">شقق مشابهة</h2><div class="urel__grid">' + related + '</div></section>' : ''}
</main>

<footer class="ftr">
  <div class="wrap">
    <div class="ftr__bottom">
      <span>© <span>${new Date().getFullYear()}</span> ${esc(siteName)} — كل الحقوق محفوظة</span>
      <span>الأسعار بالجنيه المصري · الصور تقريبية</span>
    </div>
  </div>
</footer>
</body>
</html>
`;
}

/* ---------- main ---------- */
function main() {
  const data = loadData();
  const settings = data.settings || {};
  const listings = (data.listings || []).slice();

  let base = settings.siteUrl || '';
  if (!base && settings.owner && settings.repo) {
    base = 'https://' + settings.owner + '.github.io/' + settings.repo;
  }
  base = String(base).replace(/\/+$/, '');

  if (!fs.existsSync(UNIT_DIR)) fs.mkdirSync(UNIT_DIR, { recursive: true });
  /* clean previously generated pages */
  fs.readdirSync(UNIT_DIR).forEach(f => {
    if (/\.html?$/i.test(f)) fs.unlinkSync(path.join(UNIT_DIR, f));
  });

  const ctxBase = {
    base,
    siteName: settings.siteName || 'عقاراتي',
    tagline: settings.tagline || '',
    whatsapp: settings.whatsapp || ''
  };

  const byRef = {};
  listings.forEach(l => { byRef[l.id] = l; });

  listings.forEach(l => {
    const related = listings
      .filter(r => r.id !== l.id && (r.city === l.city || r.type === l.type))
      .slice(0, 4);
    const html = pageHTML(l, Object.assign({ related }, ctxBase));
    fs.writeFileSync(path.join(UNIT_DIR, encodeURIComponent(l.id) + '.html'), html, 'utf8');
    console.log('unit/' + l.id + '.html');
  });

  /* sitemap */
  const homeLast = iso(data.updated || Date.now()).slice(0, 10);
  const urls = listings.map(l =>
    '  <url>\n    <loc>' + esc(base + '/unit/' + encodeURIComponent(l.id) + '.html') + '</loc>\n    <lastmod>' +
    iso(l.updatedAt || l.createdAt).slice(0, 10) + '</lastmod>\n  </url>'
  ).join('\n');
  const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    '  <url>\n    <loc>' + esc(base + '/') + '</loc>\n    <lastmod>' + homeLast + '</lastmod>\n  </url>\n' +
    urls + '\n</urlset>\n';
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');
  console.log('sitemap.xml (' + listings.length + ' listings)');

  /* robots.txt */
  const robots = 'User-agent: *\n' +
    'Disallow: /_9f3k7x2q.html\n' +
    'Disallow: /data/auth.js\n' +
    '\nSitemap: ' + base + '/sitemap.xml\n';
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), robots, 'utf8');
  console.log('robots.txt');
}

main();
