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
const VISIT_SESSION_WINDOW_MS = 30 * 60_000;
const VISITOR_STATS_TIME_ZONE = 'Africa/Casablanca';
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
const SEO_LASTMOD = '2026-07-02';
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

const SEO_CATEGORY_DETAILS = {
  "all": {
    "primary": [
      "free live tv all channels",
      "قنوات بث مباشر مجانية",
      "toutes chaines tv en direct gratuit",
      "todas las cadenas tv en vivo gratis",
      "todos os canais tv ao vivo gratis",
      "alle kanale live tv kostenlos",
      "すべてのチャンネル 無料放送",
      "tüm kanallar canlı tv ücretsiz"
    ],
    "headings": [
      "watch all tv channels online free",
      "all channels live streaming free",
      "مشاهدة جميع القنوات اونلاين",
      "بث حي مجاني",
      "شوف القنوات كاملة اونلاين",
      "تلفاز حي مجاني",
      "regarder toutes les chaines en ligne gratuit",
      "télévision en direct gratuite",
      "ver todos los canales online gratis",
      "television en vivo gratuita",
      "assistir todos canais online gratis",
      "televisao ao vivo gratuita",
      "alle sender online gratis",
      "fernsehen live kostenlos"
    ],
    "subheadings": [
      "free live tv all channels",
      "watch all tv channels online free",
      "all channels live streaming free",
      "قنوات بث مباشر مجانية",
      "مشاهدة جميع القنوات اونلاين",
      "بث حي مجاني",
      "شوف القنوات كاملة اونلاين",
      "تلفاز حي مجاني",
      "toutes chaines tv en direct gratuit",
      "regarder toutes les chaines en ligne gratuit",
      "télévision en direct gratuite",
      "todas las cadenas tv en vivo gratis",
      "ver todos los canales online gratis",
      "television en vivo gratuita",
      "todos os canais tv ao vivo gratis",
      "assistir todos canais online gratis",
      "televisao ao vivo gratuita",
      "alle kanale live tv kostenlos"
    ],
    "keywords": [
      "free live tv all channels",
      "watch all tv channels online free",
      "all channels live streaming free",
      "قنوات بث مباشر مجانية",
      "مشاهدة جميع القنوات اونلاين",
      "بث حي مجاني",
      "شوف القنوات كاملة اونلاين",
      "تلفاز حي مجاني",
      "toutes chaines tv en direct gratuit",
      "regarder toutes les chaines en ligne gratuit",
      "télévision en direct gratuite",
      "todas las cadenas tv en vivo gratis",
      "ver todos los canales online gratis",
      "television en vivo gratuita",
      "todos os canais tv ao vivo gratis",
      "assistir todos canais online gratis",
      "televisao ao vivo gratuita",
      "alle kanale live tv kostenlos",
      "alle sender online gratis",
      "fernsehen live kostenlos",
      "すべてのチャンネル 無料放送",
      "全チャンネル オンライン無料視聴",
      "テレビ ライブ 無料",
      "tüm kanallar canlı tv ücretsiz",
      "tüm kanalları online izle bedava",
      "televizyon canlı yayın ücretsiz",
      "所有频道 免费在线电视",
      "全部频道 在线观看免费",
      "电视直播 免费",
      "alle kanalen tv live gratis",
      "alle zenders online gratis",
      "televisie live gratis",
      "alla kanaler tv live gratis",
      "alla kanaler online gratis",
      "teve live gratis",
      "alle kanaler tv live gratis",
      "alle kanaler online gratis",
      "tv live gratis",
      "সমস্ত চ্যানেল লাইভ টিভি বিনামূল্যে",
      "সব চ্যানেল অনলাইন বিনামূল্যে দেখুন",
      "টিভি লাইভ বিনামূল্যে",
      "tutti i canali tv live gratis",
      "tutti i canali online gratis",
      "televisione live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "top-news": {
    "primary": [
      "top news live streaming free",
      "اخبار مباشرة مجانية",
      "actualités en direct gratuit",
      "noticias en vivo gratis",
      "noticias ao vivo gratis",
      "top nachrichten live kostenlos",
      "トップニュース 無料放送",
      "son dakika haberler canlı ücretsiz"
    ],
    "headings": [
      "watch top news channels free",
      "breaking news live free",
      "قنوات اخبارية بث حي",
      "اهم الاخبار مباشر",
      "اهم الاخبار حية",
      "جديد الساعة تلفزيون",
      "top actualités tv live",
      "journal télévisé gratuit",
      "actualidad tv live gratis",
      "informativo gratis",
      "principais noticias tv live",
      "jornalismo gratis",
      "nachrichten tv live gratis",
      "aktuell kostenlos"
    ],
    "subheadings": [
      "top news live streaming free",
      "watch top news channels free",
      "breaking news live free",
      "اخبار مباشرة مجانية",
      "قنوات اخبارية بث حي",
      "اهم الاخبار مباشر",
      "اهم الاخبار حية",
      "جديد الساعة تلفزيون",
      "actualités en direct gratuit",
      "top actualités tv live",
      "journal télévisé gratuit",
      "noticias en vivo gratis",
      "actualidad tv live gratis",
      "informativo gratis",
      "noticias ao vivo gratis",
      "principais noticias tv live",
      "jornalismo gratis",
      "top nachrichten live kostenlos"
    ],
    "keywords": [
      "top news live streaming free",
      "watch top news channels free",
      "breaking news live free",
      "اخبار مباشرة مجانية",
      "قنوات اخبارية بث حي",
      "اهم الاخبار مباشر",
      "اهم الاخبار حية",
      "جديد الساعة تلفزيون",
      "actualités en direct gratuit",
      "top actualités tv live",
      "journal télévisé gratuit",
      "noticias en vivo gratis",
      "actualidad tv live gratis",
      "informativo gratis",
      "noticias ao vivo gratis",
      "principais noticias tv live",
      "jornalismo gratis",
      "top nachrichten live kostenlos",
      "nachrichten tv live gratis",
      "aktuell kostenlos",
      "トップニュース 無料放送",
      "速報ニュース ライブ無料",
      "ニュース 生中継 無料",
      "son dakika haberler canlı ücretsiz",
      "en önemli haberler tv live",
      "gündem haberleri bedava",
      "头条新闻 免费直播",
      "重大新闻 在线免费",
      "要闻直播 免费",
      "topnieuws live gratis",
      "belangrijk nieuws tv live",
      "actualiteit gratis",
      "topnyheter live gratis",
      "viktiga nyheter tv live",
      "aktuellt gratis",
      "toppnyheter live gratis",
      "viktige nyheter tv live",
      "aktuelt gratis",
      "শীর্ষ সংবাদ লাইভ বিনামূল্যে",
      "গুরুত্বপূর্ণ খবর টিভি লাইভ",
      "সংবাদ বিনামূল্যে",
      "notizie principali live gratis",
      "ultime notizie tv live",
      "attualità gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "news": {
    "primary": [
      "free live news channels",
      "قنوات اخبارية مجانية",
      "chaines info en direct gratuit",
      "canales noticias gratis",
      "canais noticias gratis",
      "nachrichten kanale kostenlos",
      "ニュースチャンネル 無料",
      "haber kanalları ücretsiz"
    ],
    "headings": [
      "watch news online free",
      "live news streaming free",
      "اخبار عالمية مباشرة",
      "تلفزيون الاخبار مجاني",
      "اخبار العالم مباشر",
      "صحافة تلفزيونية حية",
      "actualités monde live gratuit",
      "info tv en direct",
      "noticias mundo en vivo",
      "periodismo tv gratis",
      "noticias mundo ao vivo",
      "jornal tv gratis",
      "weltnachrichten live gratis",
      "nachrichten tv live"
    ],
    "subheadings": [
      "free live news channels",
      "watch news online free",
      "live news streaming free",
      "قنوات اخبارية مجانية",
      "اخبار عالمية مباشرة",
      "تلفزيون الاخبار مجاني",
      "اخبار العالم مباشر",
      "صحافة تلفزيونية حية",
      "chaines info en direct gratuit",
      "actualités monde live gratuit",
      "info tv en direct",
      "canales noticias gratis",
      "noticias mundo en vivo",
      "periodismo tv gratis",
      "canais noticias gratis",
      "noticias mundo ao vivo",
      "jornal tv gratis",
      "nachrichten kanale kostenlos"
    ],
    "keywords": [
      "free live news channels",
      "watch news online free",
      "live news streaming free",
      "قنوات اخبارية مجانية",
      "اخبار عالمية مباشرة",
      "تلفزيون الاخبار مجاني",
      "اخبار العالم مباشر",
      "صحافة تلفزيونية حية",
      "chaines info en direct gratuit",
      "actualités monde live gratuit",
      "info tv en direct",
      "canales noticias gratis",
      "noticias mundo en vivo",
      "periodismo tv gratis",
      "canais noticias gratis",
      "noticias mundo ao vivo",
      "jornal tv gratis",
      "nachrichten kanale kostenlos",
      "weltnachrichten live gratis",
      "nachrichten tv live",
      "ニュースチャンネル 無料",
      "ニュース 生放送 無料",
      "報道テレビ ライブ",
      "haber kanalları ücretsiz",
      "dünya haberleri canlı",
      "gazete tv canlı yayın",
      "新闻频道 免费直播",
      "国际新闻 在线免费",
      "新闻报道 免费电视",
      "nieuwszenders gratis",
      "wereldnieuws live gratis",
      "nieuws tv live",
      "nyhetskanaler gratis",
      "världsnyheter live gratis",
      "nyheter tv live",
      "verdensnyheter live gratis",
      "সংবাদ চ্যানেল বিনামূল্যে",
      "বিশ্ব সংবাদ লাইভ বিনামূল্যে",
      "খবর টিভি লাইভ",
      "canali notizie gratis",
      "notizie mondo live gratis",
      "giornale tv live"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "music": {
    "primary": [
      "free music tv channels",
      "قنوات موسيقية مجانية",
      "اغاني بث مباشر",
      "chaines musique gratuites",
      "musica tv gratis",
      "musik tv kostenlos",
      "音楽チャンネル 無料",
      "müzik kanalları ücretsiz"
    ],
    "headings": [
      "watch music channels online free",
      "live music tv free",
      "اغاني بث مباشر",
      "موسيقى اونلاين مجانية",
      "موسيقى مغربية مجانية",
      "طرب اونلاين مجاني",
      "musique en direct gratuit",
      "clip tv live gratuit",
      "canales musicales en vivo",
      "conciertos live gratis",
      "canais musicais ao vivo",
      "shows live gratis",
      "musiksender live gratis",
      "musik live kostenlos"
    ],
    "subheadings": [
      "free music tv channels",
      "watch music channels online free",
      "live music tv free",
      "قنوات موسيقية مجانية",
      "اغاني بث مباشر",
      "موسيقى اونلاين مجانية",
      "موسيقى مغربية مجانية",
      "طرب اونلاين مجاني",
      "chaines musique gratuites",
      "musique en direct gratuit",
      "clip tv live gratuit",
      "musica tv gratis",
      "canales musicales en vivo",
      "conciertos live gratis",
      "canais musicais ao vivo",
      "shows live gratis",
      "musik tv kostenlos",
      "musiksender live gratis"
    ],
    "keywords": [
      "free music tv channels",
      "watch music channels online free",
      "live music tv free",
      "قنوات موسيقية مجانية",
      "اغاني بث مباشر",
      "موسيقى اونلاين مجانية",
      "موسيقى مغربية مجانية",
      "طرب اونلاين مجاني",
      "chaines musique gratuites",
      "musique en direct gratuit",
      "clip tv live gratuit",
      "musica tv gratis",
      "canales musicales en vivo",
      "conciertos live gratis",
      "canais musicais ao vivo",
      "shows live gratis",
      "musik tv kostenlos",
      "musiksender live gratis",
      "musik live kostenlos",
      "音楽チャンネル 無料",
      "ミュージック ライブ無料",
      "音楽番組 無料放送",
      "müzik kanalları ücretsiz",
      "müzik canlı yayın bedava",
      "konser tv live ücretsiz",
      "音乐频道 免费直播",
      "音乐节目 在线免费",
      "演唱会 免费电视",
      "muziekzenders gratis",
      "muziek live gratis",
      "concerten live gratis",
      "musikkanaler gratis",
      "musik live gratis",
      "konserter live gratis",
      "musikk live gratis",
      "সঙ্গীত চ্যানেল বিনামূল্যে",
      "সঙ্গীত লাইভ বিনামূল্যে",
      "সঙ্গীত অনুষ্ঠান বিনামূল্যে",
      "canali musica gratis",
      "musica live gratis",
      "concerti live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "sports": {
    "primary": [
      "free sports live streaming",
      "قنوات رياضية مجانية",
      "مباريات بث مباشر مجاني",
      "sport en direct gratuit",
      "deportes en vivo gratis",
      "esportes ao vivo gratis",
      "sport live kostenlos",
      "スポーツ 無料放送"
    ],
    "headings": [
      "watch sports channels free",
      "live sports tv free",
      "مباريات بث مباشر مجاني",
      "رياضة تلفزيون حي",
      "رياضة حية مجانية",
      "كورة تلفزيون مباشر",
      "match foot streaming gratuit",
      "chaine sport live gratuit",
      "partidos futbol streaming gratis",
      "canales deporte live",
      "jogos futebol streaming gratis",
      "canais esporte live",
      "fussball streaming gratis",
      "sport kanale live"
    ],
    "subheadings": [
      "free sports live streaming",
      "watch sports channels free",
      "live sports tv free",
      "قنوات رياضية مجانية",
      "مباريات بث مباشر مجاني",
      "رياضة تلفزيون حي",
      "رياضة حية مجانية",
      "كورة تلفزيون مباشر",
      "sport en direct gratuit",
      "match foot streaming gratuit",
      "chaine sport live gratuit",
      "deportes en vivo gratis",
      "partidos futbol streaming gratis",
      "canales deporte live",
      "esportes ao vivo gratis",
      "jogos futebol streaming gratis",
      "canais esporte live",
      "sport live kostenlos"
    ],
    "keywords": [
      "free sports live streaming",
      "watch sports channels free",
      "live sports tv free",
      "قنوات رياضية مجانية",
      "مباريات بث مباشر مجاني",
      "رياضة تلفزيون حي",
      "رياضة حية مجانية",
      "كورة تلفزيون مباشر",
      "sport en direct gratuit",
      "match foot streaming gratuit",
      "chaine sport live gratuit",
      "deportes en vivo gratis",
      "partidos futbol streaming gratis",
      "canales deporte live",
      "esportes ao vivo gratis",
      "jogos futebol streaming gratis",
      "canais esporte live",
      "sport live kostenlos",
      "fussball streaming gratis",
      "sport kanale live",
      "スポーツ 無料放送",
      "スポーツライブ 無料",
      "スポーツ中継 テレビ",
      "spor canlı yayın ücretsiz",
      "maç izle bedava",
      "spor kanalları canlı",
      "体育频道 免费直播",
      "比赛直播 免费",
      "足球直播 免费电视",
      "sport live gratis",
      "wedstrijden streaming gratis",
      "sportkanalen live",
      "matcher streaming gratis",
      "sportkanaler live",
      "kamper streaming gratis",
      "খেলাধুলা লাইভ বিনামূল্যে",
      "খেলা দেখুন বিনামূল্যে",
      "স্পোর্টস চ্যানেল লাইভ",
      "partite calcio streaming gratis",
      "canali sport live"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "auto": {
    "primary": [
      "auto tv channels free",
      "قنوات سيارات مجانية",
      "سيارات بث مباشر",
      "automobile tv gratuit",
      "automovil tv gratis",
      "automoveis tv gratis",
      "auto tv kostenlos",
      "自動車 無料放送"
    ],
    "headings": [
      "watch car shows online free",
      "automotive tv live free",
      "عالم السيارات بث مباشر",
      "سيارات اونلاين مجاني",
      "عالم السيارات مجاني",
      "طرقات تلفزيون حية",
      "voiture en direct gratuit",
      "sport auto live gratuit",
      "coches en vivo gratis",
      "motor live gratis",
      "carros ao vivo gratis",
      "motores live gratis",
      "autos live gratis",
      "motorsport live kostenlos"
    ],
    "subheadings": [
      "auto tv channels free",
      "watch car shows online free",
      "automotive tv live free",
      "قنوات سيارات مجانية",
      "عالم السيارات بث مباشر",
      "سيارات اونلاين مجاني",
      "سيارات بث مباشر",
      "عالم السيارات مجاني",
      "طرقات تلفزيون حية",
      "automobile tv gratuit",
      "voiture en direct gratuit",
      "sport auto live gratuit",
      "automovil tv gratis",
      "coches en vivo gratis",
      "motor live gratis",
      "automoveis tv gratis",
      "carros ao vivo gratis",
      "motores live gratis"
    ],
    "keywords": [
      "auto tv channels free",
      "watch car shows online free",
      "automotive tv live free",
      "قنوات سيارات مجانية",
      "عالم السيارات بث مباشر",
      "سيارات اونلاين مجاني",
      "سيارات بث مباشر",
      "عالم السيارات مجاني",
      "طرقات تلفزيون حية",
      "automobile tv gratuit",
      "voiture en direct gratuit",
      "sport auto live gratuit",
      "automovil tv gratis",
      "coches en vivo gratis",
      "motor live gratis",
      "automoveis tv gratis",
      "carros ao vivo gratis",
      "motores live gratis",
      "auto tv kostenlos",
      "autos live gratis",
      "motorsport live kostenlos",
      "自動車 無料放送",
      "カー ライブ無料",
      "車番組 無料テレビ",
      "otomobil tv ücretsiz",
      "araba canlı yayın bedava",
      "motor sporları canlı ücretsiz",
      "汽车频道 免费直播",
      "车展直播 免费",
      "汽车节目 免费电视",
      "auto tv gratis",
      "motorsport live gratis",
      "bilar tv gratis",
      "bilar live gratis",
      "biler tv gratis",
      "biler live gratis",
      "গাড়ি টিভি বিনামূল্যে",
      "অটো লাইভ বিনামূল্যে",
      "মোটরস্পোর্টস লাইভ বিনামূল্যে",
      "macchine live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "animation": {
    "primary": [
      "free cartoon channels",
      "قنوات كرتون مجانية",
      "كرتون بث مباشر",
      "dessin animé en direct gratuit",
      "dibujos animados en vivo gratis",
      "desenhos animados ao vivo gratis",
      "zeichentrick live kostenlos",
      "アニメ 無料放送"
    ],
    "headings": [
      "watch animation online free",
      "kids animation tv free",
      "افلام كرتون بث مباشر",
      "اطفال تلفزيون مجاني",
      "افلام كرتون مجانية",
      "اطفال تلفزيون حي",
      "cartoon tv gratuit",
      "animation live gratuit",
      "caricaturas tv gratis",
      "animacion live gratis",
      "cartoons tv gratis",
      "animacao live gratis",
      "animation live kostenlos",
      "アニメチャンネル 無料"
    ],
    "subheadings": [
      "free cartoon channels",
      "watch animation online free",
      "kids animation tv free",
      "قنوات كرتون مجانية",
      "افلام كرتون بث مباشر",
      "اطفال تلفزيون مجاني",
      "كرتون بث مباشر",
      "افلام كرتون مجانية",
      "اطفال تلفزيون حي",
      "dessin animé en direct gratuit",
      "cartoon tv gratuit",
      "animation live gratuit",
      "dibujos animados en vivo gratis",
      "caricaturas tv gratis",
      "animacion live gratis",
      "desenhos animados ao vivo gratis",
      "cartoons tv gratis",
      "animacao live gratis"
    ],
    "keywords": [
      "free cartoon channels",
      "watch animation online free",
      "kids animation tv free",
      "قنوات كرتون مجانية",
      "افلام كرتون بث مباشر",
      "اطفال تلفزيون مجاني",
      "كرتون بث مباشر",
      "افلام كرتون مجانية",
      "اطفال تلفزيون حي",
      "dessin animé en direct gratuit",
      "cartoon tv gratuit",
      "animation live gratuit",
      "dibujos animados en vivo gratis",
      "caricaturas tv gratis",
      "animacion live gratis",
      "desenhos animados ao vivo gratis",
      "cartoons tv gratis",
      "animacao live gratis",
      "zeichentrick live kostenlos",
      "animation live kostenlos",
      "アニメ 無料放送",
      "アニメチャンネル 無料",
      "アニメ ライブ無料",
      "çizgi film canlı ücretsiz",
      "animasyon tv bedava",
      "çizgi film kanalları canlı",
      "动画频道 免费直播",
      "动画片 在线免费",
      "动漫 免费电视",
      "tekenfilms live gratis",
      "animatie tv gratis",
      "cartoons live gratis",
      "tecknat live gratis",
      "animerat tv gratis",
      "barnprogram live gratis",
      "tegnefilm live gratis",
      "animasjon tv gratis",
      "কার্টুন লাইভ বিনামূল্যে",
      "অ্যানিমেশন টিভি বিনামূল্যে",
      "cartoni animati live gratis",
      "animazione tv gratis",
      "cartoni live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "business": {
    "primary": [
      "business news live free",
      "اقتصاد بث مباشر",
      "اقتصاد بث حي",
      "economie en direct gratuit",
      "negocios en vivo gratis",
      "negocios ao vivo gratis",
      "wirtschaft live kostenlos",
      "ビジネス 無料放送"
    ],
    "headings": [
      "watch business channels free",
      "financial tv free",
      "قنوات تجارية مجانية",
      "مالية اونلاين مجانية",
      "تجارة مغربية مجانية",
      "اعمال تلفزيون مباشر",
      "finance tv gratuit",
      "bourse live gratuit",
      "economia tv gratis",
      "empresas live gratis",
      "geschaft tv gratis",
      "finanzen live kostenlos",
      "経済ニュース ライブ無料",
      "ビジネステレビ"
    ],
    "subheadings": [
      "business news live free",
      "watch business channels free",
      "financial tv free",
      "اقتصاد بث مباشر",
      "قنوات تجارية مجانية",
      "مالية اونلاين مجانية",
      "اقتصاد بث حي",
      "تجارة مغربية مجانية",
      "اعمال تلفزيون مباشر",
      "economie en direct gratuit",
      "finance tv gratuit",
      "bourse live gratuit",
      "negocios en vivo gratis",
      "economia tv gratis",
      "empresas live gratis",
      "negocios ao vivo gratis",
      "wirtschaft live kostenlos",
      "geschaft tv gratis"
    ],
    "keywords": [
      "business news live free",
      "watch business channels free",
      "financial tv free",
      "اقتصاد بث مباشر",
      "قنوات تجارية مجانية",
      "مالية اونلاين مجانية",
      "اقتصاد بث حي",
      "تجارة مغربية مجانية",
      "اعمال تلفزيون مباشر",
      "economie en direct gratuit",
      "finance tv gratuit",
      "bourse live gratuit",
      "negocios en vivo gratis",
      "economia tv gratis",
      "empresas live gratis",
      "negocios ao vivo gratis",
      "wirtschaft live kostenlos",
      "geschaft tv gratis",
      "finanzen live kostenlos",
      "ビジネス 無料放送",
      "経済ニュース ライブ無料",
      "ビジネステレビ",
      "ekonomi canlı yayın ücretsiz",
      "iş dünyası tv bedava",
      "finans canlı ücretsiz",
      "财经频道 免费直播",
      "经济新闻 免费",
      "股市直播 免费电视",
      "zakelijk live gratis",
      "economie tv gratis",
      "bedrijven live gratis",
      "affärer live gratis",
      "ekonomi tv gratis",
      "företag live gratis",
      "business live gratis",
      "økonomi tv gratis",
      "bedrifter live gratis",
      "ব্যবসা লাইভ বিনামূল্যে",
      "অর্থনীতি টিভি বিনামূল্যে",
      "বাণিজ্য লাইভ বিনামূল্যে",
      "affari live gratis",
      "aziende live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "classic": {
    "primary": [
      "classic tv channels free",
      "افلام كلاسيكية مجانية",
      "تراث بث مباشر",
      "films classiques gratuit",
      "cine clasico gratis",
      "filmes classicos gratis",
      "klassiker filme kostenlos",
      "クラシック映画 無料"
    ],
    "headings": [
      "watch classic movies online free",
      "retro tv live free",
      "تراث تلفزيوني بث حي",
      "زمن الفن الجميل مباشر",
      "زمان الفن الجميل مجاني",
      "كلاسيكيات تلفزيون",
      "tv retro en direct",
      "cinema classique live",
      "tv retro en vivo",
      "peliculas classicas live",
      "tv retro ao vivo",
      "cinema classico live",
      "retro tv live",
      "klassik tv live"
    ],
    "subheadings": [
      "classic tv channels free",
      "watch classic movies online free",
      "retro tv live free",
      "افلام كلاسيكية مجانية",
      "تراث تلفزيوني بث حي",
      "زمن الفن الجميل مباشر",
      "تراث بث مباشر",
      "زمان الفن الجميل مجاني",
      "كلاسيكيات تلفزيون",
      "films classiques gratuit",
      "tv retro en direct",
      "cinema classique live",
      "cine clasico gratis",
      "tv retro en vivo",
      "peliculas classicas live",
      "filmes classicos gratis",
      "tv retro ao vivo",
      "cinema classico live"
    ],
    "keywords": [
      "classic tv channels free",
      "watch classic movies online free",
      "retro tv live free",
      "افلام كلاسيكية مجانية",
      "تراث تلفزيوني بث حي",
      "زمن الفن الجميل مباشر",
      "تراث بث مباشر",
      "زمان الفن الجميل مجاني",
      "كلاسيكيات تلفزيون",
      "films classiques gratuit",
      "tv retro en direct",
      "cinema classique live",
      "cine clasico gratis",
      "tv retro en vivo",
      "peliculas classicas live",
      "filmes classicos gratis",
      "tv retro ao vivo",
      "cinema classico live",
      "klassiker filme kostenlos",
      "retro tv live",
      "klassik tv live",
      "クラシック映画 無料",
      "レトロテレビ 無料",
      "名作映画 ライブ",
      "klasik filmler ücretsiz",
      "nostalji tv canlı",
      "eski filmler bedava",
      "经典电影 免费直播",
      "怀旧电视 免费",
      "老电影 免费电视",
      "klassieke films gratis",
      "oude films live gratis",
      "klassiska filmer gratis",
      "gamla filmer live gratis",
      "klassiske filmer gratis",
      "gamle filmer live gratis",
      "ক্লাসিক সিনেমা বিনামূল্যে",
      "রেট্রো টিভি লাইভ",
      "পুরানো সিনেমা লাইভ বিনামূল্যে",
      "film classici gratis",
      "tv retro live",
      "vecchi film live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "comedy": {
    "primary": [
      "free comedy channels",
      "مسرحيات كوميدية مجانية",
      "ضحك بث مباشر",
      "comédie tv gratuit",
      "comedia tv gratis",
      "komodie tv kostenlos",
      "お笑い 無料放送",
      "komedi tv ücretsiz"
    ],
    "headings": [
      "watch comedy shows online free",
      "funny tv live free",
      "ضحك بث مباشر",
      "فرفشة تلفزيون مجاني",
      "كوميديا مغربية مجانية",
      "فكاهة تلفزيون حية",
      "humour en direct gratuit",
      "spectacle live gratuit",
      "humor en vivo gratis",
      "chistes live gratis",
      "humor ao vivo gratis",
      "piadas live gratis",
      "humor live gratis",
      "lustig live kostenlos"
    ],
    "subheadings": [
      "free comedy channels",
      "watch comedy shows online free",
      "funny tv live free",
      "مسرحيات كوميدية مجانية",
      "ضحك بث مباشر",
      "فرفشة تلفزيون مجاني",
      "كوميديا مغربية مجانية",
      "فكاهة تلفزيون حية",
      "comédie tv gratuit",
      "humour en direct gratuit",
      "spectacle live gratuit",
      "comedia tv gratis",
      "humor en vivo gratis",
      "chistes live gratis",
      "humor ao vivo gratis",
      "piadas live gratis",
      "komodie tv kostenlos",
      "humor live gratis"
    ],
    "keywords": [
      "free comedy channels",
      "watch comedy shows online free",
      "funny tv live free",
      "مسرحيات كوميدية مجانية",
      "ضحك بث مباشر",
      "فرفشة تلفزيون مجاني",
      "كوميديا مغربية مجانية",
      "فكاهة تلفزيون حية",
      "comédie tv gratuit",
      "humour en direct gratuit",
      "spectacle live gratuit",
      "comedia tv gratis",
      "humor en vivo gratis",
      "chistes live gratis",
      "humor ao vivo gratis",
      "piadas live gratis",
      "komodie tv kostenlos",
      "humor live gratis",
      "lustig live kostenlos",
      "お笑い 無料放送",
      "コメディー ライブ無料",
      "バラエティ 無料テレビ",
      "komedi tv ücretsiz",
      "gülmece canlı yayın bedava",
      "eğlence canlı ücretsiz",
      "喜剧频道 免费直播",
      "搞笑节目 在线免费",
      "相声小品 免费",
      "komische tv gratis",
      "grappen live gratis",
      "komedi tv gratis",
      "skämt live gratis",
      "komedie tv gratis",
      "vitser live gratis",
      "কমেডি টিভি বিনামূল্যে",
      "কৌতুক লাইভ বিনামূল্যে",
      "মজার অনুষ্ঠান বিনামূল্যে",
      "commedia tv gratis",
      "umorismo live gratis",
      "barzellette live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "cooking": {
    "primary": [
      "cooking shows free online",
      "طبخ بث مباشر",
      "طابخ بث مباشر",
      "cuisine tv gratuit",
      "cocina tv gratis",
      "culinaria tv gratis",
      "kochen tv kostenlos",
      "料理番組 無料放送"
    ],
    "headings": [
      "food network live free",
      "culinary tv free",
      "وصفات اونلاين مجانية",
      "مطبخ تلفزيوني حي",
      "اكلات مغربية مجانية",
      "وصفات تلفزيون حية",
      "recettes en direct gratuit",
      "gastronomie live gratuit",
      "recetas en vivo gratis",
      "gastronomia live gratis",
      "receitas ao vivo gratis",
      "rezepte live gratis",
      "kuche live kostenlos",
      "クッキング ライブ無料"
    ],
    "subheadings": [
      "cooking shows free online",
      "food network live free",
      "culinary tv free",
      "طبخ بث مباشر",
      "وصفات اونلاين مجانية",
      "مطبخ تلفزيوني حي",
      "طابخ بث مباشر",
      "اكلات مغربية مجانية",
      "وصفات تلفزيون حية",
      "cuisine tv gratuit",
      "recettes en direct gratuit",
      "gastronomie live gratuit",
      "cocina tv gratis",
      "recetas en vivo gratis",
      "gastronomia live gratis",
      "culinaria tv gratis",
      "receitas ao vivo gratis",
      "kochen tv kostenlos"
    ],
    "keywords": [
      "cooking shows free online",
      "food network live free",
      "culinary tv free",
      "طبخ بث مباشر",
      "وصفات اونلاين مجانية",
      "مطبخ تلفزيوني حي",
      "طابخ بث مباشر",
      "اكلات مغربية مجانية",
      "وصفات تلفزيون حية",
      "cuisine tv gratuit",
      "recettes en direct gratuit",
      "gastronomie live gratuit",
      "cocina tv gratis",
      "recetas en vivo gratis",
      "gastronomia live gratis",
      "culinaria tv gratis",
      "receitas ao vivo gratis",
      "kochen tv kostenlos",
      "rezepte live gratis",
      "kuche live kostenlos",
      "料理番組 無料放送",
      "クッキング ライブ無料",
      "グルメテレビ 無料",
      "yemek kanalı ücretsiz",
      "mutfak canlı yayın bedava",
      "aşçılık tv ücretsiz",
      "美食频道 免费直播",
      "烹饪节目 免费",
      "菜谱教学 免费电视",
      "kookprogramma gratis",
      "recepten live gratis",
      "gastronomie live gratis",
      "matlagning tv gratis",
      "recept live gratis",
      "gastronomi live gratis",
      "matlaging tv gratis",
      "oppskrifter live gratis",
      "রান্না টিভি বিনামূল্যে",
      "রেসিপি লাইভ বিনামূল্যে",
      "খাবার অনুষ্ঠান বিনামূল্যে",
      "cucina tv gratis",
      "ricette live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "culture": {
    "primary": [
      "culture tv channels free",
      "ثقافة بث مباشر",
      "ثقافة مغربية بث حي",
      "culture en direct gratuit",
      "cultura en vivo gratis",
      "cultura ao vivo gratis",
      "kultur live kostenlos",
      "文化 無料放送"
    ],
    "headings": [
      "watch cultural programs free",
      "documentary culture free",
      "تراث شعبي مجاني",
      "حضارة تلفزيون اونلاين",
      "عادات تقليدية تلفزيون",
      "art tv gratuit",
      "patrimoine live gratuit",
      "arte tv gratis",
      "tradicion live gratis",
      "tradicao live gratis",
      "kunst tv gratis",
      "tradition live kostenlos",
      "伝統 ライブ無料",
      "文化テレビ 無料"
    ],
    "subheadings": [
      "culture tv channels free",
      "watch cultural programs free",
      "documentary culture free",
      "ثقافة بث مباشر",
      "تراث شعبي مجاني",
      "حضارة تلفزيون اونلاين",
      "ثقافة مغربية بث حي",
      "عادات تقليدية تلفزيون",
      "culture en direct gratuit",
      "art tv gratuit",
      "patrimoine live gratuit",
      "cultura en vivo gratis",
      "arte tv gratis",
      "tradicion live gratis",
      "cultura ao vivo gratis",
      "tradicao live gratis",
      "kultur live kostenlos",
      "kunst tv gratis"
    ],
    "keywords": [
      "culture tv channels free",
      "watch cultural programs free",
      "documentary culture free",
      "ثقافة بث مباشر",
      "تراث شعبي مجاني",
      "حضارة تلفزيون اونلاين",
      "ثقافة مغربية بث حي",
      "عادات تقليدية تلفزيون",
      "culture en direct gratuit",
      "art tv gratuit",
      "patrimoine live gratuit",
      "cultura en vivo gratis",
      "arte tv gratis",
      "tradicion live gratis",
      "cultura ao vivo gratis",
      "tradicao live gratis",
      "kultur live kostenlos",
      "kunst tv gratis",
      "tradition live kostenlos",
      "文化 無料放送",
      "伝統 ライブ無料",
      "文化テレビ 無料",
      "kültür canlı yayın ücretsiz",
      "sanat tv bedava",
      "gelenek canlı ücretsiz",
      "文化频道 免费直播",
      "传统文化 免费",
      "文艺节目 免费电视",
      "cultuur live gratis",
      "traditie live gratis",
      "kultur live gratis",
      "konst tv gratis",
      "tradition live gratis",
      "tradisjon live gratis",
      "সংস্কৃতি লাইভ বিনামূল্যে",
      "শিল্প টিভি বিনামূল্যে",
      "ঐতিহ্য লাইভ বিনামূল্যে",
      "cultura live gratis",
      "tradizione live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "documentary": {
    "primary": [
      "free documentary channels",
      "وثائقي بث مباشر",
      "documentaire en direct gratuit",
      "documental en vivo gratis",
      "documentario ao vivo gratis",
      "dokumentation live kostenlos",
      "ドキュメンタリー 無料放送",
      "belgesel canlı yayın ücretsiz"
    ],
    "headings": [
      "watch documentaries online free",
      "nat geo live free",
      "اكتشاف عالم مجاني",
      "تاريخ اونلاين مجاني",
      "اكتشاف مجاني",
      "تاريخ مغرب تلفزيون",
      "discovery tv gratuit",
      "histoire live gratuit",
      "discovery tv gratis",
      "historia live gratis",
      "geschichte live kostenlos",
      "ディスカバリー 無料",
      "歴史番組 無料",
      "keşif tv bedava"
    ],
    "subheadings": [
      "free documentary channels",
      "watch documentaries online free",
      "nat geo live free",
      "وثائقي بث مباشر",
      "اكتشاف عالم مجاني",
      "تاريخ اونلاين مجاني",
      "اكتشاف مجاني",
      "تاريخ مغرب تلفزيون",
      "documentaire en direct gratuit",
      "discovery tv gratuit",
      "histoire live gratuit",
      "documental en vivo gratis",
      "discovery tv gratis",
      "historia live gratis",
      "documentario ao vivo gratis",
      "dokumentation live kostenlos",
      "geschichte live kostenlos",
      "ドキュメンタリー 無料放送"
    ],
    "keywords": [
      "free documentary channels",
      "watch documentaries online free",
      "nat geo live free",
      "وثائقي بث مباشر",
      "اكتشاف عالم مجاني",
      "تاريخ اونلاين مجاني",
      "اكتشاف مجاني",
      "تاريخ مغرب تلفزيون",
      "documentaire en direct gratuit",
      "discovery tv gratuit",
      "histoire live gratuit",
      "documental en vivo gratis",
      "discovery tv gratis",
      "historia live gratis",
      "documentario ao vivo gratis",
      "dokumentation live kostenlos",
      "geschichte live kostenlos",
      "ドキュメンタリー 無料放送",
      "ディスカバリー 無料",
      "歴史番組 無料",
      "belgesel canlı yayın ücretsiz",
      "keşif tv bedava",
      "tarih kanalı canlı",
      "纪录频道 免费直播",
      "探索发现 免费",
      "历史频道 免费电视",
      "documentaire live gratis",
      "ontdekking tv gratis",
      "geschiedenis live gratis",
      "dokumentär live gratis",
      "upptäckt tv gratis",
      "dokumentar live gratis",
      "oppdagelse tv gratis",
      "historie live gratis",
      "তথ্যচিত্র লাইভ বিনামূল্যে",
      "আবিষ্কার টিভি বিনামূল্যে",
      "ইতিহাস লাইভ বিনামূল্যে",
      "documentario live gratis",
      "storia live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "education": {
    "primary": [
      "educational tv free",
      "تعليم بث مباشر",
      "تعليم بث حي",
      "education tv gratuit",
      "educacion tv gratis",
      "educacao tv gratis",
      "bildung tv kostenlos",
      "教育テレビ 無料放送"
    ],
    "headings": [
      "learning channels online free",
      "discovery education free",
      "دروس اونلاين مجانية",
      "ثقافة عامة تلفزيون",
      "دروس مجانية",
      "cours en direct gratuit",
      "savoir live gratuit",
      "cursos en vivo gratis",
      "aprendizaje live gratis",
      "cursos ao vivo gratis",
      "aprendizado live gratis",
      "lernen live gratis",
      "wissen live kostenlos",
      "学習番組 無料"
    ],
    "subheadings": [
      "educational tv free",
      "learning channels online free",
      "discovery education free",
      "تعليم بث مباشر",
      "دروس اونلاين مجانية",
      "ثقافة عامة تلفزيون",
      "تعليم بث حي",
      "دروس مجانية",
      "education tv gratuit",
      "cours en direct gratuit",
      "savoir live gratuit",
      "educacion tv gratis",
      "cursos en vivo gratis",
      "aprendizaje live gratis",
      "educacao tv gratis",
      "cursos ao vivo gratis",
      "aprendizado live gratis",
      "bildung tv kostenlos"
    ],
    "keywords": [
      "educational tv free",
      "learning channels online free",
      "discovery education free",
      "تعليم بث مباشر",
      "دروس اونلاين مجانية",
      "ثقافة عامة تلفزيون",
      "تعليم بث حي",
      "دروس مجانية",
      "education tv gratuit",
      "cours en direct gratuit",
      "savoir live gratuit",
      "educacion tv gratis",
      "cursos en vivo gratis",
      "aprendizaje live gratis",
      "educacao tv gratis",
      "cursos ao vivo gratis",
      "aprendizado live gratis",
      "bildung tv kostenlos",
      "lernen live gratis",
      "wissen live kostenlos",
      "教育テレビ 無料放送",
      "学習番組 無料",
      "教養テレビ 無料",
      "eğitim tv ücretsiz",
      "ders canlı yayın bedava",
      "bilgi kanalı canlı",
      "教育频道 免费直播",
      "在线课程 免费",
      "知识讲座 免费电视",
      "onderwijs tv gratis",
      "cursussen live gratis",
      "kennis live gratis",
      "utbildning tv gratis",
      "kurser live gratis",
      "kunskap live gratis",
      "utdanning tv gratis",
      "kurs live gratis",
      "kunnskap live gratis",
      "শিক্ষা টিভি বিনামূল্যে",
      "শিক্ষা লাইভ বিনামূল্যে",
      "জ্ঞান লাইভ বিনামূল্যে",
      "educazione tv gratis",
      "corsi live gratis",
      "sapere live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "entertainment": {
    "primary": [
      "free entertainment channels",
      "ترفيه بث مباشر",
      "divertissement tv gratuit",
      "entretenimiento tv gratis",
      "entretenimento tv gratis",
      "unterhaltung tv kostenlos",
      "エンタメ 無料放送",
      "eğlence tv ücretsiz"
    ],
    "headings": [
      "watch entertainment tv online free",
      "celebrity tv free",
      "سهرات تلفزيونية مجانية",
      "فنون اونلاين مجانية",
      "سهرات مغربية مجانية",
      "فنون تلفزيون حية",
      "spectacle en direct gratuit",
      "loisirs live gratuit",
      "espectaculo en vivo gratis",
      "ocio live gratis",
      "espetaculo ao vivo gratis",
      "lazer live gratis",
      "show live gratis",
      "spa live kostenlos"
    ],
    "subheadings": [
      "free entertainment channels",
      "watch entertainment tv online free",
      "celebrity tv free",
      "ترفيه بث مباشر",
      "سهرات تلفزيونية مجانية",
      "فنون اونلاين مجانية",
      "سهرات مغربية مجانية",
      "فنون تلفزيون حية",
      "divertissement tv gratuit",
      "spectacle en direct gratuit",
      "loisirs live gratuit",
      "entretenimiento tv gratis",
      "espectaculo en vivo gratis",
      "ocio live gratis",
      "entretenimento tv gratis",
      "espetaculo ao vivo gratis",
      "lazer live gratis",
      "unterhaltung tv kostenlos"
    ],
    "keywords": [
      "free entertainment channels",
      "watch entertainment tv online free",
      "celebrity tv free",
      "ترفيه بث مباشر",
      "سهرات تلفزيونية مجانية",
      "فنون اونلاين مجانية",
      "سهرات مغربية مجانية",
      "فنون تلفزيون حية",
      "divertissement tv gratuit",
      "spectacle en direct gratuit",
      "loisirs live gratuit",
      "entretenimiento tv gratis",
      "espectaculo en vivo gratis",
      "ocio live gratis",
      "entretenimento tv gratis",
      "espetaculo ao vivo gratis",
      "lazer live gratis",
      "unterhaltung tv kostenlos",
      "show live gratis",
      "spa live kostenlos",
      "エンタメ 無料放送",
      "芸能 ライブ無料",
      "エンターテイメント 無料",
      "eğlence tv ücretsiz",
      "şov canlı yayın bedava",
      "magazin canlı ücretsiz",
      "娱乐频道 免费直播",
      "综艺节目 免费",
      "明星八卦 免费电视",
      "amusement tv gratis",
      "ontspanning live gratis",
      "underhållning tv gratis",
      "nöje live gratis",
      "underholdning tv gratis",
      "moro live gratis",
      "বিনোদন টিভি বিনামূল্যে",
      "মনোরঞ্জন লাইভ বিনামূল্যে",
      "অনুষ্ঠান বিনামূল্যে",
      "intrattenimento tv gratis",
      "spettacolo live gratis",
      "divertimento live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "family": {
    "primary": [
      "family tv channels free",
      "عائلة بث مباشر",
      "عائلة بث حي",
      "famille tv gratuit",
      "familia tv gratis",
      "familie tv kostenlos",
      "家族番組 無料放送",
      "aile kanalı ücretsiz"
    ],
    "headings": [
      "watch family shows online free",
      "kids family tv free",
      "برامج اسرية مجانية",
      "اسرة تلفزيون اونلاين",
      "دار تلفزيون مباشر",
      "programme famille en direct",
      "enfants parents live",
      "programa familiar en vivo",
      "padres hijos live",
      "programa familiar ao vivo",
      "pais filhos live",
      "familienprogramm live",
      "eltern kinder live",
      "ファミリー ライブ無料"
    ],
    "subheadings": [
      "family tv channels free",
      "watch family shows online free",
      "kids family tv free",
      "عائلة بث مباشر",
      "برامج اسرية مجانية",
      "اسرة تلفزيون اونلاين",
      "عائلة بث حي",
      "دار تلفزيون مباشر",
      "famille tv gratuit",
      "programme famille en direct",
      "enfants parents live",
      "familia tv gratis",
      "programa familiar en vivo",
      "padres hijos live",
      "programa familiar ao vivo",
      "pais filhos live",
      "familie tv kostenlos",
      "familienprogramm live"
    ],
    "keywords": [
      "family tv channels free",
      "watch family shows online free",
      "kids family tv free",
      "عائلة بث مباشر",
      "برامج اسرية مجانية",
      "اسرة تلفزيون اونلاين",
      "عائلة بث حي",
      "دار تلفزيون مباشر",
      "famille tv gratuit",
      "programme famille en direct",
      "enfants parents live",
      "familia tv gratis",
      "programa familiar en vivo",
      "padres hijos live",
      "programa familiar ao vivo",
      "pais filhos live",
      "familie tv kostenlos",
      "familienprogramm live",
      "eltern kinder live",
      "家族番組 無料放送",
      "ファミリー ライブ無料",
      "親子テレビ 無料",
      "aile kanalı ücretsiz",
      "aile programı canlı yayın",
      "ebeveyn çocuk tv",
      "家庭频道 免费直播",
      "亲子节目 免费",
      "家庭教育 免费电视",
      "familie tv gratis",
      "gezinsprogramma live",
      "ouders kinderen live",
      "familj tv gratis",
      "familjeprogram live",
      "föräldrar barn live",
      "familieprogram live",
      "foreldre barn live",
      "পরিবার টিভি বিনামূল্যে",
      "পারিবারিক অনুষ্ঠান লাইভ",
      "মা-বাবা সন্তান লাইভ",
      "famiglia tv gratis",
      "programma familiare live",
      "genitori figli live"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "general": {
    "primary": [
      "general tv channels free",
      "تلفزيون عام بث حي",
      "tv généraliste gratuit",
      "tv generalista gratis",
      "fernsehen allgemein kostenlos",
      "総合テレビ 無料放送",
      "genel tv kanalı ücretsiz",
      "综合频道 免费直播"
    ],
    "headings": [
      "watch general tv online free",
      "mainstream tv free",
      "قنوات متنوعة مجانية",
      "بث مباشر عام",
      "chaine générale en direct",
      "télévision générale live",
      "cadena general en vivo",
      "television general live",
      "canal geral ao vivo",
      "televisao geral live",
      "allgemeiner sender live",
      "general tv live",
      "一般チャンネル 無料",
      "地上波 無料"
    ],
    "subheadings": [
      "general tv channels free",
      "watch general tv online free",
      "mainstream tv free",
      "تلفزيون عام بث حي",
      "قنوات متنوعة مجانية",
      "بث مباشر عام",
      "tv généraliste gratuit",
      "chaine générale en direct",
      "télévision générale live",
      "tv generalista gratis",
      "cadena general en vivo",
      "television general live",
      "canal geral ao vivo",
      "televisao geral live",
      "fernsehen allgemein kostenlos",
      "allgemeiner sender live",
      "general tv live",
      "総合テレビ 無料放送"
    ],
    "keywords": [
      "general tv channels free",
      "watch general tv online free",
      "mainstream tv free",
      "تلفزيون عام بث حي",
      "قنوات متنوعة مجانية",
      "بث مباشر عام",
      "tv généraliste gratuit",
      "chaine générale en direct",
      "télévision générale live",
      "tv generalista gratis",
      "cadena general en vivo",
      "television general live",
      "canal geral ao vivo",
      "televisao geral live",
      "fernsehen allgemein kostenlos",
      "allgemeiner sender live",
      "general tv live",
      "総合テレビ 無料放送",
      "一般チャンネル 無料",
      "地上波 無料",
      "genel tv kanalı ücretsiz",
      "genel yayın canlı",
      "normal televizyon canlı",
      "综合频道 免费直播",
      "卫视频道 免费",
      "地方台 免费电视",
      "algemene tv gratis",
      "omroep live",
      "publieke televisie gratis",
      "allmän tv gratis",
      "allmän kanal live",
      "public service gratis",
      "generell tv gratis",
      "allmenn kanal live",
      "সাধারণ টিভি বিনামূল্যে",
      "সাধারণ চ্যানেল লাইভ",
      "পাবলিক টেলিভিশন বিনামূল্যে",
      "canale generale live",
      "televisione generale gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "kids": {
    "primary": [
      "free kids channels",
      "اطفال بث مباشر",
      "اطفال بث حي",
      "enfants tv gratuit",
      "ninos tv gratis",
      "criancas tv gratis",
      "kinder tv kostenlos",
      "キッズ 無料放送"
    ],
    "headings": [
      "watch cartoons online free",
      "children tv live free",
      "برامج اطفال مجانية",
      "كرتون تلفزيون حي",
      "برامج ولاد مجانية",
      "ولاد تلفزيون مباشر",
      "dessin animé en direct",
      "junior live gratuit",
      "dibujos en vivo gratis",
      "infantil live gratis",
      "desenhos ao vivo gratis",
      "zeichentrick live gratis",
      "kindersender live kostenlos",
      "子供向け 無料"
    ],
    "subheadings": [
      "free kids channels",
      "watch cartoons online free",
      "children tv live free",
      "اطفال بث مباشر",
      "برامج اطفال مجانية",
      "كرتون تلفزيون حي",
      "اطفال بث حي",
      "برامج ولاد مجانية",
      "ولاد تلفزيون مباشر",
      "enfants tv gratuit",
      "dessin animé en direct",
      "junior live gratuit",
      "ninos tv gratis",
      "dibujos en vivo gratis",
      "infantil live gratis",
      "criancas tv gratis",
      "desenhos ao vivo gratis",
      "kinder tv kostenlos"
    ],
    "keywords": [
      "free kids channels",
      "watch cartoons online free",
      "children tv live free",
      "اطفال بث مباشر",
      "برامج اطفال مجانية",
      "كرتون تلفزيون حي",
      "اطفال بث حي",
      "برامج ولاد مجانية",
      "ولاد تلفزيون مباشر",
      "enfants tv gratuit",
      "dessin animé en direct",
      "junior live gratuit",
      "ninos tv gratis",
      "dibujos en vivo gratis",
      "infantil live gratis",
      "criancas tv gratis",
      "desenhos ao vivo gratis",
      "kinder tv kostenlos",
      "zeichentrick live gratis",
      "kindersender live kostenlos",
      "キッズ 無料放送",
      "子供向け 無料",
      "アニメキッズ 無料",
      "çocuk kanalı ücretsiz",
      "çocuk programı canlı yayın",
      "anaokulu tv ücretsiz",
      "少儿频道 免费直播",
      "儿童节目 免费",
      "早教启蒙 免费电视",
      "kinderen tv gratis",
      "tekenfilms live gratis",
      "jeugd tv live gratis",
      "barn tv gratis",
      "barnprogram live gratis",
      "ungdom tv live gratis",
      "শিশু টিভি বিনামূল্যে",
      "শিশু অনুষ্ঠান লাইভ বিনামূল্যে",
      "বাচ্চাদের টিভি লাইভ",
      "bambini tv gratis",
      "programmi bambini live",
      "cartoni animati live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "legislative": {
    "primary": [
      "legislative tv live free",
      "قنوات برلمانية مجانية",
      "برلمان بث مباشر",
      "parlement en direct gratuit",
      "legislativo en vivo gratis",
      "legislativo ao vivo gratis",
      "gesetzgebung live kostenlos",
      "国会中継 無料"
    ],
    "headings": [
      "watch government channels free",
      "political tv free",
      "سياسة بث مباشر",
      "حكومة اونلاين مجاني",
      "سياسة مغربية حية",
      "حكومة تلفزيون مجاني",
      "politique tv gratuit",
      "gouvernement live",
      "politica tv gratis",
      "gobierno live gratis",
      "governo live gratis",
      "politik tv gratis",
      "regierung live kostenlos",
      "政治 ライブ無料"
    ],
    "subheadings": [
      "legislative tv live free",
      "watch government channels free",
      "political tv free",
      "قنوات برلمانية مجانية",
      "سياسة بث مباشر",
      "حكومة اونلاين مجاني",
      "برلمان بث مباشر",
      "سياسة مغربية حية",
      "حكومة تلفزيون مجاني",
      "parlement en direct gratuit",
      "politique tv gratuit",
      "gouvernement live",
      "legislativo en vivo gratis",
      "politica tv gratis",
      "gobierno live gratis",
      "legislativo ao vivo gratis",
      "governo live gratis",
      "gesetzgebung live kostenlos"
    ],
    "keywords": [
      "legislative tv live free",
      "watch government channels free",
      "political tv free",
      "قنوات برلمانية مجانية",
      "سياسة بث مباشر",
      "حكومة اونلاين مجاني",
      "برلمان بث مباشر",
      "سياسة مغربية حية",
      "حكومة تلفزيون مجاني",
      "parlement en direct gratuit",
      "politique tv gratuit",
      "gouvernement live",
      "legislativo en vivo gratis",
      "politica tv gratis",
      "gobierno live gratis",
      "legislativo ao vivo gratis",
      "governo live gratis",
      "gesetzgebung live kostenlos",
      "politik tv gratis",
      "regierung live kostenlos",
      "国会中継 無料",
      "政治 ライブ無料",
      "議会テレビ 無料",
      "meclis canlı yayın ücretsiz",
      "siyaset tv bedava",
      "hükümet canlı ücretsiz",
      "legislative 免费直播",
      "时政新闻 免费",
      "会议直播 免费电视",
      "wetgeving live gratis",
      "politiek tv gratis",
      "regering live gratis",
      "lagstiftning live gratis",
      "lovverk live gratis",
      "politikk tv gratis",
      "regjering live gratis",
      "আইন লাইভ বিনামূল্যে",
      "রাজনীতি টিভি বিনামূল্যে",
      "সরকার লাইভ বিনামূল্যে",
      "legislativo live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "lifestyle": {
    "primary": [
      "lifestyle tv channels free",
      "حياة بث مباشر",
      "حياة بث حي",
      "mode de vie tv gratuit",
      "estilo vida tv gratis",
      "lebensstil tv kostenlos",
      "ライフスタイル 無料放送",
      "yaşam tarzı tv ücretsiz"
    ],
    "headings": [
      "watch lifestyle shows free",
      "home garden tv free",
      "صحة وجمال مجاني",
      "موضة تلفزيون اونلاين",
      "موضة مغربية تلفزيون",
      "tendance en direct gratuit",
      "deco live gratuit",
      "tendencias en vivo gratis",
      "decoracion live gratis",
      "tendencias ao vivo gratis",
      "decoracao live gratis",
      "trends live gratis",
      "deko live kostenlos",
      "暮らし 無料"
    ],
    "subheadings": [
      "lifestyle tv channels free",
      "watch lifestyle shows free",
      "home garden tv free",
      "حياة بث مباشر",
      "صحة وجمال مجاني",
      "موضة تلفزيون اونلاين",
      "حياة بث حي",
      "موضة مغربية تلفزيون",
      "mode de vie tv gratuit",
      "tendance en direct gratuit",
      "deco live gratuit",
      "estilo vida tv gratis",
      "tendencias en vivo gratis",
      "decoracion live gratis",
      "tendencias ao vivo gratis",
      "decoracao live gratis",
      "lebensstil tv kostenlos",
      "trends live gratis"
    ],
    "keywords": [
      "lifestyle tv channels free",
      "watch lifestyle shows free",
      "home garden tv free",
      "حياة بث مباشر",
      "صحة وجمال مجاني",
      "موضة تلفزيون اونلاين",
      "حياة بث حي",
      "موضة مغربية تلفزيون",
      "mode de vie tv gratuit",
      "tendance en direct gratuit",
      "deco live gratuit",
      "estilo vida tv gratis",
      "tendencias en vivo gratis",
      "decoracion live gratis",
      "tendencias ao vivo gratis",
      "decoracao live gratis",
      "lebensstil tv kostenlos",
      "trends live gratis",
      "deko live kostenlos",
      "ライフスタイル 無料放送",
      "暮らし 無料",
      "トレンドテレビ 無料",
      "yaşam tarzı tv ücretsiz",
      "moda canlı yayın bedava",
      "dekorasyon canlı ücretsiz",
      "生活频道 免费直播",
      "时尚节目 免费",
      "健康养生 免费电视",
      "lifestyle tv gratis",
      "decoratie live gratis",
      "livsstil tv gratis",
      "trender live gratis",
      "inredning live gratis",
      "interiør live gratis",
      "জীবনধারা টিভি বিনামূল্যে",
      "ট্রেন্ড লাইভ বিনামূল্যে",
      "সাজসজ্জা লাইভ বিনামূল্যে",
      "stile di vita tv gratis",
      "tendenze live gratis",
      "arredamento live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "movies": {
    "primary": [
      "free movie channels",
      "افلام بث مباشر مجانية",
      "films en direct gratuit",
      "peliculas en vivo gratis",
      "filmes ao vivo gratis",
      "filme live kostenlos",
      "映画 無料放送",
      "film kanalı ücretsiz"
    ],
    "headings": [
      "watch movies online free",
      "film tv live free",
      "سينما اونلاين مجانية",
      "احدث الافلام تلفزيوني",
      "سينما مغربية مجانية",
      "احدث الافلام تلفزيون",
      "cinema tv gratuit",
      "movie live gratuit",
      "cine tv gratis",
      "films live gratis",
      "cinema tv gratis",
      "filmes live gratis",
      "kino tv gratis",
      "kinofilme live kostenlos"
    ],
    "subheadings": [
      "free movie channels",
      "watch movies online free",
      "film tv live free",
      "افلام بث مباشر مجانية",
      "سينما اونلاين مجانية",
      "احدث الافلام تلفزيوني",
      "سينما مغربية مجانية",
      "احدث الافلام تلفزيون",
      "films en direct gratuit",
      "cinema tv gratuit",
      "movie live gratuit",
      "peliculas en vivo gratis",
      "cine tv gratis",
      "films live gratis",
      "filmes ao vivo gratis",
      "cinema tv gratis",
      "filmes live gratis",
      "filme live kostenlos"
    ],
    "keywords": [
      "free movie channels",
      "watch movies online free",
      "film tv live free",
      "افلام بث مباشر مجانية",
      "سينما اونلاين مجانية",
      "احدث الافلام تلفزيوني",
      "سينما مغربية مجانية",
      "احدث الافلام تلفزيون",
      "films en direct gratuit",
      "cinema tv gratuit",
      "movie live gratuit",
      "peliculas en vivo gratis",
      "cine tv gratis",
      "films live gratis",
      "filmes ao vivo gratis",
      "cinema tv gratis",
      "filmes live gratis",
      "filme live kostenlos",
      "kino tv gratis",
      "kinofilme live kostenlos",
      "映画 無料放送",
      "映画チャンネル 無料",
      "洋画邦画 無料",
      "film kanalı ücretsiz",
      "sinema canlı yayın bedava",
      "film izle tv ücretsiz",
      "电影频道 免费直播",
      "新片上映 免费",
      "好莱坞大片 免费电视",
      "bioscoop tv gratis",
      "filmer live gratis",
      "bio tv gratis",
      "সিনেমা লাইভ বিনামূল্যে",
      "সিনেমা টিভি বিনামূল্যে",
      "ফিল্ম লাইভ বিনামূল্যে",
      "film live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "outdoor": {
    "primary": [
      "outdoor tv channels free",
      "طبيعة بث مباشر",
      "طبيعة بث حي",
      "nature tv gratuit",
      "aire libre tv gratis",
      "ar livre tv gratis",
      "draussen tv kostenlos",
      "アウトドア 無料放送"
    ],
    "headings": [
      "watch nature online free",
      "adventure tv free",
      "مغامرات مجانية",
      "حياة برية تلفزيون",
      "سفر تلفزيون مباشر",
      "aventure en direct gratuit",
      "exploration live gratuit",
      "naturaleza en vivo gratis",
      "aventura live gratis",
      "natureza ao vivo gratis",
      "natur live gratis",
      "abenteuer live kostenlos",
      "自然番組 無料",
      "冒険テレビ 無料"
    ],
    "subheadings": [
      "outdoor tv channels free",
      "watch nature online free",
      "adventure tv free",
      "طبيعة بث مباشر",
      "مغامرات مجانية",
      "حياة برية تلفزيون",
      "طبيعة بث حي",
      "سفر تلفزيون مباشر",
      "nature tv gratuit",
      "aventure en direct gratuit",
      "exploration live gratuit",
      "aire libre tv gratis",
      "naturaleza en vivo gratis",
      "aventura live gratis",
      "ar livre tv gratis",
      "natureza ao vivo gratis",
      "draussen tv kostenlos",
      "natur live gratis"
    ],
    "keywords": [
      "outdoor tv channels free",
      "watch nature online free",
      "adventure tv free",
      "طبيعة بث مباشر",
      "مغامرات مجانية",
      "حياة برية تلفزيون",
      "طبيعة بث حي",
      "سفر تلفزيون مباشر",
      "nature tv gratuit",
      "aventure en direct gratuit",
      "exploration live gratuit",
      "aire libre tv gratis",
      "naturaleza en vivo gratis",
      "aventura live gratis",
      "ar livre tv gratis",
      "natureza ao vivo gratis",
      "draussen tv kostenlos",
      "natur live gratis",
      "abenteuer live kostenlos",
      "アウトドア 無料放送",
      "自然番組 無料",
      "冒険テレビ 無料",
      "doğa tv ücretsiz",
      "kamp canlı yayın bedava",
      "macera kanalı canlı",
      "户外频道 免费直播",
      "旅游探险 免费",
      "自然风光 免费电视",
      "buiten tv gratis",
      "natuur live gratis",
      "avontuur live gratis",
      "utomhus tv gratis",
      "äventyr live gratis",
      "utendørs tv gratis",
      "eventyr live gratis",
      "বাহিরে টিভি বিনামূল্যে",
      "প্রকৃতি লাইভ বিনামূল্যে",
      "অ্যাডভেঞ্চার লাইভ বিনামূল্যে",
      "all aperto tv gratis",
      "natura live gratis",
      "avventura live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "relax": {
    "primary": [
      "relaxation tv free",
      "استرخاء بث مباشر",
      "استرخاء بث حي",
      "relaxation tv gratuit",
      "relajacion tv gratis",
      "relaxamento tv gratis",
      "entspannung tv kostenlos",
      "リラクゼーション 無料"
    ],
    "headings": [
      "meditation channels online free",
      "calm tv live free",
      "تأمل اونلاين مجاني",
      "هدوء تلفزيوني حي",
      "هدوء مجاني",
      "راحة تلفزيون مباشر",
      "zen en direct gratuit",
      "bien etre live gratuit",
      "zen en vivo gratis",
      "tranquilidad live gratis",
      "zen ao vivo gratis",
      "tranquilidade live gratis",
      "zen live gratis",
      "ruhe live kostenlos"
    ],
    "subheadings": [
      "relaxation tv free",
      "meditation channels online free",
      "calm tv live free",
      "استرخاء بث مباشر",
      "تأمل اونلاين مجاني",
      "هدوء تلفزيوني حي",
      "استرخاء بث حي",
      "هدوء مجاني",
      "راحة تلفزيون مباشر",
      "relaxation tv gratuit",
      "zen en direct gratuit",
      "bien etre live gratuit",
      "relajacion tv gratis",
      "zen en vivo gratis",
      "tranquilidad live gratis",
      "relaxamento tv gratis",
      "zen ao vivo gratis",
      "tranquilidade live gratis"
    ],
    "keywords": [
      "relaxation tv free",
      "meditation channels online free",
      "calm tv live free",
      "استرخاء بث مباشر",
      "تأمل اونلاين مجاني",
      "هدوء تلفزيوني حي",
      "استرخاء بث حي",
      "هدوء مجاني",
      "راحة تلفزيون مباشر",
      "relaxation tv gratuit",
      "zen en direct gratuit",
      "bien etre live gratuit",
      "relajacion tv gratis",
      "zen en vivo gratis",
      "tranquilidad live gratis",
      "relaxamento tv gratis",
      "zen ao vivo gratis",
      "tranquilidade live gratis",
      "entspannung tv kostenlos",
      "zen live gratis",
      "ruhe live kostenlos",
      "リラクゼーション 無料",
      "癒し番組 無料",
      "禅テレビ 無料",
      "rahatlama tv ücretsiz",
      "meditasyon canlı yayın bedava",
      "huzur kanalı canlı",
      "休闲频道 免费直播",
      "轻松娱乐 免费",
      "瑜伽冥想 免费电视",
      "ontspanning tv gratis",
      "rust live gratis",
      "avkoppling tv gratis",
      "lugna live gratis",
      "avslapping tv gratis",
      "ro live gratis",
      "শিথিল টিভি বিনামূল্যে",
      "ধ্যান লাইভ বিনামূল্যে",
      "শান্তি লাইভ বিনামূল্যে",
      "relax tv gratis",
      "tranquillita live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "religious": {
    "primary": [
      "religious tv channels free",
      "قنوات دينية مجانية",
      "دين بث مباشر",
      "religion tv gratuit",
      "religion tv gratis",
      "religiao tv gratis",
      "religion tv kostenlos",
      "宗教 無料放送"
    ],
    "headings": [
      "watch church online free",
      "spiritual tv free",
      "دروس اسلامية بث حي",
      "قرآن تلفزيون مباشر",
      "فتاوى مجانية",
      "قرآن تلفزيون حي",
      "spiritualite en direct",
      "eglise live gratuit",
      "espiritualidad en vivo",
      "iglesia live gratis",
      "espiritualidade ao vivo",
      "igreja live gratis",
      "spiritualitat live",
      "kirche live kostenlos"
    ],
    "subheadings": [
      "religious tv channels free",
      "watch church online free",
      "spiritual tv free",
      "قنوات دينية مجانية",
      "دروس اسلامية بث حي",
      "قرآن تلفزيون مباشر",
      "دين بث مباشر",
      "فتاوى مجانية",
      "قرآن تلفزيون حي",
      "religion tv gratuit",
      "spiritualite en direct",
      "eglise live gratuit",
      "religion tv gratis",
      "espiritualidad en vivo",
      "iglesia live gratis",
      "religiao tv gratis",
      "espiritualidade ao vivo",
      "igreja live gratis"
    ],
    "keywords": [
      "religious tv channels free",
      "watch church online free",
      "spiritual tv free",
      "قنوات دينية مجانية",
      "دروس اسلامية بث حي",
      "قرآن تلفزيون مباشر",
      "دين بث مباشر",
      "فتاوى مجانية",
      "قرآن تلفزيون حي",
      "religion tv gratuit",
      "spiritualite en direct",
      "eglise live gratuit",
      "religion tv gratis",
      "espiritualidad en vivo",
      "iglesia live gratis",
      "religiao tv gratis",
      "espiritualidade ao vivo",
      "igreja live gratis",
      "religion tv kostenlos",
      "spiritualitat live",
      "kirche live kostenlos",
      "宗教 無料放送",
      "spirituality 無料",
      "お寺テレビ 無料",
      "dini kanal ücretsiz",
      "maneviyat canlı yayın",
      "cami tv canlı ücretsiz",
      "宗教频道 免费直播",
      "佛教道教 免费",
      "教堂礼拜 免费电视",
      "religie tv gratis",
      "spiritualiteit live",
      "kerk live gratis",
      "andlighet live",
      "kyrkan live gratis",
      "åndelighet live",
      "kirke live gratis",
      "ধর্মীয় টিভি বিনামূল্যে",
      "আধ্যাত্মিকতা লাইভ",
      "গির্জা লাইভ বিনামূল্যে",
      "religione tv gratis",
      "spiritualita live",
      "chiesa live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "series": {
    "primary": [
      "free series streaming",
      "مسلسلات بث مباشر",
      "مسلسلات بث حي",
      "series tv gratuit",
      "series tv gratis",
      "serien tv kostenlos",
      "ドラマ 無料放送",
      "dizi kanalı ücretsiz"
    ],
    "headings": [
      "watch tv series online free",
      "drama tv live free",
      "دراما عربية مجانية",
      "مسلسلات تركية تلفزيون",
      "دراما مغربية مجانية",
      "سلسلات تلفزيون مباشر",
      "feuilleton en direct gratuit",
      "drama live gratuit",
      "telenovela en vivo gratis",
      "drama live gratis",
      "telenovela ao vivo gratis",
      "fernsehserie live gratis",
      "drama live kostenlos",
      "連続ドラマ 無料"
    ],
    "subheadings": [
      "free series streaming",
      "watch tv series online free",
      "drama tv live free",
      "مسلسلات بث مباشر",
      "دراما عربية مجانية",
      "مسلسلات تركية تلفزيون",
      "مسلسلات بث حي",
      "دراما مغربية مجانية",
      "سلسلات تلفزيون مباشر",
      "series tv gratuit",
      "feuilleton en direct gratuit",
      "drama live gratuit",
      "series tv gratis",
      "telenovela en vivo gratis",
      "drama live gratis",
      "telenovela ao vivo gratis",
      "serien tv kostenlos",
      "fernsehserie live gratis"
    ],
    "keywords": [
      "free series streaming",
      "watch tv series online free",
      "drama tv live free",
      "مسلسلات بث مباشر",
      "دراما عربية مجانية",
      "مسلسلات تركية تلفزيون",
      "مسلسلات بث حي",
      "دراما مغربية مجانية",
      "سلسلات تلفزيون مباشر",
      "series tv gratuit",
      "feuilleton en direct gratuit",
      "drama live gratuit",
      "series tv gratis",
      "telenovela en vivo gratis",
      "drama live gratis",
      "telenovela ao vivo gratis",
      "serien tv kostenlos",
      "fernsehserie live gratis",
      "drama live kostenlos",
      "ドラマ 無料放送",
      "連続ドラマ 無料",
      "韓国ドラマ 無料",
      "dizi kanalı ücretsiz",
      "dizi canlı yayın bedava",
      "yerli dizi tv ücretsiz",
      "电视剧 免费直播",
      "热播剧集 免费",
      "韩剧美剧 免费电视",
      "tv serie live gratis",
      "serier tv gratis",
      "ধারাবাহিক টিভি বিনামূল্যে",
      "টিভি সিরিজ লাইভ বিনামূল্যে",
      "নাটক লাইভ বিনামূল্যে",
      "serie tv gratis",
      "serie televisive live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "science": {
    "primary": [
      "science tv channels free",
      "علوم بث مباشر",
      "علوم بث حي",
      "science tv gratuit",
      "ciencia tv gratis",
      "wissenschaft tv kostenlos",
      "科学 無料放送",
      "bilim kanalı ücretsiz"
    ],
    "headings": [
      "watch discovery online free",
      "space tv free",
      "اكتشافات مجانية",
      "فضاء تلفزيون اونلاين",
      "فضاء تلفزيون مباشر",
      "decouverte en direct",
      "espace live gratuit",
      "descubrimiento en vivo",
      "espacio live gratis",
      "descoberta ao vivo",
      "espaco live gratis",
      "entdeckung live",
      "weltraum live kostenlos",
      "サイエンス 無料"
    ],
    "subheadings": [
      "science tv channels free",
      "watch discovery online free",
      "space tv free",
      "علوم بث مباشر",
      "اكتشافات مجانية",
      "فضاء تلفزيون اونلاين",
      "علوم بث حي",
      "فضاء تلفزيون مباشر",
      "science tv gratuit",
      "decouverte en direct",
      "espace live gratuit",
      "ciencia tv gratis",
      "descubrimiento en vivo",
      "espacio live gratis",
      "descoberta ao vivo",
      "espaco live gratis",
      "wissenschaft tv kostenlos",
      "entdeckung live"
    ],
    "keywords": [
      "science tv channels free",
      "watch discovery online free",
      "space tv free",
      "علوم بث مباشر",
      "اكتشافات مجانية",
      "فضاء تلفزيون اونلاين",
      "علوم بث حي",
      "فضاء تلفزيون مباشر",
      "science tv gratuit",
      "decouverte en direct",
      "espace live gratuit",
      "ciencia tv gratis",
      "descubrimiento en vivo",
      "espacio live gratis",
      "descoberta ao vivo",
      "espaco live gratis",
      "wissenschaft tv kostenlos",
      "entdeckung live",
      "weltraum live kostenlos",
      "科学 無料放送",
      "サイエンス 無料",
      "宇宙番組 無料",
      "bilim kanalı ücretsiz",
      "keşif canlı yayın bedava",
      "uzay tv canlı",
      "科技频道 免费直播",
      "探索宇宙 免费",
      "自然奥秘 免费电视",
      "wetenschap tv gratis",
      "ontdekking live",
      "ruimte live gratis",
      "vetenskap tv gratis",
      "upptäckt live",
      "rymden live gratis",
      "vitenskap tv gratis",
      "oppdagelse live",
      "romfart live gratis",
      "বিজ্ঞান টিভি বিনামূল্যে",
      "আবিষ্কার লাইভ বিনামূল্যে",
      "মহাকাশ লাইভ বিনামূল্যে",
      "scienza tv gratis",
      "scoperta live",
      "spazio live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "shop": {
    "primary": [
      "shopping tv channels free",
      "تسوق بث مباشر",
      "تسوق بث حي",
      "teleshopping gratuit",
      "televenta gratis",
      "tele compras gratis",
      "teleshopping kostenlos",
      "通販 無料放送"
    ],
    "headings": [
      "watch home shopping free",
      "deals tv live free",
      "عروض تلفزيونية مجانية",
      "تسوق اونلاين مجاني",
      "عروض مجانية",
      "تجارة تلفزيون مباشر",
      "achat tv en direct",
      "bonnes affaires live",
      "compras tv en vivo",
      "ofertas live gratis",
      "compras tv ao vivo",
      "einkaufen tv live",
      "angebote live kostenlos",
      "ショッピング 無料"
    ],
    "subheadings": [
      "shopping tv channels free",
      "watch home shopping free",
      "deals tv live free",
      "تسوق بث مباشر",
      "عروض تلفزيونية مجانية",
      "تسوق اونلاين مجاني",
      "تسوق بث حي",
      "عروض مجانية",
      "تجارة تلفزيون مباشر",
      "teleshopping gratuit",
      "achat tv en direct",
      "bonnes affaires live",
      "televenta gratis",
      "compras tv en vivo",
      "ofertas live gratis",
      "tele compras gratis",
      "compras tv ao vivo",
      "teleshopping kostenlos"
    ],
    "keywords": [
      "shopping tv channels free",
      "watch home shopping free",
      "deals tv live free",
      "تسوق بث مباشر",
      "عروض تلفزيونية مجانية",
      "تسوق اونلاين مجاني",
      "تسوق بث حي",
      "عروض مجانية",
      "تجارة تلفزيون مباشر",
      "teleshopping gratuit",
      "achat tv en direct",
      "bonnes affaires live",
      "televenta gratis",
      "compras tv en vivo",
      "ofertas live gratis",
      "tele compras gratis",
      "compras tv ao vivo",
      "teleshopping kostenlos",
      "einkaufen tv live",
      "angebote live kostenlos",
      "通販 無料放送",
      "ショッピング 無料",
      "テレビショッピング 無料",
      "alışveriş kanalı ücretsiz",
      "televizyon alışverişi canlı",
      "fırsat tv canlı",
      "购物频道 免费直播",
      "电视购物 免费",
      "优惠促销 免费电视",
      "teleshopping gratis",
      "winkelen tv live",
      "aanbiedingen live gratis",
      "shopping tv gratis",
      "handla tv live",
      "erbjudanden live gratis",
      "handle tv live",
      "tilbud live gratis",
      "কেনাকাটা টিভি বিনামূল্যে",
      "টিভি শপিং লাইভ",
      "অফার লাইভ বিনামূল্যে",
      "tv shopping live",
      "offerte live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "travel": {
    "primary": [
      "travel tv channels free",
      "سفر بث مباشر",
      "سياحة بث حي",
      "voyage tv gratuit",
      "viajes tv gratis",
      "viagens tv gratis",
      "reisen tv kostenlos",
      "旅行 無料放送"
    ],
    "headings": [
      "watch travel shows online free",
      "adventure travel tv free",
      "سياحة مجانية",
      "رحلات تلفزيون اونلاين",
      "رحلات مجانية",
      "سفر تلفزيون مباشر",
      "tourisme en direct gratuit",
      "aventure live gratuit",
      "turismo en vivo gratis",
      "aventura live gratis",
      "turismo ao vivo gratis",
      "tourismus live gratis",
      "abenteuer live kostenlos",
      "観光番組 無料"
    ],
    "subheadings": [
      "travel tv channels free",
      "watch travel shows online free",
      "adventure travel tv free",
      "سفر بث مباشر",
      "سياحة مجانية",
      "رحلات تلفزيون اونلاين",
      "سياحة بث حي",
      "رحلات مجانية",
      "سفر تلفزيون مباشر",
      "voyage tv gratuit",
      "tourisme en direct gratuit",
      "aventure live gratuit",
      "viajes tv gratis",
      "turismo en vivo gratis",
      "aventura live gratis",
      "viagens tv gratis",
      "turismo ao vivo gratis",
      "reisen tv kostenlos"
    ],
    "keywords": [
      "travel tv channels free",
      "watch travel shows online free",
      "adventure travel tv free",
      "سفر بث مباشر",
      "سياحة مجانية",
      "رحلات تلفزيون اونلاين",
      "سياحة بث حي",
      "رحلات مجانية",
      "سفر تلفزيون مباشر",
      "voyage tv gratuit",
      "tourisme en direct gratuit",
      "aventure live gratuit",
      "viajes tv gratis",
      "turismo en vivo gratis",
      "aventura live gratis",
      "viagens tv gratis",
      "turismo ao vivo gratis",
      "reisen tv kostenlos",
      "tourismus live gratis",
      "abenteuer live kostenlos",
      "旅行 無料放送",
      "観光番組 無料",
      "世界一周 無料",
      "seyahat tv ücretsiz",
      "gezi canlı yayın bedava",
      "turistik kanal canlı",
      "旅游频道 免费直播",
      "世界各地 免费",
      "风景美食 免费电视",
      "reizen tv gratis",
      "toerisme live gratis",
      "avontuur live gratis",
      "resa tv gratis",
      "turism live gratis",
      "äventyr live gratis",
      "reise tv gratis",
      "turisme live gratis",
      "eventyr live gratis",
      "ভ্রমণ টিভি বিনামূল্যে",
      "ভ্রমণ লাইভ বিনামূল্যে",
      "দর্শনীয় স্থান লাইভ বিনামূল্যে",
      "viaggi tv gratis",
      "turismo live gratis",
      "avventura live gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  },
  "weather": {
    "primary": [
      "weather channel live free",
      "طقس بث مباشر",
      "طقس بث حي",
      "meteo en direct gratuit",
      "clima en vivo gratis",
      "tempo ao vivo gratis",
      "wetter live kostenlos",
      "天気予報 無料放送"
    ],
    "headings": [
      "watch weather tv online free",
      "local weather free",
      "حالة جوية مجانية",
      "اخبار الطقس تلفزيوني",
      "مناخ تلفزيون مباشر",
      "previsions tv gratuit",
      "climat live gratuit",
      "pronostico tv gratis",
      "meteorologia live gratis",
      "previsao tv gratis",
      "clima live gratis",
      "vorhersage tv gratis",
      "klima live kostenlos",
      "気象情報 無料"
    ],
    "subheadings": [
      "weather channel live free",
      "watch weather tv online free",
      "local weather free",
      "طقس بث مباشر",
      "حالة جوية مجانية",
      "اخبار الطقس تلفزيوني",
      "طقس بث حي",
      "مناخ تلفزيون مباشر",
      "meteo en direct gratuit",
      "previsions tv gratuit",
      "climat live gratuit",
      "clima en vivo gratis",
      "pronostico tv gratis",
      "meteorologia live gratis",
      "tempo ao vivo gratis",
      "previsao tv gratis",
      "clima live gratis",
      "wetter live kostenlos"
    ],
    "keywords": [
      "weather channel live free",
      "watch weather tv online free",
      "local weather free",
      "طقس بث مباشر",
      "حالة جوية مجانية",
      "اخبار الطقس تلفزيوني",
      "طقس بث حي",
      "مناخ تلفزيون مباشر",
      "meteo en direct gratuit",
      "previsions tv gratuit",
      "climat live gratuit",
      "clima en vivo gratis",
      "pronostico tv gratis",
      "meteorologia live gratis",
      "tempo ao vivo gratis",
      "previsao tv gratis",
      "clima live gratis",
      "wetter live kostenlos",
      "vorhersage tv gratis",
      "klima live kostenlos",
      "天気予報 無料放送",
      "気象情報 無料",
      "天気ライブ 無料",
      "hava durumu canlı ücretsiz",
      "meteoroloji tv bedava",
      "iklim kanalı canlı",
      "气象频道 免费直播",
      "天气预报 免费",
      "自然灾害 免费电视",
      "weer live gratis",
      "voorspelling tv gratis",
      "klimaat live gratis",
      "väder live gratis",
      "prognos tv gratis",
      "klimat live gratis",
      "vær live gratis",
      "prognose tv gratis",
      "klima live gratis",
      "আবহাওয়া লাইভ বিনামূল্যে",
      "পূর্বাভাস টিভি বিনামূল্যে",
      "জলবায়ু লাইভ বিনামূল্যে",
      "meteo live gratis",
      "previsioni tv gratis"
    ],
    "countries": [
      "USA",
      "Saudi Arabia",
      "Morocco",
      "France",
      "Spain",
      "Brazil",
      "Germany",
      "Japan",
      "Turkey",
      "China",
      "Netherlands",
      "Sweden",
      "Norway",
      "Bangladesh",
      "Italy"
    ],
    "languages": [
      "English",
      "Arabic",
      "French",
      "Spanish",
      "Portuguese",
      "German",
      "Japanese",
      "Turkish",
      "Chinese",
      "Dutch",
      "Swedish",
      "Norwegian",
      "Bengali",
      "Italian"
    ]
  }
};
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
  "世界杯2026直播",
  "world cup 2026 live streaming",
  "免费在线电视直播",
  "fifa world cup 2026 live",
  "free live tv",
  "watch free live tv online no sign up",
  "canlı tv izle ücretsiz",
  "كأس العالم 2026 بث مباشر",
  "live tv streaming",
  "watch world cup live free",
  "free live tv no registration",
  "مشاهدة قنوات عربية بث مباشر",
  "免费看电视 不用注册",
  "watch live tv online",
  "watch international tv online free streaming",
  "regarder tv en direct gratuit",
  "bedava canlı maç izle",
  "free tv online",
  "free iptv world channels",
  "free arabic tv channels online",
  "watch free tv",
  "free streaming sites",
  "live tv globe 3d",
  "بث مباشر تلفزيون مجاني",
  "live tv free",
  "live football streaming",
  "iptv free",
  "free sports streaming",
  "free live tv streaming sites",
  "free tv channels",
  "free live tv app",
  "watch tv online free",
  "best free live tv",
  "free live streaming",
  "free tv streaming apps",
  "live tv app free",
  "watch live sports free",
  "mundial 2026 en vivo gratis",
  "coupe du monde 2026 en direct",
  "assistir tv ao vivo gratis",
  "free live tv streaming apps for android",
  "tv en direct gratuit sans inscription",
  "assistir tv online gratis",
  "Weltmeisterschaft 2026 live",
  "無料テレビ視聴",
  "canlı dünya kupası izle",
  "free sports streaming sites no sign up",
  "crackstreams alternative",
  "watch live tv online free hindi",
  "yalla shoot alternative",
  "ワールドカップ2026 ライブ",
  "best free live tv streaming reddit",
  "free live tv deutschland",
  "free live tv bangladesh",
  "ustvgo alternative",
  "free live tv apk firestick",
  "gratis tv kijken online",
  "streameast alternative",
  "free live tv streaming south africa",
  "vipleague alternative",
  "sportrar alternative",
  "বাংলাদেশ ফ্রি টিভি",
  "gratis tv online sverige",
  "gratis tv på nettet norge",
  "total sportek alternative",
  "bielańska dyskoteka",
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
  "kanal d izle",
  "映画 オンライン 無料",
  "atv izle",
  "tv online schauen kostenlos",
  "marruecos partido hoy",
  "morocco afcon",
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
  "haber tv izle",
  "مباراة المغرب القادمة",
  "equipe maroc live",
  "スポーツ ライブ 無料",
  "marruecos mundial",
  "morocco vs france",
  "tv8 izle",
  "مباراة المغرب بث مباشر",
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
      bodyHtml: `
      <p>These answers explain how WatchNations works as a free global TV discovery platform for country pages, categories, radio stations, and external live TV links.</p>
      <h2>WatchNations Questions</h2>
      <h3>Is WatchNations free?</h3>
      <p>Yes. WatchNations is free to use and does not require an account, email, subscription, or signup.</p>
      <h3>How do I find channels?</h3>
      <p>Choose a country from the globe, use country search, or browse categories such as news, sports, music, movies, kids, weather, and education.</p>
      <h3>Why are some channels unavailable?</h3>
      <p>External live streams can change, go offline, or be restricted by the original provider. WatchNations organizes publicly available links but does not control external streams.</p>
      <h3>Does WatchNations host video streams?</h3>
      <p>No. WatchNations does not host, upload, or own video content. It organizes external public sources in good faith.</p>
    `
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
  const detail = SEO_CATEGORY_DETAILS[id] || {};
  const categoryKeywords = buildCategoryKeywords(id);
  return seoPage({
    path: `/categories/${id}`,
    title: `${label} Live TV Channels - WatchNations`,
    description: categoryDescription(label, summary, detail),
    heading: `${label} Live TV Channels`,
    bodyHtml: categorySeoBody(id, label, summary, detail),
    keywords: categoryKeywords,
    newsKeywords: categoryKeywords.slice(0, 48),
    cta: { href: `/?category=${id}`, label: `Open ${label} Channels` }
  });
}


function categoryDescription(label, summary, detail = {}) {
  const primary = compactSeoList([...(detail.primary || []), ...(detail.keywords || [])], 4).join(', ');
  const suffix = primary ? ` Search topics include ${primary}.` : '';
  return `Discover ${summary} on WatchNations. Browse free live TV channels by category, country, and interactive 3D globe TV channels.${suffix}`.slice(0, 300);
}

function buildCategoryKeywords(id) {
  const detail = SEO_CATEGORY_DETAILS[id] || {};
  return compactSeoList([
    ...(detail.keywords || []),
    ...(detail.primary || []),
    ...(detail.headings || []),
    ...(detail.subheadings || []),
    ...SEO_KEYWORDS
  ], 220);
}

function categorySeoBody(id, label, summary, detail = {}) {
  const primary = compactSeoList(detail.primary || [], 8);
  const headings = compactSeoList(detail.headings || [], 10);
  const subheadings = compactSeoList(detail.subheadings || [], 12);
  const keywords = compactSeoList(detail.keywords || [], 22);
  const countries = compactSeoList(detail.countries || [], 15);
  const languages = compactSeoList(detail.languages || [], 14);
  const related = SEO_CATEGORIES
    .filter(([categoryId]) => categoryId !== id)
    .slice(0, 8)
    .map(([categoryId, categoryLabel]) => `<a href="/categories/${escapeHtml(categoryId)}">${escapeHtml(categoryLabel)}</a>`)
    .join('');

  return `
      <p>WatchNations helps users discover ${escapeHtml(summary)} through a fast global TV guide, country pages, and the interactive 3D globe.</p>
      <h2>${escapeHtml(label)} TV Search Intent</h2>
      <p>${escapeHtml(sentenceFromList(primary, `${label.toLowerCase()} live TV`, `${label} searches include`))}</p>
      <h3>High-Intent ${escapeHtml(label)} Keywords</h3>
      <p>${escapeHtml(sentenceFromList(keywords, `${label.toLowerCase()} channels online free`, 'People also search for'))}</p>
      <h2>${escapeHtml(label)} Channels by Country and Language</h2>
      <p>This category is optimized for viewers searching from ${escapeHtml(formatSeoList(countries))}. It also supports multilingual discovery in ${escapeHtml(formatSeoList(languages))}.</p>
      <h3>Related ${escapeHtml(label)} Headings</h3>
      <p>${escapeHtml(sentenceFromList(headings, `watch ${label.toLowerCase()} online`, 'Useful page topics include'))}</p>
      <h3>More ${escapeHtml(label)} Discovery Topics</h3>
      <p>${escapeHtml(sentenceFromList(subheadings, `${label.toLowerCase()} streaming`, 'Additional searches include'))}</p>
      <nav aria-label="Related category pages" class="related-category-links">${related}</nav>
      <p>Streams are provided by external public sources. WatchNations does not host or control video content.</p>
    `;
}

function compactSeoList(items = [], limit = 20) {
  const seen = new Set();
  const result = [];
  items.forEach((item) => {
    const value = String(item || '').trim();
    const key = value.toLowerCase();
    if (!value || seen.has(key)) return;
    seen.add(key);
    result.push(value);
  });
  return result.slice(0, limit);
}

function sentenceFromList(items, fallback, prefix) {
  const list = compactSeoList(items, 12);
  return `${prefix} ${formatSeoList(list.length ? list : [fallback])}.`;
}

function formatSeoList(items = []) {
  const list = compactSeoList(items, 20);
  if (!list.length) return '';
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
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
    title: `Watch ${country.name} TV Channels Live Online Free | WatchNations`,
    description: `${country.name} TV channels, radio stations, and online newspapers for free. Browse live news, sports, music, and entertainment on WatchNations.`,
    heading: `Watch ${country.name} TV Channels Live Online`,
    bodyHtml: countrySeoBody(code, country),
    cta: { href: `/?country=${code}`, label: `Open ${country.name} in WatchNations` }
  });
}

function countrySeoBody(code, country) {
  const nearby = nearbyCountryLinks(code);
  const categories = countryCategoryLinks(country.name);
  return `
      <p>WatchNations is a free country media guide for ${escapeHtml(country.name)}. This page helps viewers watch ${escapeHtml(country.name)} TV channels live online, listen to radio stations, browse online newspapers, and discover useful categories without registration. It is built for people searching for local TV, international TV channels, live news, sports streaming discovery, music, movies, and public media sources by country. Choose the app button to open ${escapeHtml(country.name)} in the interactive globe, then explore channels, radio, newspapers, and favorites from one fast page.</p>
      <h2 id="live-tv">Live TV Channels</h2>
      <p>Use the WatchNations app to explore free live TV channels from ${escapeHtml(country.name)} and related international channels by country, language, and category.</p>
      <h3>${escapeHtml(country.name)} News and Sports TV</h3>
      <p>Browse news, sports, general, business, weather, and entertainment discovery pages connected to ${escapeHtml(country.name)} and nearby regions.</p>
      <h2 id="radio">Radio Stations</h2>
      <p>Listen to radio stations worldwide and discover ${escapeHtml(country.name)} radio streams when public station sources are available through the WatchNations radio browser.</p>
      <h2 id="newspapers">Online Newspapers</h2>
      <p>Open electronic newspapers and online news sources from ${escapeHtml(country.name)} when newspaper links are available, or continue to the publisher website directly.</p>
      <h2 id="categories">Popular Categories</h2>
      <nav aria-label="${escapeHtml(country.name)} popular categories" class="related-category-links">${categories}</nav>
      <h2 id="nearby-countries">Nearby Countries</h2>
      <p>Explore nearby country pages and compare live TV, radio, and online newspaper sources by region.</p>
      <nav aria-label="Nearby country pages" class="related-category-links">${nearby}</nav>
      <h2 id="faq">Frequently Asked Questions</h2>
      <h3>Can I watch ${escapeHtml(country.name)} TV channels for free?</h3>
      <p>Yes. WatchNations helps you discover free external TV sources and country pages without creating an account.</p>
      <h3>Does WatchNations include ${escapeHtml(country.name)} radio stations?</h3>
      <p>Yes. The app includes a radio section and searches public radio station directories when streams are available.</p>
      <h3>Can I open ${escapeHtml(country.name)} newspapers from this page?</h3>
      <p>Yes. Newspaper entries can be opened inside the browser view or through a direct link to the newspaper website.</p>
      <p>${escapeHtml(countryArabicSeoLine(code, country.name))}</p>
      <p>Streams are provided by external public sources. WatchNations does not host or control video content.</p>
    `;
}

function countryCategoryLinks(countryName) {
  const categoryIds = ['news', 'sports', 'music', 'movies', 'kids', 'documentary', 'business', 'weather'];
  return categoryIds
    .map((id) => {
      const category = SEO_CATEGORIES.find(([categoryId]) => categoryId === id);
      const label = category ? category[1] : id;
      return `<a href="/categories/${escapeHtml(id)}">${escapeHtml(countryName)} ${escapeHtml(label)}</a>`;
    })
    .join('');
}

function nearbyCountryLinks(code) {
  const countryMap = {
    MA: ['DZ', 'ES', 'FR', 'PT', 'TN', 'EG'],
    US: ['CA', 'MX', 'GB', 'FR', 'DE', 'BR'],
    FR: ['BE', 'ES', 'DE', 'IT', 'MA', 'GB'],
    ES: ['PT', 'FR', 'MA', 'IT', 'DE', 'GB'],
    SA: ['AE', 'QA', 'KW', 'BH', 'OM', 'EG'],
    EG: ['SA', 'AE', 'MA', 'DZ', 'TN', 'TR'],
    GB: ['IE', 'FR', 'DE', 'US', 'CA', 'NL'],
    DE: ['FR', 'NL', 'BE', 'AT', 'CH', 'GB']
  };
  const countries = loadSeoCountries();
  const preferred = countryMap[normalizeCountryCode(code)] || countries
    .map((country) => country.code)
    .filter((countryCode) => countryCode !== normalizeCountryCode(code))
    .slice(0, 6);
  return preferred
    .map((nearbyCode) => countries.find((country) => country.code === normalizeCountryCode(nearbyCode)))
    .filter(Boolean)
    .slice(0, 6)
    .map((country) => `<a href="/countries/${country.code.toLowerCase()}">${escapeHtml(country.name)} TV</a>`)
    .join('');
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

function seoStructuredData({ pathname, title, description, heading, keywords = SEO_KEYWORDS }) {
  const canonical = `https://watchnations.com${pathname === '/' ? '/' : pathname}`;
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = [
    { '@type': 'ListItem', position: 1, name: 'WatchNations', item: 'https://watchnations.com/' }
  ];
  if (segments[0] === 'countries') {
    breadcrumbs.push({ '@type': 'ListItem', position: 2, name: 'Countries', item: 'https://watchnations.com/countries' });
    if (segments[1]) breadcrumbs.push({ '@type': 'ListItem', position: 3, name: heading, item: canonical });
  } else if (segments[0] === 'categories') {
    breadcrumbs.push({ '@type': 'ListItem', position: 2, name: 'Categories', item: 'https://watchnations.com/categories' });
    if (segments[1]) breadcrumbs.push({ '@type': 'ListItem', position: 3, name: heading, item: canonical });
  } else if (segments.length) {
    breadcrumbs.push({ '@type': 'ListItem', position: 2, name: heading, item: canonical });
  }

  const pageType = seoPageType(pathname);
  const graph = [
    {
      '@type': 'Organization',
      '@id': 'https://watchnations.com/#organization',
      name: 'WatchNations',
      url: 'https://watchnations.com/',
      logo: {
        '@type': 'ImageObject',
        url: 'https://watchnations.com/assets/watchnations-tv-logo.png'
      },
      email: 'lindaraymane@gmail.com'
    },
    {
      '@type': 'WebSite',
      '@id': 'https://watchnations.com/#website',
      name: 'WatchNations',
      url: 'https://watchnations.com/',
      publisher: { '@id': 'https://watchnations.com/#organization' },
      inLanguage: ['en', 'ar', 'es', 'fr', 'it', 'pt', 'bn', 'tr', 'ja', 'de', 'nl', 'sv', 'no', 'zh'],
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://watchnations.com/?q={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    },
    {
      '@type': pageType,
      '@id': `${canonical}#webpage`,
      url: canonical,
      name: title,
      headline: heading,
      description,
      isPartOf: { '@id': 'https://watchnations.com/#website' },
      about: { '@id': 'https://watchnations.com/#webapp' },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: 'https://watchnations.com/assets/favicon-512.png'
      },
      dateModified: SEO_LASTMOD,
      inLanguage: 'en',
      keywords: compactSeoList(keywords, 80)
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: breadcrumbs
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://watchnations.com/#webapp',
      name: 'WatchNations',
      url: 'https://watchnations.com/',
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: 'Web',
      isAccessibleForFree: true,
      description: 'Explore free live TV, radio stations, electronic newspapers, and international media by country and category.',
      featureList: [
        'Interactive 3D globe TV discovery',
        'Watch TV channels by country',
        'Free live TV without registration',
        'Radio stations worldwide',
        'Electronic newspapers by country',
        'Category-specific live TV discovery'
      ],
      publisher: { '@id': 'https://watchnations.com/#organization' }
    }
  ];
  const itemList = seoItemList(pathname, heading);
  if (itemList) graph.push(itemList);
  const faq = seoFaqPage(pathname, heading);
  if (faq) graph.push(faq);

  return {
    '@context': 'https://schema.org',
    '@graph': graph
  };
}

function seoPageType(pathname) {
  if (pathname === '/about') return 'AboutPage';
  if (pathname === '/feedback') return 'ContactPage';
  if (pathname === '/countries' || pathname.startsWith('/countries/') || pathname === '/categories' || pathname.startsWith('/categories/')) return 'CollectionPage';
  return 'WebPage';
}

function seoItemList(pathname, heading) {
  const canonical = `https://watchnations.com${pathname === '/' ? '/' : pathname}`;
  if (pathname.startsWith('/countries/')) {
    const countryCode = normalizeCountryCode(pathname.split('/').pop());
    const country = loadSeoCountries().find((item) => item.code === countryCode);
    const countryName = country ? country.name : heading;
    const sections = [
      ['Live TV Channels', '#live-tv'],
      ['Radio Stations', '#radio'],
      ['Online Newspapers', '#newspapers'],
      ['Popular Categories', '#categories'],
      ['Nearby Countries', '#nearby-countries'],
      ['FAQ', '#faq']
    ];
    return {
      '@type': 'ItemList',
      '@id': `${canonical}#country-sections`,
      name: `${countryName} TV, radio, and newspaper sections`,
      itemListElement: sections.map(([name, hash], index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name,
        url: `${canonical}${hash}`
      }))
    };
  }

  if (pathname === '/categories' || pathname.startsWith('/categories/')) {
    const categories = SEO_CATEGORIES.slice(0, 12);
    return {
      '@type': 'ItemList',
      '@id': `${canonical}#category-sections`,
      name: 'WatchNations live TV category pages',
      itemListElement: categories.map(([id, label], index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: label,
        url: `https://watchnations.com/categories/${id}`
      }))
    };
  }

  return null;
}

function seoFaqPage(pathname, heading) {
  if (pathname === '/faq') {
    return {
      '@type': 'FAQPage',
      '@id': 'https://watchnations.com/faq#faq',
      mainEntity: [
        seoQuestion('Is WatchNations free?', 'Yes. WatchNations is free to use and does not require an account, email, subscription, or signup.'),
        seoQuestion('How do I find channels?', 'Choose a country from the globe, use country search, or browse categories such as news, sports, music, movies, kids, weather, and education.'),
        seoQuestion('Why are some channels unavailable?', 'External live streams can change, go offline, or be restricted by the original provider. WatchNations organizes publicly available links but does not control external streams.'),
        seoQuestion('Does WatchNations host video streams?', 'No. WatchNations does not host, upload, or own video content. It organizes external public sources in good faith.')
      ]
    };
  }

  if (pathname.startsWith('/countries/')) {
    const countryCode = normalizeCountryCode(pathname.split('/').pop());
    const country = loadSeoCountries().find((item) => item.code === countryCode);
    const countryName = country ? country.name : heading.replace(/^Watch\s+|\s+TV Channels.*$/g, '');
    return {
      '@type': 'FAQPage',
      '@id': `https://watchnations.com${pathname}#faq-schema`,
      mainEntity: [
        seoQuestion(`Can I watch ${countryName} TV channels for free?`, 'Yes. WatchNations helps you discover free external TV sources and country pages without creating an account.'),
        seoQuestion(`Does WatchNations include ${countryName} radio stations?`, 'Yes. The app includes a radio section and searches public radio station directories when streams are available.'),
        seoQuestion(`Can I open ${countryName} newspapers from this page?`, 'Yes. Newspaper entries can be opened inside the browser view or through a direct link to the newspaper website.')
      ]
    };
  }

  return null;
}

function seoQuestion(name, text) {
  return {
    '@type': 'Question',
    name,
    acceptedAnswer: {
      '@type': 'Answer',
      text
    }
  };
}

function schemaScript(data) {
  return `<script type="application/ld+json">${escapeScriptJson(JSON.stringify(data))}</script>`;
}

function escapeScriptJson(value) {
  return String(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

function seoPage({ path: pathname, title, description, heading, body = [], bodyHtml = '', cta, keywords = SEO_KEYWORDS, newsKeywords = SEO_KEYWORDS.slice(0, 12) }) {
  const canonical = `https://watchnations.com${pathname === '/' ? '/' : pathname}`;
  const structuredData = seoStructuredData({ pathname, title, description, heading, keywords });
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
  <meta name="keywords" content="${escapeHtml(keywords.join(', '))}">
  <meta name="news_keywords" content="${escapeHtml(newsKeywords.join(', '))}">
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
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="https://watchnations.com/assets/favicon-512.png">
  ${schemaScript(structuredData)}
  <style>
    :root{color:#f7f9fb;background:#050609;font-family:Inter,Segoe UI,Tahoma,Arial,sans-serif}
    body{margin:0;background:#050609;color:#f7f9fb;line-height:1.7}
    header,main,footer{max-width:980px;margin:auto;padding:28px}
    header{display:flex;gap:8px;align-items:center;border-bottom:1px solid rgba(255,255,255,.14)}
    img{width:82px;height:64px;object-fit:contain;margin-right:-8px}
    a{color:#ff4a42}.brand{font-weight:900;font-size:34px;line-height:1}.brand span{color:#ff0800;text-shadow:0 0 14px rgba(255,8,0,.28)}
    h1{font-size:clamp(34px,6vw,62px);line-height:1.05;margin:34px 0 18px}
    p{max-width:760px;color:#d7dbe3}.button{display:inline-block;margin-top:10px;padding:12px 18px;border:1px solid #ff0800;border-radius:8px;color:#fff;background:#ff0800;text-decoration:none;font-weight:900}
    nav{display:flex;gap:14px;flex-wrap:wrap;margin-top:18px}.related-category-links a{padding:8px 10px;border:1px solid rgba(255,255,255,.16);border-radius:8px;text-decoration:none}.country-grid{columns:3 220px;padding-left:20px}.country-grid li{break-inside:avoid;margin:0 0 8px}
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
    dailyVisits: {},
    weeklyVisits: {},
    recentVisitors: {},
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
      uniqueVisitors: Array.isArray(state.uniqueVisitors) ? state.uniqueVisitors : [],
      dailyVisits: normalizeVisitBuckets(state.dailyVisits),
      weeklyVisits: normalizeVisitBuckets(state.weeklyVisits),
      recentVisitors: typeof state.recentVisitors === 'object' && state.recentVisitors ? state.recentVisitors : {}
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
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const todayKey = getVisitorDateKey(nowDate);
  const weekKey = getVisitorWeekKey(nowDate);
  const lastSeen = Number(state.recentVisitors?.[visitorHash] || 0);
  const isNewSession = !lastSeen || nowDate.getTime() - lastSeen > VISIT_SESSION_WINDOW_MS;

  if (isNewSession) state.totalVisits = Number(state.totalVisits || 0) + 1;
  if (!state.uniqueVisitors.includes(visitorHash)) state.uniqueVisitors.push(visitorHash);
  touchVisitBucket(state.dailyVisits, todayKey, visitorHash, isNewSession);
  touchVisitBucket(state.weeklyVisits, weekKey, visitorHash, isNewSession);
  state.recentVisitors = pruneRecentVisitors({
    ...(state.recentVisitors || {}),
    [visitorHash]: nowDate.getTime()
  }, nowDate.getTime());
  state.firstVisitAt = state.firstVisitAt || now;
  state.lastVisitAt = now;
  state.updatedAt = now;
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
  const now = new Date();
  const today = getVisitBucket(state.dailyVisits, getVisitorDateKey(now));
  const week = getVisitBucket(state.weeklyVisits, getVisitorWeekKey(now));
  return {
    visitors: Number(state.uniqueVisitors.length || 0),
    totalVisits: Number(state.totalVisits || 0),
    todayVisitors: today.visitors.length,
    todayVisits: Number(today.visits || 0),
    weekVisitors: week.visitors.length,
    weekVisits: Number(week.visits || 0),
    firstVisitAt: state.firstVisitAt || '',
    lastVisitAt: state.lastVisitAt || '',
    updatedAt: state.updatedAt || '',
    todayKey: getVisitorDateKey(now),
    weekKey: getVisitorWeekKey(now),
    sessionWindowMinutes: Math.round(VISIT_SESSION_WINDOW_MS / 60_000)
  };
}

function normalizeVisitBuckets(value) {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value).map(([key, bucket]) => [
      key,
      {
        visits: Number(bucket?.visits || 0),
        visitors: Array.isArray(bucket?.visitors) ? [...new Set(bucket.visitors.filter(Boolean))] : []
      }
    ])
  );
}

function touchVisitBucket(buckets, key, visitorHash, isNewSession) {
  const bucket = getVisitBucket(buckets, key);
  if (isNewSession) bucket.visits = Number(bucket.visits || 0) + 1;
  if (!bucket.visitors.includes(visitorHash)) bucket.visitors.push(visitorHash);
  buckets[key] = bucket;
}

function getVisitBucket(buckets, key) {
  return {
    visits: Number(buckets?.[key]?.visits || 0),
    visitors: Array.isArray(buckets?.[key]?.visitors) ? buckets[key].visitors : []
  };
}

function pruneRecentVisitors(recentVisitors, nowMs) {
  const maxAge = VISIT_SESSION_WINDOW_MS * 2;
  return Object.fromEntries(
    Object.entries(recentVisitors).filter(([, timestamp]) => nowMs - Number(timestamp || 0) <= maxAge)
  );
}

function getVisitorDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: VISITOR_STATS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getVisitorWeekKey(date = new Date()) {
  const [year, month, day] = getVisitorDateKey(date).split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1, day, 12));
  const dayIndex = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayIndex + 3);
  const weekYear = target.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(weekYear, 0, 4, 12));
  const firstDayIndex = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayIndex + 3);
  const week = 1 + Math.round((target - firstThursday) / (7 * 86400000));
  return `${weekYear}-W${String(week).padStart(2, '0')}`;
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
