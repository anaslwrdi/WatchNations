let THREE;
let videojs;
let DateTime;

const API_BASE = 'https://iptv-org.github.io/api';
const IPTV_BASE = 'https://iptv-org.github.io/iptv';
const WORLD_GEOJSON = '/data/countries-lite.json';
const LOCAL_COUNTRIES = '/data/iptv-countries.min.json';

const palette = ['#1eb6d9', '#e7c51e', '#3daf58', '#d84d77', '#f2643f', '#9b58b4', '#42c7bb'];
const channelCache = new Map();
let iptvApiIndexPromise;
const LOAD_EXTERNAL_LOGOS = false;
const CHANNEL_CACHE_VERSION = 'flags-categories-v1';
const countryCodeAliases = {
  EH: 'MA',
  UK: 'GB',
  FX: 'FR',
  EL: 'GR'
};
const nameToCodeFallback = {
  'France': 'FR',
  'Norway': 'NO',
  'Kosovo': 'XK',
  'Somaliland': 'SO',
  'Northern Cyprus': 'CY',
  'US Naval Base Guantanamo Bay': 'CU',
  'Dhekelia Sovereign Base Area': 'CY',
  'Akrotiri Sovereign Base Area': 'CY',
  'Western Sahara': 'EH',
  'Falkland Islands': 'FK',
  'Greenland': 'GL',
  'Puerto Rico': 'PR',
  'New Caledonia': 'NC',
  'French Polynesia': 'PF',
  'Guam': 'GU',
  'US Virgin Islands': 'VI',
  'American Samoa': 'AS',
  'Bermuda': 'BM',
  'Cayman Islands': 'KY',
  'Faroe Islands': 'FO',
  'Gibraltar': 'GI',
  'Montserrat': 'MS',
  'Turks and Caicos Islands': 'TC',
  'British Virgin Islands': 'VG',
  'Northern Mariana Islands': 'MP',
  'Anguilla': 'AI',
  'Saint Barthelemy': 'BL',
  'Saint Martin': 'MF',
  'Sint Maarten': 'SX',
  'Aruba': 'AW',
  'Curacao': 'CW',
  'Bonaire': 'BQ'
};
const timezoneByCountry = {
  MA: 'Africa/Casablanca', DZ: 'Africa/Algiers', EG: 'Africa/Cairo', TN: 'Africa/Tunis', LY: 'Africa/Tripoli',
  FR: 'Europe/Paris', ES: 'Europe/Madrid', PT: 'Europe/Lisbon', GB: 'Europe/London', IE: 'Europe/Dublin',
  DE: 'Europe/Berlin', IT: 'Europe/Rome', NL: 'Europe/Amsterdam', BE: 'Europe/Brussels', CH: 'Europe/Zurich',
  US: 'America/New_York', CA: 'America/Toronto', MX: 'America/Mexico_City', BR: 'America/Sao_Paulo',
  AR: 'America/Argentina/Buenos_Aires', CL: 'America/Santiago', CO: 'America/Bogota', PE: 'America/Lima',
  SA: 'Asia/Riyadh', AE: 'Asia/Dubai', QA: 'Asia/Qatar', KW: 'Asia/Kuwait', TR: 'Europe/Istanbul',
  IN: 'Asia/Kolkata', CN: 'Asia/Shanghai', JP: 'Asia/Tokyo', KR: 'Asia/Seoul', AU: 'Australia/Sydney',
  NZ: 'Pacific/Auckland', ZA: 'Africa/Johannesburg', NG: 'Africa/Lagos', KE: 'Africa/Nairobi'
};

const regionFocus = {
  AF: [66, 34], AL: [20, 41], DZ: [2, 28], AD: [1, 42], AO: [18, -12], AR: [-64, -34],
  AM: [45, 40], AU: [134, -25], AT: [14, 47], AZ: [48, 40], BH: [50, 26], BD: [90, 24],
  BE: [4, 51], BR: [-52, -10], BG: [25, 43], CA: [-105, 57], CL: [-71, -30], CN: [104, 35],
  CO: [-74, 5], HR: [16, 45], CY: [33, 35], CZ: [15, 49], DK: [10, 56], EG: [30, 26],
  FI: [26, 64], FR: [2, 47], DE: [10, 51], GH: [-1, 8], GR: [22, 39], HK: [114, 22],
  HU: [19, 47], IN: [78, 22], ID: [118, -2], IQ: [44, 33], IE: [-8, 53], IL: [35, 31],
  IT: [12, 43], JP: [138, 37], JO: [36, 31], KE: [38, 1], KR: [127, 36], KW: [47, 29],
  LB: [35, 34], LY: [17, 27], MA: [-7, 32], MX: [-102, 23], NL: [5, 52], NZ: [172, -42],
  NG: [8, 9], NO: [8, 61], PK: [70, 30], PS: [35, 32], PE: [-75, -9], PH: [122, 13],
  PL: [19, 52], PT: [-8, 39], QA: [51, 25], RO: [25, 46], RU: [90, 60], SA: [45, 24],
  RS: [21, 44], SG: [104, 1], ZA: [24, -29], ES: [-3, 40], SE: [15, 62], CH: [8, 47],
  TH: [101, 15], TN: [9, 34], TR: [35, 39], AE: [54, 24], GB: [-2, 54], US: [-98, 39],
  UK: [-2, 54], UY: [-56, -33], VE: [-66, 8], VN: [108, 16]
};

const manualCountryCenters = {
  AX: [20, 60], AI: [-63, 18], AG: [-61.8, 17.1], AS: [-170.7, -14.3], AW: [-70, 12.5],
  BA: [18, 44], BB: [-59.5, 13.2], BF: [-1.7, 12.2], BI: [30, -3.4], BJ: [2.3, 9.3],
  BL: [-62.8, 17.9], BM: [-64.8, 32.3], BN: [114.7, 4.5], BQ: [-68.2, 12.2], BS: [-77.4, 25],
  BT: [90.4, 27.5], BW: [24.7, -22.3], BY: [28, 53], BZ: [-88.7, 17.2], CD: [23.7, -2.8],
  CF: [20.9, 6.6], CG: [15.8, -1], CI: [-5.5, 7.6], CK: [-159.8, -21.2], CM: [12.7, 5.7],
  CR: [-84, 9.9], CU: [-79.5, 21.5], CV: [-24, 16], CW: [-69, 12.1], DJ: [42.6, 11.8],
  DM: [-61.4, 15.4], DO: [-70.2, 18.8], EC: [-78.2, -1.4], EE: [25, 58.7], ER: [39.7, 15.2],
  ET: [40.5, 9], FO: [-6.9, 62], FJ: [178, -17.8], FK: [-59, -51.7], FM: [158.2, 6.9],
  GA: [11.7, -0.6], GD: [-61.7, 12.1], GE: [43.4, 42], GF: [-53.1, 3.9], GG: [-2.6, 49.5],
  GI: [-5.35, 36.14], GL: [-42, 72], GM: [-15.3, 13.4], GN: [-10.9, 10.4], GP: [-61.6, 16.2],
  GQ: [10.3, 1.7], GT: [-90.2, 15.6], GU: [144.8, 13.4], GW: [-15.2, 12], GY: [-58.9, 4.8],
  HN: [-86.2, 14.8], HT: [-72.3, 19], IM: [-4.5, 54.2], IS: [-19, 65], JE: [-2.1, 49.2],
  JM: [-77.3, 18.1], KH: [104.9, 12.6], KI: [-157.4, 1.9], KM: [43.7, -11.9], KN: [-62.7, 17.3],
  KP: [127.5, 40], KY: [-81.2, 19.3], KZ: [67, 48], LA: [103.8, 18], LC: [-60.97, 13.9],
  LI: [9.55, 47.16], LK: [80.7, 7.9], LR: [-9.4, 6.4], LS: [28.2, -29.6], LT: [24, 55.3],
  LU: [6.1, 49.8], LV: [24.6, 56.9], MC: [7.42, 43.73], MD: [28.4, 47.2], ME: [19.3, 42.8],
  MF: [-63.1, 18.1], MG: [46.8, -19], MH: [171.2, 7.1], MK: [21.7, 41.6], ML: [-3.5, 17],
  MM: [96, 21], MN: [103.8, 46.8], MO: [113.55, 22.17], MP: [145.7, 15.2], MQ: [-61, 14.6],
  MR: [-10.9, 20.3], MS: [-62.2, 16.7], MT: [14.4, 35.9], MU: [57.6, -20.2], MV: [73.2, 3.2],
  MW: [34.3, -13.3], MY: [102, 4.2], MZ: [35.5, -18.2], NA: [17.1, -22], NC: [165.6, -21.3],
  NE: [8.1, 17.6], NI: [-85, 12.9], NP: [84, 28.3], NR: [166.9, -0.5], OM: [57.5, 21],
  PA: [-80, 8.5], PF: [-149.4, -17.7], PG: [145, -6.3], PR: [-66.5, 18.2], PY: [-58.4, -23.4],
  RE: [55.5, -21.1], RW: [29.9, -1.9], SC: [55.5, -4.6], SD: [30, 15.6], SL: [-11.8, 8.5], SN: [-14.5, 14.5],
  SO: [46, 5.2], SR: [-56, 4], SS: [31.3, 7.3], ST: [6.7, 0.2], SV: [-88.9, 13.7],
  SX: [-63.05, 18.04], SY: [38.5, 35], SZ: [31.5, -26.5], TC: [-71.8, 21.8], TD: [18.7, 15.3], TG: [1.2, 8.6],
  TJ: [71, 38.6], TL: [125.7, -8.9], TM: [59.5, 39], TO: [-175.2, -21.2], TT: [-61.2, 10.5],
  TV: [179.2, -8.5], TW: [121, 23.7], TZ: [35, -6.3], UA: [31, 49], UG: [32.3, 1.3],
  VC: [-61.2, 13.2], VG: [-64.5, 18.4], VI: [-64.8, 18.3], VU: [167.7, -16.2], WS: [-172.1, -13.8],
  XK: [20.9, 42.6], YE: [47.6, 15.6], ZM: [27.8, -13.1], ZW: [29.9, -19]
};

const icons = {
  menu: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  tv: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  radio: '<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M7 7l10-4M7 13h.01M11 13h6M11 17h6"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M19.5 12.6 12 20l-7.5-7.4A5 5 0 0 1 12 6a5 5 0 0 1 7.5 6.6Z"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="m8 5 12 7-12 7Z"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="m12 2 3 6 7 .9-5 4.8 1.3 6.8L12 17l-6.3 3.5L7 13.7 2 8.9 9 8Z"/></svg>',
  music: '<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  trophy: '<svg viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M5 5H3v2a4 4 0 0 0 4 4M19 5h2v2a4 4 0 0 1-4 4"/></svg>',
  news: '<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4zM8 9h8M8 13h8M8 17h5"/></svg>',
  spark: '<svg viewBox="0 0 24 24"><path d="M12 2v6M12 16v6M4.9 4.9l4.2 4.2M14.9 14.9l4.2 4.2M2 12h6M16 12h6M4.9 19.1l4.2-4.2M14.9 9.1l4.2-4.2"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M7 17 17 7M7 7h10v10"/></svg>',
  bolt: '<svg viewBox="0 0 24 24"><path d="m13 2-9 13h7l-1 7 9-13h-7Z"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 10v7M12 7h.01"/></svg>',
  code: '<svg viewBox="0 0 24 24"><path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/></svg>',
  car: '<svg viewBox="0 0 24 24"><path d="M5 16h14M7 16l1-5h8l1 5M6 16v3M18 16v3"/><circle cx="7" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></svg>',
  film: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 4v16M16 4v16M4 9h4M4 15h4M16 9h4M16 15h4"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-8"/></svg>',
  laugh: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 10h.01M16 10h.01M8 15c2.5 2 5.5 2 8 0"/></svg>',
  cooking: '<svg viewBox="0 0 24 24"><path d="M6 3v7M10 3v7M8 3v18M16 4v17M16 4c3 2 3 6 0 8"/></svg>',
  culture: '<svg viewBox="0 0 24 24"><path d="M4 20h16M6 20V9M18 20V9M3 9l9-5 9 5M8 12h8M8 16h8"/></svg>',
  education: '<svg viewBox="0 0 24 24"><path d="m3 8 9-4 9 4-9 4-9-4Z"/><path d="M7 10v5c3 2 7 2 10 0v-5M21 8v6"/></svg>',
  family: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20a6 6 0 0 1 12 0M14 20a5 5 0 0 1 7 0"/></svg>',
  kid: '<svg viewBox="0 0 24 24"><path d="M8 6h8M10 4v4M14 4v4"/><rect x="5" y="8" width="14" height="11" rx="3"/><path d="M9 13h.01M15 13h.01M10 16h4"/></svg>',
  law: '<svg viewBox="0 0 24 24"><path d="M12 3v18M5 6h14M7 6l-4 7h8L7 6ZM17 6l-4 7h8l-4-7Z"/></svg>',
  leaf: '<svg viewBox="0 0 24 24"><path d="M20 4c-8 0-14 5-14 12a4 4 0 0 0 4 4c7 0 10-8 10-16Z"/><path d="M6 20c3-6 7-9 14-16"/></svg>',
  mountain: '<svg viewBox="0 0 24 24"><path d="m3 19 7-11 5 7 3-4 3 8H3Z"/></svg>',
  cross: '<svg viewBox="0 0 24 24"><path d="M12 3v18M7 8h10"/></svg>',
  science: '<svg viewBox="0 0 24 24"><path d="M10 3h4M11 3v5l-6 10a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3L13 8V3"/><path d="M8 16h8"/></svg>',
  shop: '<svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7L6 8ZM9 8a3 3 0 0 1 6 0"/></svg>',
  plane: '<svg viewBox="0 0 24 24"><path d="M2 16 22 4l-6 16-4-7-10 3Z"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"/></svg>',
  message: '<svg viewBox="0 0 24 24"><path d="M4 5h16v12H7l-3 3V5Z"/></svg>',
  help: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 17h.01"/></svg>'
};

const primaryNavItems = [
  ['about', 'About', 'info'],
  ['favorites', 'Favorites', 'star', 'favorites']
];

const categories = [
  ['all', 'All Channels', 'tv'],
  ['top-news', 'Top News', 'news'],
  ['news', 'News', 'news'],
  ['music', 'Music', 'music'],
  ['sports', 'Sports', 'trophy'],
  ['auto', 'Auto', 'car'],
  ['animation', 'Animation', 'spark'],
  ['business', 'Business', 'chart'],
  ['classic', 'Classic', 'film'],
  ['comedy', 'Comedy', 'laugh'],
  ['cooking', 'Cooking', 'cooking'],
  ['culture', 'Culture', 'culture'],
  ['documentary', 'Documentary', 'film'],
  ['education', 'Education', 'education'],
  ['entertainment', 'Entertainment', 'spark'],
  ['family', 'Family', 'family'],
  ['general', 'General', 'tv'],
  ['kids', 'Kids', 'kid'],
  ['legislative', 'Legislative', 'law'],
  ['lifestyle', 'Lifestyle', 'leaf'],
  ['movies', 'Movies', 'film'],
  ['outdoor', 'Outdoor', 'mountain'],
  ['relax', 'Relax', 'heart'],
  ['religious', 'Religious', 'cross'],
  ['series', 'Series', 'film'],
  ['science', 'Science', 'science'],
  ['shop', 'Shop', 'shop'],
  ['travel', 'Travel', 'plane'],
  ['weather', 'Weather', 'globe']
];

const footerNavItems = [
  ['faq', 'FAQ', 'help'],
  ['privacy', 'Privacy Policy', 'shield'],
  ['feedback', 'Feedback', 'message']
];

const categoryKeywordRules = [
  ['top-news', ['top news', 'breaking', 'breaking news', 'headline', 'headlines', 'world news', '24/7 news', '24x7 news', 'live news']],
  ['news', ['news', 'noticias', 'actualite', 'actualites', 'nachrichten', 'haber', 'journal', 'cnn', 'bbc', 'al jazeera', 'france 24', 'euronews']],
  ['music', ['music', 'musica', 'musique', 'musik', 'radio music', 'mtv', 'hits', 'pop', 'rock', 'jazz', 'dance']],
  ['sports', ['sport', 'sports', 'football', 'soccer', 'futbol', 'tennis', 'basketball', 'golf', 'racing', 'nba', 'nfl', 'formula', 'f1']],
  ['auto', ['auto', 'cars', 'motor', 'motors', 'automotive', 'car tv']],
  ['animation', ['animation', 'anime', 'cartoon', 'toon']],
  ['business', ['business', 'finance', 'financial', 'economy', 'markets', 'bloomberg', 'cnbc']],
  ['classic', ['classic', 'classics', 'oldies', 'retro']],
  ['comedy', ['comedy', 'humor', 'humour', 'funny']],
  ['cooking', ['cooking', 'cook', 'food', 'kitchen', 'recipes', 'chef', 'gastronomy']],
  ['culture', ['culture', 'cultural', 'arts', 'art', 'heritage']],
  ['documentary', ['documentary', 'documentaries', 'docu', 'history', 'nature', 'discovery', 'national geographic']],
  ['education', ['education', 'educational', 'learn', 'learning', 'school', 'university', 'knowledge']],
  ['entertainment', ['entertainment', 'variety', 'show', 'shows', 'celebrity']],
  ['family', ['family', 'familia', 'family tv']],
  ['kids', ['kids', 'children', 'child', 'cartoon network', 'nickelodeon', 'disney', 'baby']],
  ['legislative', ['legislative', 'parliament', 'congress', 'senate', 'assembly', 'government']],
  ['lifestyle', ['lifestyle', 'life style', 'home', 'fashion', 'health', 'wellness']],
  ['movies', ['movie', 'movies', 'film', 'films', 'cinema', 'cine', 'hollywood']],
  ['outdoor', ['outdoor', 'adventure', 'hunting', 'fishing', 'travel outdoor']],
  ['relax', ['relax', 'relaxing', 'ambient', 'chill', 'slow tv', 'meditation']],
  ['religious', ['religious', 'religion', 'islam', 'quran', 'christian', 'church', 'bible', 'catholic', 'spiritual']],
  ['series', ['series', 'serie', 'serial', 'drama', 'soap', 'telenovela']],
  ['science', ['science', 'technology', 'tech', 'space', 'nasa', 'research']],
  ['shop', ['shop', 'shopping', 'teleshop', 'qvc']],
  ['travel', ['travel', 'tourism', 'tourist', 'journey', 'voyage']],
  ['weather', ['weather', 'meteo', 'meteorology', 'climate', 'forecast']]
];

const categoryIds = new Set(categories.map(([id]) => id));

const brandLogo = `
  <svg class="tv-logo" viewBox="0 0 96 74" aria-hidden="true">
    <defs>
      <linearGradient id="tvLogoRed" x1="20" y1="12" x2="78" y2="66" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ff4a42"/>
        <stop offset="0.42" stop-color="#ff0800"/>
        <stop offset="1" stop-color="#c90000"/>
      </linearGradient>
      <linearGradient id="tvLogoGloss" x1="20" y1="18" x2="72" y2="58" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" stop-opacity="0.7"/>
        <stop offset="0.34" stop-color="#ffffff" stop-opacity="0.16"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="22" y="62" width="15" height="6" rx="3" fill="#c90000"/>
    <rect x="59" y="62" width="15" height="6" rx="3" fill="#c90000"/>
    <rect x="29" y="14" width="7" height="24" rx="3.5" fill="#ff0800" transform="rotate(-38 32.5 26)"/>
    <rect x="60" y="14" width="7" height="24" rx="3.5" fill="#ff0800" transform="rotate(38 63.5 26)"/>
    <circle cx="27" cy="13" r="8" fill="url(#tvLogoRed)"/>
    <circle cx="69" cy="13" r="8" fill="url(#tvLogoRed)"/>
    <path d="M38 32a10 10 0 0 1 20 0Z" fill="url(#tvLogoRed)"/>
    <rect x="9" y="28" width="78" height="38" rx="12" fill="url(#tvLogoRed)"/>
    <rect x="13" y="32" width="70" height="30" rx="9" fill="url(#tvLogoGloss)"/>
    <rect x="14" y="32" width="68" height="30" rx="9" fill="none" stroke="#ffb2ae" stroke-opacity="0.5" stroke-width="2"/>
    <text x="24" y="55" fill="#050505" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="900">TV</text>
    <circle cx="31" cy="9" r="4" fill="#fff" opacity="0.5"/>
    <circle cx="65" cy="9" r="4" fill="#fff" opacity="0.5"/>
  </svg>
`;

const appState = {
  countries: [],
  availableCountryCodes: new Set(),
  selectedCountry: null,
  mediaMode: 'tv',
  selectedCategory: 'all',
  globalMode: false,
  renderLimit: 700,
  hoveredCountry: null,
  query: '',
  channelQuery: '',
  currentChannels: [],
  renderedChannels: [],
  aiChannels: null,
  aiInsight: '',
  videoReadyPromise: null,
  favorites: new Set(safeParseJSON(localStorage.getItem('watchnations:favorites'), [])),
  favoriteChannels: new Map(safeParseJSON(localStorage.getItem('watchnations:favorite-channels'), []).map((channel) => [channel.url, channel])),
  geojson: null,
  geojsonPromise: null,
  countryLookup: new Map(),
  globe: null,
  player: null,
  pickCanvas: null,
  pickColorToCountry: new Map(),
  countryCenters: new Map(),
  countryFocusPoints: new Map(),
  globeZoom: 1,
  userControlledGlobe: false,
  performanceMode: window.matchMedia('(max-width: 760px)').matches
};

document.getElementById('root').innerHTML = `
  <main class="shell">
    <header class="topbar">
      <button class="icon-button" id="menuButton" aria-label="Open menu">${icons.menu}</button>
      <div class="brand"><span class="brand-mark">${brandLogo}</span><strong><span class="brand-watch">Watch</span>Nations</strong></div>
      <div class="top-actions">
        <button class="icon-button" id="focusGlobeButton" title="Focus globe">${icons.globe}</button>
        <button class="icon-button" id="randomButton" title="Random country">${icons.spark}</button>
        <button class="icon-button" id="searchFocusButton" title="Search">${icons.search}</button>
      </div>
    </header>

    <aside class="left-nav" id="leftNav">
      <button class="close-menu" id="closeMenu" aria-label="Close menu">${icons.close}</button>
      <div class="nav-section">
        ${primaryNavItems.map(([action, label, icon, category]) => (
          category
            ? `<a class="nav-link" data-category="${category}">${icons[icon]} <span>${label}</span></a>`
            : `<a class="nav-link" data-action="${action}">${icons[icon]} <span>${label}</span></a>`
        )).join('')}
      </div>
      <div class="nav-title">Explore</div>
      <div class="nav-section nav-section-explore">
        ${categories.map(([id, label, icon]) => `<a class="nav-link" data-category="${id}">${icons[icon]} <span>${label}</span></a>`).join('')}
      </div>
      <div class="nav-section nav-section-footer">
        ${footerNavItems.map(([action, label, icon]) => `<a class="nav-link" data-action="${action}">${icons[icon]} <span>${label}</span></a>`).join('')}
      </div>
    </aside>

    <section class="hero">
      <div class="mode-switch"><button class="active" id="tvMode">TV</button><button id="radioMode">Radio</button></div>
      <div class="globe-stage" id="globeStage"></div>
      <div class="globe-controls" aria-label="Globe zoom controls">
        <button class="icon-button" id="zoomInButton" title="Zoom in">+</button>
        <button class="icon-button" id="zoomOutButton" title="Zoom out">-</button>
        <button class="icon-button" id="zoomResetButton" title="Reset zoom">${icons.globe}</button>
      </div>
      <div class="globe-label" id="globeLabel">Click a country</div>
      <div class="globe-aim" id="globeAim"></div>
      <div class="globe-status" id="globeStatus"><strong>Ready</strong><span>Move the globe until a country is inside the red circle</span></div>
      <div class="hero-card">
        <span>${icons.bolt} Fast mode</span>
        <strong id="heroCountry">Choose from the globe</strong>
        <small>Move the globe, place a country in the red circle, then click.</small>
      </div>
      <button class="hint" id="openPanelHint"><span>Choose a country</span>${icons.arrow}</button>
    </section>

    <aside class="country-panel" id="countryPanel">
      <div class="panel-head">
        <div><small>WatchNations</small><h1 id="countryTitle">Select a Country</h1></div>
        <div class="panel-actions">
          <button class="change-country" id="changeCountryButton">Change country</button>
          <strong id="clock"></strong>
        </div>
      </div>
      <section class="country-picker" id="countryPicker">
        <label class="search-box">${icons.search}<input id="countrySearch" placeholder="Search country" /></label>
        <div class="country-list" id="countryList"><p class="muted">Loading countries...</p></div>
      </section>
      <div class="channels">
        <section class="player-panel" id="playerPanel">
          <div class="player-head">
            <strong id="playerTitle">Select a channel</strong>
            <button class="mini-text-button" id="pipPlayerButton" title="Picture in picture">PiP</button>
            <button class="mini-button" id="closePlayerButton" title="Close player">${icons.close}</button>
          </div>
          <video id="livePlayer" class="video-js vjs-default-skin" controls preload="none" playsinline></video>
          <audio id="radioPlayer" controls preload="none"></audio>
        </section>
        <div class="channels-head">
          <div><h2 id="mediaTitle">Free Channels</h2><small id="aiInsight">Smart filter is ready</small></div>
          <div class="channels-tools">
            <span id="channelCount">0</span>
          </div>
        </div>
        <label class="search-box channel-search">${icons.search}<input id="channelSearch" placeholder="Search channels or category" /></label>
        <div class="channel-grid" id="channelGrid"></div>
      </div>
    </aside>
  </main>
  <div class="about-modal" id="aboutModal" aria-hidden="true">
    <div class="about-backdrop" data-close-about></div>
    <section class="about-dialog" role="dialog" aria-modal="true" aria-labelledby="aboutTitle" lang="en" dir="ltr">
      <button class="mini-button about-close" id="aboutCloseButton" title="Close">${icons.close}</button>
      <div class="about-copy">
        <h2 id="aboutTitle">About WatchNations</h2>
        <p>Discover the easiest way to watch free live TV online with <strong>WatchNations</strong> - a platform designed for exploring international TV channels from around the world. Whether you enjoy live news, sports, movies, music, documentaries, or cultural shows, WatchNations helps you discover channels by country in a simple and enjoyable way.</p>
        <p>No sign-ups, no subscriptions - just click, choose a country, and start watching.</p>
        <p>Our interactive 3D globe makes exploring global television more fun. You can browse channels by country, discover new regions, or find something completely unexpected. With a clean and smooth interface, WatchNations makes online TV streaming fast, simple, and accessible in just a few clicks.</p>
        <p>Tired of watching the same channels every day? Want to discover a news channel from Japan, a cooking show from Italy, or live sports from Argentina?</p>
        <p><strong>WatchNations is your shortcut to worldwide live TV - free, simple, and easy to use.</strong></p>
        <p>You can explore news, sports, music, movies, cultural programs, and unique channels from different countries. You can also use the "Random Channel" feature to discover something new when you feel like exploring.</p>
        <p>It feels like traveling around the world - without leaving your chair.</p>
        <h3>We Take Copyright Seriously</h3>
        <p>WatchNations does not host, own, or control any of the video streams listed on the platform. We only organize and provide access to publicly available links that we believe are shared in good faith.</p>
        <p>If you are a copyright holder and believe that a channel or stream should not appear on WatchNations, please contact us at:</p>
        <p><a href="mailto:lindaraymane@gmail.com">lindaraymane@gmail.com</a></p>
        <p>We will review your request and remove the link if necessary.</p>
        <p>Please note that removing a link from WatchNations does not remove the original content from the internet. For full removal, you may also need to contact the original hosting provider or source.</p>
        <h3>Neutral and Global</h3>
        <p>WatchNations is a neutral platform.</p>
        <p>We do not promote political opinions, borders, disputes, or any specific agenda. Our purpose is simply to help people explore global television content from different countries and cultures.</p>
        <p>TV is for everyone, and WatchNations is built to make that experience simple, open, and enjoyable.</p>
        <h3>Contact Us</h3>
        <p>Have a channel suggestion? Found a broken link? Want to report an issue or contact us about copyright?</p>
        <p>Email us at:</p>
        <p><a href="mailto:lindaraymane@gmail.com">lindaraymane@gmail.com</a></p>
        <p>We'd love to hear from you.</p>
        <p>Now go ahead, explore the globe, choose a country, and start discovering what the world is watching with <strong>WatchNations</strong>.</p>
      </div>
    </section>
  </div>
  <div class="about-modal" id="privacyModal" aria-hidden="true">
    <div class="about-backdrop" data-close-privacy></div>
    <section class="about-dialog" role="dialog" aria-modal="true" aria-labelledby="privacyTitle" lang="en" dir="ltr">
      <button class="mini-button about-close" id="privacyCloseButton" title="Close">${icons.close}</button>
      <div class="about-copy">
        <h2 id="privacyTitle">Privacy Policy</h2>
        <p>At WatchNations, we care about your privacy and want you to feel safe while using our platform. This Privacy Policy explains how we handle data, external links, cookies, advertising, analytics, and your browsing experience.</p>
        <h3>Introduction</h3>
        <p>Your privacy is important to us. This policy explains how WatchNations operates and how we protect users while they explore free live TV channels from around the world.</p>
        <p>By using WatchNations, you agree to the terms described in this Privacy Policy.</p>
        <h3>External Links</h3>
        <p>WatchNations may contain links to external video streams hosted on third-party websites or public platforms.</p>
        <p>While we try to organize and display publicly available sources in good faith, we do not own, host, or control these external websites or streams. Therefore, WatchNations is not responsible for the privacy practices, content, or policies of third-party websites.</p>
        <p>We recommend reviewing the privacy policies of any external websites you visit through WatchNations.</p>
        <h3>Use of Google Ads</h3>
        <p>WatchNations may display advertisements provided by Google AdSense or other advertising partners.</p>
        <p>Google and its partners may use cookies or similar technologies to show ads based on your browsing behavior, interests, or previous visits to websites.</p>
        <p>You can manage or disable personalized ads through your browser settings or Google ad settings.</p>
        <h3>Use of Google Analytics</h3>
        <p>WatchNations may use Google Analytics or similar analytics tools to understand how visitors interact with the website and to improve the user experience.</p>
        <p>Analytics data may include general information such as:</p>
        <ul>
          <li>Pages visited</li>
          <li>Time spent on the website</li>
          <li>Device type</li>
          <li>Browser type</li>
          <li>Country or approximate region</li>
          <li>General usage behavior</li>
        </ul>
        <p>This information is used for statistics and website improvement. We do not use analytics tools to personally identify individual users.</p>
        <h3>Security</h3>
        <p>WatchNations uses HTTPS encryption to help protect your connection while browsing the website.</p>
        <p>HTTPS helps provide a safer and more secure experience when accessing WatchNations and exploring available channels.</p>
        <h3>No Account Registration</h3>
        <p>WatchNations does not require users to create an account, sign in, or provide personal information in order to use the platform.</p>
        <p>You can browse and watch available free live TV links without creating a profile.</p>
        <h3>No Personal Data Collection</h3>
        <p>WatchNations does not intentionally request, collect, store, or process personal information such as your name, address, phone number, or payment details.</p>
        <p>Our goal is to provide a simple and open browsing experience without requiring personal data from users.</p>
        <h3>Third-Party Trackers</h3>
        <p>WatchNations does not intentionally embed third-party trackers except for services related to analytics, advertising, or basic website functionality.</p>
        <p>We do not sell your personal data to third parties.</p>
        <h3>Favorite Channels</h3>
        <p>If WatchNations includes a "Favorite Channels" feature, your favorite channels may be stored locally in your browser.</p>
        <p>This means the data stays on your device and is not sent to our servers.</p>
        <p>Your saved favorites are connected to the browser and device you are using. You can remove this information at any time by clearing your browser data or local storage.</p>
        <h3>Cookies</h3>
        <p>WatchNations may use cookies or similar technologies for:</p>
        <ul>
          <li>Basic website functionality</li>
          <li>Improving user experience</li>
          <li>Analytics</li>
          <li>Advertising</li>
          <li>Remembering local preferences</li>
        </ul>
        <p>You can manage, block, or delete cookies at any time through your browser settings.</p>
        <p>Please note that disabling cookies may affect some website features.</p>
        <h3>Children's Privacy</h3>
        <p>WatchNations is designed as a general audience platform for discovering publicly available TV channels.</p>
        <p>We do not knowingly collect personal information from children. If you believe that a child has provided personal information through our website, please contact us and we will take appropriate action.</p>
        <h3>Copyright and External Content</h3>
        <p>WatchNations does not host video streams directly. The platform only organizes and links to publicly available sources on the internet.</p>
        <p>Because external streams are controlled by third parties, their own privacy policies, terms, and content rules may apply.</p>
        <h3>Privacy Policy Updates</h3>
        <p>We may update this Privacy Policy from time to time as WatchNations develops or as legal, technical, or service changes occur.</p>
        <p>Any changes will be posted on this page. We encourage users to review this Privacy Policy regularly.</p>
        <h3>Compliance with Data Protection Standards</h3>
        <p>Although WatchNations does not intentionally collect personal information, we aim to respect general privacy principles and data protection standards, including GDPR and CCPA where applicable.</p>
        <h3>Contact Us</h3>
        <p>If you have any questions, concerns, or requests related to this Privacy Policy, you can contact us at:</p>
        <p><a href="mailto:lindaraymane@gmail.com">lindaraymane@gmail.com</a></p>
        <p>We will do our best to review and respond to your message.</p>
      </div>
    </section>
  </div>
  <div class="about-modal" id="faqModal" aria-hidden="true">
    <div class="about-backdrop" data-close-faq></div>
    <section class="about-dialog" role="dialog" aria-modal="true" aria-labelledby="faqTitle" lang="en" dir="ltr">
      <button class="mini-button about-close" id="faqCloseButton" title="Close">${icons.close}</button>
      <div class="about-copy">
        <h2 id="faqTitle">Frequently Asked Questions</h2>
        <p>Welcome to the helpful side of WatchNations - the place where we answer common questions and help you understand how the platform works.</p>
        <h3>Is WatchNations really free?</h3>
        <p>Yes. WatchNations is free to use.</p>
        <p>You do not need a subscription, account, or sign-up. Just choose a country, select a channel, and start watching available live TV streams from around the world.</p>
        <h3>How do I watch live channels?</h3>
        <p>It is simple.</p>
        <p>You can explore channels by using the interactive 3D globe and selecting a country, or you can browse countries and categories from the menu.</p>
        <p>If you feel like discovering something new, you can also use the "Random Channel" feature to open a random available channel.</p>
        <h3>How do I search for a channel?</h3>
        <p>To search for a channel, first choose a country or category, then type the channel name in the search bar.</p>
        <p>If you want to return to the full channel list, clear or close the search. If the search icon is active, it means you are still viewing filtered results.</p>
        <h3>Is WatchNations safe?</h3>
        <p>WatchNations is designed to provide a simple and safe browsing experience.</p>
        <p>We do not ask users to create accounts or provide personal information. We also aim to organize publicly available sources and avoid suspicious or unsafe links whenever possible.</p>
        <p>However, some streams may open from external websites or third-party sources. We recommend being careful when visiting external links and avoiding any website that asks for unnecessary downloads or personal information.</p>
        <h3>Why are some channels unavailable?</h3>
        <p>Some channels may stop working temporarily or permanently.</p>
        <p>This can happen because the original source is offline, the broadcaster changed the stream link, the server is busy, or the channel is restricted in some regions.</p>
        <p>If a channel does not work, you can try again later or choose another available channel.</p>
        <h3>How does WatchNations protect my privacy?</h3>
        <p>Your privacy is important to us.</p>
        <p>WatchNations does not require users to register or provide personal details such as name, email, phone number, or payment information.</p>
        <p>We may use tools such as Google Analytics to understand general website usage, such as pages visited, popular countries, device type, and general traffic behavior. This helps us improve the platform.</p>
        <p>We may also use Google AdSense or other advertising partners to display ads. These services may use cookies to provide ads and measure performance.</p>
        <p>You can manage cookies and privacy preferences through your browser settings.</p>
        <h3>Where are my favorite channels saved?</h3>
        <p>If WatchNations includes a favorite channels feature, your favorites may be saved locally in your browser.</p>
        <p>This means they are stored on your device, not on our servers. If you clear your browser data, change device, or use another browser, your favorites may disappear.</p>
        <h3>Is WatchNations legal?</h3>
        <p>WatchNations does not host, upload, or broadcast TV channels directly.</p>
        <p>The platform only organizes and links to publicly available live streams that we believe are shared in good faith, such as free-to-air channels, official broadcaster sources, public websites, or open public stream directories.</p>
        <p>We do not intentionally list paid TV channels, pirated premium channels, or subscription-only content.</p>
        <p>If you are a copyright owner and believe that a stream or channel should not appear on WatchNations, please contact us at:</p>
        <p><a href="mailto:lindaraymane@gmail.com">lindaraymane@gmail.com</a></p>
        <p>We will review your request and remove the link if necessary.</p>
        <h3>How can I contact WatchNations?</h3>
        <p>You can contact us if you find a broken channel, want to suggest a channel, or need to report a copyright issue.</p>
        <p>Email us at:</p>
        <p><a href="mailto:lindaraymane@gmail.com">lindaraymane@gmail.com</a></p>
        <p>We will do our best to review your message.</p>
      </div>
    </section>
  </div>
  <div class="about-modal" id="feedbackModal" aria-hidden="true">
    <div class="about-backdrop" data-close-feedback></div>
    <section class="about-dialog" role="dialog" aria-modal="true" aria-labelledby="feedbackTitle" lang="en" dir="ltr">
      <button class="mini-button about-close" id="feedbackCloseButton" title="Close">${icons.close}</button>
      <div class="about-copy">
        <h2 id="feedbackTitle">Tell Us What You Think</h2>
        <p>Got ideas, suggestions, or just want to say hello? We'd love to hear from you.</p>
        <p>Your feedback helps us improve WatchNations and make the platform better for everyone. Whether you want to suggest a new channel, report a broken link, share a feature idea, or simply contact our team, feel free to reach out anytime.</p>
        <p>You can contact us at:</p>
        <p><a href="mailto:lindaraymane@gmail.com">lindaraymane@gmail.com</a></p>
        <p>We are always happy to hear from our users.</p>
        <h3>DMCA & Copyright Notice</h3>
        <p>At WatchNations, we respect copyright laws and take intellectual property rights seriously.</p>
        <p>WatchNations does not host, upload, or broadcast any video content directly. Our platform only organizes and links to publicly available live TV streams from external sources.</p>
        <p>If you believe that any channel, stream, link, or content listed on WatchNations infringes your copyright or should not appear on our platform, please contact us and we will review your request as soon as possible.</p>
        <p>We are committed to cooperating with copyright owners and removing any link that violates copyright laws, DMCA rules, or other applicable regulations.</p>
        <p>To submit a copyright removal request, please send us an email with the following information:</p>
        <ul>
          <li>The name of the channel or content you are reporting</li>
          <li>The link or page where the content appears on WatchNations</li>
          <li>Proof that you are the copyright owner or authorized representative</li>
          <li>A short explanation of the issue</li>
          <li>Your contact information</li>
        </ul>
        <p>Please send copyright requests to:</p>
        <p><a href="mailto:lindaraymane@gmail.com">lindaraymane@gmail.com</a></p>
        <p>Once we receive your request, we will review it and remove the link if necessary.</p>
        <p>Please note that removing a link from WatchNations does not remove the original content from the internet. For complete removal, you may also need to contact the original website, broadcaster, or hosting provider.</p>
      </div>
    </section>
  </div>
`;

const leftNav = document.getElementById('leftNav');
const menuButton = document.getElementById('menuButton');
const closeMenu = document.getElementById('closeMenu');
const countrySearch = document.getElementById('countrySearch');
const channelSearch = document.getElementById('channelSearch');
const countryPanel = document.getElementById('countryPanel');
const changeCountryButton = document.getElementById('changeCountryButton');
const closePlayerButton = document.getElementById('closePlayerButton');
const pipPlayerButton = document.getElementById('pipPlayerButton');
const aboutModal = document.getElementById('aboutModal');
const aboutCloseButton = document.getElementById('aboutCloseButton');
const privacyModal = document.getElementById('privacyModal');
const privacyCloseButton = document.getElementById('privacyCloseButton');
const faqModal = document.getElementById('faqModal');
const faqCloseButton = document.getElementById('faqCloseButton');
const feedbackModal = document.getElementById('feedbackModal');
const feedbackCloseButton = document.getElementById('feedbackCloseButton');

menuButton.addEventListener('click', () => leftNav.classList.toggle('open'));
closeMenu.addEventListener('click', () => leftNav.classList.remove('open'));
document.getElementById('searchFocusButton').addEventListener('click', () => countrySearch.focus());
document.getElementById('focusGlobeButton').addEventListener('click', () => focusCountry(appState.selectedCountry?.code || 'MA'));
document.getElementById('zoomInButton').addEventListener('click', () => setGlobeZoom(appState.globeZoom + 0.18));
document.getElementById('zoomOutButton').addEventListener('click', () => setGlobeZoom(appState.globeZoom - 0.18));
document.getElementById('zoomResetButton').addEventListener('click', () => setGlobeZoom(1));
document.getElementById('randomButton').addEventListener('click', selectRandomCountry);
document.getElementById('openPanelHint').addEventListener('click', revealCountryPanelIfStacked);
document.getElementById('radioMode').addEventListener('click', () => setMediaMode('radio'));
document.getElementById('tvMode').addEventListener('click', () => setMediaMode('tv'));
makePlayerPanelDraggable();
changeCountryButton.addEventListener('click', () => {
  countryPanel.classList.remove('channels-only');
  countrySearch.focus();
});
closePlayerButton.addEventListener('click', closePlayer);
pipPlayerButton.addEventListener('click', requestPlayerPictureInPicture);
aboutCloseButton.addEventListener('click', closeAboutModal);
aboutModal.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-about]')) closeAboutModal();
});
privacyCloseButton.addEventListener('click', closePrivacyModal);
privacyModal.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-privacy]')) closePrivacyModal();
});
faqCloseButton.addEventListener('click', closeFaqModal);
faqModal.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-faq]')) closeFaqModal();
});
feedbackCloseButton.addEventListener('click', closeFeedbackModal);
feedbackModal.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-feedback]')) closeFeedbackModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && aboutModal.classList.contains('open')) closeAboutModal();
  if (event.key === 'Escape' && privacyModal.classList.contains('open')) closePrivacyModal();
  if (event.key === 'Escape' && faqModal.classList.contains('open')) closeFaqModal();
  if (event.key === 'Escape' && feedbackModal.classList.contains('open')) closeFeedbackModal();
});

countrySearch.addEventListener('input', (event) => {
  appState.query = event.target.value;
  renderCountries();
});
channelSearch.addEventListener('input', (event) => {
  appState.channelQuery = event.target.value;
  appState.aiChannels = null;
  appState.renderLimit = appState.globalMode ? 700 : 1000;
  renderChannels();
  requestPythonAI();
});
leftNav.addEventListener('click', (event) => {
  const link = event.target.closest('.nav-link');
  if (!link) return;

  if (link.dataset.category) {
    handleCategoryNavigation(link.dataset.category).catch(() => {
      document.getElementById('channelCount').textContent = '0';
      document.getElementById('aiInsight').textContent = 'Could not load channels right now';
      document.getElementById('channelGrid').innerHTML = '<p class="muted">Channels could not be loaded right now.</p>';
    });
  }
  if (link.dataset.action === 'focus') {
    leftNav.classList.remove('open');
    focusCountry(appState.selectedCountry?.code || 'MA');
  }
  if (link.dataset.action === 'random-channel') {
    leftNav.classList.remove('open');
    playRandomChannel();
  }
  if (link.dataset.action === 'about') {
    leftNav.classList.remove('open');
    openAboutModal();
  }
  if (link.dataset.action === 'privacy') {
    leftNav.classList.remove('open');
    openPrivacyModal();
  }
  if (link.dataset.action === 'faq') {
    leftNav.classList.remove('open');
    openFaqModal();
  }
  if (link.dataset.action === 'feedback') {
    leftNav.classList.remove('open');
    openFeedbackModal();
  }
  if (['embed'].includes(link.dataset.action)) {
    leftNav.classList.remove('open');
    showToast(navActionMessage(link.dataset.action));
  }
});

async function handleCategoryNavigation(categoryId) {
  appState.selectedCategory = categoryId;
  appState.aiChannels = null;
  appState.channelQuery = '';
  appState.renderLimit = 700;
  channelSearch.value = '';
  leftNav.classList.remove('open');

  if (categoryId === 'favorites') {
    appState.globalMode = false;
    countryPanel.classList.add('channels-only');
    document.getElementById('countryTitle').textContent = 'Favorites';
    document.getElementById('heroCountry').textContent = 'Favorites';
    document.getElementById('mediaTitle').textContent = appState.mediaMode === 'radio' ? 'Favorite Radio' : 'Favorite Channels';
    renderChannels();
    requestPythonAI();
    return;
  }

  if (appState.mediaMode === 'radio') {
    if (!appState.currentChannels.length && !appState.selectedCountry) {
      document.getElementById('countryTitle').textContent = 'Select a Country';
      document.getElementById('aiInsight').textContent = 'Choose a country first, then filter radio stations';
      document.getElementById('channelGrid').innerHTML = '<p class="muted">Choose a country first to browse radio stations by category.</p>';
      document.getElementById('channelCount').textContent = '0';
      return;
    }
    renderChannels();
    requestPythonAI();
    return;
  }

  await loadGlobalCategory(categoryId);
}

async function loadGlobalCategory(categoryId) {
  const label = categoryLabel(categoryId);
  appState.globalMode = true;
  appState.selectedCountry = null;
  appState.currentChannels = [];
  appState.aiChannels = null;
  appState.aiInsight = '';
  appState.renderLimit = categoryId === 'all' ? 700 : 1000;
  countryPanel.classList.add('channels-only');
  document.getElementById('countryTitle').textContent = label;
  document.getElementById('heroCountry').textContent = label;
  document.getElementById('channelCount').textContent = '...';
  document.getElementById('aiInsight').textContent = categoryId === 'all'
    ? 'Loading channels from all countries'
    : `Loading ${label} channels from all countries`;
  document.getElementById('channelGrid').innerHTML = skeletonCards();
  setGlobeStatus(label, 'Loading channels from all countries');

  try {
    appState.currentChannels = await loadGlobalCategoryChannels(categoryId);
    const filteredCount = smartFilterChannels(appState.currentChannels).length;
    appState.aiInsight = categoryId === 'all'
      ? `${filteredCount} channels from all countries`
      : `${filteredCount} ${label} channels from all countries`;
    setGlobeStatus(label, `${filteredCount} channels ready`);
    renderCountries();
    renderChannels();
  } catch (error) {
    appState.currentChannels = [];
    document.getElementById('channelCount').textContent = '0';
    document.getElementById('aiInsight').textContent = 'Could not load global channels right now';
    document.getElementById('channelGrid').innerHTML = '<p class="muted">Global channels could not be loaded right now.</p>';
  }
}

function categoryLabel(categoryId) {
  return categories.find(([id]) => id === categoryId)?.[1] || 'Channels';
}

setInterval(updateClock, 1000);
updateClock();
updateMediaLabels();
initGlobe();
loadCountries();

async function initGlobe() {
  const mount = document.getElementById('globeStage');
  mount.innerHTML = `<div class="globe-loading"><span>${brandLogo}</span><strong>Loading globe</strong></div>`;

  try {
    const threeModule = await loadGlobeModules();
    THREE = threeModule;
    mount.innerHTML = '';
    createGlobe();
  } catch (error) {
    mount.innerHTML = `<div class="globe-loading error-state"><span>${brandLogo}</span><strong>Globe could not load</strong></div>`;
  }
}

async function loadGlobeModules() {
  const sources = [
    '/assets/vendor/three.module.js',
    'https://esm.sh/three@0.165.0',
    'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js'
  ];

  let lastError;
  for (const source of sources) {
    try {
      return await import(source);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function updateClock() {
  const fallback = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (!DateTime || !appState.selectedCountry) {
    document.getElementById('clock').textContent = fallback;
    return;
  }

  const zone = timezoneByCountry[appState.selectedCountry.code];
  document.getElementById('clock').textContent = zone
    ? DateTime.now().setZone(zone).toFormat('HH:mm')
    : fallback;
}

async function loadCountries() {
  try {
    const countries = await cachedJson(LOCAL_COUNTRIES, 'countries-lite', { fallbackUrl: `${API_BASE}/countries.json` });
    appState.countries = dedupeCountries(
      countries
        .map(normalizeCountry)
        .filter((country) => country.code)
    ).sort((a, b) => a.name.localeCompare(b.name));
    rebuildCountryLookup();
    appState.availableCountryCodes = new Set(appState.countries.map((country) => country.code));
    renderCountries();
    if (!appState.selectedCountry && !appState.globalMode) {
      document.getElementById('countryTitle').textContent = 'Select a Country';
      document.getElementById('heroCountry').textContent = 'Choose from the globe';
      document.getElementById('aiInsight').textContent = 'Click a country on the globe to load channels';
      document.getElementById('channelGrid').innerHTML = '<p class="muted">Channels will appear here after you choose a country from the globe.</p>';
    }
  } catch (error) {
    document.getElementById('countryList').innerHTML =
      '<p class="error">Could not load countries. Check the internet connection and reload.</p>';
  }
}

async function cachedJson(url, key, options = {}) {
  const cached = sessionStorage.getItem(`watchnations:${key}`);
  if (cached) return safeParseJSON(cached, []);

  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
    if (!response.ok) throw new Error(`Failed to load ${url}`);
  } catch (error) {
    if (!options.fallbackUrl) throw error;
    response = await fetch(options.fallbackUrl, { signal: AbortSignal.timeout(18_000) });
    if (!response.ok) throw new Error(`Failed to load ${options.fallbackUrl}`);
  }

  const data = await response.json();
  safeSessionSet(`watchnations:${key}`, data);
  return data;
}

async function selectCountry(country, options = {}) {
  const shouldShowChannelsOnly = !options.keepPicker;
  appState.globalMode = false;
  appState.selectedCountry = country;
  appState.currentChannels = [];
  appState.aiChannels = null;
  appState.aiInsight = '';
  appState.channelQuery = '';
  appState.renderLimit = 700;
  channelSearch.value = '';
  document.getElementById('countryTitle').textContent = country.name;
  document.getElementById('heroCountry').textContent = country.name;
  const mediaLabel = appState.mediaMode === 'radio' ? 'radio stations' : 'channels';
  setGlobeStatus(country.name, `${country.flag || flag(country.code)} Loading ${mediaLabel}`);
  document.getElementById('channelCount').textContent = '...';
  document.getElementById('aiInsight').textContent = options.fromGlobe ? 'Selected from the globe' : `Loading ${mediaLabel} for this country`;
  document.getElementById('channelGrid').innerHTML = skeletonCards();
  updateMediaLabels();
  renderCountries();
  focusCountry(country.code);
  updateClock();
  loadLuxon().then(updateClock).catch(() => {});
  if (!options.silent) leftNav.classList.remove('open');
  countryPanel.classList.toggle('channels-only', shouldShowChannelsOnly);

  try {
    appState.currentChannels = await loadCountryMedia(country.code);
    setGlobeStatus(country.name, `${country.flag || flag(country.code)} ${appState.currentChannels.length} ${mediaLabel} available`);
    renderChannels();
    requestPythonAI();
    if (appState.mediaMode === 'tv') mergeIptvApiChannels(country).catch(() => {});
  } catch (error) {
    appState.currentChannels = [];
    document.getElementById('channelCount').textContent = '0';
    document.getElementById('aiInsight').textContent = `No ${mediaLabel} found for this country`;
    setGlobeStatus(country.name, `${country.flag || flag(country.code)} No ${mediaLabel} found right now`);
    document.getElementById('channelGrid').innerHTML =
      `<p class="muted">No playable free ${escapeHtml(mediaLabel)} were found for this country right now.</p>`;
  }
}

function setMediaMode(mode) {
  if (!['tv', 'radio'].includes(mode) || appState.mediaMode === mode) return;
  appState.mediaMode = mode;
  appState.globalMode = false;
  appState.aiChannels = null;
  appState.aiInsight = '';
  appState.channelQuery = '';
  appState.renderLimit = 700;
  channelSearch.value = '';
  closePlayer();
  updateMediaLabels();
  document.getElementById('tvMode').classList.toggle('active', mode === 'tv');
  document.getElementById('radioMode').classList.toggle('active', mode === 'radio');
  showToast(mode === 'radio' ? 'Radio mode is active.' : 'TV mode is active.');
  if (appState.selectedCountry) {
    selectCountry(appState.selectedCountry, { keepPicker: false, silent: true });
  } else {
    document.getElementById('aiInsight').textContent =
      mode === 'radio' ? 'Click a country on the globe to load radio stations' : 'Click a country on the globe to load channels';
    document.getElementById('channelGrid').innerHTML =
      `<p class="muted">${mode === 'radio' ? 'Radio stations' : 'Channels'} will appear here after you choose a country from the globe.</p>`;
  }
}

function updateMediaLabels() {
  const isRadio = appState.mediaMode === 'radio';
  document.getElementById('mediaTitle').textContent = isRadio ? 'Free Radio' : 'Free Channels';
  document.getElementById('playerTitle').textContent = isRadio ? 'Select a radio station' : 'Select a channel';
  channelSearch.placeholder = isRadio ? 'Search stations, language, or tag' : 'Search channels or category';
}

async function loadCountryMedia(code) {
  return appState.mediaMode === 'radio' ? loadRadioStations(code) : loadCountryChannels(code);
}

async function loadRadioStations(code) {
  code = normalizeCountryCode(code);
  const cacheKey = `watchnations:radio:${code}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return safeParseJSON(cached, []);

  const response = await fetch(`/api/radio/stations?country=${encodeURIComponent(code)}`);
  if (!response.ok) throw new Error(`Radio stations failed for ${code}`);
  const data = await response.json();
  const stations = Array.isArray(data.stations) ? data.stations.map(sanitizeChannel).filter((station) => station.url) : [];
  safeSessionSet(cacheKey, stations);
  return stations;
}

async function selectCountryByCode(rawCode, options = {}) {
  const code = normalizeCountryCode(rawCode);
  debugCountrySelection(rawCode, code, options.source || 'unknown');
  if (!isAvailableCountryCode(code)) {
    showToast('This country is not available yet.');
    return;
  }

  const country = findCountryByCode(code);
  if (!country) {
    showToast('Country data is still loading.');
    return;
  }

  await selectCountry(country, options);
}

async function loadCountryChannels(code) {
  code = normalizeCountryCode(code);
  if (channelCache.has(code)) return channelCache.get(code);

  const cacheKey = `watchnations:${CHANNEL_CACHE_VERSION}:m3u:${code}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    const data = safeParseJSON(cached, []);
    channelCache.set(code, data);
    return data;
  }

  let data = [];
  try {
    data = await loadM3UChannels(code);
  } catch (error) {
    data = await loadApiChannelsForCountry(code);
    if (!data.length) throw error;
  }
  safeSessionSet(cacheKey, data);
  channelCache.set(code, data);
  return data;
}

async function loadM3UChannels(code) {
  let lastError;
  for (const candidate of candidateCountryCodes(code)) {
    try {
      const response = await fetch(`${IPTV_BASE}/countries/${candidate.toLowerCase()}.m3u`);
      if (!response.ok) throw new Error(`No playlist for ${candidate}`);
      return parseM3U(await response.text(), normalizeCountryCode(code));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error(`No playlist for ${code}`);
}

async function mergeIptvApiChannels(country) {
  const code = normalizeCountryCode(country.code);
  const apiChannels = await loadApiChannelsForCountry(code);
  if (appState.selectedCountry?.code !== code || !apiChannels.length) return;

  const merged = dedupeChannels([...appState.currentChannels, ...apiChannels]);
  if (merged.length <= appState.currentChannels.length) return;

  appState.currentChannels = merged;
  channelCache.set(code, merged);
  safeSessionSet(`watchnations:${CHANNEL_CACHE_VERSION}:m3u:${code}`, merged);
  setGlobeStatus(country.name, `${country.flag || flag(code)} ${merged.length} channels available`);
  appState.aiInsight = `${merged.length} streams available for this country`;
  appState.aiChannels = null;
  renderChannels();
  requestPythonAI();
}

async function loadApiChannelsForCountry(code) {
  const cacheKey = `watchnations:${CHANNEL_CACHE_VERSION}:api-country:${code}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return safeParseJSON(cached, []);

  const { channels, streams } = await loadIptvApiIndex();
  const countryChannels = channels.filter((channel) => channelHasCountry(channel, code));
  const channelById = new Map(countryChannels.map((channel) => [channel.id, channel]));
  const output = streams
    .map((stream) => {
      const channelId = stream.channel || stream.channel_id || stream.channelId;
      const channel = channelById.get(channelId);
      if (!channel) return null;
      const url = sanitizeUrl(stream.url);
      if (!url) return null;
      const group = Array.isArray(channel.categories) && channel.categories.length ? channel.categories.join(', ') : 'general';
      return {
        id: channel.id || `${code}-${url}`,
        name: channel.name || 'Live TV',
        url,
        logo: LOAD_EXTERNAL_LOGOS ? sanitizeUrl(channel.logo) : '',
        category: classifyChannelCategory({ name: channel.name, group, category: group }),
        sourceCategory: group,
        group,
        quality: stream.quality || '',
        country: code
      };
    })
    .filter(Boolean);

  const deduped = dedupeChannels(output);
  safeSessionSet(cacheKey, deduped);
  return deduped;
}

async function loadAllIptvChannels() {
  if (appState.mediaMode === 'radio') {
    showToast('Global TV is available in TV mode.');
    return;
  }
  appState.globalMode = true;
  appState.selectedCountry = null;
  appState.currentChannels = [];
  appState.aiChannels = null;
  appState.aiInsight = '';
  appState.channelQuery = '';
  appState.renderLimit = 700;
  channelSearch.value = '';
  countryPanel.classList.add('channels-only');
  document.getElementById('countryTitle').textContent = 'All Channels';
  document.getElementById('heroCountry').textContent = 'All Channels';
  document.getElementById('channelCount').textContent = '...';
  document.getElementById('aiInsight').textContent = 'Loading playable global streams';
  document.getElementById('channelGrid').innerHTML = skeletonCards();
  setGlobeStatus('All Channels', 'Loading the global stream index');

  try {
    appState.currentChannels = await loadGlobalIptvChannels();
    appState.aiInsight = `Loaded ${appState.currentChannels.length} playable streams`;
    setGlobeStatus('All Channels', `${appState.currentChannels.length} playable streams loaded`);
    renderCountries();
    renderChannels();
  } catch (error) {
    appState.currentChannels = [];
    document.getElementById('channelCount').textContent = '0';
    document.getElementById('aiInsight').textContent = 'Could not load the global channel index';
    document.getElementById('channelGrid').innerHTML = '<p class="muted">The global channel index could not be loaded right now.</p>';
  }
}

async function loadGlobalIptvChannels() {
  const cacheKey = `watchnations:${CHANNEL_CACHE_VERSION}:api-global-streams`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return safeParseJSON(cached, []);

  const { channels, streams } = await loadIptvApiIndex();
  const channelById = new Map(channels.map((channel) => [channel.id, channel]));
  const output = streams
    .map((stream) => {
      const channelId = stream.channel || stream.channel_id || stream.channelId;
      const channel = channelById.get(channelId);
      const url = sanitizeUrl(stream.url);
      if (!channel || !url) return null;
      const country = normalizeCountryCode(channel.country || channel.countries?.[0] || '');
      const group = Array.isArray(channel.categories) && channel.categories.length ? channel.categories.join(', ') : 'general';
      return {
        id: channel.id || `global-${url}`,
        name: channel.name || 'Live TV',
        url,
        logo: LOAD_EXTERNAL_LOGOS ? sanitizeUrl(channel.logo) : '',
        category: classifyChannelCategory({ name: channel.name, group, category: group }),
        sourceCategory: group,
        group,
        quality: stream.quality || '',
        country
      };
    })
    .filter(Boolean);

  const deduped = dedupeChannels(output);
  safeSessionSet(cacheKey, deduped);
  return deduped;
}

async function loadGlobalCategoryChannels(categoryId) {
  const cacheKey = `watchnations:${CHANNEL_CACHE_VERSION}:server-category:${categoryId}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return safeParseJSON(cached, []);

  try {
    const response = await fetch(`/api/tv/category?category=${encodeURIComponent(categoryId)}&limit=3000`);
    if (!response.ok) throw new Error(`Category ${categoryId} failed`);
    const data = await response.json();
    const channels = Array.isArray(data.channels) ? data.channels.map(sanitizeChannel).filter((channel) => channel.url) : [];
    if (channels.length) {
      safeSessionSet(cacheKey, channels);
      return channels;
    }
  } catch (error) {
    // Fall back to the browser-side index if the local API is temporarily unavailable.
  }

  return loadGlobalIptvChannels();
}

async function loadIptvApiIndex() {
  iptvApiIndexPromise ||= Promise.all([
    cachedJson(`${API_BASE}/channels.json`, 'api-channels'),
    cachedJson(`${API_BASE}/streams.json`, 'api-streams')
  ]).then(([channels, streams]) => ({ channels, streams }));
  return iptvApiIndexPromise;
}

function channelHasCountry(channel, code) {
  if (normalizeCountryCode(channel.country) === code) return true;
  if (Array.isArray(channel.countries)) {
    return channel.countries.some((countryCode) => normalizeCountryCode(countryCode) === code);
  }
  return false;
}

function candidateCountryCodes(code) {
  const normalized = normalizeCountryCode(code);
  const candidates = new Set([normalized]);
  appState.countries.forEach((country) => {
    if (country.code === normalized && country.sourceCode) candidates.add(country.sourceCode);
  });
  Object.entries(countryCodeAliases).forEach(([raw, mapped]) => {
    if (mapped === normalized) candidates.add(raw);
  });
  return [...candidates].filter(Boolean);
}

function parseM3U(text, countryCode) {
  const lines = text.split(/\r?\n/);
  const channels = [];

  for (let index = 0; index < lines.length; index += 1) {
    const info = lines[index].trim();
    if (!info.startsWith('#EXTINF')) continue;

    const url = sanitizeUrl(lines[index + 1]?.trim());
    if (!url) continue;

    const title = info.split(',').pop()?.trim() || 'Live TV';
    const id = getAttr(info, 'tvg-id') || `${countryCode}-${channels.length}`;
    const logo = LOAD_EXTERNAL_LOGOS ? sanitizeUrl(getAttr(info, 'tvg-logo')) : '';
    const group = getAttr(info, 'group-title') || 'general';
    const quality = /(?:720p|1080p|4K|HD|FHD)/i.exec(title)?.[0] || '';

    channels.push({
      id,
      name: title.replace(/\s+\([^)]+\)$/g, ''),
      url,
      logo,
      category: classifyChannelCategory({ name: title, group, category: group }),
      sourceCategory: group,
      group,
      quality,
      country: countryCode
    });
  }

  return dedupeChannels(channels);
}

function getAttr(text, attr) {
  const match = new RegExp(`${attr}="([^"]*)"`, 'i').exec(text);
  return match?.[1] || '';
}

function classifyChannelCategory(channel = {}) {
  const exactCategory = normalize(channel.category || channel.group || '');
  if (categoryIds.has(exactCategory) && exactCategory !== 'all') return exactCategory;

  const haystack = normalize([
    channel.name,
    channel.group,
    channel.category,
    channel.sourceCategory
  ].filter(Boolean).join(' '));

  for (const [categoryId, keywords] of categoryKeywordRules) {
    if (keywords.some((keyword) => haystack.includes(normalize(keyword)))) {
      return categoryId;
    }
  }

  return 'general';
}

function channelMatchesCategory(channel, categoryId) {
  if (categoryId === 'all') return true;
  const category = classifyChannelCategory(channel);
  if (category === categoryId) return true;

  const source = normalize(`${channel.category || ''} ${channel.group || ''} ${channel.sourceCategory || ''}`);
  return source.split(/[^a-z0-9]+/).includes(categoryId);
}

function dedupeChannels(channels) {
  const seen = new Set();
  return channels.filter((channel) => {
    const key = `${channel.name}|${channel.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderCountries() {
  const list = document.getElementById('countryList');
  const countries = smartRankCountries(appState.countries, appState.query);

  list.innerHTML = countries
    .map(
      (country) => `
        <button data-code="${escapeHtml(country.code)}" class="${country.code === appState.selectedCountry?.code ? 'selected' : ''}">
          <span class="country-flag" aria-hidden="true">
            <img src="${escapeHtml(flagImageUrl(country.code, 80))}" srcset="${escapeHtml(flagSrcSet(country.code))}" alt="" loading="lazy" />
            <span class="country-flag-fallback">${escapeHtml(country.code)}</span>
          </span>
          <span>${escapeHtml(country.name)}</span>
          <small>${escapeHtml(country.code)}</small>
        </button>
      `
    )
    .join('');

  list.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      selectCountryByCode(button.dataset.code, { keepPicker: false, source: 'search' });
    });
  });
  list.querySelectorAll('.country-flag img').forEach((image) => {
    image.addEventListener('error', () => {
      image.hidden = true;
    }, { once: true });
  });
}

function smartRankCountries(countries, query) {
  const normalized = normalize(query);
  if (!normalized) {
    const priority = new Set(['MA', 'US', 'FR', 'ES', 'GB', 'DE', 'IT', 'DZ', 'EG', 'SA', 'AE', 'TR']);
    return [...countries].sort((a, b) => Number(priority.has(b.code)) - Number(priority.has(a.code)) || a.name.localeCompare(b.name));
  }

  return countries
    .map((country) => {
      const name = normalize(country.name);
      const code = normalize(country.code);
      let score = 0;
      if (name === normalized || code === normalized) score += 100;
      if (name.startsWith(normalized)) score += 60;
      if (name.includes(normalized)) score += 25;
      return { country, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.country.name.localeCompare(b.country.name))
    .map((item) => item.country);
}

function renderChannels() {
  const grid = document.getElementById('channelGrid');
  syncFavoriteMetadata(appState.currentChannels);
  const channels = smartFilterChannels(appState.aiChannels || appState.currentChannels);

  document.getElementById('channelCount').textContent = channels.length;
  document.getElementById('aiInsight').textContent = appState.aiInsight || getInsight(channels);

  if (!channels.length) {
    const label = appState.mediaMode === 'radio' ? 'radio stations' : 'channels';
    grid.innerHTML = appState.selectedCategory === 'favorites'
      ? '<p class="muted">No favorites yet. Press the star button on any channel to save it here.</p>'
      : `<p class="muted">No ${label} match the current filter.</p>`;
    return;
  }

  const renderedChannels = channels.slice(0, appState.renderLimit);
  appState.renderedChannels = renderedChannels;

  grid.innerHTML = renderedChannels
    .map(
      (channel, index) => `
        <article class="channel-card">
          ${channelLogoMarkup(channel)}
          <div>
            <strong>${escapeHtml(channel.name)}</strong>
            <small>${escapeHtml(channelMeta(channel))}</small>
          </div>
          <div class="channel-actions">
            <button class="mini-button favorite ${appState.favorites.has(channel.url) ? 'active' : ''}" data-favorite-index="${index}" title="${appState.favorites.has(channel.url) ? 'Remove favorite' : 'Add favorite'}">${icons.star}</button>
            <button class="mini-button play-channel" data-url="${escapeHtml(sanitizeUrl(channel.url))}" data-title="${escapeHtml(channel.name)}" data-id="${escapeHtml(channel.id)}" data-type="${escapeHtml(channel.type || appState.mediaMode)}" title="Play">${icons.play}</button>
          </div>
        </article>
      `
    )
    .join('') + renderMoreChannelsButton(channels.length);

  grid.querySelectorAll('[data-favorite-index]').forEach((button) => {
    button.addEventListener('click', () => toggleFavorite(getRenderedChannel(button.dataset.favoriteIndex)));
  });
  grid.querySelectorAll('.play-channel').forEach((button) => {
    button.addEventListener('click', () => playChannel(button.dataset.url, button.dataset.title, {
      id: button.dataset.id,
      type: button.dataset.type
    }));
  });
  grid.querySelectorAll('.channel-logo img').forEach((image) => {
    image.addEventListener('error', () => {
      image.hidden = true;
      image.closest('.channel-logo')?.classList.add('show-fallback');
    }, { once: true });
  });
  grid.querySelector('[data-load-more-channels]')?.addEventListener('click', () => {
    appState.renderLimit += appState.globalMode ? 700 : 1000;
    renderChannels();
  });
}

function channelMeta(channel) {
  const country = findCountryByCode(channel.country);
  const parts = channel.type === 'radio'
    ? [country?.name || channel.country || '', channel.group || 'Radio', channel.quality || '']
    : [country?.name || channel.country || '', channel.group || 'General', channel.quality || ''];
  return parts.filter(Boolean).join(' - ');
}

function channelLogoMarkup(channel) {
  const countryCode = channel.country || appState.selectedCountry?.code || '';
  const imageUrl = flagImageUrl(countryCode, 160);
  const fallbackFlag = escapeHtml(flag(countryCode) || normalizeCountryCode(countryCode) || 'WN');
  if (!imageUrl) {
    return `<span class="channel-logo show-fallback"><span class="logo-fallback">${fallbackFlag}</span></span>`;
  }
  return `
    <span class="channel-logo">
      <img src="${escapeHtml(imageUrl)}" srcset="${escapeHtml(flagSrcSet(countryCode))}" alt="" loading="lazy" decoding="async" />
      <span class="logo-fallback">${fallbackFlag}</span>
    </span>
  `;
}

function renderMoreChannelsButton(total) {
  if (total <= appState.renderLimit) return '';
  const remaining = total - appState.renderLimit;
  return `
    <button class="load-more-channels" data-load-more-channels>
      Show ${Math.min(remaining, appState.globalMode ? 700 : 1000)} more of ${remaining}
    </button>
  `;
}

function smartFilterChannels(channels) {
  const query = normalize(appState.channelQuery);
  let output = appState.selectedCategory === 'favorites'
    ? [...appState.favoriteChannels.values()].filter((channel) => {
      const type = channel.type || 'tv';
      return appState.favorites.has(channel.url) && type === appState.mediaMode;
    })
    : channels;

  if (appState.selectedCategory !== 'favorites' && appState.selectedCategory !== 'all') {
    output = output.filter((channel) => channelMatchesCategory(channel, appState.selectedCategory));
  }

  if (!query) return output;

  return output
    .map((channel) => {
      const countryName = findCountryByCode(channel.country)?.name || channel.country || '';
      const haystack = normalize(`${channel.name} ${channel.group} ${channel.quality} ${countryName} ${channel.country} ${channel.type || ''}`);
      let score = 0;
      if (haystack.includes(query)) score += 30;
      if (normalize(channel.name).startsWith(query)) score += 30;
      if (String(channel.url).toLowerCase().includes('.m3u8')) score += 3;
      return { channel, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.channel.name.localeCompare(b.channel.name))
    .map((item) => item.channel);
}

function requestPythonAI() {
  clearTimeout(requestPythonAI.timer);
  requestPythonAI.timer = setTimeout(async () => {
    if (!appState.currentChannels.length || normalize(appState.channelQuery).length < 2) return;

    try {
      const response = await fetch('/api/ai/rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: appState.channelQuery,
          channels: smartFilterChannels(appState.currentChannels).slice(0, 180)
        })
      });
      const result = await response.json();
      if (!result.channels?.length) return;
      appState.aiChannels = result.channels.map(sanitizeChannel).filter((channel) => channel.url);
      appState.aiInsight = appState.mediaMode === 'radio'
        ? `${appState.aiChannels.length} matching stations`
        : `${appState.aiChannels.length} matching channels`;
      renderChannels();
    } catch (error) {
      appState.aiInsight = '';
    }
  }, 520);
}

function sanitizeChannel(channel) {
  const sourceCategory = String(channel?.sourceCategory || channel?.group || channel?.category || 'General').slice(0, 120);
  return {
    id: String(channel?.id || '').slice(0, 120),
    name: String(channel?.name || 'Live TV').slice(0, 160),
    url: sanitizeUrl(channel?.url),
    logo: sanitizeUrl(channel?.logo),
    category: classifyChannelCategory(channel),
    sourceCategory,
    group: String(channel?.group || 'General').slice(0, 80),
    quality: String(channel?.quality || '').slice(0, 32),
    country: String(channel?.country || '').slice(0, 4),
    type: String(channel?.type || appState.mediaMode || 'tv').slice(0, 12)
  };
}

function normalizeCountry(country) {
  const code = normalizeCountryCode(country?.code);
  return {
    ...country,
    sourceCode: String(country?.code || '').trim().toUpperCase(),
    code,
    flag: country?.flag || flag(code)
  };
}

function dedupeCountries(countries) {
  const byCode = new Map();
  countries.forEach((country) => {
    const existing = byCode.get(country.code);
    if (!existing) {
      byCode.set(country.code, country);
      return;
    }

    const countryIsExact = country.sourceCode === country.code;
    const existingIsAlias = existing.sourceCode !== existing.code;
    if (countryIsExact && existingIsAlias) byCode.set(country.code, country);
  });
  return [...byCode.values()];
}

function rebuildCountryLookup() {
  appState.countryLookup = new Map();
  appState.countries.forEach((country) => {
    appState.countryLookup.set(country.code, country);
  });
}

function findCountryByCode(code) {
  const normalized = normalizeCountryCode(code);
  return appState.countryLookup.get(normalized) || null;
}

function countryFromGeoFeature(feature, code) {
  const normalized = normalizeCountryCode(code);
  return (
    findCountryByCode(normalized) || {
      code: normalized,
      name: featureCountryName(feature) || normalized,
      flag: flag(normalized)
    }
  );
}

function getInsight(channels) {
  if (appState.selectedCategory === 'favorites') return `${channels.length} favorite ${appState.mediaMode === 'radio' ? 'stations' : 'channels'} saved`;
  if (appState.globalMode) return appState.aiInsight || `Global channel index: ${channels.length} streams`;
  if (!appState.currentChannels.length) return appState.mediaMode === 'radio' ? 'Choose a country to load radio stations' : 'Choose a country to load channels';
  if (appState.channelQuery) return `AI filter ranked ${channels.length} matching channels`;
  const groups = new Set(channels.map((channel) => channel.group).filter(Boolean));
  return appState.mediaMode === 'radio'
    ? `${channels.length} stations across ${groups.size || 1} groups`
    : `${channels.length} streams across ${groups.size || 1} groups`;
}

function getRenderedChannel(index) {
  return appState.renderedChannels[Number(index)] || null;
}

function syncFavoriteMetadata(channels) {
  let changed = false;
  channels.forEach((channel) => {
    if (!channel?.url || !appState.favorites.has(channel.url) || appState.favoriteChannels.has(channel.url)) return;
    appState.favoriteChannels.set(channel.url, sanitizeChannel({
      ...channel,
      type: channel.type || appState.mediaMode,
      country: channel.country || appState.selectedCountry?.code || ''
    }));
    changed = true;
  });
  if (changed) saveFavorites();
}

function toggleFavorite(channel) {
  if (!channel?.url) return;
  appState.aiChannels = null;
  const favoriteChannel = sanitizeChannel({
    ...channel,
    type: channel.type || appState.mediaMode,
    country: channel.country || appState.selectedCountry?.code || ''
  });

  if (appState.favorites.has(favoriteChannel.url)) {
    appState.favorites.delete(favoriteChannel.url);
    appState.favoriteChannels.delete(favoriteChannel.url);
    showToast('Removed from Favorites.');
  } else {
    appState.favorites.add(favoriteChannel.url);
    appState.favoriteChannels.set(favoriteChannel.url, favoriteChannel);
    showToast('Added to Favorites.');
  }

  saveFavorites();
  renderChannels();
}

function saveFavorites() {
  try {
    localStorage.setItem('watchnations:favorites', JSON.stringify([...appState.favorites]));
    localStorage.setItem('watchnations:favorite-channels', JSON.stringify([...appState.favoriteChannels.values()]));
  } catch (error) {
    showToast('Favorites storage is full.');
  }
}

function selectRandomCountry() {
  if (!appState.countries.length) return;
  const country = appState.countries[Math.floor(Math.random() * appState.countries.length)];
  selectCountry(country);
}

function playRandomChannel() {
  const channels = smartFilterChannels(appState.currentChannels);
  if (!channels.length) {
    showToast(appState.mediaMode === 'radio' ? 'No radio stations available for the current filter.' : 'No channels available for the current filter.');
    return;
  }
  const channel = channels[Math.floor(Math.random() * channels.length)];
  const url = sanitizeUrl(channel.url);
  if (!url) {
    showToast('This channel link is not safe to open.');
    return;
  }
  playChannel(url, channel.name);
}

async function playChannel(rawUrl, rawTitle = 'Live TV', options = {}) {
  const url = sanitizeUrl(rawUrl);
  if (!url) {
    showToast('This stream URL is not safe to play.');
    return;
  }

  const playerPanel = document.getElementById('playerPanel');
  const playerTitle = document.getElementById('playerTitle');
  playerPanel.classList.add('open');
  playerTitle.textContent = rawTitle || (options.type === 'radio' ? 'Live Radio' : 'Live TV');

  if (options.type === 'radio' || appState.mediaMode === 'radio') {
    playRadio(url, rawTitle, options.id);
    return;
  }

  playerPanel.classList.remove('radio-player');
  showToast('Loading live stream...');

  try {
    document.getElementById('radioPlayer').pause();
    document.getElementById('radioPlayer').classList.remove('open');
    document.getElementById('livePlayer').classList.add('open');
    await ensureVideoPlayer();

    appState.player.src({ src: url, type: streamType(url) });
    const playResult = appState.player.play();
    if (playResult?.catch) {
      playResult.catch(() => showToast('Press play to start this stream.'));
    }
  } catch (error) {
    showToast('Video player could not load. Opening stream in a new tab.');
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

async function playRadio(url, title = 'Live Radio', stationId = '') {
  const playerPanel = document.getElementById('playerPanel');
  const audio = document.getElementById('radioPlayer');
  playerPanel.classList.add('radio-player');
  document.getElementById('livePlayer').classList.remove('open');
  audio.classList.add('open');
  if (appState.player) appState.player.pause();

  try {
    if (stationId) {
      const response = await fetch(`/api/radio/click?id=${encodeURIComponent(stationId)}`);
      if (response.ok) {
        const data = await response.json();
        if (sanitizeUrl(data.url)) url = data.url;
      }
    }
  } catch (error) {
    // If the click counter is unreachable, play the station URL directly.
  }

  audio.src = url;
  showToast(`Loading ${title || 'radio station'}...`);
  const playResult = audio.play();
  if (playResult?.catch) {
    playResult.catch(() => showToast('Press play to start this radio station.'));
  }
}

function closePlayer() {
  const playerPanel = document.getElementById('playerPanel');
  playerPanel.classList.remove('open');
  playerPanel.classList.remove('radio-player');
  document.getElementById('playerTitle').textContent = appState.mediaMode === 'radio' ? 'Select a radio station' : 'Select a channel';
  if (appState.player) appState.player.pause();
  document.getElementById('radioPlayer').pause();
}

function makePlayerPanelDraggable() {
  const panel = document.getElementById('playerPanel');
  const head = panel?.querySelector('.player-head');
  if (!panel || !head) return;

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  head.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;
    dragging = true;
    const rect = panel.getBoundingClientRect();
    startX = event.clientX;
    startY = event.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    panel.classList.add('dragging');
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    head.setPointerCapture?.(event.pointerId);
  });

  head.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const rect = panel.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
    const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
    const left = Math.min(maxLeft, Math.max(8, startLeft + event.clientX - startX));
    const top = Math.min(maxTop, Math.max(8, startTop + event.clientY - startY));
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  });

  const stopDragging = (event) => {
    if (!dragging) return;
    dragging = false;
    panel.classList.remove('dragging');
    head.releasePointerCapture?.(event.pointerId);
  };
  head.addEventListener('pointerup', stopDragging);
  head.addEventListener('pointercancel', stopDragging);
}

async function requestPlayerPictureInPicture() {
  const video = document.querySelector('#livePlayer video') || document.getElementById('livePlayer');
  if (!video || document.getElementById('playerPanel').classList.contains('radio-player')) {
    showToast('Picture in picture is available for TV streams.');
    return;
  }

  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      return;
    }
    if (!document.pictureInPictureEnabled || typeof video.requestPictureInPicture !== 'function') {
      showToast('Your browser does not support picture in picture.');
      return;
    }
    await video.requestPictureInPicture();
  } catch (error) {
    showToast('Start the video first, then try PiP.');
  }
}

function streamType(url) {
  const normalized = url.toLowerCase();
  if (normalized.includes('.mpd')) return 'application/dash+xml';
  if (normalized.includes('.mp4')) return 'video/mp4';
  return 'application/x-mpegURL';
}

async function loadLuxon() {
  if (DateTime) return DateTime;
  const sources = ['https://esm.sh/luxon@3.5.0', 'https://cdn.jsdelivr.net/npm/luxon@3.5.0/+esm'];
  for (const source of sources) {
    try {
      const module = await import(source);
      DateTime = module.DateTime;
      return DateTime;
    } catch (error) {
      // Try the next CDN.
    }
  }
  throw new Error('Luxon could not load');
}

async function loadVideoJs() {
  if (videojs) return videojs;
  await loadStylesheetOnce('videojs-css', 'https://vjs.zencdn.net/8.16.1/video-js.css');
  await loadScriptOnce('videojs-js', 'https://vjs.zencdn.net/8.16.1/video.min.js');
  videojs = window.videojs;
  if (!videojs) throw new Error('Video.js is unavailable');
  return videojs;
}

async function ensureVideoPlayer() {
  await loadVideoJs();
  if (!appState.player) {
    appState.player = videojs('livePlayer', {
      autoplay: false,
      controls: true,
      fluid: true,
      html5: {
        vhs: {
          enableLowInitialPlaylist: true,
          overrideNative: true
        }
      },
      liveui: true,
      preload: 'auto',
      responsive: true
    });
  }
  return appState.player;
}

function preloadVideoPlayerWhenIdle() {
  const warm = () => {
    if (appState.videoReadyPromise || appState.performanceMode) return;
    appState.videoReadyPromise = ensureVideoPlayer().catch(() => {
      appState.videoReadyPromise = null;
    });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(warm, { timeout: 4000 });
  } else {
    setTimeout(warm, 2600);
  }
}

function loadStylesheetOnce(id, href) {
  if (document.getElementById(id)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
}

function loadScriptOnce(id, src) {
  if (document.getElementById(id)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function openAboutModal() {
  aboutModal.classList.add('open');
  aboutModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  aboutCloseButton.focus();
}

function closeAboutModal() {
  aboutModal.classList.remove('open');
  aboutModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function openPrivacyModal() {
  privacyModal.classList.add('open');
  privacyModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  privacyCloseButton.focus();
}

function closePrivacyModal() {
  privacyModal.classList.remove('open');
  privacyModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function openFaqModal() {
  faqModal.classList.add('open');
  faqModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  faqCloseButton.focus();
}

function closeFaqModal() {
  faqModal.classList.remove('open');
  faqModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function openFeedbackModal() {
  feedbackModal.classList.add('open');
  feedbackModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  feedbackCloseButton.focus();
}

function closeFeedbackModal() {
  feedbackModal.classList.remove('open');
  feedbackModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function navActionMessage(action) {
  const messages = {
    about: 'WatchNations brings free TV and radio by country.',
    embed: 'Embed tools will be available in the next build.',
    faq: 'FAQ section is ready to be connected.',
    privacy: 'WatchNations does not require accounts or passwords.',
    feedback: 'Feedback form will be connected soon.'
  };
  return messages[action] || 'Ready';
}

function skeletonCards() {
  return Array.from({ length: 6 }, () => '<div class="channel-card skeleton"><span></span><div></div><i></i></div>').join('');
}

function createGlobe() {
  if (!THREE) return;
  const mount = document.getElementById('globeStage');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, mount.clientWidth / mount.clientHeight, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !appState.performanceMode, powerPreference: 'high-performance' });
  const globeGroup = new THREE.Group();
  const textureCanvas = document.createElement('canvas');
  const rotation = new THREE.Vector2(0, 1.05);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  textureCanvas.width = appState.performanceMode ? 720 : 1024;
  textureCanvas.height = appState.performanceMode ? 360 : 512;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, appState.performanceMode ? 1.5 : 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  mount.appendChild(renderer.domElement);
  camera.position.z = appState.performanceMode ? 6.8 : 6.15;

  scene.add(globeGroup);
  scene.add(new THREE.AmbientLight(0xffffff, 2.55));

  const light = new THREE.PointLight(0x65dcff, 2.45, 12);
  light.position.set(-2.5, 1.6, 3);
  scene.add(light);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.flipY = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), appState.performanceMode ? 4 : 8);
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(1.62, appState.performanceMode ? 48 : 72, appState.performanceMode ? 48 : 72),
    new THREE.MeshBasicMaterial({ map: texture })
  );
  globeGroup.add(globe);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(1.8, 64, 64),
    new THREE.MeshBasicMaterial({ color: 0x0077bf, transparent: true, opacity: 0.14, side: THREE.BackSide })
  );
  globeGroup.add(glow);
  scene.add(makeStars());

  appState.globe = { textureCanvas, texture, rotation, renderer, camera, mount, globe, globeGroup, raycaster, pointer, featureByCode: new Map() };
  exposeLocalGlobeDebug();
  applyGlobeZoom();
  drawLoadingTexture(ctxFromCanvas(textureCanvas), textureCanvas, texture);
  drawWorldTexture('');

  let pointerDown = false;
  let lastX = 0;
  let lastY = 0;
  let startX = 0;
  let startY = 0;
  let dragging = false;

  mount.addEventListener('pointerdown', (event) => {
    pointerDown = true;
    dragging = false;
    appState.userControlledGlobe = true;
    mount.setPointerCapture?.(event.pointerId);
    lastX = event.clientX;
    lastY = event.clientY;
    startX = event.clientX;
    startY = event.clientY;
  });
  mount.addEventListener('pointermove', (event) => {
    if (!pointerDown) return;
    dragging = true;
    rotation.y += (event.clientX - lastX) * 0.006;
    rotation.x += (event.clientY - lastY) * 0.004;
    lastX = event.clientX;
    lastY = event.clientY;
  });
  mount.addEventListener('wheel', (event) => {
    event.preventDefault();
    setGlobeZoom(appState.globeZoom + (event.deltaY < 0 ? 0.12 : -0.12));
    scheduleCenterTargetUpdate({ mount, camera, globe, raycaster, pointer });
  }, { passive: false });
  mount.addEventListener('pointerup', (event) => {
    mount.releasePointerCapture?.(event.pointerId);
    if (pointerDown && !dragging && Math.hypot(event.clientX - startX, event.clientY - startY) < 14) {
      pickCountryAtCenter({ mount, camera, globe, raycaster, pointer });
    }
    pointerDown = false;
    updateCenterTarget({ mount, camera, globe, raycaster, pointer });
  });
  mount.addEventListener('pointerleave', () => {
    updateCenterTarget({ mount, camera, globe, raycaster, pointer });
  });
  window.addEventListener('resize', () => {
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    camera.aspect = mount.clientWidth / mount.clientHeight;
    camera.updateProjectionMatrix();
    syncGlobeOverlay(mount);
    scheduleCenterTargetUpdate({ mount, camera, globe, raycaster, pointer });
  });
  syncGlobeOverlay(mount);

  let frame = 0;
  let lastCenterUpdate = 0;
  const animate = () => {
    requestAnimationFrame(animate);
    frame += 1;
    const dx = rotation.x - globeGroup.rotation.x;
    const dy = rotation.y - globeGroup.rotation.y;
    globeGroup.rotation.x += dx * 0.075;
    globeGroup.rotation.y += dy * 0.075;
    if (!pointerDown && !appState.userControlledGlobe && frame % (appState.performanceMode ? 2 : 1) === 0) {
      rotation.y += 0.00025;
    }
    const now = performance.now();
    if ((Math.abs(dx) > 0.005 || Math.abs(dy) > 0.005) && now - lastCenterUpdate > (appState.performanceMode ? 180 : 120)) {
      updateCenterTarget({ mount, camera, globe, raycaster, pointer });
      lastCenterUpdate = now;
    }
    renderer.render(scene, camera);
  };
  animate();
}

async function drawWorldTexture(selectedCode) {
  const { textureCanvas, texture } = appState.globe;
  selectedCode = normalizeCountryCode(selectedCode);
  const ctx = textureCanvas.getContext('2d');

  try {
    if (!appState.geojson) {
      appState.geojsonPromise ||= fetch(WORLD_GEOJSON).then((response) => response.json());
      appState.geojson = await appState.geojsonPromise;
      computeFeatureBBoxes();
    }
    ctx.fillStyle = '#010407';
    ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
    appState.globe.featureByCode.clear();
    appState.countryCenters.clear();

    appState.geojson.features.forEach((feature, index) => {
      const iso = getFeatureCountryCode(feature);
      if (!iso) return;
      const countryColor = countryDisplayColor(index, iso === selectedCode);
      appState.globe.featureByCode.set(iso, feature);
      appState.countryCenters.set(iso, featureCenter(feature));

      ctx.beginPath();
      drawGeoFeature(ctx, feature, textureCanvas);
      ctx.fillStyle = countryColor;
      ctx.fill();
      ctx.strokeStyle = iso === selectedCode ? '#ffffff' : 'rgba(0, 0, 0, 0.72)';
      ctx.lineWidth = iso === selectedCode ? 3.2 : 1.15;
      ctx.stroke();
    });

    registerCountryCenters();
  } catch (error) {
    drawFallbackTexture(ctx, textureCanvas);
  }

  const selectedFocus = selectedCode ? representativePointForCountry(selectedCode) : null;
  if (selectedFocus && appState.selectedCountry?.code === selectedCode) {
    setGlobeRotationToLonLat(selectedFocus[0], selectedFocus[1]);
  }

  texture.needsUpdate = true;
  scheduleCenterTargetUpdate(appState.globe);
}

async function pickCountryFromGlobe(event, context) {
  const uv = globeUVFromEvent(event, context);
  if (!uv) return;
  const code = countryCodeFromUv(uv);
  if (!code) {
    showToast('Click directly on a country.');
    return;
  }

  await selectCountryByCode(code, { fromGlobe: true, source: 'globe' });
  revealCountryPanelIfStacked();
}

async function pickCountryAtCenter(context) {
  const code = countryCodeAtGlobeCenter(context);
  if (!code) {
    showToast('Move a country into the red circle first.');
    return;
  }

  await selectCountryByCode(code, { fromGlobe: true, source: 'center-reticle' });
  revealCountryPanelIfStacked();
}

function revealCountryPanelIfStacked() {
  if (!window.matchMedia('(max-width: 760px)').matches) return;
  document.getElementById('countryPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateCenterTarget(context) {
  const label = document.getElementById('globeLabel');
  const aim = document.getElementById('globeAim');
  const center = syncGlobeOverlay(context.mount);
  const code = countryCodeAtGlobeCenter(context);
  const feature = code ? appState.globe?.featureByCode?.get(code) : null;
  const country = code ? findCountryByCode(code) || countryFromGeoFeature(feature, code) : null;

  aim.classList.add('show');
  label.style.left = `${center.x}px`;
  label.style.top = `${center.y}px`;

  if (!country) {
    context.mount.classList.remove('can-pick');
    appState.hoveredCountry = null;
    label.textContent = 'Move a country into the circle';
    label.classList.add('show');
    setGlobeStatus('Move the globe', 'Place a country inside the red circle, then click');
    return;
  }

  context.mount.classList.add('can-pick');
  appState.hoveredCountry = country;
  label.textContent = `${country.flag || flag(country.code)} ${country.name}`;
  label.classList.add('show');
  setGlobeStatus(country.name, `${country.flag || flag(country.code)} Click the globe to load channels`);
}

function scheduleCenterTargetUpdate(context) {
  clearTimeout(scheduleCenterTargetUpdate.timer);
  scheduleCenterTargetUpdate.timer = setTimeout(() => updateCenterTarget(context), 120);
}

function syncGlobeOverlay(mount) {
  const hero = mount.closest('.hero');
  const mountRect = mount.getBoundingClientRect();
  const heroRect = hero.getBoundingClientRect();
  const center = {
    x: mountRect.left - heroRect.left + mountRect.width / 2,
    y: mountRect.top - heroRect.top + mountRect.height / 2
  };
  hero.style.setProperty('--globe-center-x', `${center.x}px`);
  hero.style.setProperty('--globe-center-y', `${center.y}px`);
  return center;
}

async function updateGlobeHover(event, context) {
  const label = document.getElementById('globeLabel');
  const aim = document.getElementById('globeAim');
  const uv = globeUVFromEvent(event, context);
  const code = uv ? countryCodeFromUv(uv) : '';
  const feature = code ? appState.globe?.featureByCode?.get(code) : null;
  const country = code ? findCountryByCode(code) || countryFromGeoFeature(feature, code) : null;
  if (!country) {
    context.mount.classList.remove('can-pick');
    label.classList.remove('show');
    aim.classList.remove('show');
    return;
  }

  context.mount.classList.add('can-pick');
  appState.hoveredCountry = country;
  label.textContent = `Click ${country.name}`;
  setGlobeStatus(country.name, `${country.flag || flag(country.code)} Click to load channels`);
  label.style.left = `${event.clientX - context.mount.getBoundingClientRect().left}px`;
  label.style.top = `${event.clientY - context.mount.getBoundingClientRect().top}px`;
  label.classList.add('show');
  aim.style.left = label.style.left;
  aim.style.top = label.style.top;
  aim.classList.add('show');
}

function setGlobeStatus(title, detail) {
  const status = document.getElementById('globeStatus');
  if (!status) return;
  status.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span>`;
}

function globeUVFromEvent(event, context) {
  const rect = context.mount.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  return globeUVFromPointer(x, y, context);
}

function globeUVFromPointer(x, y, context) {
  context.pointer.x = x;
  context.pointer.y = y;
  context.globe.parent?.updateWorldMatrix(true, true);
  context.globe.updateWorldMatrix(true, false);
  context.raycaster.setFromCamera(context.pointer, context.camera);

  const hit = context.raycaster.intersectObject(context.globe, false)[0];
  if (!hit?.uv) return null;
  return hit.uv;
}

function countryCodeFromUv(uv) {
  if (!uv) return '';
  const { lon, lat } = uvToLonLat(uv);
  countryCodeFromUv.lastSource = 'math';
  return countryFromLonLat(lon, lat);
}

function countryCodeAtGlobeCenter(context) {
  const uv = globeUVFromPointer(0, 0, context);
  if (uv) {
    const code = countryCodeFromUv(uv);
    if (code) return code;
    const { lon, lat } = uvToLonLat(uv);
    return nearestSmallCountryCode(lon, lat);
  }

  const [lon, lat] = centerLonLatFromGlobe(context);
  return countryFromLonLat(lon, lat) || nearestSmallCountryCode(lon, lat);
}

function exposeLocalGlobeDebug() {
  if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) return;
  window.watchNationsDebug = {
    center() {
      const context = appState.globe;
      const uv = globeUVFromPointer(0, 0, context);
      const formula = centerLonLatFromGlobe(context);
      const uvLonLat = uv ? uvToLonLat(uv) : null;
      return {
        uv: uv ? { x: uv.x, y: uv.y } : null,
        uvLonLat,
        uvCode: uv ? countryFromLonLat(uvLonLat.lon, uvLonLat.lat) : '',
        formulaLonLat: { lon: formula[0], lat: formula[1] },
        formulaCode: countryCodeAtGlobeCenter(context),
        rotation: {
          x: context.globeGroup.rotation.x,
          y: context.globeGroup.rotation.y
        }
      };
    }
  };
}

function uvToLonLat(uv) {
  return {
    lon: uv.x * 360 - 180,
    lat: uv.y * 180 - 90
  };
}

function centerLonLatFromGlobe(context) {
  const globeGroup = context?.globe?.parent || appState.globe?.globeGroup;
  if (!globeGroup) return [0, 0];
  const lon = normalizeLongitude(THREE.MathUtils.radToDeg(-globeGroup.rotation.y - Math.PI / 2));
  const lat = Math.max(-85, Math.min(85, THREE.MathUtils.radToDeg(globeGroup.rotation.x)));
  return [lon, lat];
}

function normalizeLongitude(lon) {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

function nearestCountryCodeForCenter(lon, lat) {
  return nearestSmallCountryCode(lon, lat);
}

function nearestSmallCountryCode(lon, lat) {
  let closestCode = '';
  let minDistance = Infinity;
  const limit = appState.globeZoom > 1.2 ? 2.1 : 1.4;

  Object.keys(manualCountryCenters).forEach((code) => {
    if (!isAvailableCountryCode(code)) return;
    const center = manualCountryCenter(code);
    if (!center) return;
    const distance = countryDistance(lon, lat, center[0], center[1]);
    if (distance < limit && distance < minDistance) {
      minDistance = distance;
      closestCode = normalizeCountryCode(code);
    }
  });

  return closestCode;
}

function computeFeatureBBoxes() {
  if (!appState.geojson) return;
  appState.geojson.features.forEach((feature) => {
    const points = [];
    collectFeaturePoints(feature.geometry, points);
    if (points.length) {
      let minLon = Infinity;
      let maxLon = -Infinity;
      let minLat = Infinity;
      let maxLat = -Infinity;
      points.forEach(([lon, lat]) => {
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      });
      feature.bbox = [minLon, minLat, maxLon, maxLat];
    } else {
      feature.bbox = [0, 0, 0, 0];
    }
  });
}

function countryFromLonLat(lon, lat) {
  if (!appState.geojson) return '';

  for (const feature of appState.geojson.features) {
    const code = getFeatureCountryCode(feature);
    if (!code) continue;
    
    const bbox = feature.bbox || [0, 0, 0, 0];
    if (lon >= bbox[0] && lon <= bbox[2] && lat >= bbox[1] && lat <= bbox[3]) {
      if (pointInFeature(lon, lat, feature)) {
        return code;
      }
    }
  }

  return '';
}

function countryDistance(lonA, latA, lonB, latB) {
  const latScale = Math.cos(((latA + latB) / 2) * (Math.PI / 180));
  return Math.hypot((lonA - lonB) * latScale, latA - latB);
}

function pointInFeature(lon, lat, feature) {
  const geometry = feature?.geometry;
  if (!geometry) return false;
  if (geometry.type === 'Polygon') return pointInPolygon(lon, lat, geometry.coordinates);
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.some((polygon) => pointInPolygon(lon, lat, polygon));
  return false;
}

function pointInPolygon(lon, lat, rings) {
  if (!rings?.length || !pointInRing(lon, lat, rings[0])) return false;
  return !rings.slice(1).some((hole) => pointInRing(lon, lat, hole));
}

function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / ((yj - yi) || 1e-9) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function drawFallbackTexture(ctx, canvas) {
  ctx.fillStyle = '#010407';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255, 8, 0, 0.16)';
  for (let y = 0; y < canvas.height; y += canvas.height / 8) {
    ctx.fillRect(0, y, canvas.width, 1);
  }
  for (let x = 0; x < canvas.width; x += canvas.width / 12) {
    ctx.fillRect(x, 0, 1, canvas.height);
  }
}

function drawGeoFeature(ctx, feature, canvas) {
  const geometry = feature?.geometry;
  if (!geometry) return;
  if (geometry.type === 'Polygon') {
    drawPolygon(ctx, geometry.coordinates, canvas);
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((polygon) => drawPolygon(ctx, polygon, canvas));
  }
}

function drawPolygon(ctx, rings, canvas) {
  rings.forEach((ring) => {
    ring.forEach(([lon, lat], index) => {
      const point = projectLonLat(lon, lat, canvas);
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
  });
}

function projectLonLat(lon, lat, canvas) {
  const width = canvas.width;
  const height = canvas.height;
  return {
    x: ((lon + 180) / 360) * width,
    y: ((90 - lat) / 180) * height
  };
}

function registerCountryCenters() {
  appState.countries.forEach((country) => {
    const code = normalizeCountryCode(country.code);
    if (!appState.countryCenters.has(code)) {
      const center = manualCountryCenter(code);
      if (center) appState.countryCenters.set(code, center);
    }
  });
}

function featureCenter(feature) {
  const points = [];
  collectFeaturePoints(feature?.geometry, points);
  if (!points.length) return null;
  let minLon = 180;
  let maxLon = -180;
  let minLat = 90;
  let maxLat = -90;

  points.forEach(([lon, lat]) => {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });

  return [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
}

function isSmallCountryFeature(feature, code) {
  if (manualCountryCenters[normalizeCountryCode(code)]) return true;
  const points = [];
  collectFeaturePoints(feature?.geometry, points);
  if (!points.length) return true;

  let minLon = 180;
  let maxLon = -180;
  let minLat = 90;
  let maxLat = -90;
  points.forEach(([lon, lat]) => {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });

  return (maxLon - minLon) * (maxLat - minLat) < 8;
}

function collectFeaturePoints(geometry, output) {
  if (!geometry) return;
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach((ring) => output.push(...ring));
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((polygon) => polygon.forEach((ring) => output.push(...ring)));
  }
}

function manualCountryCenter(code) {
  code = normalizeCountryCode(code);
  return regionFocus[code] || manualCountryCenters[code] || null;
}

function representativePointForCountry(code) {
  if (!appState.geojson) return null;
  code = normalizeCountryCode(code);
  if (appState.countryFocusPoints.has(code)) return appState.countryFocusPoints.get(code);

  const preferred = manualCountryCenter(code);
  if (preferred && pointInsideCountryCode(preferred[0], preferred[1], code)) {
    appState.countryFocusPoints.set(code, preferred);
    return preferred;
  }

  const features = appState.geojson.features.filter((feature) => getFeatureCountryCode(feature) === code);
  for (const feature of features) {
    const point = representativePointForFeature(feature, preferred);
    if (point) {
      appState.countryFocusPoints.set(code, point);
      return point;
    }
  }
  appState.countryFocusPoints.set(code, null);
  return null;
}

function representativePointForFeature(feature, preferred) {
  const bbox = feature?.bbox;
  if (!bbox) return null;
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const center = preferred || [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
  if (pointInFeature(center[0], center[1], feature)) return center;

  let bestPoint = null;
  let bestDistance = Infinity;
  const lonSpan = Math.max(0.01, maxLon - minLon);
  const latSpan = Math.max(0.01, maxLat - minLat);

  for (let y = 1; y <= 9; y += 1) {
    const lat = minLat + (latSpan * y) / 10;
    for (let x = 1; x <= 9; x += 1) {
      const lon = minLon + (lonSpan * x) / 10;
      if (!pointInFeature(lon, lat, feature)) continue;
      const distance = countryDistance(lon, lat, center[0], center[1]);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestPoint = [lon, lat];
      }
    }
  }

  return bestPoint;
}

function pointInsideCountryCode(lon, lat, code) {
  if (!appState.geojson) return false;
  code = normalizeCountryCode(code);
  return appState.geojson.features.some((feature) => getFeatureCountryCode(feature) === code && pointInFeature(lon, lat, feature));
}

function drawLoadingTexture(ctx, canvas, texture) {
  ctx.fillStyle = '#010407';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const glow = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.5, 0, canvas.width * 0.5, canvas.height * 0.5, canvas.width * 0.5);
  glow.addColorStop(0, 'rgba(255, 8, 0, 0.2)');
  glow.addColorStop(1, 'rgba(255, 8, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let y = canvas.height / 8; y < canvas.height; y += canvas.height / 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  for (let x = canvas.width / 12; x < canvas.width; x += canvas.width / 12) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  texture.needsUpdate = true;
}

function ctxFromCanvas(canvas) {
  return canvas.getContext('2d');
}

function countryDisplayColor(index, selected) {
  if (selected) return '#f4fff0';
  const base = palette[index % palette.length];
  return base;
}

function getFeatureCountryCode(feature) {
  const properties = feature?.properties || {};
  const name = properties.name || properties.ADMIN || properties.NAME || '';
  if (name && nameToCodeFallback[name]) {
    return nameToCodeFallback[name];
  }
  return normalizeCountryCode(
    properties['ISO3166-1-Alpha-2'] ||
      properties.ISO_A2 ||
      properties.iso_a2 ||
      properties.ADM0_A3 ||
      properties['Alpha-2'] ||
      properties.ISO2 ||
      ''
  );
}

function featureCountryName(feature) {
  const properties = feature?.properties || {};
  return (
    properties.ADMIN ||
    properties.name ||
    properties.NAME ||
    properties.NAME_EN ||
    properties.name_en ||
    ''
  );
}

function normalizeCountryCode(code = '') {
  const normalized = String(code).trim().toUpperCase();
  if (!normalized || normalized === '-99') return '';
  return countryCodeAliases[normalized] || normalized;
}

function isAvailableCountryCode(code) {
  const normalized = normalizeCountryCode(code);
  return Boolean(normalized && appState.availableCountryCodes.has(normalized));
}

function debugCountrySelection(rawCode, normalizedCode, source) {
  if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) return;
  console.debug('[WatchNations country selection]', {
    rawCode: rawCode || '',
    normalizedCode: normalizedCode || '',
    source
  });
}

function indexToPickColor(index) {
  const r = index & 255;
  const g = (index >> 8) & 255;
  const b = (index >> 16) & 255;
  return rgbToHex(r, g, b);
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function focusCountry(code) {
  if (!THREE || !appState.globe) return;
  appState.userControlledGlobe = true;
  code = normalizeCountryCode(code);
  const [lon, lat] = representativePointForCountry(code) || manualCountryCenter(code) || appState.countryCenters.get(code) || [0, 20];
  setGlobeRotationToLonLat(lon, lat);
  applyGlobeZoom();
  drawWorldTexture(code);
}

function setGlobeRotationToLonLat(lon, lat) {
  appState.globe.rotation.y = -THREE.MathUtils.degToRad(lon) - Math.PI / 2;
  appState.globe.rotation.x = THREE.MathUtils.degToRad(lat);
  appState.globe.globeGroup.rotation.y = appState.globe.rotation.y;
  appState.globe.globeGroup.rotation.x = appState.globe.rotation.x;
}

function setGlobeZoom(value) {
  appState.globeZoom = Math.max(0.72, Math.min(1.9, value));
  applyGlobeZoom();
  setGlobeStatus(
    appState.hoveredCountry?.name || appState.selectedCountry?.name || 'Globe zoom',
    `Zoom ${Math.round(appState.globeZoom * 100)}%`
  );
}

function applyGlobeZoom() {
  if (!appState.globe?.camera) return;
  const baseDistance = appState.performanceMode ? 6.8 : 6.15;
  appState.globe.camera.position.z = baseDistance / appState.globeZoom;
  appState.globe.camera.updateProjectionMatrix();
}

function makeStars() {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const total = appState.performanceMode ? 260 : 520;

  for (let i = 0; i < total; i += 1) {
    const radius = 9 + Math.random() * 12;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions.push(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.sin(phi) * Math.sin(theta),
      radius * Math.cos(phi)
    );
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: 0x8be8ff, size: 0.024, transparent: true, opacity: 0.78 })
  );
}

function flag(code) {
  code = normalizeCountryCode(code);
  if (!code || code.length !== 2) return 'WN';
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt()));
}

function flagImageUrl(code, width = 160) {
  code = normalizeCountryCode(code).toLowerCase();
  if (!/^[a-z]{2}$/.test(code)) return '';
  const safeWidth = [40, 80, 120, 160, 320].includes(Number(width)) ? Number(width) : 160;
  return `https://flagcdn.com/w${safeWidth}/${code}.png`;
}

function flagSrcSet(code) {
  code = normalizeCountryCode(code).toLowerCase();
  if (!/^[a-z]{2}$/.test(code)) return '';
  return [
    `https://flagcdn.com/w80/${code}.png 1x`,
    `https://flagcdn.com/w160/${code}.png 2x`,
    `https://flagcdn.com/w320/${code}.png 3x`
  ].join(', ');
}

function createLogoFallback() {
  const fallback = document.createElement('span');
  fallback.className = 'logo-fallback';
  fallback.textContent = flag(appState.selectedCountry?.code);
  return fallback;
}

function safeParseJSON(value, fallback) {
  try {
    return JSON.parse(value || '');
  } catch (error) {
    return fallback;
  }
}

function safeSessionSet(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Large IPTV and radio indexes can exceed browser storage; the live in-memory state still works.
  }
}

function sanitizeUrl(value = '') {
  try {
    const url = new URL(String(value).trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch (error) {
    return '';
  }
}

function normalize(value = '') {
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
