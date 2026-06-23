const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = __dirname;
const rootPath = path.resolve(root);
const port = Number(process.env.PORT || 5173);
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
const RADIO_USER_AGENT = 'WatchNations/1.0';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.geojson': 'application/geo+json; charset=utf-8',
  '.png': 'image/png'
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

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(404);
      response.end('Not found');
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

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end('Not found');
        return;
      }

      response.writeHead(200, {
        'Content-Type': types[path.extname(filePath)],
        'Cache-Control': 'no-store'
      });
      response.end(request.method === 'HEAD' ? undefined : data);
    });
  });

server.headersTimeout = 10_000;
server.requestTimeout = 30_000;
server.keepAliveTimeout = 5_000;
server.listen(port, '127.0.0.1', () => {
  console.log(`WatchNations running at http://127.0.0.1:${port}`);
});

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
  const relative = path.relative(rootPath, filePath);
  const [topLevel] = relative.split(path.sep);
  return ['src', 'data', 'assets'].includes(topLevel);
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
    const child = spawn('py', ['-3', script], { stdio: ['pipe', 'pipe', 'pipe'] });
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
      "script-src 'self' https://esm.sh https://cdn.jsdelivr.net https://vjs.zencdn.net",
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
