const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { spawn } = require('child_process');

const root = __dirname;
const rootPath = path.resolve(root);
const port = Number(process.env.PORT || 5173);
const host = process.env.HOST || '127.0.0.1';
const MAX_AI_PAYLOAD_BYTES = 600_000;
const MAX_URL_LENGTH = 2048;
const API_RATE_LIMIT_WINDOW_MS = 60_000;
const API_RATE_LIMIT_MAX = 180;
const DEVELOPER_STATE_FILE = path.join(rootPath, 'data', 'developer-state.json');
const DEFAULT_DEVELOPER_PASSWORD = 'laxa123';
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
const SEO_ROUTES = new Set(['/about', '/faq', '/privacy', '/privacy-policy', '/feedback', '/countries']);
const SEO_CATEGORIES = [
  ['all', 'All Channels', 'free live TV channels from all countries'],
  ['top-news', 'Top News', 'top live news channels from around the world'],
  ['news', 'News', 'free live news TV channels by country'],
  ['music', 'Music', 'free live music TV channels worldwide'],
  ['sports', 'Sports', 'free live sports TV channels worldwide'],
  ['auto', 'Auto', 'automotive and car TV channels'],
  ['animation', 'Animation', 'animation and cartoon TV channels'],
  ['business', 'Business', 'business, finance, and markets TV channels'],
  ['classic', 'Classic', 'classic and retro TV channels'],
  ['comedy', 'Comedy', 'comedy and entertainment TV channels'],
  ['cooking', 'Cooking', 'cooking, food, and recipe TV channels'],
  ['culture', 'Culture', 'culture and arts TV channels'],
  ['documentary', 'Documentary', 'documentary TV channels worldwide'],
  ['education', 'Education', 'educational TV channels'],
  ['entertainment', 'Entertainment', 'entertainment TV channels worldwide'],
  ['family', 'Family', 'family TV channels'],
  ['general', 'General', 'general live TV channels'],
  ['kids', 'Kids', 'kids and children TV channels'],
  ['legislative', 'Legislative', 'parliament and legislative TV channels'],
  ['lifestyle', 'Lifestyle', 'lifestyle TV channels'],
  ['movies', 'Movies', 'movie and cinema TV channels'],
  ['outdoor', 'Outdoor', 'outdoor and adventure TV channels'],
  ['relax', 'Relax', 'relaxing and ambient TV channels'],
  ['religious', 'Religious', 'religious and spiritual TV channels'],
  ['series', 'Series', 'series and drama TV channels'],
  ['science', 'Science', 'science and technology TV channels'],
  ['shop', 'Shop', 'shopping TV channels'],
  ['travel', 'Travel', 'travel and tourism TV channels'],
  ['weather', 'Weather', 'weather forecast TV channels']
];
const SEO_KEYWORDS = [
  "interactive 3d globe tv channels",
  "watch tv channels by country map",
  "free live tv no email required",
  "random tv channel discovery",
  "watch tv online free without registration",
  "regarder tv en direct gratuit sans inscription",
  "tv en direct monde entier",
  "ver tv online gratis sin registrarse",
  "ver television en vivo gratis",
  "world cup 2026 live stream free",
  "olympics 2026 live streaming free",
  "champions league live stream free",
  "watch global tv online free",
  "watch local tv online free",
  "free live tv no subscription",
  "tv streaming no signup",
  "international tv channels free",
  "world tv channels streaming",
  "live TV",
  "free streaming",
  "online television",
  "news live",
  "sports streaming",
  "regarder tv en direct gratuit",
  "watch tv channels by country",
  "discover international tv channels",
  "listen to radio stations worldwide",
  "free tv no account required",
  "global tv channel aggregator",
  "قنوات عربية بث مباشر بدون اشتراك",
  "تلفزيون عربي اونلاين مجاني",
  "راديو عربي بث مباشر مجاني",
  "مشاهدة قنوات عالمية اونلاين",
  "دوري روشن السعودي بث مباشر",
  "watch reality tv online free",
  "watch live tv without registration",
  "world tv streaming live streaming",
  "discover tv channels online free",
  "watch business tv online free",
  "watch canada tv online free",
  "saudi arabia live tv streaming",
  "free tv channels without registration",
  "watch sports online online free",
  "world tv streaming channels list",
  "watch family tv online free",
  "watch sports online no signup",
  "free live tv without registration",
  "watch comedy tv online free",
  "digital tv channels free online",
  "watch global tv channels list",
  "watch kids tv online free",
  "world tv streaming without registration",
  "how to free live tv",
  "watch tv streaming no signup",
  "watch cooking tv online free",
  "discover tv channels live streaming",
  "saudi arabia tv app free",
  "news channels live online free",
  "world tv streaming online free",
  "international tv channels online free",
  "watch live tv online free",
  "watch health tv online free",
  "watch fashion tv online free",
  "watch nature tv online free",
  "saudi arabia movies online free",
  "international tv channels live streaming",
  "قنوات عربية مجانية بدون تسجيل",
  "watch educational tv online free",
  "watch tv on laptop free",
  "watch news tv online free",
  "watch mexico tv online free",
  "world tv streaming no subscription",
  "watch indonesia tv online free",
  "discover tv channels no signup",
  "watch sports tv online free",
  "random tv channel live streaming",
  "watch global tv by country",
  "tv online free live streaming",
  "free tv app no signup",
  "watch science tv online free",
  "discover tv channels no subscription",
  "free saudi arabia tv channels",
  "watch global tv live streaming",
  "watch global tv without registration",
  "watch cartoon tv online free",
  "how to discover tv channels",
  "watch germany tv online free",
  "watch nigeria tv online free",
  "saudi arabia tv channels online",
  "saudi arabia tv guide online",
  "free tv channel aggregator worldwide",
  "watch france tv online free",
  "watch korea tv online free",
  "مشاهدة مسلسلات عربية بث مباشر",
  "موقع قنوات عربية hd بث مباشر",
  "افضل موقع قنوات عربية للمغتربين مجاني",
  "بث مباشر قنوات عربية بدون تقطيع",
  "قنوات عربية للاطفال تعليمية بث مباشر",
  "قنوات مسيحية عربية بث مباشر مجاني",
  "كيف اشاهد قنوات عربية بث مباشر مجاني بدون تسجيل",
  "documentaires live gratuit",
  "oesterreich sender kostenlos",
  "niederlande streaming gratis",
  "dokumentationen sender kostenlos",
  "nachrichten streaming gratis",
  "kostenlos dokumentationen online",
  "unterhaltung sender kostenlos",
  "chaines actualites gratuites",
  "chaines religion gratuites",
  "voir documentaires gratuit",
  "watch indian tv usa",
  "ver chile online gratis",
  "canales de chile gratis",
  "regarder divertissement en direct",
  "tv italiana online gratis",
  "tv brasileira online gratis",
  "canales de tv gratis",
  "ver argentina online gratis",
  "ver peliculas online gratis",
  "watch indian tv uk",
  "programas de tv online",
  "tv indonesia online gratis",
  "tv sverige online gratis",
  "ver italia online gratis",
  "canales de brasil gratis",
  "canales de moda gratis",
  "ver religion online gratis",
  "cote ivoire live gratuit",
  "tv divertissement sans inscription",
  "مسلسلات عربية بث مباشر",
  "canais de tv gratis",
  "divertissement tv en ligne",
  "مشاهدة قنوات فلسطينية بث مباشر",
  "مشاهدة قنوات موسيقى بث مباشر",
  "直播 电视 免费",
  "电影 在线 免费",
  "canlı tv izle",
  "体育 直播 免费",
  "电视剧 免费 观看",
  "canlı maç izle",
  "免费 在线 电视",
  "新闻 直播 免费",
  "综艺 节目 免费",
  "高清 电视 直播",
  "央视 直播 免费",
  "手机 电视 直播",
  "卫视 直播 免费",
  "美国 电视 直播",
  "免费 电视 直播 软件",
  "韩国 电视 直播",
  "fernsehen online kostenlos",
  "bein sports izle",
  "日本 电视 直播",
  "港澳 电视 直播",
  "网络电视 免费看",
  "英国 电视 直播",
  "sport live stream",
  "morocco match today",
  "dizi tv izle",
  "ücretsiz tv izle",
  "免费 全球 电视 直播",
  "台湾 电视 直播",
  "champions league stream",
  "bundesliga live stream",
  "live tv stream gratis",
  "morocco live stream",
  "match maroc en direct",
  "مباراة المغرب اليوم",
  "watch morocco match",
  "film tv izle",
  "maroc match aujourd hui",
  "filme online kostenlos",
  "morocco football live",
  "spor tv izle",
  "بث مباشر المنتخب المغربي",
  "morocco game today",
  "regarder maroc en direct",
  "無料 テレビ オンライン",
  "kostenlose tv sender",
  "serien online kostenlos",
  "morocco world cup",
  "show tv izle",
  "مشاهدة مباراة المغرب",
  "アニメ 無料 視聴",
  "free tv online",
  "kanal d izle",
  "映画 オンライン 無料",
  "atv izle",
  "tv online schauen kostenlos",
  "marruecos partido hoy",
  "morocco afcon",
  "live tv streaming",
  "online tv kanalları",
  "trt izle",
  "المنتخب المغربي مباشر",
  "streaming match maroc",
  "ライブ tv 視聴",
  "韓国 ドラマ 無料",
  "fox tv izle",
  "live tv streaming deutschland",
  "ver marruecos en vivo",
  "morocco vs portugal",
  "assistir tv online gratis",
  "haber tv izle",
  "مباراة المغرب القادمة",
  "equipe maroc live",
  "スポーツ ライブ 無料",
  "marruecos mundial",
  "morocco vs france",
  "tv8 izle",
  "مباراة المغرب بث مباشر",
  "gratis tv kijken online",
  "deutsche tv sender online",
  "partido marruecos directo",
  "morocco vs spain",
  "marrocos vs portugal",
  "tv ao vivo gratis",
  "euro sport izle",
  "maroc coupe du monde",
  "sport tv live",
  "海外 テレビ 無料",
  "news live stream",
  "live tv streamen",
  "ニュース ライブ 無料",
  "ausländische tv sender",
  "marruecos copa africa",
  "marruecos streaming gratis",
  "morocco vs croatia",
  "marocco vs italia",
  "marrocos jogo hoje",
  "ulusal tv izle",
  "الأسود مباشر",
  "maroc qualif can",
  "films tv gratis",
  "tv kijken gratis",
  "海外 ドラマ 無料 視聴",
  "nachrichten tv online",
  "dokumentationen online",
  "marokko vs deutschland",
  "marruecos vs portugal",
  "morocco vs belgium",
  "marocco vs portogallo",
  "assistir marrocos ao vivo",
  "marrocos vs brasil",
  "canlı tv izle hd kesintisiz",
  "gratis tv online",
  "مباراة المغرب والبرتغال",
  "match maroc france",
  "marokko vs nederland",
  "nederlandse tv online",
  "日本 tv 海外 視聴",
  "無料 テレビ 視聴 アプリ",
  "international tv sender",
  "canais de tv online",
  "series online kijken",
  "kinderfernsehen online",
  "marruecos eliminatorias",
  "marruecos vs francia",
  "marrocos transmissao online",
  "yabancı tv izle",
  "titta på fotboll live gratis",
  "مباراة المغرب وفرنسا",
  "match maroc portugal",
  "gratis online tv kijken",
  "marokko wedstrijd vandaag",
  "nieuws tv live",
  "子供 番組 無料",
  "filmer tv gratis",
  "国際 ニュース 無料",
  "marokko spiel heute",
  "musik tv online",
  "marruecos vs españa",
  "morocco vs canada",
  "marrocos ao vivo gratis",
  "marrocos vs franca",
  "مباراة المغرب وإسبانيا",
  "match maroc espagne",
  "buitenlandse tv online",
  "marokko live stream",
  "音楽 番組 無料",
  "serier online gratis",
  "svensk tv online",
  "reality tv gratis",
  "料理 番組 無料",
  "marokko vs frankreich",
  "wetter tv online",
  "morocco vs iran",
  "marocco partita oggi",
  "marocco streaming gratis",
  "marocco vs francia",
  "marrocos vs argentina",
  "marrocos vs espanha",
  "free tv online channels",
  "ücretsiz tv izleme sitesi",
  "nyheter tv live",
  "titta på tv gratis",
  "مباراة المغرب وكرواتيا",
  "match maroc belgique",
  "internationale tv zenders",
  "kinder tv gratis",
  "live tv kijken gratis voetbal",
  "marokko gratis stream",
  "marokko vs belgie",
  "marokko vs frankrijk",
  "バラエティ 番組 無料",
  "marokko kostenlos stream",
  "marokko vs belgien",
  "internationella tv kanaler",
  "gratis tv på nett",
  "comedy tv online",
  "科技 ニュース 無料",
  "marocco live gratis",
  "marocco vs belgio",
  "free tv online movies",
  "marokko live gratis",
  "kultur tv online",
  "marokko vs spanien",
  "marokko weltmeisterschaft",
  "marruecos vs croacia",
  "morocco vs brazil",
  "marocco diretta streaming",
  "marocco vs spagna",
  "marrocos copa do mundo",
  "marrocos vs croacia",
  "tv ao vivo gratis futebol",
  "live tv streaming india",
  "dokumentär tv gratis",
  "titta på tv kanaler gratis",
  "utländsk tv online",
  "مباراة المغرب وبلجيكا",
  "match maroc croatie",
  "nrk tv online",
  "marokko vs spanje",
  "marokko wereldbeker",
  "muziek tv online",
  "documentary 無料",
  "経済 ニュース 無料",
  "tv gratis na internet",
  "live tv streaming cricket",
  "marokko vs brasilien",
  "marokko vs kroatien",
  "marruecos vs belgica",
  "morocco vs argentina",
  "marocco mondiale",
  "marocco vs croazia",
  "marrocos vs belgica",
  "barn tv gratis",
  "titta på tv4 online gratis",
  "internasjonale tv kanaler",
  "live tv streaming gratis",
  "documentaire tv gratis",
  "marokko online kijken",
  "marokko vs kroatie",
  "旅行 番組 無料",
  "marokko online schauen",
  "marocco vs brasile",
  "canais esportes ao vivo",
  "free tv online sports",
  "marokko afrika cup",
  "marruecos vs canada",
  "morocco vs germany",
  "marrocos copa africa",
  "marrocos vs canada",
  "tv ao vivo gratis globo",
  "free tv online ipl",
  "live tv streaming football",
  "مباراة المغرب وكندا",
  "match maroc canada",
  "dokumentar tv gratis",
  "se tv gratis online",
  "tv2 online gratis",
  "marokko afcon",
  "marokko vs brazilie",
  "natuur tv online",
  "weer tv online",
  "marokko vs argentinien",
  "marocco coppa africa",
  "tv online filmes gratis",
  "live tv streaming news",
  "marokko vs kanada",
  "marruecos vs iran",
  "morocco vs netherlands",
  "marocco vs argentina",
  "marocco vs canada",
  "marrocos vs ira",
  "tv online internacional",
  "natur tv online",
  "väder tv online",
  "مباراة المغرب وإيران",
  "match maroc iran",
  "musikk tv online",
  "norsk tv gratis på nett",
  "tv norge online gratis",
  "marokko vs canada",
  "wetenschap tv online",
  "marokko qualifikation",
  "marokko vs niederlande",
  "marruecos vs brasil",
  "morocco vs england",
  "assistir tv aberta online",
  "marrocos eliminatorias",
  "tv online novelas gratis",
  "free tv online app",
  "free tv online hindi",
  "مباراة المغرب والبرازيل",
  "match maroc bresil",
  "marokko kwalificatie",
  "marokko vs argentinie",
  "marokko vs england",
  "marruecos vs argentina",
  "morocco vs italy",
  "marocco qualificazione",
  "marocco vs germania",
  "marocco vs iran",
  "assistir tv online gratis apk",
  "marrocos vs alemanha",
  "free tv online bangladesh",
  "vetenskap tv online",
  "مباراة المغرب والأرجنتين",
  "match maroc argentine",
  "gratis tysk tv på nettet",
  "vær tv online",
  "marokko vs iran",
  "tv ao vivo gratis noticias",
  "marokko vs italien",
  "marruecos vs alemania",
  "marocco vs olanda",
  "marrocos vs holanda",
  "tv online gratis no pc",
  "live tv streaming english",
  "live tv streaming hd",
  "مباراة المغرب وألمانيا",
  "match maroc allemagne",
  "marokko vs duitsland",
  "marruecos vs holanda",
  "marocco vs inghilterra",
  "assistir tv do brasil",
  "marrocos vs inglaterra",
  "tv gratis android",
  "free tv online pakistan",
  "مباراة المغرب وهولندا",
  "match maroc pays bas",
  "vitenskap tv online",
  "marokko vs engeland",
  "marruecos vs inglaterra",
  "canais de tv online hd",
  "marrocos vs italia",
  "tv ao vivo gratis iphone",
  "live tv streaming bpl",
  "مباراة المغرب وإنجلترا",
  "match maroc angleterre",
  "marokko vs italie",
  "marruecos vs italia",
  "tv gratis smart tv",
  "free tv online tamil",
  "مباراة المغرب وإيطاليا",
  "match maroc italie",
  "canais de tv online aplicativo",
  "live tv streaming bbc",
  "live tv streaming urdu"
];
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.geojson': 'application/geo+json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
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

    if (request.method === 'POST' && url.pathname === '/api/visitors/track') {
      readJson(request)
        .then((payload) => trackVisitor(payload, request))
        .then((result) => sendJson(response, 200, result))
        .catch(() => sendJson(response, 200, publicVisitorStats()));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/developer/login') {
      readJson(request)
        .then((payload) => {
          if (!verifyDeveloperPassword(payload?.password)) {
            sendJson(response, 401, { ok: false, error: 'Invalid password' });
            return;
          }
          sendJson(response, 200, { ok: true, stats: developerStats() });
        })
        .catch(() => sendJson(response, 400, { ok: false, error: 'Bad request' }));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/developer/password') {
      readJson(request)
        .then((payload) => {
          const currentPassword = String(payload?.currentPassword || '');
          const newPassword = String(payload?.newPassword || '');
          if (!verifyDeveloperPassword(currentPassword)) {
            sendJson(response, 401, { ok: false, error: 'Invalid current password' });
            return;
          }
          const validationError = validateDeveloperPassword(newPassword);
          if (validationError) {
            sendJson(response, 400, { ok: false, error: validationError });
            return;
          }
          const state = loadDeveloperState();
          state.passwordHash = hashDeveloperSecret(newPassword);
          state.updatedAt = new Date().toISOString();
          saveDeveloperState(state);
          sendJson(response, 200, { ok: true, stats: developerStats() });
        })
        .catch(() => sendJson(response, 400, { ok: false, error: 'Bad request' }));
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/radio/stations') {
      handleRadioStations(url)
        .then((result) => sendJson(response, 200, result))
        .catch(() => sendJson(response, 200, { stations: [], error: 'Radio service unavailable' }));
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/radio/click') {
      handleRadioClick(url)
        .then((result) => sendJson(response, 200, result))
        .catch(() => sendJson(response, 200, { url: '', error: 'Radio click unavailable' }));
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/tv/category') {
      handleTvCategory(url)
        .then((result) => sendJson(response, 200, result))
        .catch(() => sendJson(response, 200, { channels: [], error: 'TV category unavailable' }));
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
      sendTextResponse(request, response, 200, renderSeoRoute(url.pathname), 'text/html; charset=utf-8', 'no-cache, max-age=0, must-revalidate');
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
      if (path.relative(rootPath, filePath) === 'hdWiS7.js') {
        headers['Service-Worker-Allowed'] = '/';
      }
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
  if (pathname === '/categories') return true;
  return /^\/countries\/[a-z]{2}$/i.test(pathname) || /^\/categories\/[a-z0-9-]+$/i.test(pathname);
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

  if (pathname === '/privacy' || pathname === '/privacy-policy') {
    return seoPage({
      path: pathname,
      title: 'Privacy Policy - WatchNations',
      description: 'Read the WatchNations privacy policy covering external links, local favorites, analytics, cookies, and user privacy.',
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
  if (pathname === '/categories') return renderCategoriesSeoPage();

  const countryMatch = pathname.match(/^\/countries\/([a-z]{2})$/i);
  if (countryMatch) return renderCountrySeoPage(countryMatch[1]);
  const categoryMatch = pathname.match(/^\/categories\/([a-z0-9-]+)$/i);
  if (categoryMatch) return renderCategorySeoPage(categoryMatch[1]);

  return seoPage({
    path: '/',
    title: 'WatchNations - Watch Global TV Online Free',
    description: 'Watch global TV online free by country with no signup. Explore live news, sports, radio, and international channels.',
    heading: 'WatchNations',
    body: [
      'WatchNations is a global TV channel aggregator for people who want to watch global TV online free, watch local TV online free, browse a world TV channel list, and discover international TV channels free.',
      'Use interactive 3D globe TV channels, free live TV no subscription, TV streaming no signup, online television, world TV channels streaming, news live, sports streaming, radio stations worldwide, and electronic newspapers by country from one free app.',
      'WatchNations also supports sports discovery keywords such as world cup 2026 live stream free, olympics 2026 live streaming free, champions league live stream free, and دوري روشن السعودي بث مباشر.',
      'French viewers can use WatchNations to regarder tv en direct gratuit and explore tv en direct monde entier.',
      'Arabic users can explore مشاهدة قنوات عربية بث مباشر مجانا, قنوات عربية بث مباشر بدون اشتراك, قنوات سعودية بث مباشر, قنوات مصرية بث مباشر مجاني, and قنوات اماراتية اونلاين.'
    ]
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
    description: 'Browse countries on WatchNations to watch TV channels by country, explore an IPTV list by country, and listen to radio stations worldwide.',
    heading: 'Browse Live TV by Country',
    bodyHtml: `
      <p>Choose a country to discover free live TV channels, radio stations worldwide, and a global TV channel list free to browse. Each country page links back to the interactive WatchNations app.</p>
      <ul class="country-grid">${countryLinks}</ul>
    `
  });
}

function renderCategoriesSeoPage() {
  const categoryLinks = SEO_CATEGORIES
    .map(([id, label, summary]) => `<li><a href="/categories/${id}">${escapeHtml(label)} live TV</a><span>${escapeHtml(summary)}</span></li>`)
    .join('');
  return seoPage({
    path: '/categories',
    title: 'Live TV Categories - WatchNations',
    description: 'Browse free live TV channels by category on WatchNations, discover international TV channels, and watch news from around the world.',
    heading: 'Browse Live TV by Category',
    bodyHtml: `
      <p>WatchNations organizes global live TV channels into categories so users can discover channels by topic, by country, and through random TV channel discovery.</p>
      <ul class="category-grid">${categoryLinks}</ul>
    `
  });
}

function renderCategorySeoPage(rawCategory) {
  const category = SEO_CATEGORIES.find(([id]) => id === String(rawCategory || '').toLowerCase());
  if (!category) {
    return seoPage({
      path: '/categories',
      title: 'Category Not Found - WatchNations',
      description: 'Browse free live TV channels by category on WatchNations.',
      heading: 'Category Not Found',
      body: ['This category is not available yet. Browse the full category list to find free live TV channels.']
    });
  }

  const [id, label, summary] = category;
  return seoPage({
    path: `/categories/${id}`,
    title: `${label} Live TV Channels - WatchNations`,
    description: `Discover ${summary} on WatchNations. Browse free live TV channels by category, country, and interactive 3D globe TV channels.`,
    heading: `${label} Live TV Channels`,
    body: [
      `WatchNations helps users discover ${summary}.`,
      `Open the WatchNations app to browse ${label.toLowerCase()} channels from all countries, search streams, listen to radio stations worldwide, and save favorites locally in your browser.`,
      'Streams are provided by external public sources. WatchNations does not host or control video content.'
    ],
    cta: { href: `/?category=${id}`, label: `Open ${label} Channels` }
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
    description: `${countrySeoDescription(code, country)} Browse by country, category, radio, electronic newspapers, and interactive globe.`,
    heading: `${country.name} Live TV Channels`,
    body: [
      `WatchNations helps users watch TV channels by country and discover free live TV channels and radio stations from ${country.name}.`,
      countryArabicSeoLine(code, country.name),
      `Open the WatchNations app to browse ${country.name} channels, save favorites, use random TV channel discovery, and explore related categories such as news, sports, music, movies, and weather.`,
      'Streams are provided by external public sources. WatchNations does not host or control video content.'
    ],
    cta: { href: `/?country=${code}`, label: `Open ${country.name} in WatchNations` }
  });
}

function countrySeoDescription(code, country) {
  code = normalizeCountryCode(code);
  const arabicTargets = {
    SA: 'قنوات سعودية بث مباشر على WatchNations مع روابط TV وراديو ومصادر إلكترونية حسب الدولة.',
    EG: 'قنوات مصرية بث مباشر مجاني على WatchNations مع مشاهدة قنوات عربية بث مباشر مجانا وبدون اشتراك.',
    AE: 'قنوات اماراتية اونلاين على WatchNations مع قنوات عربية بث مباشر بدون اشتراك ومصادر عالمية.'
  };
  return arabicTargets[code] || `Watch free live TV channels and radio stations from ${country.name} on WatchNations.`;
}

function countryArabicSeoLine(code, countryName) {
  const lines = {
    SA: 'هذه الصفحة تستهدف قنوات سعودية بث مباشر ضمن تجربة مشاهدة قنوات عربية بث مباشر مجانا وبدون اشتراك.',
    EG: 'هذه الصفحة مناسبة لمن يبحث عن قنوات مصرية بث مباشر مجاني ومشاهدة قنوات عربية بث مباشر.',
    AE: 'هذه الصفحة مناسبة لمن يبحث عن قنوات اماراتية اونلاين وقنوات عربية بث مباشر بدون اشتراك.'
  };
  return lines[normalizeCountryCode(code)] || `${countryName} is part of the WatchNations country TV guide and global TV channel list free to explore.`;
}

function seoPage({ path: pathname, title, description, heading, body = [], bodyHtml = '', cta }) {
  const canonical = `https://watchnations.com${pathname === '/' ? '/' : pathname}`;
  const paragraphs = body.map((text) => `<p>${escapeHtml(text)}</p>`).join('');
  const action = cta ? `<p><a class="button" href="${escapeHtml(cta.href)}">${escapeHtml(cta.label)}</a></p>` : '<p><a class="button" href="/">Open WatchNations App</a></p>';
  const internalLinks = '<nav aria-label="Internal links"><a href="/">Home</a><a href="/countries">Countries</a><a href="/categories">Categories</a><a href="/categories/news">News</a><a href="/categories/sports">Sports</a><a href="/categories/kids">Kids TV</a><a href="/countries/us">United States</a><a href="/countries/sa">Saudi Arabia</a><a href="/countries/fr">France</a></nav>';
  return `<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="keywords" content="${escapeHtml(SEO_KEYWORDS.join(', '))}">
  <meta name="news_keywords" content="${escapeHtml(SEO_KEYWORDS.slice(0, 12).join(', '))}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="google-site-verification" content="BOGebDfiNtUgDvVuRNuqb7sQb92qcvZ3Y-CkEgRrhKE">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/assets/favicon-192.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/assets/favicon-180.png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="WatchNations">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="https://watchnations.com/assets/favicon-512.png">
  <style>
    :root{color:#f7f9fb;background:#050609;font-family:Inter,Segoe UI,Tahoma,Arial,sans-serif}
    body{margin:0;background:#050609;color:#f7f9fb;line-height:1.7}
    header,main,footer{max-width:980px;margin:auto;padding:28px}
    header{display:flex;gap:8px;align-items:center;border-bottom:1px solid rgba(255,255,255,.14)}
    img{width:82px;height:64px;object-fit:contain;margin-right:-8px}
    a{color:#ff4a42}.brand{font-weight:900;font-size:34px;line-height:1}.brand span{color:#ff0800;text-shadow:0 0 14px rgba(255,8,0,.28)}
    h1{font-size:clamp(34px,6vw,62px);line-height:1.05;margin:34px 0 18px}
    p{max-width:760px;color:#d7dbe3}.button{display:inline-block;margin-top:10px;padding:12px 18px;border:1px solid #ff0800;border-radius:8px;color:#fff;background:#ff0800;text-decoration:none;font-weight:900}
    nav{display:flex;gap:14px;flex-wrap:wrap;margin-top:18px}.country-grid{columns:3 220px;padding-left:20px}.country-grid li{break-inside:avoid;margin:0 0 8px}
    footer{border-top:1px solid rgba(255,255,255,.14);color:#b8bfca}
  </style>
</head>
<body>
  <header><a href="/"><img src="/assets/watchnations-tv-logo.png" alt="WatchNations logo"></a><div><div class="brand"><span>Watch</span>Nations</div><nav><a href="/">App</a><a href="/countries">Countries</a><a href="/categories">Categories</a><a href="/about">About</a><a href="/faq">FAQ</a><a href="/privacy-policy">Privacy</a><a href="/feedback">Feedback</a></nav></div></header>
  <main>
    <h1>${escapeHtml(heading)}</h1>
    ${bodyHtml || paragraphs}
    ${action}
    ${internalLinks}
  </main>
  <footer>WatchNations does not host video streams. It organizes publicly available external links in good faith.</footer>
</body>
</html>`;
}

function buildSitemap() {
  const staticUrls = ['/', '/countries', '/categories', '/about', '/faq', '/privacy', '/privacy-policy', '/feedback'];
  const countryUrls = loadSeoCountries().map((country) => `/countries/${country.code.toLowerCase()}`);
  const categoryUrls = SEO_CATEGORIES.map(([id]) => `/categories/${id}`);
  const urls = [...staticUrls, ...categoryUrls, ...countryUrls]
    .map((pathname) => `  <url>
    <loc>https://watchnations.com${pathname === '/' ? '/' : pathname}</loc>
    <lastmod>${SEO_LASTMOD}</lastmod>
    <changefreq>${pathname.startsWith('/countries/') || pathname.startsWith('/categories/') ? 'weekly' : 'daily'}</changefreq>
    <priority>${pathname === '/' ? '1.0' : pathname.startsWith('/countries/') || pathname.startsWith('/categories/') ? '0.7' : '0.8'}</priority>
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
  if (['robots.txt', 'sitemap.xml', 'site.webmanifest', 'llms.txt', 'BingSiteAuth.xml', 'favicon.ico', 'hdWiS7.js'].some((file) => filePath === path.join(rootPath, file))) return true;
  const relative = path.relative(rootPath, filePath);
  const [topLevel] = relative.split(path.sep);
  return ['src', 'data', 'assets'].includes(topLevel);
}

function staticCacheControl(filePath) {
  const relative = path.relative(rootPath, filePath);
  const [topLevel] = relative.split(path.sep);
  if (relative === 'index.html') return 'no-cache, max-age=0, must-revalidate';
  if (relative === 'favicon.ico') return 'public, max-age=604800, stale-while-revalidate=86400';
  if (topLevel === 'assets') return 'public, max-age=31536000, immutable';
  if (topLevel === 'data') return 'public, max-age=3600, stale-while-revalidate=86400';
  if (['robots.txt', 'sitemap.xml', 'site.webmanifest', 'llms.txt', 'BingSiteAuth.xml', 'hdWiS7.js'].includes(relative)) return 'public, max-age=3600, stale-while-revalidate=86400';
  if (topLevel === 'src') return 'no-cache, max-age=0, must-revalidate';
  return 'no-cache, max-age=0, must-revalidate';
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

function defaultDeveloperState() {
  return {
    passwordHash: hashDeveloperSecret(DEFAULT_DEVELOPER_PASSWORD),
    totalVisits: 0,
    uniqueVisitors: [],
    firstVisitAt: '',
    lastVisitAt: '',
    updatedAt: new Date().toISOString()
  };
}

function loadDeveloperState() {
  try {
    const state = JSON.parse(fs.readFileSync(DEVELOPER_STATE_FILE, 'utf8'));
    return {
      ...defaultDeveloperState(),
      ...state,
      uniqueVisitors: Array.isArray(state.uniqueVisitors) ? state.uniqueVisitors : []
    };
  } catch (error) {
    const state = defaultDeveloperState();
    saveDeveloperState(state);
    return state;
  }
}

function saveDeveloperState(state) {
  fs.mkdirSync(path.dirname(DEVELOPER_STATE_FILE), { recursive: true });
  fs.writeFileSync(DEVELOPER_STATE_FILE, JSON.stringify(state, null, 2));
}

function hashDeveloperSecret(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function verifyDeveloperPassword(password) {
  const state = loadDeveloperState();
  return state.passwordHash === hashDeveloperSecret(password);
}

function validateDeveloperPassword(password) {
  if (password.length < 4) return 'Password must be at least 4 characters.';
  if (password.length > 80) return 'Password is too long.';
  return '';
}

function trackVisitor(payload, request) {
  const state = loadDeveloperState();
  const visitorId = safeText(payload?.visitorId, 120) || `${request.socket.remoteAddress || 'local'}:${request.headers['user-agent'] || ''}`;
  const visitorHash = hashDeveloperSecret(visitorId);
  const now = new Date().toISOString();
  state.totalVisits = Number(state.totalVisits || 0) + 1;
  if (!state.uniqueVisitors.includes(visitorHash)) state.uniqueVisitors.push(visitorHash);
  state.firstVisitAt = state.firstVisitAt || now;
  state.lastVisitAt = now;
  saveDeveloperState(state);
  return publicVisitorStats(state);
}

function publicVisitorStats(state = loadDeveloperState()) {
  return {
    ok: true,
    visitors: Number(state.uniqueVisitors?.length || 0)
  };
}

function developerStats() {
  const state = loadDeveloperState();
  return {
    visitors: Number(state.uniqueVisitors.length || 0),
    totalVisits: Number(state.totalVisits || 0),
    firstVisitAt: state.firstVisitAt || '',
    lastVisitAt: state.lastVisitAt || '',
    updatedAt: state.updatedAt || ''
  };
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
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.setHeader('X-DNS-Prefetch-Control', 'off');
  response.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  response.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:",
      "style-src 'self' 'unsafe-inline' https://vjs.zencdn.net",
      "img-src 'self' https: data:",
      "connect-src 'self' https: http:",
      "media-src https: http: blob:",
      "frame-src https: http:",
      "font-src 'self' data:",
      "worker-src 'self' blob: https://sw.wpushorg.com",
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "form-action 'none'"
    ].join('; ')
  );
}
