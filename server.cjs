const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { spawn } = require('child_process');

const root = __dirname;
const rootPath = path.resolve(root);
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || '127.0.0.1';
const MAX_AI_PAYLOAD_BYTES = 600_000;
const MAX_URL_LENGTH = 2048;
const API_RATE_LIMIT_WINDOW_MS = 60_000;
const API_RATE_LIMIT_MAX = 180;
const rateLimitBuckets = new Map();
const RADIO_BROWSER_HOSTS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info'
];
const IPTV_API_BASE = 'https://iptv-org.github.io/api';
const RADIO_USER_AGENT = 'WatchNations/1.0';
const tvCategoryCache = new Map();
const TV_CATEGORY_CACHE_MS = 15 * 60_000;
const compressedFileCache = new Map();
const SEO_LASTMOD = '2026-06-24';
const SEO_ROUTES = new Set(['/about', '/faq', '/privacy-policy', '/feedback', '/countries']);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.geojson': 'application/geo+json; charset=utf-8',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

const server = http.createServer((request, response) => {
    setSecurityHeaders(response);

    if (String(request.url || '').length > MAX_URL_LENGTH) {
      response.writeHead(414);
      response.end('URI too long');
      return;
    }

    if (!['GET', 'HEAD', 'POST'].includes(request.method)) {
      response.writeHead(405);
      response.end('Method not allowed');
      return;
    }

    let url;
    try {
      url = new URL(request.url, `http://${request.headers.host || '127.0.0.1'}`);
    } catch (error) {
      response.writeHead(400);
      response.end('Bad request');
      return;
    }

    if (url.pathname.startsWith('/api/') && !allowApiRequest(request, response)) {
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/ai/rank') {
      readJson(request)
        .then((payload) => sanitizeAIPayload(payload))
        .then((payload) => runPythonAI(payload).catch(() => jsRankFallback(payload)))
        .then((result) => sendJson(response, 200, result))
        .catch(() => sendJson(response, 200, jsRankFallback({ channels: [] })));
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/radio/stations') {
      handleRadioStations(url)
        .then((result) => sendJson(response, 200, result))
        .catch(() => sendJson(response, 502, { stations: [], error: 'Radio service unavailable' }));
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/radio/click') {
      handleRadioClick(url)
        .then((result) => sendJson(response, 200, result))
        .catch(() => sendJson(response, 502, { url: '', error: 'Radio click unavailable' }));
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/tv/category') {
      handleTvCategory(url)
        .then((result) => sendJson(response, 200, result))
        .catch(() => sendJson(response, 502, { channels: [], error: 'TV category unavailable' }));
      return;
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    if (url.pathname === '/sitemap.xml') {
      sendTextResponse(request, response, 200, buildSitemap(), 'application/xml; charset=utf-8', 'public, max-age=3600');
      return;
    }

    if (isSeoRoute(url.pathname)) {
      sendTextResponse(request, response, 200, renderSeoRoute(url.pathname), 'text/html; charset=utf-8', 'public, max-age=3600');
      return;
    }

    let decodedPath;
    try {
      decodedPath = decodeURIComponent(url.pathname);
    } catch (error) {
      response.writeHead(400);
      response.end('Bad request');
      return;
    }

    const relativePath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^[/\\]+/, '');
    const filePath = path.resolve(rootPath, relativePath);

    if (!filePath.startsWith(`${rootPath}${path.sep}`) && filePath !== path.join(rootPath, 'index.html')) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    if (!isAllowedStaticPath(filePath)) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(types, path.extname(filePath))) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    sendStaticFile(request, response, filePath);
  });

server.headersTimeout = 10_000;
server.requestTimeout = 30_000;
server.keepAliveTimeout = 5_000;
server.listen(port, host, () => {
  console.log(`WatchNations running at http://${host}:${port}`);
});

function sendStaticFile(request, response, filePath) {
  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    const etag = `"${stats.size.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}"`;
    if (request.headers['if-none-match'] === etag) {
      response.writeHead(304, {
        'ETag': etag,
        'Cache-Control': staticCacheControl(filePath)
      });
      response.end();
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end('Not found');
        return;
      }

      const headers = {
        'Content-Type': types[path.extname(filePath)],
        'Cache-Control': staticCacheControl(filePath),
        'ETag': etag,
        'Vary': 'Accept-Encoding'
      };
      const encoded = compressStaticBody(request, filePath, data, etag);
      if (encoded.encoding) headers['Content-Encoding'] = encoded.encoding;

      response.writeHead(200, headers);
      response.end(request.method === 'HEAD' ? undefined : encoded.body);
    });
  });
}

function sendTextResponse(request, response, status, text, contentType, cacheControl) {
  const data = Buffer.from(text, 'utf8');
  const etag = `"${data.length.toString(16)}-${Buffer.from(text).subarray(0, 32).toString('hex')}"`;
  if (request.headers['if-none-match'] === etag) {
    response.writeHead(304, {
      'ETag': etag,
      'Cache-Control': cacheControl
    });
    response.end();
    return;
  }

  const headers = {
    'Content-Type': contentType,
    'Cache-Control': cacheControl,
    'ETag': etag,
    'Vary': 'Accept-Encoding'
  };
  const encoded = compressBuffer(request, data, etag);
  if (encoded.encoding) headers['Content-Encoding'] = encoded.encoding;
  response.writeHead(status, headers);
  response.end(request.method === 'HEAD' ? undefined : encoded.body);
}

function compressStaticBody(request, filePath, data, etag) {
  if (data.length < 1024) return { body: data, encoding: '' };
  const ext = path.extname(filePath);
  if (!['.html', '.js', '.css', '.json', '.geojson', '.txt', '.xml', '.webmanifest'].includes(ext)) {
    return { body: data, encoding: '' };
  }

  return compressBuffer(request, data, etag);
}

function compressBuffer(request, data, etag) {
  if (data.length < 1024) return { body: data, encoding: '' };

  const accepted = String(request.headers['accept-encoding'] || '');
  const encoding = accepted.includes('br') ? 'br' : (accepted.includes('gzip') ? 'gzip' : '');
  if (!encoding) return { body: data, encoding: '' };

  const cacheKey = `${etag}:${encoding}`;
  const cached = compressedFileCache.get(cacheKey);
  if (cached) return { body: cached, encoding };

  const body = encoding === 'br'
    ? zlib.brotliCompressSync(data, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } })
    : zlib.gzipSync(data, { level: 6 });
  compressedFileCache.set(cacheKey, body);
  if (compressedFileCache.size > 80) compressedFileCache.delete(compressedFileCache.keys().next().value);
  return { body, encoding };
}

function isSeoRoute(pathname) {
  if (SEO_ROUTES.has(pathname)) return true;
  return /^\/countries\/[a-z]{2}$/i.test(pathname);
}

function renderSeoRoute(pathname) {
  if (pathname === '/about') {
    return seoPage({
      path: pathname,
      title: 'About WatchNations - Free Global TV Discovery',
      description: 'Learn about WatchNations, a free platform for discovering live TV channels and radio stations by country, category, and interactive globe.',
      heading: 'About WatchNations',
      body: [
        'WatchNations helps people discover free live TV channels and radio stations from around the world. The platform is built around country browsing, category discovery, favorites, and an interactive 3D globe.',
        'The service does not require sign-up or subscription. Users can choose a country, browse available channels, and open live streams from public external sources.',
        'WatchNations is neutral and global. It does not host, upload, own, or control video streams. Copyright and DMCA questions can be sent to lindaraymane@gmail.com.'
      ]
    });
  }

  if (pathname === '/faq') {
    return seoPage({
      path: pathname,
      title: 'WatchNations FAQ - Free Live TV Questions',
      description: 'Answers to common WatchNations questions about free live TV, radio stations, favorites, safety, privacy, and external streams.',
      heading: 'Frequently Asked Questions',
      body: [
        'Is WatchNations free? Yes. WatchNations is free to use and does not require an account or subscription.',
        'How do I find channels? Choose a country from the globe, use country search, or browse categories such as news, sports, music, movies, kids, weather, and education.',
        'Why are some channels unavailable? External live streams can change, go offline, or be restricted by the original provider. WatchNations organizes publicly available links but does not control external streams.'
      ]
    });
  }

  if (pathname === '/privacy-policy') {
    return seoPage({
      path: pathname,
      title: 'Privacy Policy - WatchNations',
      description: 'Read the WatchNations privacy policy covering external links, local favorites, analytics, advertising, cookies, and user privacy.',
      heading: 'Privacy Policy',
      body: [
        'WatchNations does not require users to create an account or provide personal information to browse free live TV and radio sources.',
        'Favorite channels may be stored locally in the browser. This means saved favorites stay on the user device and are not sent to WatchNations servers.',
        'The platform may link to external streams and websites. Those third-party sources have their own privacy policies and content rules.'
      ]
    });
  }

  if (pathname === '/feedback') {
    return seoPage({
      path: pathname,
      title: 'Feedback and Copyright Contact - WatchNations',
      description: 'Contact WatchNations to suggest channels, report broken links, send feedback, or submit copyright and DMCA removal requests.',
      heading: 'Feedback and Copyright Contact',
      body: [
        'Users can contact WatchNations to suggest a channel, report a broken link, share a feature idea, or ask about copyright concerns.',
        'WatchNations respects copyright laws and does not host or upload video content. The platform organizes external public sources in good faith.',
        'For feedback, DMCA, or copyright requests, email lindaraymane@gmail.com.'
      ]
    });
  }

  if (pathname === '/countries') return renderCountriesSeoPage();

  const countryMatch = pathname.match(/^\/countries\/([a-z]{2})$/i);
  if (countryMatch) return renderCountrySeoPage(countryMatch[1]);

  return seoPage({
    path: '/',
    title: 'WatchNations - Free Live TV Channels by Country',
    description: 'Explore free live TV channels and radio stations from around the world by country and category.',
    heading: 'WatchNations',
    body: ['Explore global free live TV and radio by country.']
  });
}

function renderCountriesSeoPage() {
  const countries = loadSeoCountries();
  const countryLinks = countries
    .map((country) => `<li><a href="/countries/${country.code.toLowerCase()}">${escapeHtml(country.name)} live TV channels</a></li>`)
    .join('');
  return seoPage({
    path: '/countries',
    title: 'Countries - Watch Free Live TV by Country | WatchNations',
    description: 'Browse countries on WatchNations and discover free live TV channels and radio stations from around the world.',
    heading: 'Browse Live TV by Country',
    bodyHtml: `
      <p>Choose a country to discover free live TV channels and radio stations. Each country page links back to the interactive WatchNations app.</p>
      <ul class="country-grid">${countryLinks}</ul>
    `
  });
}

function renderCountrySeoPage(rawCode) {
  const code = normalizeCountryCode(rawCode);
  const country = loadSeoCountries().find((item) => item.code === code);
  if (!country) {
    return seoPage({
      path: '/countries',
      title: 'Country Not Found - WatchNations',
      description: 'Browse free live TV channels by country on WatchNations.',
      heading: 'Country Not Found',
      body: ['This country is not available yet. Browse the full country list to find available live TV channels.']
    });
  }

  return seoPage({
    path: `/countries/${code.toLowerCase()}`,
    title: `${country.name} Live TV Channels - WatchNations`,
    description: `Watch free live TV channels and radio stations from ${country.name} on WatchNations. Browse by country, category, and interactive globe.`,
    heading: `${country.name} Live TV Channels`,
    body: [
      `WatchNations helps users discover free live TV channels and radio stations from ${country.name}.`,
      `Open the WatchNations app to browse ${country.name} channels, save favorites, and explore related categories such as news, sports, music, movies, and weather.`,
      'Streams are provided by external public sources. WatchNations does not host or control video content.'
    ],
    cta: { href: `/?country=${code}`, label: `Open ${country.name} in WatchNations` }
  });
}

function seoPage({ path: pathname, title, description, heading, body = [], bodyHtml = '', cta }) {
  const canonical = `https://watchnations.com${pathname === '/' ? '/' : pathname}`;
  const paragraphs = body.map((text) => `<p>${escapeHtml(text)}</p>`).join('');
  const action = cta ? `<p><a class="button" href="${escapeHtml(cta.href)}">${escapeHtml(cta.label)}</a></p>` : '<p><a class="button" href="/">Open WatchNations App</a></p>';
  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="google-site-verification" content="BOGebDfiNtUgDvVuRNuqb7sQb92qcvZ3Y-CkEgRrhKE">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="icon" href="/assets/watchnations-tv-logo.png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="WatchNations">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="https://watchnations.com/assets/watchnations-tv-logo.png">
  <style>
    :root{color:#f7f9fb;background:#050609;font-family:Inter,Segoe UI,Tahoma,Arial,sans-serif}
    body{margin:0;background:#050609;color:#f7f9fb;line-height:1.7}
    header,main,footer{max-width:980px;margin:auto;padding:28px}
    header{display:flex;gap:18px;align-items:center;border-bottom:1px solid rgba(255,255,255,.14)}
    img{width:72px;height:72px;object-fit:contain}
    a{color:#ff4a42} .brand{font-weight:900;font-size:28px}.brand span{color:#ff0800}
    h1{font-size:clamp(34px,6vw,62px);line-height:1.05;margin:34px 0 18px}
    p{max-width:760px;color:#d7dbe3}.button{display:inline-block;margin-top:10px;padding:12px 18px;border:1px solid #ff0800;border-radius:8px;color:#fff;background:#ff0800;text-decoration:none;font-weight:900}
    nav{display:flex;gap:14px;flex-wrap:wrap;margin-top:18px}.country-grid{columns:3 220px;padding-left:20px}.country-grid li{break-inside:avoid;margin:0 0 8px}
    footer{border-top:1px solid rgba(255,255,255,.14);color:#b8bfca}
  </style>
</head>
<body>
  <header><a href="/"><img src="/assets/watchnations-tv-logo.png" alt="WatchNations logo"></a><div><div class="brand"><span>Watch</span>Nations</div><nav><a href="/">App</a><a href="/countries">Countries</a><a href="/about">About</a><a href="/faq">FAQ</a><a href="/privacy-policy">Privacy</a><a href="/feedback">Feedback</a></nav></div></header>
  <main>
    <h1>${escapeHtml(heading)}</h1>
    ${bodyHtml || paragraphs}
    ${action}
  </main>
  <footer>WatchNations does not host video streams. It organizes publicly available external links in good faith.</footer>
</body>
</html>`;
}

function buildSitemap() {
  const staticUrls = ['/', '/countries', '/about', '/faq', '/privacy-policy', '/feedback'];
  const countryUrls = loadSeoCountries().map((country) => `/countries/${country.code.toLowerCase()}`);
  const urls = [...staticUrls, ...countryUrls]
    .map((pathname) => `  <url>
    <loc>https://watchnations.com${pathname === '/' ? '/' : pathname}</loc>
    <lastmod>${SEO_LASTMOD}</lastmod>
    <changefreq>${pathname.startsWith('/countries/') ? 'weekly' : 'daily'}</changefreq>
    <priority>${pathname === '/' ? '1.0' : pathname.startsWith('/countries/') ? '0.7' : '0.8'}</priority>
  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function loadSeoCountries() {
  try {
    const file = fs.readFileSync(path.join(rootPath, 'data', 'iptv-countries.min.json'), 'utf8');
    const countries = JSON.parse(file);
    return Array.isArray(countries)
      ? countries
        .map((country) => ({ code: normalizeCountryCode(country.code), name: safeText(country.name, 120) }))
        .filter((country) => country.code && country.name)
      : [];
  } catch (error) {
    return [];
  }
}

function allowApiRequest(request, response) {
  const key = request.socket.remoteAddress || 'local';
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key) || {
    count: 0,
    resetAt: now + API_RATE_LIMIT_WINDOW_MS
  };

  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + API_RATE_LIMIT_WINDOW_MS;
  }

  bucket.count += 1;
  rateLimitBuckets.set(key, bucket);

  if (rateLimitBuckets.size > 250) {
    for (const [entryKey, entry] of rateLimitBuckets) {
      if (now > entry.resetAt) rateLimitBuckets.delete(entryKey);
    }
  }

  if (bucket.count > API_RATE_LIMIT_MAX) {
    sendJson(response, 429, { error: 'Too many requests' });
    return false;
  }

  return true;
}

function isAllowedStaticPath(filePath) {
  if (filePath === path.join(rootPath, 'index.html')) return true;
  if (['robots.txt', 'sitemap.xml', 'site.webmanifest', 'llms.txt'].some((file) => filePath === path.join(rootPath, file))) return true;
  const relative = path.relative(rootPath, filePath);
  const [topLevel] = relative.split(path.sep);
  return ['src', 'data', 'assets'].includes(topLevel);
}

function staticCacheControl(filePath) {
  const relative = path.relative(rootPath, filePath);
  const [topLevel] = relative.split(path.sep);
  if (topLevel === 'data' || topLevel === 'assets') return 'public, max-age=604800';
  if (['robots.txt', 'sitemap.xml', 'site.webmanifest', 'llms.txt'].includes(relative)) return 'public, max-age=3600';
  if (topLevel === 'src') return 'no-cache';
  return 'no-store';
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      if (typeof chunk !== 'string') chunk = chunk.toString('utf8');
      body += chunk;
      if (Buffer.byteLength(body, 'utf8') > MAX_AI_PAYLOAD_BYTES) {
        reject(new Error('Payload too large'));
        request.destroy();
      }
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function runPythonAI(payload) {
  return new Promise((resolve, reject) => {
    const script = path.join(root, 'ai_engine.py');
    const command = process.platform === 'win32' ? 'py' : 'python3';
    const args = process.platform === 'win32' ? ['-3', script] : [script];
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '';
    let error = '';
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error('Python AI timed out'));
    }, 2500);

    child.stdout.on('data', (chunk) => {
      output += chunk;
    });
    child.stderr.on('data', (chunk) => {
      error += chunk;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(error || `Python exited with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(output));
      } catch (parseError) {
        reject(parseError);
      }
    });
    child.stdin.end(JSON.stringify(payload));
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  response.end(JSON.stringify(payload));
}

async function handleRadioStations(url) {
  const country = normalizeCountryCode(url.searchParams.get('country'));
  if (!country) return { stations: [] };

  const params = new URLSearchParams({
    countrycode: country,
    hidebroken: 'true',
    order: 'clickcount',
    reverse: 'true',
    limit: '250'
  });
  const stations = await fetchRadioBrowser(`/json/stations/search?${params.toString()}`);
  return {
    country,
    stations: Array.isArray(stations)
      ? stations.map((station) => sanitizeRadioStation(station, country)).filter((station) => station.url)
      : []
  };
}

async function handleRadioClick(url) {
  const id = safeText(url.searchParams.get('id'), 80);
  if (!/^[a-z0-9-]{16,80}$/i.test(id)) return { url: '' };
  const result = await fetchRadioBrowser(`/json/url/${encodeURIComponent(id)}`);
  return {
    url: safeUrl(result?.url),
    ok: Boolean(result?.ok)
  };
}

async function handleTvCategory(url) {
  const category = safeText(url.searchParams.get('category'), 40).toLowerCase() || 'all';
  const allowed = new Set([
    'all', 'top-news', 'news', 'music', 'sports', 'auto', 'animation', 'business', 'classic',
    'comedy', 'cooking', 'culture', 'documentary', 'education', 'entertainment', 'family',
    'general', 'kids', 'legislative', 'lifestyle', 'movies', 'outdoor', 'relax', 'religious',
    'series', 'science', 'shop', 'travel', 'weather'
  ]);
  if (!allowed.has(category)) return { category, channels: [] };

  const limit = Math.max(100, Math.min(3000, Number(url.searchParams.get('limit') || 1800)));
  const cacheKey = `${category}:${limit}`;
  const cached = tvCategoryCache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < TV_CATEGORY_CACHE_MS) return cached.payload;

  const [channels, streams] = await Promise.all([
    fetchJson(`${IPTV_API_BASE}/channels.json`),
    fetchJson(`${IPTV_API_BASE}/streams.json`)
  ]);
  const channelById = new Map(channels.map((channel) => [channel.id, channel]));
  const output = [];

  for (const stream of streams) {
    const channelId = stream.channel || stream.channel_id || stream.channelId;
    const channel = channelById.get(channelId);
    if (!channel || !channelMatchesServerCategory(channel, category)) continue;
    const item = sanitizeTvChannel(channel, stream);
    if (!item.url) continue;
    output.push(item);
    if (output.length >= limit) break;
  }

  const payload = { category, channels: output };
  tvCategoryCache.set(cacheKey, { createdAt: Date.now(), payload });
  if (tvCategoryCache.size > 80) tvCategoryCache.delete(tvCategoryCache.keys().next().value);
  return payload;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(30_000)
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status}`);
  return response.json();
}

function channelMatchesServerCategory(channel, category) {
  if (category === 'all') return true;
  const categories = Array.isArray(channel?.categories) ? channel.categories.map((item) => String(item).toLowerCase()) : [];
  const mapped = category === 'top-news' ? 'news' : category;
  if (categories.includes(mapped)) return true;
  const haystack = `${channel?.name || ''} ${categories.join(' ')}`.toLowerCase();
  const keywords = {
    news: ['news', 'noticias', 'actualite', 'cnn', 'bbc', 'al jazeera', 'france 24'],
    'top-news': ['news', 'breaking', 'headline', 'cnn', 'bbc', 'al jazeera', 'france 24'],
    sports: ['sport', 'football', 'soccer', 'tennis', 'basketball', 'racing', 'f1'],
    music: ['music', 'mtv', 'hits', 'pop', 'rock'],
    movies: ['movie', 'film', 'cinema'],
    kids: ['kids', 'children', 'cartoon', 'disney', 'baby'],
    business: ['business', 'finance', 'economy', 'markets'],
    weather: ['weather', 'meteo', 'forecast']
  }[category] || [mapped];
  return keywords.some((keyword) => haystack.includes(keyword));
}

function sanitizeTvChannel(channel, stream) {
  const country = normalizeCountryCode(channel?.country || (Array.isArray(channel?.countries) ? channel.countries[0] : ''));
  const categories = Array.isArray(channel?.categories) && channel.categories.length ? channel.categories.join(', ') : 'General';
  const url = safeUrl(stream?.url);
  return {
    id: safeText(channel?.id, 120) || safeText(stream?.channel, 120),
    name: safeText(channel?.name, 160) || 'Live TV',
    url,
    logo: '',
    category: safeText(categories.split(',')[0] || 'general', 80).toLowerCase(),
    sourceCategory: safeText(categories, 120),
    group: safeText(categories, 80),
    quality: safeText(stream?.quality, 32),
    country,
    type: 'tv'
  };
}

async function fetchRadioBrowser(pathname) {
  let lastError;
  for (const host of RADIO_BROWSER_HOSTS) {
    try {
      const response = await fetch(`${host}${pathname}`, {
        headers: {
          'User-Agent': RADIO_USER_AGENT,
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(8500)
      });
      if (!response.ok) throw new Error(`Radio Browser ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Radio Browser unavailable');
}

function sanitizeRadioStation(station, fallbackCountry) {
  const country = normalizeCountryCode(station?.countrycode || fallbackCountry);
  const tags = safeText(station?.tags, 120)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 3);
  const language = safeText(station?.language, 80)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)[0] || '';
  const codec = safeText(station?.codec, 24);
  const bitrate = Number(station?.bitrate || 0);
  const group = tags.length ? tags.join(', ') : (language || 'Radio');
  const quality = [codec, bitrate > 0 ? `${bitrate}kbps` : ''].filter(Boolean).join(' ');

  return {
    id: safeText(station?.stationuuid, 90),
    name: safeText(station?.name, 160) || 'Live Radio',
    url: safeUrl(station?.url_resolved) || safeUrl(station?.url),
    logo: safeUrl(station?.favicon),
    category: safeText(tags[0] || 'radio', 80).toLowerCase(),
    group,
    quality,
    country,
    type: 'radio'
  };
}

function sanitizeAIPayload(payload) {
  const query = String(payload?.query || '').slice(0, 120);
  const channels = Array.isArray(payload?.channels) ? payload.channels : [];

  return {
    query,
    channels: channels.slice(0, 180).map((channel) => ({
      id: safeText(channel.id, 120),
      name: safeText(channel.name, 160),
      url: safeUrl(channel.url),
      logo: safeUrl(channel.logo),
      category: safeText(channel.category, 80),
      group: safeText(channel.group, 80),
      quality: safeText(channel.quality, 32),
      country: safeText(channel.country, 4),
      type: safeText(channel.type, 12)
    }))
  };
}

function normalizeCountryCode(code = '') {
  const normalized = String(code).trim().toUpperCase();
  if (!normalized || normalized === '-99') return '';
  const aliases = { EH: 'MA', UK: 'GB', FX: 'FR', EL: 'GR' };
  const code2 = aliases[normalized] || normalized;
  return /^[A-Z]{2}$/.test(code2) ? code2 : '';
}

function safeText(value, maxLength) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, maxLength);
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch (error) {
    return '';
  }
}

function jsRankFallback(payload) {
  const channels = Array.isArray(payload.channels) ? payload.channels : [];
  const query = String(payload.query || '').toLowerCase().trim();
  const ranked = channels
    .map((channel) => {
      const haystack = `${channel.name || ''} ${channel.group || ''} ${channel.quality || ''}`.toLowerCase();
      let score = 1;
      if (query && haystack.includes(query)) score += 30;
      if (query && haystack.startsWith(query)) score += 30;
      if (String(channel.url || '').includes('.m3u8')) score += 3;
      return { ...channel, _score: score };
    })
    .filter((channel) => !query || channel._score > 1)
    .sort((a, b) => b._score - a._score || String(a.name).localeCompare(String(b.name)));

  return {
    channels: ranked.slice(0, 120),
    insight: `JavaScript AI fallback ranked ${ranked.length} channels`
  };
}

function setSecurityHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  response.setHeader('X-DNS-Prefetch-Control', 'off');
  response.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  response.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'sha256-dQ/lscS4ySTLL6Y7qdfhfM7oyHHDmS+qiDbr8eK+A+k=' https://esm.sh https://cdn.jsdelivr.net https://vjs.zencdn.net",
      "style-src 'self' 'unsafe-inline' https://vjs.zencdn.net",
      "img-src 'self' https: data:",
      "connect-src 'self' https: http:",
      "media-src https: http: blob:",
      "font-src 'self' data:",
      "worker-src blob:",
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "form-action 'none'"
    ].join('; ')
  );
}
