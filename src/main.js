let THREE;
let videojs;
let DateTime;

const API_BASE = 'https://iptv-org.github.io/api';
const IPTV_BASE = 'https://iptv-org.github.io/iptv';
const WORLD_GEOJSON = '/data/countries-lite.json';
const LOCAL_COUNTRIES = '/data/iptv-countries.min.json';
const NEWSPAPERS_DATA = '/data/newspapers.json';

const palette = ['#1eb6d9', '#e7c51e', '#3daf58', '#d84d77', '#f2643f', '#9b58b4', '#42c7bb'];
const channelCache = new Map();
let iptvApiIndexPromise;
const LOAD_EXTERNAL_LOGOS = false;
const CHANNEL_CACHE_VERSION = 'playable-alternates-v2';
const INITIAL_CHANNEL_RENDER_LIMIT = window.matchMedia('(max-width: 760px)').matches ? 60 : 140;
const CHANNEL_RENDER_INCREMENT = window.matchMedia('(max-width: 760px)').matches ? 90 : 220;
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

const supportedLanguages = [
  ['en', 'English'],
  ['es', 'Español'],
  ['fr', 'Français'],
  ['ar', 'العربية'],
  ['it', 'Italiano'],
  ['pt', 'Português'],
  ['bn', 'বাংলা'],
  ['tr', 'Türkçe'],
  ['ja', '日本語'],
  ['de', 'Deutsch'],
  ['nl', 'Nederlands'],
  ['sv', 'Svenska'],
  ['no', 'Norsk'],
  ['zh', '中文']
];

const translations = {
  en: {
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    focusGlobe: 'Focus globe',
    randomCountry: 'Random country',
    search: 'Search',
    tv: 'TV',
    radio: 'Radio',
    newspapers: 'E-Newspapers',
    globeZoomControls: 'Globe zoom controls',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    resetZoom: 'Reset zoom',
    clickCountry: 'Click a country',
    ready: 'Ready',
    readyDetail: 'Move the globe until a country is inside the red circle',
    fastMode: 'Fast mode',
    chooseFromGlobe: 'Choose from the globe',
    heroHint: 'Move the globe, place a country in the red circle, then click.',
    chooseCountry: 'Choose a country',
    selectCountry: 'Select a Country',
    changeCountry: 'Change country',
    searchCountry: 'Search country',
    loadingCountries: 'Loading countries...',
    selectChannel: 'Select a channel',
    selectRadio: 'Select a radio station',
    pip: 'Picture in picture',
    close: 'Close',
    freeChannels: 'Free Channels',
    freeRadio: 'Free Radio',
    smartReady: 'Smart filter is ready',
    searchChannels: 'Search channels or category',
    searchRadio: 'Search stations, language, or tag',
    explore: 'Explore',
    favorites: 'Favorites',
    favoriteChannels: 'Favorite Channels',
    favoriteRadio: 'Favorite Radio',
    about: 'About',
    faq: 'FAQ',
    privacy: 'Privacy Policy',
    feedback: 'Feedback',
    allChannels: 'All Channels',
    loadingGlobe: 'Loading globe',
    globeError: 'Globe could not load',
    channelsWillAppear: 'Channels will appear here after you choose a country from the globe.',
    radioWillAppear: 'Radio stations will appear here after you choose a country from the globe.',
    clickCountryChannels: 'Click a country on the globe to load channels',
    clickCountryRadio: 'Click a country on the globe to load radio stations',
    chooseCountryRadioFirst: 'Choose a country first, then filter radio stations',
    chooseCountryRadioFirstBody: 'Choose a country first to browse radio stations by category.',
    noFavorites: 'No favorites yet. Press the star button on any channel to save it here.',
    noMatch: 'No {label} match the current filter.',
    removeFavorite: 'Remove favorite',
    addFavorite: 'Add favorite',
    play: 'Play',
    showMore: 'Show {count} more of {remaining}',
    noChannelsAvailable: 'No channels available for the current filter.',
    noRadioAvailable: 'No radio stations available for the current filter.',
    loadingChannelsAll: 'Loading channels from all countries',
    loadingCategoryAll: 'Loading {label} channels from all countries',
    couldNotLoadChannels: 'Could not load channels right now',
    channelsCouldNotLoad: 'Channels could not be loaded right now.',
    couldNotLoadGlobal: 'Could not load global channels right now',
    globalCouldNotLoad: 'Global channels could not be loaded right now.',
    loadingMediaForCountry: 'Loading {label} for this country',
    selectedFromGlobe: 'Selected from the globe',
    mediaAvailable: '{count} {label} available',
    noMediaFound: 'No {label} found for this country',
    noMediaFoundDetail: 'No playable free {label} were found for this country right now.',
    tvActive: 'TV mode is active.',
    radioActive: 'Radio mode is active.',
    newspapersReady: 'E-Newspapers button is ready. Send the data to connect it.',
    countryUnavailable: 'This country is not available yet.',
    countryLoading: 'Country data is still loading.',
    clickDirectlyCountry: 'Click directly on a country.',
    moveCountryCircle: 'Move a country into the circle',
    moveGlobe: 'Move the globe',
    placeCountryCircle: 'Place a country inside the red circle, then click',
    clickGlobeLoadChannels: 'Click the globe to load channels',
    clickToLoadChannels: 'Click to load channels',
    zoom: 'Zoom {percent}%',
    addedFavorite: 'Added to Favorites.',
    removedFavorite: 'Removed from Favorites.',
    favoritesFull: 'Favorites storage is full.',
    unsafeChannel: 'This channel link is not safe to open.',
    unsafeStream: 'This stream URL is not safe to play.',
    loadingLiveStream: 'Loading live stream...',
    pressPlayStream: 'Press play to start this stream.',
    tryingAlternateStream: 'Trying another stream for this channel...',
    playerError: 'Video player could not load. Opening stream in a new tab.',
    loadingRadio: 'Loading {title}...',
    pressPlayRadio: 'Press play to start this radio station.',
    pipTvOnly: 'Picture in picture is available for TV streams.',
    pipUnsupported: 'Your browser does not support picture in picture.',
    startVideoFirst: 'Start the video first, then try PiP.',
    globalTvOnly: 'Global TV is available in TV mode.',
    loadedStreams: 'Loaded {count} playable streams',
    streamsLoaded: '{count} playable streams loaded',
    globalIndexError: 'Could not load the global channel index',
    globalIndexErrorBody: 'The global channel index could not be loaded right now.',
    developerArea: 'Developer Area',
    developerTitle: 'WatchNations Developer',
    accessCode: 'Access code',
    enterCode: 'Enter code',
    openDeveloper: 'Open developer page',
    realVisitors: 'Real visitors',
    totalVisits: 'Total visits',
    lastVisit: 'Last visit: {date}',
    currentCode: 'Current code',
    newCode: 'New code',
    changeCode: 'Change code',
    checkingCode: 'Checking code...',
    developerOpen: 'Developer page is open.',
    wrongCode: 'Wrong code.',
    savingCode: 'Saving new code...',
    codeChanged: 'Code changed successfully.',
    refreshStatsError: 'Could not refresh stats.',
    requestFailed: 'Request failed.',
    category: {
      all: 'All Channels', 'top-news': 'Top News', news: 'News', music: 'Music', sports: 'Sports',
      auto: 'Auto', animation: 'Animation', business: 'Business', classic: 'Classic', comedy: 'Comedy',
      cooking: 'Cooking', culture: 'Culture', documentary: 'Documentary', education: 'Education',
      entertainment: 'Entertainment', family: 'Family', general: 'General', kids: 'Kids',
      legislative: 'Legislative', lifestyle: 'Lifestyle', movies: 'Movies', outdoor: 'Outdoor',
      relax: 'Relax', religious: 'Religious', series: 'Series', science: 'Science', shop: 'Shop',
      travel: 'Travel', weather: 'Weather', favorites: 'Favorites'
    }
  },
  es: {
    openMenu: 'Abrir menú', closeMenu: 'Cerrar menú', focusGlobe: 'Centrar globo', randomCountry: 'País aleatorio',
    search: 'Buscar', tv: 'TV', radio: 'Radio', newspapers: 'Periódicos digitales', globeZoomControls: 'Controles de zoom del globo',
    zoomIn: 'Acercar', zoomOut: 'Alejar', resetZoom: 'Restablecer zoom', clickCountry: 'Haz clic en un país',
    ready: 'Listo', readyDetail: 'Mueve el globo hasta que un país quede dentro del círculo rojo', fastMode: 'Modo rápido',
    chooseFromGlobe: 'Elige desde el globo', heroHint: 'Mueve el globo, coloca un país en el círculo rojo y haz clic.',
    chooseCountry: 'Elegir país', selectCountry: 'Selecciona un país', changeCountry: 'Cambiar país',
    searchCountry: 'Buscar país', loadingCountries: 'Cargando países...',
    selectChannel: 'Selecciona un canal', selectRadio: 'Selecciona una emisora', pip: 'Imagen en imagen',
    close: 'Cerrar', freeChannels: 'Canales gratis', freeRadio: 'Radio gratis', smartReady: 'Filtro inteligente listo',
    searchChannels: 'Buscar canales o categoría', searchRadio: 'Buscar emisoras, idioma o etiqueta', explore: 'Explorar',
    favorites: 'Favoritos', favoriteChannels: 'Canales favoritos', favoriteRadio: 'Radios favoritas',
    about: 'Acerca de', faq: 'FAQ', privacy: 'Política de privacidad', feedback: 'Comentarios',
    allChannels: 'Todos los canales', loadingGlobe: 'Cargando globo', globeError: 'No se pudo cargar el globo',
    channelsWillAppear: 'Los canales aparecerán aquí después de elegir un país en el globo.',
    radioWillAppear: 'Las emisoras aparecerán aquí después de elegir un país en el globo.',
    clickCountryChannels: 'Haz clic en un país del globo para cargar canales',
    clickCountryRadio: 'Haz clic en un país del globo para cargar radios',
    chooseCountryRadioFirst: 'Elige primero un país y luego filtra las radios',
    chooseCountryRadioFirstBody: 'Elige primero un país para ver radios por categoría.',
    noFavorites: 'Aún no hay favoritos. Pulsa la estrella de cualquier canal para guardarlo aquí.',
    noMatch: 'No hay {label} que coincidan con el filtro actual.', removeFavorite: 'Quitar favorito',
    addFavorite: 'Añadir favorito', play: 'Reproducir', showMore: 'Mostrar {count} más de {remaining}',
    noChannelsAvailable: 'No hay canales disponibles para el filtro actual.',
    noRadioAvailable: 'No hay emisoras disponibles para el filtro actual.',
    loadingChannelsAll: 'Cargando canales de todos los países',
    loadingCategoryAll: 'Cargando canales de {label} de todos los países',
    couldNotLoadChannels: 'No se pudieron cargar los canales ahora',
    channelsCouldNotLoad: 'Los canales no se pudieron cargar ahora.',
    couldNotLoadGlobal: 'No se pudieron cargar los canales globales ahora',
    globalCouldNotLoad: 'Los canales globales no se pudieron cargar ahora.',
    loadingMediaForCountry: 'Cargando {label} para este país', selectedFromGlobe: 'Seleccionado desde el globo',
    mediaAvailable: '{count} {label} disponibles', noMediaFound: 'No se encontraron {label} para este país',
    noMediaFoundDetail: 'No se encontraron {label} gratis reproducibles para este país ahora.',
    tvActive: 'Modo TV activo.', radioActive: 'Modo radio activo.',
    newspapersReady: 'El botón de periódicos digitales está listo. Envía los datos para conectarlo.',
    countryUnavailable: 'Este país aún no está disponible.', countryLoading: 'Los datos del país aún se están cargando.',
    clickDirectlyCountry: 'Haz clic directamente en un país.', moveCountryCircle: 'Mueve un país dentro del círculo',
    moveGlobe: 'Mueve el globo', placeCountryCircle: 'Coloca un país dentro del círculo rojo y haz clic',
    clickGlobeLoadChannels: 'Haz clic en el globo para cargar canales', clickToLoadChannels: 'Haz clic para cargar canales',
    zoom: 'Zoom {percent}%', addedFavorite: 'Añadido a Favoritos.', removedFavorite: 'Eliminado de Favoritos.',
    favoritesFull: 'El almacenamiento de favoritos está lleno.', unsafeChannel: 'Este enlace de canal no es seguro.',
    unsafeStream: 'Esta URL de stream no es segura.', loadingLiveStream: 'Cargando transmisión en vivo...',
    pressPlayStream: 'Pulsa reproducir para iniciar esta transmisión.', tryingAlternateStream: 'Probando otra transmisión para este canal...', playerError: 'No se pudo cargar el reproductor. Abriendo en una nueva pestaña.',
    loadingRadio: 'Cargando {title}...', pressPlayRadio: 'Pulsa reproducir para iniciar esta emisora.',
    pipTvOnly: 'Imagen en imagen está disponible para streams de TV.', pipUnsupported: 'Tu navegador no soporta imagen en imagen.',
    startVideoFirst: 'Inicia el video primero y luego prueba PiP.', globalTvOnly: 'La TV global está disponible en modo TV.',
    loadedStreams: '{count} streams reproducibles cargados', streamsLoaded: '{count} streams reproducibles cargados',
    globalIndexError: 'No se pudo cargar el índice global de canales',
    globalIndexErrorBody: 'El índice global de canales no se pudo cargar ahora.',
    developerArea: 'Área de desarrollador', developerTitle: 'Desarrollador de WatchNations',
    accessCode: 'Código de acceso', enterCode: 'Introduce el código', openDeveloper: 'Abrir página de desarrollador',
    realVisitors: 'Visitantes reales', totalVisits: 'Visitas totales', lastVisit: 'Última visita: {date}',
    currentCode: 'Código actual', newCode: 'Nuevo código', changeCode: 'Cambiar código',
    checkingCode: 'Comprobando código...', developerOpen: 'La página de desarrollador está abierta.',
    wrongCode: 'Código incorrecto.', savingCode: 'Guardando nuevo código...', codeChanged: 'Código cambiado correctamente.',
    refreshStatsError: 'No se pudieron actualizar las estadísticas.', requestFailed: 'Solicitud fallida.',
    category: {
      all: 'Todos los canales', 'top-news': 'Noticias principales', news: 'Noticias', music: 'Música', sports: 'Deportes',
      auto: 'Motor', animation: 'Animación', business: 'Negocios', classic: 'Clásicos', comedy: 'Comedia',
      cooking: 'Cocina', culture: 'Cultura', documentary: 'Documentales', education: 'Educación',
      entertainment: 'Entretenimiento', family: 'Familia', general: 'General', kids: 'Niños',
      legislative: 'Legislativo', lifestyle: 'Estilo de vida', movies: 'Películas', outdoor: 'Aire libre',
      relax: 'Relax', religious: 'Religión', series: 'Series', science: 'Ciencia', shop: 'Compras',
      travel: 'Viajes', weather: 'Tiempo', favorites: 'Favoritos'
    }
  },
  fr: {
    openMenu: 'Ouvrir le menu', closeMenu: 'Fermer le menu', focusGlobe: 'Centrer le globe', randomCountry: 'Pays aléatoire',
    search: 'Rechercher', tv: 'TV', radio: 'Radio', newspapers: 'Journaux en ligne', globeZoomControls: 'Contrôles du zoom du globe',
    zoomIn: 'Zoom avant', zoomOut: 'Zoom arrière', resetZoom: 'Réinitialiser le zoom', clickCountry: 'Cliquez sur un pays',
    ready: 'Prêt', readyDetail: 'Déplacez le globe jusqu’à placer un pays dans le cercle rouge', fastMode: 'Mode rapide',
    chooseFromGlobe: 'Choisir sur le globe', heroHint: 'Déplacez le globe, placez un pays dans le cercle rouge, puis cliquez.',
    chooseCountry: 'Choisir un pays', selectCountry: 'Sélectionner un pays', changeCountry: 'Changer de pays',
    searchCountry: 'Rechercher un pays', loadingCountries: 'Chargement des pays...',
    selectChannel: 'Sélectionner une chaîne', selectRadio: 'Sélectionner une radio', pip: 'Image dans l’image',
    close: 'Fermer', freeChannels: 'Chaînes gratuites', freeRadio: 'Radios gratuites', smartReady: 'Filtre intelligent prêt',
    searchChannels: 'Rechercher chaînes ou catégorie', searchRadio: 'Rechercher radios, langue ou tag', explore: 'Explorer',
    favorites: 'Favoris', favoriteChannels: 'Chaînes favorites', favoriteRadio: 'Radios favorites',
    about: 'À propos', faq: 'FAQ', privacy: 'Politique de confidentialité', feedback: 'Commentaires',
    allChannels: 'Toutes les chaînes', loadingGlobe: 'Chargement du globe', globeError: 'Impossible de charger le globe',
    channelsWillAppear: 'Les chaînes apparaîtront ici après avoir choisi un pays sur le globe.',
    radioWillAppear: 'Les radios apparaîtront ici après avoir choisi un pays sur le globe.',
    clickCountryChannels: 'Cliquez sur un pays du globe pour charger les chaînes',
    clickCountryRadio: 'Cliquez sur un pays du globe pour charger les radios',
    chooseCountryRadioFirst: 'Choisissez d’abord un pays, puis filtrez les radios',
    chooseCountryRadioFirstBody: 'Choisissez d’abord un pays pour parcourir les radios par catégorie.',
    noFavorites: 'Aucun favori pour le moment. Appuyez sur l’étoile d’une chaîne pour l’enregistrer ici.',
    noMatch: 'Aucun {label} ne correspond au filtre actuel.', removeFavorite: 'Retirer des favoris',
    addFavorite: 'Ajouter aux favoris', play: 'Lire', showMore: 'Afficher {count} de plus sur {remaining}',
    noChannelsAvailable: 'Aucune chaîne disponible pour le filtre actuel.',
    noRadioAvailable: 'Aucune radio disponible pour le filtre actuel.',
    loadingChannelsAll: 'Chargement des chaînes de tous les pays',
    loadingCategoryAll: 'Chargement des chaînes {label} de tous les pays',
    couldNotLoadChannels: 'Impossible de charger les chaînes maintenant',
    channelsCouldNotLoad: 'Les chaînes n’ont pas pu être chargées maintenant.',
    couldNotLoadGlobal: 'Impossible de charger les chaînes mondiales maintenant',
    globalCouldNotLoad: 'Les chaînes mondiales n’ont pas pu être chargées maintenant.',
    loadingMediaForCountry: 'Chargement des {label} pour ce pays', selectedFromGlobe: 'Sélectionné depuis le globe',
    mediaAvailable: '{count} {label} disponibles', noMediaFound: 'Aucun {label} trouvé pour ce pays',
    noMediaFoundDetail: 'Aucun {label} gratuit et lisible n’a été trouvé pour ce pays maintenant.',
    tvActive: 'Mode TV actif.', radioActive: 'Mode radio actif.',
    newspapersReady: 'Le bouton Journaux en ligne est prêt. Envoyez les données pour le connecter.',
    countryUnavailable: 'Ce pays n’est pas encore disponible.', countryLoading: 'Les données du pays sont encore en chargement.',
    clickDirectlyCountry: 'Cliquez directement sur un pays.', moveCountryCircle: 'Placez un pays dans le cercle',
    moveGlobe: 'Déplacez le globe', placeCountryCircle: 'Placez un pays dans le cercle rouge, puis cliquez',
    clickGlobeLoadChannels: 'Cliquez sur le globe pour charger les chaînes', clickToLoadChannels: 'Cliquez pour charger les chaînes',
    zoom: 'Zoom {percent}%', addedFavorite: 'Ajouté aux favoris.', removedFavorite: 'Retiré des favoris.',
    favoritesFull: 'Le stockage des favoris est plein.', unsafeChannel: 'Ce lien de chaîne n’est pas sûr.',
    unsafeStream: 'Cette URL de stream n’est pas sûre.', loadingLiveStream: 'Chargement du direct...',
    pressPlayStream: 'Appuyez sur lecture pour démarrer ce stream.', tryingAlternateStream: 'Essai d’un autre flux pour cette chaîne...', playerError: 'Le lecteur vidéo n’a pas pu charger. Ouverture dans un nouvel onglet.',
    loadingRadio: 'Chargement de {title}...', pressPlayRadio: 'Appuyez sur lecture pour démarrer cette radio.',
    pipTvOnly: 'L’image dans l’image est disponible pour les streams TV.', pipUnsupported: 'Votre navigateur ne prend pas en charge l’image dans l’image.',
    startVideoFirst: 'Lancez d’abord la vidéo, puis essayez PiP.', globalTvOnly: 'La TV mondiale est disponible en mode TV.',
    loadedStreams: '{count} streams lisibles chargés', streamsLoaded: '{count} streams lisibles chargés',
    globalIndexError: 'Impossible de charger l’index mondial des chaînes',
    globalIndexErrorBody: 'L’index mondial des chaînes n’a pas pu être chargé maintenant.',
    developerArea: 'Espace développeur', developerTitle: 'Développeur WatchNations',
    accessCode: 'Code d’accès', enterCode: 'Saisir le code', openDeveloper: 'Ouvrir la page développeur',
    realVisitors: 'Visiteurs réels', totalVisits: 'Visites totales', lastVisit: 'Dernière visite : {date}',
    currentCode: 'Code actuel', newCode: 'Nouveau code', changeCode: 'Changer le code',
    checkingCode: 'Vérification du code...', developerOpen: 'La page développeur est ouverte.',
    wrongCode: 'Code incorrect.', savingCode: 'Enregistrement du nouveau code...', codeChanged: 'Code modifié avec succès.',
    refreshStatsError: 'Impossible d’actualiser les statistiques.', requestFailed: 'Requête échouée.',
    category: {
      all: 'Toutes les chaînes', 'top-news': 'À la une', news: 'Actualités', music: 'Musique', sports: 'Sports',
      auto: 'Auto', animation: 'Animation', business: 'Business', classic: 'Classiques', comedy: 'Comédie',
      cooking: 'Cuisine', culture: 'Culture', documentary: 'Documentaires', education: 'Éducation',
      entertainment: 'Divertissement', family: 'Famille', general: 'Général', kids: 'Enfants',
      legislative: 'Législatif', lifestyle: 'Lifestyle', movies: 'Films', outdoor: 'Plein air',
      relax: 'Relax', religious: 'Religion', series: 'Séries', science: 'Science', shop: 'Shopping',
      travel: 'Voyage', weather: 'Météo', favorites: 'Favoris'
    }
  },
  ar: {
    openMenu: 'فتح القائمة', closeMenu: 'إغلاق القائمة', focusGlobe: 'تركيز الكرة', randomCountry: 'دولة عشوائية',
    search: 'بحث', tv: 'TV', radio: 'راديو', newspapers: 'جرائد إلكترونية', globeZoomControls: 'أدوات تكبير الكرة',
    zoomIn: 'تكبير', zoomOut: 'تصغير', resetZoom: 'إعادة الضبط', clickCountry: 'اضغط على دولة',
    ready: 'جاهز', readyDetail: 'حرّك الكرة حتى تدخل دولة داخل الدائرة الحمراء', fastMode: 'وضع سريع',
    chooseFromGlobe: 'اختر من الكرة', heroHint: 'حرّك الكرة، ضع دولة داخل الدائرة الحمراء، ثم اضغط.',
    chooseCountry: 'اختر دولة', selectCountry: 'اختر دولة', changeCountry: 'تغيير الدولة',
    searchCountry: 'ابحث عن دولة', loadingCountries: 'جاري تحميل الدول...',
    selectChannel: 'اختر قناة', selectRadio: 'اختر محطة راديو', pip: 'صورة داخل صورة',
    close: 'إغلاق', freeChannels: 'قنوات مجانية', freeRadio: 'راديو مجاني', smartReady: 'الفلتر الذكي جاهز',
    searchChannels: 'ابحث عن قنوات أو تصنيف', searchRadio: 'ابحث عن محطة أو لغة أو وسم', explore: 'استكشاف',
    favorites: 'المفضلة', favoriteChannels: 'القنوات المفضلة', favoriteRadio: 'الراديو المفضل',
    about: 'حول الموقع', faq: 'الأسئلة', privacy: 'سياسة الخصوصية', feedback: 'الملاحظات',
    allChannels: 'كل القنوات', loadingGlobe: 'جاري تحميل الكرة', globeError: 'تعذر تحميل الكرة',
    channelsWillAppear: 'ستظهر القنوات هنا بعد اختيار دولة من الكرة.',
    radioWillAppear: 'ستظهر محطات الراديو هنا بعد اختيار دولة من الكرة.',
    clickCountryChannels: 'اضغط على دولة في الكرة لتحميل القنوات',
    clickCountryRadio: 'اضغط على دولة في الكرة لتحميل الراديو',
    chooseCountryRadioFirst: 'اختر دولة أولاً ثم فلتر محطات الراديو',
    chooseCountryRadioFirstBody: 'اختر دولة أولاً لتصفح محطات الراديو حسب التصنيف.',
    noFavorites: 'لا توجد مفضلة بعد. اضغط النجمة على أي قناة لحفظها هنا.',
    noMatch: 'لا توجد {label} تطابق الفلتر الحالي.', removeFavorite: 'إزالة من المفضلة',
    addFavorite: 'إضافة إلى المفضلة', play: 'تشغيل', showMore: 'عرض {count} إضافية من {remaining}',
    noChannelsAvailable: 'لا توجد قنوات متاحة للفلتر الحالي.',
    noRadioAvailable: 'لا توجد محطات راديو متاحة للفلتر الحالي.',
    loadingChannelsAll: 'جاري تحميل القنوات من كل الدول',
    loadingCategoryAll: 'جاري تحميل قنوات {label} من كل الدول',
    couldNotLoadChannels: 'تعذر تحميل القنوات الآن',
    channelsCouldNotLoad: 'تعذر تحميل القنوات الآن.',
    couldNotLoadGlobal: 'تعذر تحميل القنوات العالمية الآن',
    globalCouldNotLoad: 'تعذر تحميل القنوات العالمية الآن.',
    loadingMediaForCountry: 'جاري تحميل {label} لهذه الدولة', selectedFromGlobe: 'تم الاختيار من الكرة',
    mediaAvailable: '{count} {label} متاحة', noMediaFound: 'لم يتم العثور على {label} لهذه الدولة',
    noMediaFoundDetail: 'لم يتم العثور على {label} مجانية قابلة للتشغيل لهذه الدولة حالياً.',
    tvActive: 'تم تفعيل وضع TV.', radioActive: 'تم تفعيل وضع الراديو.',
    newspapersReady: 'زر الجرائد الإلكترونية جاهز. أرسل البيانات لربطه.',
    countryUnavailable: 'هذه الدولة غير متاحة بعد.', countryLoading: 'بيانات الدولة ما زالت تُحمّل.',
    clickDirectlyCountry: 'اضغط مباشرة على دولة.', moveCountryCircle: 'حرّك دولة إلى داخل الدائرة',
    moveGlobe: 'حرّك الكرة', placeCountryCircle: 'ضع دولة داخل الدائرة الحمراء ثم اضغط',
    clickGlobeLoadChannels: 'اضغط على الكرة لتحميل القنوات', clickToLoadChannels: 'اضغط لتحميل القنوات',
    zoom: 'تكبير {percent}%', addedFavorite: 'تمت الإضافة إلى المفضلة.', removedFavorite: 'تمت الإزالة من المفضلة.',
    favoritesFull: 'مساحة المفضلة ممتلئة.', unsafeChannel: 'رابط هذه القناة غير آمن.',
    unsafeStream: 'رابط البث غير آمن.', loadingLiveStream: 'جاري تحميل البث المباشر...',
    pressPlayStream: 'اضغط تشغيل لبدء هذا البث.', tryingAlternateStream: 'نجرب بثًا آخر لهذه القناة...', playerError: 'تعذر تحميل المشغل. سيتم فتح البث في تبويب جديد.',
    loadingRadio: 'جاري تحميل {title}...', pressPlayRadio: 'اضغط تشغيل لبدء هذه المحطة.',
    pipTvOnly: 'صورة داخل صورة متاحة لبث التلفاز.', pipUnsupported: 'متصفحك لا يدعم صورة داخل صورة.',
    startVideoFirst: 'شغّل الفيديو أولاً ثم جرّب PiP.', globalTvOnly: 'القنوات العالمية متاحة في وضع TV.',
    loadedStreams: 'تم تحميل {count} بث قابل للتشغيل', streamsLoaded: 'تم تحميل {count} بث قابل للتشغيل',
    globalIndexError: 'تعذر تحميل فهرس القنوات العالمي',
    globalIndexErrorBody: 'تعذر تحميل فهرس القنوات العالمي الآن.',
    developerArea: 'صفحة المطوّر', developerTitle: 'مطوّر WatchNations',
    accessCode: 'كود الدخول', enterCode: 'أدخل الكود', openDeveloper: 'فتح صفحة المطوّر',
    realVisitors: 'الزوار الحقيقيون', totalVisits: 'إجمالي الزيارات', lastVisit: 'آخر زيارة: {date}',
    currentCode: 'الكود الحالي', newCode: 'الكود الجديد', changeCode: 'تغيير الكود',
    checkingCode: 'جاري التحقق من الكود...', developerOpen: 'تم فتح صفحة المطوّر.',
    wrongCode: 'الكود غير صحيح.', savingCode: 'جاري حفظ الكود الجديد...', codeChanged: 'تم تغيير الكود بنجاح.',
    refreshStatsError: 'تعذر تحديث الإحصائيات.', requestFailed: 'فشل الطلب.',
    category: {
      all: 'كل القنوات', 'top-news': 'أهم الأخبار', news: 'الأخبار', music: 'الموسيقى', sports: 'الرياضة',
      auto: 'السيارات', animation: 'الرسوم المتحركة', business: 'الأعمال', classic: 'كلاسيكي', comedy: 'كوميديا',
      cooking: 'الطبخ', culture: 'الثقافة', documentary: 'وثائقي', education: 'تعليم',
      entertainment: 'ترفيه', family: 'العائلة', general: 'عام', kids: 'الأطفال',
      legislative: 'تشريعي', lifestyle: 'نمط الحياة', movies: 'الأفلام', outdoor: 'الخارج',
      relax: 'استرخاء', religious: 'ديني', series: 'مسلسلات', science: 'علوم', shop: 'تسوق',
      travel: 'سفر', weather: 'الطقس', favorites: 'المفضلة'
    }
  },
  it: {
    openMenu: 'Apri menu', closeMenu: 'Chiudi menu', focusGlobe: 'Centra globo', randomCountry: 'Paese casuale',
    search: 'Cerca', tv: 'TV', radio: 'Radio', newspapers: 'Giornali online', globeZoomControls: 'Controlli zoom del globo',
    zoomIn: 'Avvicina', zoomOut: 'Allontana', resetZoom: 'Reimposta zoom', clickCountry: 'Clicca un paese',
    ready: 'Pronto', readyDetail: 'Muovi il globo finché un paese entra nel cerchio rosso', fastMode: 'Modalità rapida',
    chooseFromGlobe: 'Scegli dal globo', heroHint: 'Muovi il globo, metti un paese nel cerchio rosso e clicca.',
    chooseCountry: 'Scegli un paese', selectCountry: 'Seleziona un paese', changeCountry: 'Cambia paese',
    searchCountry: 'Cerca paese', loadingCountries: 'Caricamento paesi...',
    selectChannel: 'Seleziona un canale', selectRadio: 'Seleziona una radio', pip: 'Picture in picture',
    close: 'Chiudi', freeChannels: 'Canali gratis', freeRadio: 'Radio gratis', smartReady: 'Filtro intelligente pronto',
    searchChannels: 'Cerca canali o categoria', searchRadio: 'Cerca radio, lingua o tag', explore: 'Esplora',
    favorites: 'Preferiti', favoriteChannels: 'Canali preferiti', favoriteRadio: 'Radio preferite',
    about: 'Informazioni', faq: 'FAQ', privacy: 'Privacy Policy', feedback: 'Feedback',
    allChannels: 'Tutti i canali', loadingGlobe: 'Caricamento globo', globeError: 'Impossibile caricare il globo',
    channelsWillAppear: 'I canali appariranno qui dopo aver scelto un paese dal globo.',
    radioWillAppear: 'Le radio appariranno qui dopo aver scelto un paese dal globo.',
    clickCountryChannels: 'Clicca un paese sul globo per caricare i canali',
    clickCountryRadio: 'Clicca un paese sul globo per caricare le radio',
    chooseCountryRadioFirst: 'Scegli prima un paese, poi filtra le radio',
    chooseCountryRadioFirstBody: 'Scegli prima un paese per sfogliare le radio per categoria.',
    noFavorites: 'Nessun preferito. Premi la stella su un canale per salvarlo qui.',
    noMatch: 'Nessun {label} corrisponde al filtro attuale.', removeFavorite: 'Rimuovi preferito',
    addFavorite: 'Aggiungi preferito', play: 'Riproduci', showMore: 'Mostra altri {count} di {remaining}',
    noChannelsAvailable: 'Nessun canale disponibile per il filtro attuale.',
    noRadioAvailable: 'Nessuna radio disponibile per il filtro attuale.',
    loadingChannelsAll: 'Caricamento canali da tutti i paesi',
    loadingCategoryAll: 'Caricamento canali {label} da tutti i paesi',
    couldNotLoadChannels: 'Impossibile caricare i canali ora',
    channelsCouldNotLoad: 'I canali non possono essere caricati ora.',
    couldNotLoadGlobal: 'Impossibile caricare i canali globali ora',
    globalCouldNotLoad: 'I canali globali non possono essere caricati ora.',
    loadingMediaForCountry: 'Caricamento {label} per questo paese', selectedFromGlobe: 'Selezionato dal globo',
    mediaAvailable: '{count} {label} disponibili', noMediaFound: 'Nessun {label} trovato per questo paese',
    noMediaFoundDetail: 'Nessun {label} gratuito riproducibile trovato per questo paese ora.',
    tvActive: 'Modalità TV attiva.', radioActive: 'Modalità radio attiva.',
    newspapersReady: 'Il pulsante Giornali online è pronto. Invia i dati per collegarlo.',
    countryUnavailable: 'Questo paese non è ancora disponibile.', countryLoading: 'I dati del paese sono ancora in caricamento.',
    clickDirectlyCountry: 'Clicca direttamente su un paese.', moveCountryCircle: 'Muovi un paese dentro il cerchio',
    moveGlobe: 'Muovi il globo', placeCountryCircle: 'Metti un paese nel cerchio rosso e clicca',
    clickGlobeLoadChannels: 'Clicca il globo per caricare i canali', clickToLoadChannels: 'Clicca per caricare i canali',
    zoom: 'Zoom {percent}%', addedFavorite: 'Aggiunto ai preferiti.', removedFavorite: 'Rimosso dai preferiti.',
    favoritesFull: 'Archivio preferiti pieno.', unsafeChannel: 'Questo link canale non è sicuro.',
    unsafeStream: 'Questo URL stream non è sicuro.', loadingLiveStream: 'Caricamento live stream...',
    pressPlayStream: 'Premi play per avviare questo stream.', tryingAlternateStream: 'Provo un altro stream per questo canale...', playerError: 'Il player video non si è caricato. Apertura in una nuova scheda.',
    loadingRadio: 'Caricamento {title}...', pressPlayRadio: 'Premi play per avviare questa radio.',
    pipTvOnly: 'Picture in picture disponibile per stream TV.', pipUnsupported: 'Il browser non supporta picture in picture.',
    startVideoFirst: 'Avvia prima il video, poi prova PiP.', globalTvOnly: 'La TV globale è disponibile in modalità TV.',
    loadedStreams: '{count} stream riproducibili caricati', streamsLoaded: '{count} stream riproducibili caricati',
    globalIndexError: 'Impossibile caricare l’indice globale dei canali',
    globalIndexErrorBody: 'L’indice globale dei canali non può essere caricato ora.',
    developerArea: 'Area sviluppatore', developerTitle: 'Sviluppatore WatchNations',
    accessCode: 'Codice accesso', enterCode: 'Inserisci codice', openDeveloper: 'Apri pagina sviluppatore',
    realVisitors: 'Visitatori reali', totalVisits: 'Visite totali', lastVisit: 'Ultima visita: {date}',
    currentCode: 'Codice attuale', newCode: 'Nuovo codice', changeCode: 'Cambia codice',
    checkingCode: 'Controllo codice...', developerOpen: 'Pagina sviluppatore aperta.',
    wrongCode: 'Codice errato.', savingCode: 'Salvataggio nuovo codice...', codeChanged: 'Codice cambiato con successo.',
    refreshStatsError: 'Impossibile aggiornare le statistiche.', requestFailed: 'Richiesta fallita.',
    category: {
      all: 'Tutti i canali', 'top-news': 'Notizie principali', news: 'Notizie', music: 'Musica', sports: 'Sport',
      auto: 'Auto', animation: 'Animazione', business: 'Business', classic: 'Classici', comedy: 'Commedia',
      cooking: 'Cucina', culture: 'Cultura', documentary: 'Documentari', education: 'Educazione',
      entertainment: 'Intrattenimento', family: 'Famiglia', general: 'Generale', kids: 'Bambini',
      legislative: 'Legislativo', lifestyle: 'Lifestyle', movies: 'Film', outdoor: 'Outdoor',
      relax: 'Relax', religious: 'Religione', series: 'Serie', science: 'Scienza', shop: 'Shopping',
      travel: 'Viaggi', weather: 'Meteo', favorites: 'Preferiti'
    }
  }
};

function mergeTranslation(base, overrides) {
  return {
    ...base,
    ...overrides,
    category: {
      ...base.category,
      ...(overrides.category || {})
    }
  };
}

const extraLanguageOverrides = {
  pt: {
    openMenu: 'Abrir menu', closeMenu: 'Fechar menu', focusGlobe: 'Focar globo', randomCountry: 'País aleatório',
    search: 'Pesquisar', tv: 'TV', radio: 'Rádio', newspapers: 'Jornais digitais', globeZoomControls: 'Controles de zoom do globo',
    zoomIn: 'Aproximar', zoomOut: 'Afastar', resetZoom: 'Redefinir zoom', clickCountry: 'Clique em um país',
    ready: 'Pronto', readyDetail: 'Mova o globo até um país entrar no círculo vermelho', fastMode: 'Modo rápido',
    chooseFromGlobe: 'Escolha no globo', heroHint: 'Mova o globo, coloque um país no círculo vermelho e clique.',
    chooseCountry: 'Escolha um país', selectCountry: 'Selecionar país', changeCountry: 'Alterar país',
    searchCountry: 'Pesquisar país', loadingCountries: 'Carregando países...', selectChannel: 'Selecionar canal',
    selectRadio: 'Selecionar rádio', pip: 'Imagem em imagem', close: 'Fechar', freeChannels: 'Canais grátis',
    freeRadio: 'Rádio grátis', smartReady: 'Filtro inteligente pronto', searchChannels: 'Pesquisar canais ou categoria',
    searchRadio: 'Pesquisar rádios, idioma ou tag', explore: 'Explorar', favorites: 'Favoritos',
    favoriteChannels: 'Canais favoritos', favoriteRadio: 'Rádios favoritas', about: 'Sobre', faq: 'FAQ',
    privacy: 'Política de privacidade', feedback: 'Feedback', allChannels: 'Todos os canais',
    loadingGlobe: 'Carregando globo', globeError: 'Não foi possível carregar o globo',
    channelsWillAppear: 'Os canais aparecerão aqui depois que você escolher um país no globo.',
    radioWillAppear: 'As rádios aparecerão aqui depois que você escolher um país no globo.',
    clickCountryChannels: 'Clique em um país no globo para carregar canais',
    clickCountryRadio: 'Clique em um país no globo para carregar rádios',
    chooseCountryRadioFirst: 'Escolha primeiro um país e depois filtre as rádios',
    chooseCountryRadioFirstBody: 'Escolha primeiro um país para navegar por rádios por categoria.',
    noFavorites: 'Ainda não há favoritos. Pressione a estrela em qualquer canal para salvar aqui.',
    noMatch: 'Nenhum {label} corresponde ao filtro atual.', removeFavorite: 'Remover favorito',
    addFavorite: 'Adicionar favorito', play: 'Reproduzir', showMore: 'Mostrar mais {count} de {remaining}',
    noChannelsAvailable: 'Nenhum canal disponível para o filtro atual.', noRadioAvailable: 'Nenhuma rádio disponível para o filtro atual.',
    loadingChannelsAll: 'Carregando canais de todos os países', loadingCategoryAll: 'Carregando canais {label} de todos os países',
    couldNotLoadChannels: 'Não foi possível carregar os canais agora', channelsCouldNotLoad: 'Os canais não puderam ser carregados agora.',
    couldNotLoadGlobal: 'Não foi possível carregar canais globais agora', globalCouldNotLoad: 'Os canais globais não puderam ser carregados agora.',
    loadingMediaForCountry: 'Carregando {label} para este país', selectedFromGlobe: 'Selecionado no globo',
    mediaAvailable: '{count} {label} disponíveis', noMediaFound: 'Nenhum {label} encontrado para este país',
    noMediaFoundDetail: 'Nenhum {label} gratuito reproduzível foi encontrado para este país agora.',
    tvActive: 'Modo TV ativo.', radioActive: 'Modo rádio ativo.', newspapersReady: 'Jornais digitais prontos.',
    countryUnavailable: 'Este país ainda não está disponível.', countryLoading: 'Os dados do país ainda estão carregando.',
    clickDirectlyCountry: 'Clique diretamente em um país.', moveCountryCircle: 'Mova um país para dentro do círculo',
    moveGlobe: 'Mova o globo', placeCountryCircle: 'Coloque um país dentro do círculo vermelho e clique',
    clickGlobeLoadChannels: 'Clique no globo para carregar canais', clickToLoadChannels: 'Clique para carregar canais',
    zoom: 'Zoom {percent}%', addedFavorite: 'Adicionado aos favoritos.', removedFavorite: 'Removido dos favoritos.',
    favoritesFull: 'O armazenamento de favoritos está cheio.', unsafeChannel: 'Este link de canal não é seguro.',
    unsafeStream: 'Este URL de stream não é seguro.', loadingLiveStream: 'Carregando transmissão ao vivo...',
    pressPlayStream: 'Pressione play para iniciar este stream.', tryingAlternateStream: 'Tentando outro stream para este canal...',
    playerError: 'O player de vídeo não carregou. Abrindo em uma nova guia.', loadingRadio: 'Carregando {title}...',
    pressPlayRadio: 'Pressione play para iniciar esta rádio.', pipTvOnly: 'Imagem em imagem está disponível para streams de TV.',
    pipUnsupported: 'Seu navegador não suporta imagem em imagem.', startVideoFirst: 'Inicie o vídeo primeiro e tente PiP.',
    globalTvOnly: 'TV global está disponível no modo TV.', loadedStreams: '{count} streams reproduzíveis carregados',
    streamsLoaded: '{count} streams reproduzíveis carregados', globalIndexError: 'Não foi possível carregar o índice global de canais',
    globalIndexErrorBody: 'O índice global de canais não pode ser carregado agora.',
    developerArea: 'Área do desenvolvedor', developerTitle: 'Desenvolvedor WatchNations',
    accessCode: 'Código de acesso', enterCode: 'Digite o código', openDeveloper: 'Abrir página do desenvolvedor',
    realVisitors: 'Visitantes reais', totalVisits: 'Total de visitas', lastVisit: 'Última visita: {date}',
    currentCode: 'Código atual', newCode: 'Novo código', changeCode: 'Alterar código',
    checkingCode: 'Verificando código...', developerOpen: 'Página do desenvolvedor aberta.',
    wrongCode: 'Código incorreto.', savingCode: 'Salvando novo código...', codeChanged: 'Código alterado com sucesso.',
    refreshStatsError: 'Não foi possível atualizar as estatísticas.', requestFailed: 'Solicitação falhou.',
    category: {
      all: 'Todos os canais', 'top-news': 'Principais notícias', news: 'Notícias', music: 'Música', sports: 'Esportes',
      auto: 'Automóveis', animation: 'Animação', business: 'Negócios', classic: 'Clássicos', comedy: 'Comédia',
      cooking: 'Culinária', culture: 'Cultura', documentary: 'Documentários', education: 'Educação',
      entertainment: 'Entretenimento', family: 'Família', general: 'Geral', kids: 'Crianças',
      legislative: 'Legislativo', lifestyle: 'Estilo de vida', movies: 'Filmes', outdoor: 'Ar livre',
      relax: 'Relaxamento', religious: 'Religião', series: 'Séries', science: 'Ciência', shop: 'Compras',
      travel: 'Viagem', weather: 'Clima', favorites: 'Favoritos'
    }
  },
  bn: {
    openMenu: 'মেনু খুলুন', closeMenu: 'মেনু বন্ধ করুন', focusGlobe: 'গ্লোব ফোকাস করুন', randomCountry: 'এলোমেলো দেশ',
    search: 'অনুসন্ধান', tv: 'টিভি', radio: 'রেডিও', newspapers: 'ই-পত্রিকা', globeZoomControls: 'গ্লোব জুম নিয়ন্ত্রণ',
    zoomIn: 'জুম ইন', zoomOut: 'জুম আউট', resetZoom: 'জুম রিসেট', clickCountry: 'একটি দেশে ক্লিক করুন',
    ready: 'প্রস্তুত', readyDetail: 'লাল বৃত্তে একটি দেশ আসা পর্যন্ত গ্লোব ঘোরান', fastMode: 'দ্রুত মোড',
    chooseFromGlobe: 'গ্লোব থেকে বেছে নিন', heroHint: 'গ্লোব ঘোরান, দেশটি লাল বৃত্তে রাখুন, তারপর ক্লিক করুন.',
    chooseCountry: 'দেশ বেছে নিন', selectCountry: 'দেশ নির্বাচন করুন', changeCountry: 'দেশ পরিবর্তন করুন',
    searchCountry: 'দেশ খুঁজুন', loadingCountries: 'দেশ লোড হচ্ছে...', selectChannel: 'চ্যানেল নির্বাচন করুন',
    selectRadio: 'রেডিও নির্বাচন করুন', pip: 'পিকচার ইন পিকচার', close: 'বন্ধ করুন', freeChannels: 'ফ্রি চ্যানেল',
    freeRadio: 'ফ্রি রেডিও', smartReady: 'স্মার্ট ফিল্টার প্রস্তুত', searchChannels: 'চ্যানেল বা বিভাগ খুঁজুন',
    searchRadio: 'রেডিও, ভাষা বা ট্যাগ খুঁজুন', explore: 'এক্সপ্লোর', favorites: 'প্রিয়',
    favoriteChannels: 'প্রিয় চ্যানেল', favoriteRadio: 'প্রিয় রেডিও', about: 'সম্পর্কে', faq: 'FAQ',
    privacy: 'গোপনীয়তা নীতি', feedback: 'মতামত', allChannels: 'সব চ্যানেল',
    loadingGlobe: 'গ্লোব লোড হচ্ছে', globeError: 'গ্লোব লোড করা যায়নি',
    channelsWillAppear: 'গ্লোব থেকে দেশ বেছে নেওয়ার পর চ্যানেল এখানে দেখা যাবে.',
    radioWillAppear: 'গ্লোব থেকে দেশ বেছে নেওয়ার পর রেডিও এখানে দেখা যাবে.',
    clickCountryChannels: 'চ্যানেল লোড করতে গ্লোবের একটি দেশে ক্লিক করুন',
    clickCountryRadio: 'রেডিও লোড করতে গ্লোবের একটি দেশে ক্লিক করুন',
    chooseCountryRadioFirst: 'আগে দেশ বেছে নিন, তারপর রেডিও ফিল্টার করুন',
    chooseCountryRadioFirstBody: 'বিভাগ অনুযায়ী রেডিও দেখতে আগে একটি দেশ বেছে নিন.',
    noFavorites: 'এখনও কোনো প্রিয় নেই. কোনো চ্যানেলে তারকা চাপলে এখানে সেভ হবে.',
    noMatch: 'বর্তমান ফিল্টারের সাথে কোনো {label} মেলেনি.', removeFavorite: 'প্রিয় থেকে সরান',
    addFavorite: 'প্রিয়তে যোগ করুন', play: 'চালান', showMore: '{remaining} এর মধ্যে আরও {count} দেখান',
    noChannelsAvailable: 'বর্তমান ফিল্টারে কোনো চ্যানেল নেই.', noRadioAvailable: 'বর্তমান ফিল্টারে কোনো রেডিও নেই.',
    loadingChannelsAll: 'সব দেশ থেকে চ্যানেল লোড হচ্ছে', loadingCategoryAll: 'সব দেশ থেকে {label} চ্যানেল লোড হচ্ছে',
    couldNotLoadChannels: 'এখন চ্যানেল লোড করা যায়নি', channelsCouldNotLoad: 'চ্যানেল এখন লোড করা যায়নি.',
    couldNotLoadGlobal: 'এখন বৈশ্বিক চ্যানেল লোড করা যায়নি', globalCouldNotLoad: 'বৈশ্বিক চ্যানেল এখন লোড করা যায়নি.',
    loadingMediaForCountry: 'এই দেশের জন্য {label} লোড হচ্ছে', selectedFromGlobe: 'গ্লোব থেকে নির্বাচিত',
    mediaAvailable: '{count}টি {label} উপলব্ধ', noMediaFound: 'এই দেশের জন্য কোনো {label} পাওয়া যায়নি',
    noMediaFoundDetail: 'এই দেশের জন্য এখন চালানো যায় এমন ফ্রি {label} পাওয়া যায়নি.',
    tvActive: 'টিভি মোড সক্রিয়.', radioActive: 'রেডিও মোড সক্রিয়.', newspapersReady: 'ই-পত্রিকা প্রস্তুত.',
    countryUnavailable: 'এই দেশ এখনও উপলব্ধ নয়.', countryLoading: 'দেশের ডেটা এখনও লোড হচ্ছে.',
    moveGlobe: 'গ্লোব ঘোরান', placeCountryCircle: 'দেশটি লাল বৃত্তে রাখুন এবং ক্লিক করুন',
    clickGlobeLoadChannels: 'চ্যানেল লোড করতে গ্লোবে ক্লিক করুন', clickToLoadChannels: 'চ্যানেল লোড করতে ক্লিক করুন',
    category: {
      all: 'সব চ্যানেল', 'top-news': 'শীর্ষ খবর', news: 'খবর', music: 'সঙ্গীত', sports: 'খেলা',
      auto: 'অটো', animation: 'অ্যানিমেশন', business: 'ব্যবসা', classic: 'ক্লাসিক', comedy: 'কমেডি',
      cooking: 'রান্না', culture: 'সংস্কৃতি', documentary: 'ডকুমেন্টারি', education: 'শিক্ষা',
      entertainment: 'বিনোদন', family: 'পরিবার', general: 'সাধারণ', kids: 'শিশু',
      legislative: 'আইনসভা', lifestyle: 'লাইফস্টাইল', movies: 'সিনেমা', outdoor: 'আউটডোর',
      relax: 'রিল্যাক্স', religious: 'ধর্মীয়', series: 'সিরিজ', science: 'বিজ্ঞান', shop: 'শপিং',
      travel: 'ভ্রমণ', weather: 'আবহাওয়া', favorites: 'প্রিয়'
    }
  },
  tr: {
    search: 'Ara', tv: 'TV', radio: 'Radyo', newspapers: 'E-Gazeteler', chooseCountry: 'Ülke seç',
    selectCountry: 'Ülke seç', searchCountry: 'Ülke ara', selectChannel: 'Kanal seç', selectRadio: 'Radyo seç',
    freeChannels: 'Ücretsiz kanallar', freeRadio: 'Ücretsiz radyo', searchChannels: 'Kanal veya kategori ara',
    searchRadio: 'Radyo, dil veya etiket ara', explore: 'Keşfet', favorites: 'Favoriler',
    about: 'Hakkında', privacy: 'Gizlilik Politikası', feedback: 'Geri bildirim', allChannels: 'Tüm kanallar',
    channelsWillAppear: 'Globe üzerinden bir ülke seçtikten sonra kanallar burada görünecek.',
    radioWillAppear: 'Globe üzerinden bir ülke seçtikten sonra radyolar burada görünecek.',
    mediaAvailable: '{count} {label} mevcut', noMediaFound: 'Bu ülke için {label} bulunamadı',
    tvActive: 'TV modu aktif.', radioActive: 'Radyo modu aktif.', play: 'Oynat', close: 'Kapat',
    category: {
      all: 'Tüm kanallar', 'top-news': 'Öne çıkan haberler', news: 'Haberler', music: 'Müzik', sports: 'Spor',
      auto: 'Otomobil', animation: 'Animasyon', business: 'İş', classic: 'Klasik', comedy: 'Komedi',
      cooking: 'Yemek', culture: 'Kültür', documentary: 'Belgesel', education: 'Eğitim',
      entertainment: 'Eğlence', family: 'Aile', general: 'Genel', kids: 'Çocuk',
      legislative: 'Meclis', lifestyle: 'Yaşam', movies: 'Filmler', outdoor: 'Açık hava',
      relax: 'Rahatlama', religious: 'Dini', series: 'Diziler', science: 'Bilim', shop: 'Alışveriş',
      travel: 'Seyahat', weather: 'Hava durumu', favorites: 'Favoriler'
    }
  },
  ja: {
    search: '検索', tv: 'テレビ', radio: 'ラジオ', newspapers: '電子新聞', chooseCountry: '国を選択',
    selectCountry: '国を選択', searchCountry: '国を検索', selectChannel: 'チャンネルを選択', selectRadio: 'ラジオを選択',
    freeChannels: '無料チャンネル', freeRadio: '無料ラジオ', searchChannels: 'チャンネルまたはカテゴリを検索',
    searchRadio: 'ラジオ、言語、タグを検索', explore: '探索', favorites: 'お気に入り',
    about: '概要', privacy: 'プライバシーポリシー', feedback: 'フィードバック', allChannels: 'すべてのチャンネル',
    channelsWillAppear: '地球儀から国を選ぶと、ここにチャンネルが表示されます。',
    radioWillAppear: '地球儀から国を選ぶと、ここにラジオが表示されます。',
    mediaAvailable: '{count}件の{label}が利用可能', noMediaFound: 'この国の{label}は見つかりません',
    tvActive: 'テレビモードが有効です。', radioActive: 'ラジオモードが有効です。', play: '再生', close: '閉じる',
    category: {
      all: 'すべてのチャンネル', 'top-news': 'トップニュース', news: 'ニュース', music: '音楽', sports: 'スポーツ',
      auto: '自動車', animation: 'アニメーション', business: 'ビジネス', classic: 'クラシック', comedy: 'コメディ',
      cooking: '料理', culture: '文化', documentary: 'ドキュメンタリー', education: '教育',
      entertainment: 'エンタメ', family: 'ファミリー', general: '一般', kids: '子ども',
      legislative: '議会', lifestyle: 'ライフスタイル', movies: '映画', outdoor: 'アウトドア',
      relax: 'リラックス', religious: '宗教', series: 'シリーズ', science: '科学', shop: 'ショッピング',
      travel: '旅行', weather: '天気', favorites: 'お気に入り'
    }
  },
  de: {
    search: 'Suchen', tv: 'TV', radio: 'Radio', newspapers: 'E-Zeitungen', chooseCountry: 'Land wählen',
    selectCountry: 'Land auswählen', searchCountry: 'Land suchen', selectChannel: 'Kanal auswählen', selectRadio: 'Radio auswählen',
    freeChannels: 'Kostenlose Kanäle', freeRadio: 'Kostenloses Radio', searchChannels: 'Kanäle oder Kategorie suchen',
    searchRadio: 'Sender, Sprache oder Tag suchen', explore: 'Entdecken', favorites: 'Favoriten',
    about: 'Über uns', privacy: 'Datenschutz', feedback: 'Feedback', allChannels: 'Alle Kanäle',
    channelsWillAppear: 'Kanäle erscheinen hier, nachdem Sie ein Land auf dem Globus ausgewählt haben.',
    radioWillAppear: 'Radios erscheinen hier, nachdem Sie ein Land auf dem Globus ausgewählt haben.',
    mediaAvailable: '{count} {label} verfügbar', noMediaFound: 'Keine {label} für dieses Land gefunden',
    tvActive: 'TV-Modus aktiv.', radioActive: 'Radio-Modus aktiv.', play: 'Abspielen', close: 'Schließen',
    category: {
      all: 'Alle Kanäle', 'top-news': 'Top-Nachrichten', news: 'Nachrichten', music: 'Musik', sports: 'Sport',
      auto: 'Auto', animation: 'Animation', business: 'Wirtschaft', classic: 'Klassiker', comedy: 'Comedy',
      cooking: 'Kochen', culture: 'Kultur', documentary: 'Dokumentation', education: 'Bildung',
      entertainment: 'Unterhaltung', family: 'Familie', general: 'Allgemein', kids: 'Kinder',
      legislative: 'Parlament', lifestyle: 'Lifestyle', movies: 'Filme', outdoor: 'Outdoor',
      relax: 'Entspannung', religious: 'Religion', series: 'Serien', science: 'Wissenschaft', shop: 'Shopping',
      travel: 'Reisen', weather: 'Wetter', favorites: 'Favoriten'
    }
  },
  nl: {
    search: 'Zoeken', tv: 'TV', radio: 'Radio', newspapers: 'E-kranten', chooseCountry: 'Kies een land',
    selectCountry: 'Selecteer land', searchCountry: 'Land zoeken', selectChannel: 'Kanaal selecteren', selectRadio: 'Radio selecteren',
    freeChannels: 'Gratis kanalen', freeRadio: 'Gratis radio', searchChannels: 'Kanalen of categorie zoeken',
    searchRadio: 'Stations, taal of tag zoeken', explore: 'Ontdekken', favorites: 'Favorieten',
    about: 'Over', privacy: 'Privacybeleid', feedback: 'Feedback', allChannels: 'Alle kanalen',
    channelsWillAppear: 'Kanalen verschijnen hier nadat je een land op de globe kiest.',
    radioWillAppear: 'Radiozenders verschijnen hier nadat je een land op de globe kiest.',
    mediaAvailable: '{count} {label} beschikbaar', noMediaFound: 'Geen {label} gevonden voor dit land',
    tvActive: 'TV-modus actief.', radioActive: 'Radiomodus actief.', play: 'Afspelen', close: 'Sluiten',
    category: {
      all: 'Alle kanalen', 'top-news': 'Belangrijk nieuws', news: 'Nieuws', music: 'Muziek', sports: 'Sport',
      auto: 'Auto', animation: 'Animatie', business: 'Zakelijk', classic: 'Klassiek', comedy: 'Comedy',
      cooking: 'Koken', culture: 'Cultuur', documentary: 'Documentaire', education: 'Onderwijs',
      entertainment: 'Entertainment', family: 'Familie', general: 'Algemeen', kids: 'Kinderen',
      legislative: 'Parlementair', lifestyle: 'Lifestyle', movies: 'Films', outdoor: 'Outdoor',
      relax: 'Relax', religious: 'Religie', series: 'Series', science: 'Wetenschap', shop: 'Winkelen',
      travel: 'Reizen', weather: 'Weer', favorites: 'Favorieten'
    }
  },
  sv: {
    search: 'Sök', tv: 'TV', radio: 'Radio', newspapers: 'E-tidningar', chooseCountry: 'Välj land',
    selectCountry: 'Välj ett land', searchCountry: 'Sök land', selectChannel: 'Välj kanal', selectRadio: 'Välj radio',
    freeChannels: 'Gratis kanaler', freeRadio: 'Gratis radio', searchChannels: 'Sök kanaler eller kategori',
    searchRadio: 'Sök stationer, språk eller tagg', explore: 'Utforska', favorites: 'Favoriter',
    about: 'Om', privacy: 'Integritetspolicy', feedback: 'Feedback', allChannels: 'Alla kanaler',
    channelsWillAppear: 'Kanaler visas här efter att du valt ett land på globen.',
    radioWillAppear: 'Radiostationer visas här efter att du valt ett land på globen.',
    mediaAvailable: '{count} {label} tillgängliga', noMediaFound: 'Inga {label} hittades för detta land',
    tvActive: 'TV-läge är aktivt.', radioActive: 'Radioläge är aktivt.', play: 'Spela', close: 'Stäng',
    category: {
      all: 'Alla kanaler', 'top-news': 'Toppnyheter', news: 'Nyheter', music: 'Musik', sports: 'Sport',
      auto: 'Auto', animation: 'Animation', business: 'Näringsliv', classic: 'Klassiskt', comedy: 'Komedi',
      cooking: 'Matlagning', culture: 'Kultur', documentary: 'Dokumentär', education: 'Utbildning',
      entertainment: 'Underhållning', family: 'Familj', general: 'Allmänt', kids: 'Barn',
      legislative: 'Parlament', lifestyle: 'Livsstil', movies: 'Filmer', outdoor: 'Friluftsliv',
      relax: 'Avkoppling', religious: 'Religion', series: 'Serier', science: 'Vetenskap', shop: 'Shopping',
      travel: 'Resor', weather: 'Väder', favorites: 'Favoriter'
    }
  },
  no: {
    search: 'Søk', tv: 'TV', radio: 'Radio', newspapers: 'E-aviser', chooseCountry: 'Velg land',
    selectCountry: 'Velg et land', searchCountry: 'Søk land', selectChannel: 'Velg kanal', selectRadio: 'Velg radio',
    freeChannels: 'Gratis kanaler', freeRadio: 'Gratis radio', searchChannels: 'Søk kanaler eller kategori',
    searchRadio: 'Søk stasjoner, språk eller tagg', explore: 'Utforsk', favorites: 'Favoritter',
    about: 'Om', privacy: 'Personvern', feedback: 'Tilbakemelding', allChannels: 'Alle kanaler',
    channelsWillAppear: 'Kanaler vises her etter at du velger et land på globusen.',
    radioWillAppear: 'Radiostasjoner vises her etter at du velger et land på globusen.',
    mediaAvailable: '{count} {label} tilgjengelig', noMediaFound: 'Ingen {label} funnet for dette landet',
    tvActive: 'TV-modus er aktiv.', radioActive: 'Radiomodus er aktiv.', play: 'Spill av', close: 'Lukk',
    category: {
      all: 'Alle kanaler', 'top-news': 'Toppnyheter', news: 'Nyheter', music: 'Musikk', sports: 'Sport',
      auto: 'Auto', animation: 'Animasjon', business: 'Næring', classic: 'Klassisk', comedy: 'Komedie',
      cooking: 'Matlaging', culture: 'Kultur', documentary: 'Dokumentar', education: 'Utdanning',
      entertainment: 'Underholdning', family: 'Familie', general: 'Generelt', kids: 'Barn',
      legislative: 'Parlament', lifestyle: 'Livsstil', movies: 'Filmer', outdoor: 'Friluft',
      relax: 'Avslapning', religious: 'Religion', series: 'Serier', science: 'Vitenskap', shop: 'Shopping',
      travel: 'Reise', weather: 'Vær', favorites: 'Favoritter'
    }
  },
  zh: {
    search: '搜索', tv: '电视', radio: '广播', newspapers: '电子报纸', chooseCountry: '选择国家',
    selectCountry: '选择国家', searchCountry: '搜索国家', selectChannel: '选择频道', selectRadio: '选择电台',
    freeChannels: '免费频道', freeRadio: '免费广播', searchChannels: '搜索频道或分类',
    searchRadio: '搜索电台、语言或标签', explore: '探索', favorites: '收藏',
    about: '关于', privacy: '隐私政策', feedback: '反馈', allChannels: '所有频道',
    channelsWillAppear: '从地球仪选择国家后，频道会显示在这里。',
    radioWillAppear: '从地球仪选择国家后，广播会显示在这里。',
    mediaAvailable: '可用 {label}：{count}', noMediaFound: '未找到该国家的{label}',
    tvActive: '电视模式已启用。', radioActive: '广播模式已启用。', play: '播放', close: '关闭',
    category: {
      all: '所有频道', 'top-news': '头条新闻', news: '新闻', music: '音乐', sports: '体育',
      auto: '汽车', animation: '动画', business: '商业', classic: '经典', comedy: '喜剧',
      cooking: '烹饪', culture: '文化', documentary: '纪录片', education: '教育',
      entertainment: '娱乐', family: '家庭', general: '综合', kids: '儿童',
      legislative: '议会', lifestyle: '生活方式', movies: '电影', outdoor: '户外',
      relax: '放松', religious: '宗教', series: '剧集', science: '科学', shop: '购物',
      travel: '旅行', weather: '天气', favorites: '收藏'
    }
  }
};

Object.entries(extraLanguageOverrides).forEach(([language, overrides]) => {
  translations[language] = mergeTranslation(translations.en, overrides);
});

const savedLanguage = localStorage.getItem('watchnations:language');
let currentLanguage = translations[savedLanguage] ? savedLanguage : 'en';
const newspaperText = {
  en: {
    title: 'E-Newspapers', select: 'Select a Country', search: 'Search newspapers, source, or category',
    hint: 'Choose a country to browse electronic newspapers and official sources.',
    categories: 'Newspaper categories', all: 'All', politics: 'Politics', economy: 'Economy', society: 'Society', sports: 'Sports', technology: 'Technology & Crypto',
    loading: 'Loading e-newspapers', loaded: '{count} sources available', empty: 'No newspapers match the current filter.',
    read: 'Read here', open: 'Open website', official: 'Official', source: 'Source', readerTitle: 'Newspaper reader',
    frameNote: 'Some websites block embedded reading. Use Open website if the page does not appear.'
  },
  es: {
    title: 'Periódicos digitales', select: 'Selecciona un país', search: 'Buscar periódicos, fuente o categoría',
    hint: 'Elige un país para explorar periódicos digitales y fuentes oficiales.',
    categories: 'Categorías', all: 'Todo', politics: 'Política', economy: 'Economía', society: 'Sociedad', sports: 'Deportes', technology: 'Tecnología y cripto',
    loading: 'Cargando periódicos', loaded: '{count} fuentes disponibles', empty: 'No hay periódicos que coincidan con el filtro.',
    read: 'Leer aquí', open: 'Abrir sitio', official: 'Oficial', source: 'Fuente', readerTitle: 'Lector de periódico',
    frameNote: 'Algunos sitios bloquean la lectura integrada. Usa Abrir sitio si la página no aparece.'
  },
  fr: {
    title: 'Journaux en ligne', select: 'Sélectionner un pays', search: 'Rechercher journaux, source ou catégorie',
    hint: 'Choisissez un pays pour parcourir les journaux en ligne et les sources officielles.',
    categories: 'Catégories', all: 'Tout', politics: 'Politique', economy: 'Économie', society: 'Société', sports: 'Sports', technology: 'Technologie et crypto',
    loading: 'Chargement des journaux', loaded: '{count} sources disponibles', empty: 'Aucun journal ne correspond au filtre.',
    read: 'Lire ici', open: 'Ouvrir le site', official: 'Officiel', source: 'Source', readerTitle: 'Lecteur de journal',
    frameNote: 'Certains sites bloquent la lecture intégrée. Utilisez Ouvrir le site si la page ne s’affiche pas.'
  },
  ar: {
    title: 'جرائد إلكترونية', select: 'اختر دولة', search: 'ابحث عن جريدة أو مصدر أو تصنيف',
    hint: 'اختر دولة لتصفح الجرائد الإلكترونية والمصادر الرسمية.',
    categories: 'تصنيفات الجرائد', all: 'الكل', politics: 'السياسة', economy: 'الاقتصاد', society: 'المجتمع', sports: 'الرياضة', technology: 'التكنولوجيا والعملات الرقمية',
    loading: 'جاري تحميل الجرائد الإلكترونية', loaded: '{count} مصدر متاح', empty: 'لا توجد جرائد تطابق الفلتر الحالي.',
    read: 'تصفح هنا', open: 'فتح الموقع', official: 'رسمي', source: 'مصدر', readerTitle: 'قارئ الجريدة',
    frameNote: 'بعض المواقع تمنع العرض داخل الموقع. استخدم فتح الموقع إذا لم تظهر الصفحة.'
  },
  it: {
    title: 'Giornali online', select: 'Seleziona un paese', search: 'Cerca giornali, fonte o categoria',
    hint: 'Scegli un paese per sfogliare giornali online e fonti ufficiali.',
    categories: 'Categorie', all: 'Tutto', politics: 'Politica', economy: 'Economia', society: 'Società', sports: 'Sport', technology: 'Tecnologia e cripto',
    loading: 'Caricamento giornali', loaded: '{count} fonti disponibili', empty: 'Nessun giornale corrisponde al filtro.',
    read: 'Leggi qui', open: 'Apri sito', official: 'Ufficiale', source: 'Fonte', readerTitle: 'Lettore giornale',
    frameNote: 'Alcuni siti bloccano la lettura integrata. Usa Apri sito se la pagina non appare.'
  }
};

const extraNewspaperText = {
  pt: {
    title: 'Jornais digitais', select: 'Selecionar país', search: 'Pesquisar jornais, fonte ou categoria',
    hint: 'Escolha um país para navegar por jornais digitais e fontes oficiais.',
    categories: 'Categorias de jornais', all: 'Todos', politics: 'Política', economy: 'Economia', society: 'Sociedade', sports: 'Esportes', technology: 'Tecnologia e cripto',
    loading: 'Carregando jornais digitais', loaded: '{count} fontes disponíveis', empty: 'Nenhum jornal corresponde ao filtro atual.',
    read: 'Ler aqui', open: 'Abrir site', official: 'Oficial', source: 'Fonte', readerTitle: 'Leitor de jornal',
    frameNote: 'Alguns sites bloqueiam a leitura incorporada. Use Abrir site se a página não aparecer.'
  },
  bn: {
    title: 'ই-পত্রিকা', select: 'দেশ নির্বাচন করুন', search: 'পত্রিকা, উৎস বা বিভাগ খুঁজুন',
    hint: 'ডিজিটাল পত্রিকা ও সরকারি উৎস দেখতে একটি দেশ বেছে নিন.',
    categories: 'পত্রিকার বিভাগ', all: 'সব', politics: 'রাজনীতি', economy: 'অর্থনীতি', society: 'সমাজ', sports: 'খেলা', technology: 'প্রযুক্তি ও ক্রিপ্টো',
    loading: 'ই-পত্রিকা লোড হচ্ছে', loaded: '{count}টি উৎস উপলব্ধ', empty: 'বর্তমান ফিল্টারে কোনো পত্রিকা নেই.',
    read: 'এখানে পড়ুন', open: 'ওয়েবসাইট খুলুন', official: 'সরকারি', source: 'উৎস', readerTitle: 'পত্রিকা রিডার',
    frameNote: 'কিছু সাইট এমবেডেড পড়া ব্লক করে. পৃষ্ঠা না দেখালে ওয়েবসাইট খুলুন ব্যবহার করুন.'
  },
  tr: {
    title: 'E-Gazeteler', select: 'Ülke seç', search: 'Gazete, kaynak veya kategori ara',
    hint: 'Dijital gazeteleri ve resmi kaynakları gezmek için bir ülke seçin.',
    categories: 'Gazete kategorileri', all: 'Tümü', politics: 'Politika', economy: 'Ekonomi', society: 'Toplum', sports: 'Spor', technology: 'Teknoloji ve kripto',
    loading: 'E-gazeteler yükleniyor', loaded: '{count} kaynak mevcut', empty: 'Geçerli filtreyle eşleşen gazete yok.',
    read: 'Burada oku', open: 'Siteyi aç', official: 'Resmi', source: 'Kaynak', readerTitle: 'Gazete okuyucu',
    frameNote: 'Bazı siteler gömülü okumayı engeller. Sayfa görünmezse Siteyi aç kullanın.'
  },
  ja: {
    title: '電子新聞', select: '国を選択', search: '新聞、提供元、カテゴリを検索',
    hint: '国を選んで電子新聞と公式ソースを閲覧します。',
    categories: '新聞カテゴリ', all: 'すべて', politics: '政治', economy: '経済', society: '社会', sports: 'スポーツ', technology: 'テクノロジーと暗号資産',
    loading: '電子新聞を読み込み中', loaded: '{count}件のソースが利用可能', empty: '現在のフィルターに一致する新聞はありません。',
    read: 'ここで読む', open: 'サイトを開く', official: '公式', source: 'ソース', readerTitle: '新聞リーダー',
    frameNote: '一部のサイトは埋め込み表示をブロックします。表示されない場合はサイトを開いてください。'
  },
  de: {
    title: 'E-Zeitungen', select: 'Land auswählen', search: 'Zeitungen, Quelle oder Kategorie suchen',
    hint: 'Wählen Sie ein Land, um digitale Zeitungen und offizielle Quellen zu durchsuchen.',
    categories: 'Zeitungskategorien', all: 'Alle', politics: 'Politik', economy: 'Wirtschaft', society: 'Gesellschaft', sports: 'Sport', technology: 'Technologie und Krypto',
    loading: 'E-Zeitungen werden geladen', loaded: '{count} Quellen verfügbar', empty: 'Keine Zeitung passt zum aktuellen Filter.',
    read: 'Hier lesen', open: 'Website öffnen', official: 'Offiziell', source: 'Quelle', readerTitle: 'Zeitungsleser',
    frameNote: 'Einige Websites blockieren die eingebettete Anzeige. Nutzen Sie Website öffnen, falls die Seite nicht erscheint.'
  },
  nl: {
    title: 'E-kranten', select: 'Land selecteren', search: 'Kranten, bron of categorie zoeken',
    hint: 'Kies een land om digitale kranten en officiële bronnen te bekijken.',
    categories: 'Krantencategorieën', all: 'Alles', politics: 'Politiek', economy: 'Economie', society: 'Maatschappij', sports: 'Sport', technology: 'Technologie en crypto',
    loading: 'E-kranten laden', loaded: '{count} bronnen beschikbaar', empty: 'Geen kranten passen bij het huidige filter.',
    read: 'Hier lezen', open: 'Website openen', official: 'Officieel', source: 'Bron', readerTitle: 'Krantenlezer',
    frameNote: 'Sommige websites blokkeren ingebed lezen. Gebruik Website openen als de pagina niet verschijnt.'
  },
  sv: {
    title: 'E-tidningar', select: 'Välj land', search: 'Sök tidningar, källa eller kategori',
    hint: 'Välj ett land för att läsa digitala tidningar och officiella källor.',
    categories: 'Tidningskategorier', all: 'Alla', politics: 'Politik', economy: 'Ekonomi', society: 'Samhälle', sports: 'Sport', technology: 'Teknik och krypto',
    loading: 'Laddar e-tidningar', loaded: '{count} källor tillgängliga', empty: 'Ingen tidning matchar aktuellt filter.',
    read: 'Läs här', open: 'Öppna webbplats', official: 'Officiell', source: 'Källa', readerTitle: 'Tidningsläsare',
    frameNote: 'Vissa webbplatser blockerar inbäddad läsning. Använd Öppna webbplats om sidan inte visas.'
  },
  no: {
    title: 'E-aviser', select: 'Velg land', search: 'Søk aviser, kilde eller kategori',
    hint: 'Velg et land for å lese digitale aviser og offisielle kilder.',
    categories: 'Aviskategorier', all: 'Alle', politics: 'Politikk', economy: 'Økonomi', society: 'Samfunn', sports: 'Sport', technology: 'Teknologi og krypto',
    loading: 'Laster e-aviser', loaded: '{count} kilder tilgjengelig', empty: 'Ingen aviser passer til gjeldende filter.',
    read: 'Les her', open: 'Åpne nettsted', official: 'Offisiell', source: 'Kilde', readerTitle: 'Avisleser',
    frameNote: 'Noen nettsteder blokkerer innebygd lesing. Bruk Åpne nettsted hvis siden ikke vises.'
  },
  zh: {
    title: '电子报纸', select: '选择国家', search: '搜索报纸、来源或分类',
    hint: '选择一个国家，浏览电子报纸和官方来源。',
    categories: '报纸分类', all: '全部', politics: '政治', economy: '经济', society: '社会', sports: '体育', technology: '科技与加密',
    loading: '正在加载电子报纸', loaded: '可用来源 {count} 个', empty: '没有符合当前筛选的报纸。',
    read: '在此阅读', open: '打开网站', official: '官方', source: '来源', readerTitle: '报纸阅读器',
    frameNote: '部分网站会阻止嵌入阅读。如果页面未显示，请使用打开网站。'
  }
};

Object.entries(extraNewspaperText).forEach(([language, overrides]) => {
  newspaperText[language] = { ...newspaperText.en, ...overrides };
});

const newspaperLocale = {
  en: {
    categoryNames: {
      all: 'all sources', politics: 'politics', economy: 'economy', society: 'society', sports: 'sports', technology: 'technology and crypto'
    },
    description: '{name} is a {category} source from {country}. Open the official website or read it inside WatchNations when supported.',
    sourceMeta: 'Online source'
  },
  es: {
    categoryNames: {
      all: 'todas las fuentes', politics: 'politica', economy: 'economia', society: 'sociedad', sports: 'deportes', technology: 'tecnologia y cripto'
    },
    description: '{name} es una fuente de {category} de {country}. Abre el sitio oficial o leelo dentro de WatchNations cuando sea compatible.',
    sourceMeta: 'Fuente online'
  },
  fr: {
    categoryNames: {
      all: 'toutes les sources', politics: 'politique', economy: 'economie', society: 'societe', sports: 'sports', technology: 'technologie et crypto'
    },
    description: '{name} est une source {category} de {country}. Ouvrez le site officiel ou lisez-la dans WatchNations lorsque le site le permet.',
    sourceMeta: 'Source en ligne'
  },
  ar: {
    categoryNames: {
      all: 'كل المصادر', politics: 'السياسة', economy: 'الاقتصاد', society: 'المجتمع', sports: 'الرياضة', technology: 'التكنولوجيا والعملات الرقمية'
    },
    description: '{name} مصدر ضمن {category} من {country}. يمكنك فتح الموقع الرسمي أو تصفحه داخل WatchNations عند توفر ذلك.',
    sourceMeta: 'مصدر إلكتروني'
  },
  it: {
    categoryNames: {
      all: 'tutte le fonti', politics: 'politica', economy: 'economia', society: 'societa', sports: 'sport', technology: 'tecnologia e cripto'
    },
    description: '{name} e una fonte di {category} da {country}. Apri il sito ufficiale o leggilo dentro WatchNations quando supportato.',
    sourceMeta: 'Fonte online'
  }
};

const extraNewspaperLocale = {
  pt: {
    categoryNames: { all: 'todas as fontes', politics: 'política', economy: 'economia', society: 'sociedade', sports: 'esportes', technology: 'tecnologia e cripto' },
    description: '{name} é uma fonte de {category} de {country}. Abra o site oficial ou leia dentro do WatchNations quando suportado.',
    sourceMeta: 'Fonte online'
  },
  bn: {
    categoryNames: { all: 'সব উৎস', politics: 'রাজনীতি', economy: 'অর্থনীতি', society: 'সমাজ', sports: 'খেলা', technology: 'প্রযুক্তি ও ক্রিপ্টো' },
    description: '{name} হলো {country} থেকে {category} উৎস. সমর্থিত হলে অফিসিয়াল সাইট খুলুন বা WatchNations-এর ভিতরে পড়ুন.',
    sourceMeta: 'অনলাইন উৎস'
  },
  tr: {
    categoryNames: { all: 'tüm kaynaklar', politics: 'politika', economy: 'ekonomi', society: 'toplum', sports: 'spor', technology: 'teknoloji ve kripto' },
    description: '{name}, {country} ülkesinden bir {category} kaynağıdır. Resmi siteyi açın veya desteklenirse WatchNations içinde okuyun.',
    sourceMeta: 'Online kaynak'
  },
  ja: {
    categoryNames: { all: 'すべてのソース', politics: '政治', economy: '経済', society: '社会', sports: 'スポーツ', technology: 'テクノロジーと暗号資産' },
    description: '{name} は {country} の {category} ソースです。公式サイトを開くか、対応している場合は WatchNations 内で読めます。',
    sourceMeta: 'オンラインソース'
  },
  de: {
    categoryNames: { all: 'alle Quellen', politics: 'Politik', economy: 'Wirtschaft', society: 'Gesellschaft', sports: 'Sport', technology: 'Technologie und Krypto' },
    description: '{name} ist eine {category}-Quelle aus {country}. Öffnen Sie die offizielle Website oder lesen Sie sie in WatchNations, wenn unterstützt.',
    sourceMeta: 'Online-Quelle'
  },
  nl: {
    categoryNames: { all: 'alle bronnen', politics: 'politiek', economy: 'economie', society: 'maatschappij', sports: 'sport', technology: 'technologie en crypto' },
    description: '{name} is een {category}-bron uit {country}. Open de officiële website of lees binnen WatchNations wanneer ondersteund.',
    sourceMeta: 'Online bron'
  },
  sv: {
    categoryNames: { all: 'alla källor', politics: 'politik', economy: 'ekonomi', society: 'samhälle', sports: 'sport', technology: 'teknik och krypto' },
    description: '{name} är en {category}-källa från {country}. Öppna den officiella webbplatsen eller läs i WatchNations när det stöds.',
    sourceMeta: 'Onlinekälla'
  },
  no: {
    categoryNames: { all: 'alle kilder', politics: 'politikk', economy: 'økonomi', society: 'samfunn', sports: 'sport', technology: 'teknologi og krypto' },
    description: '{name} er en {category}-kilde fra {country}. Åpne det offisielle nettstedet eller les i WatchNations når det støttes.',
    sourceMeta: 'Nettkilde'
  },
  zh: {
    categoryNames: { all: '所有来源', politics: '政治', economy: '经济', society: '社会', sports: '体育', technology: '科技与加密' },
    description: '{name} 是来自 {country} 的{category}来源。可打开官方网站，或在支持时于 WatchNations 内阅读。',
    sourceMeta: '在线来源'
  }
};

Object.entries(extraNewspaperLocale).forEach(([language, overrides]) => {
  newspaperLocale[language] = {
    ...newspaperLocale.en,
    ...overrides,
    categoryNames: {
      ...newspaperLocale.en.categoryNames,
      ...(overrides.categoryNames || {})
    }
  };
});

function nt(key, values = {}) {
  const value = newspaperText[currentLanguage]?.[key] || newspaperText.en[key] || key;
  return value.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
}

function t(key, values = {}) {
  const value = key.split('.').reduce((entry, part) => entry?.[part], translations[currentLanguage])
    ?? key.split('.').reduce((entry, part) => entry?.[part], translations.en)
    ?? key;
  if (typeof value !== 'string') return key;
  return value.replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
}

function tCategory(id) {
  return translations[currentLanguage].category?.[id] || translations.en.category[id] || id;
}

function mediaTypeLabel(type = appState.mediaMode) {
  const labels = {
    en: { tv: 'channels', radio: 'radio stations' },
    es: { tv: 'canales', radio: 'emisoras' },
    fr: { tv: 'chaînes', radio: 'radios' },
    ar: { tv: 'قنوات', radio: 'محطات راديو' },
    it: { tv: 'canali', radio: 'radio' },
    pt: { tv: 'canais', radio: 'rádios' },
    bn: { tv: 'চ্যানেল', radio: 'রেডিও স্টেশন' },
    tr: { tv: 'kanal', radio: 'radyo istasyonu' },
    ja: { tv: 'チャンネル', radio: 'ラジオ局' },
    de: { tv: 'Kanäle', radio: 'Radiosender' },
    nl: { tv: 'kanalen', radio: 'radiostations' },
    sv: { tv: 'kanaler', radio: 'radiostationer' },
    no: { tv: 'kanaler', radio: 'radiostasjoner' },
    zh: { tv: '频道', radio: '广播电台' }
  };
  return labels[currentLanguage]?.[type] || labels.en[type] || labels.en.tv;
}

function infoPageContent(page) {
  const pages = {
    about: {
      en: ['About WatchNations', ['WatchNations helps you watch TV channels by country, discover international TV channels, and browse global media using a clean interface and an interactive 3D globe.', 'Use WatchNations for free TV with no account required, random TV channel discovery, radio stations worldwide, electronic newspapers, and a global TV channel list free to explore.', 'Arabic viewers can discover مشاهدة قنوات عربية بث مباشر مجانا, قنوات عربية بث مباشر بدون اشتراك, قنوات سعودية بث مباشر, قنوات مصرية بث مباشر مجاني, and قنوات اماراتية اونلاين.', 'The platform does not host streams. It organizes publicly available links and helps users explore channels from different cultures.', 'For channel suggestions, broken links, or copyright requests, contact lindaraymane@gmail.com.']],
      es: ['Acerca de WatchNations', ['WatchNations te ayuda a descubrir TV en vivo, radio y medios globales gratis por país con una interfaz limpia y un globo 3D interactivo.', 'La plataforma no aloja streams. Organiza enlaces públicos y ayuda a explorar canales de distintas culturas.', 'Para sugerencias, enlaces rotos o solicitudes de copyright, contacta con lindaraymane@gmail.com.']],
      fr: ['À propos de WatchNations', ['WatchNations vous aide à découvrir la TV en direct gratuite, la radio et les médias mondiaux par pays avec une interface claire et un globe 3D interactif.', 'La plateforme n’héberge pas les streams. Elle organise des liens publics et aide à explorer des chaînes de différentes cultures.', 'Pour les suggestions, liens cassés ou demandes de droits, contactez lindaraymane@gmail.com.']],
      ar: ['حول WatchNations', ['يساعدك WatchNations على مشاهدة القنوات حسب الدولة واكتشاف قنوات دولية عبر كرة أرضية ثلاثية الأبعاد وواجهة سلسة.', 'يمكنك استخدام الموقع من أجل مشاهدة قنوات عربية بث مباشر مجانا، قنوات عربية بث مباشر بدون اشتراك، قنوات سعودية بث مباشر، قنوات مصرية بث مباشر مجاني، وقنوات اماراتية اونلاين.', 'يدعم الموقع أيضاً الراديو العالمي، الجرائد الإلكترونية، واكتشاف قناة عشوائية بدون إنشاء حساب.', 'الموقع لا يستضيف البثوث، بل ينظم روابط عامة متاحة ويساعد المستخدمين على استكشاف قنوات من ثقافات مختلفة.', 'للاقتراحات أو الروابط المعطلة أو طلبات الحقوق تواصل عبر lindaraymane@gmail.com.']],
      it: ['Informazioni su WatchNations', ['WatchNations ti aiuta a scoprire TV live gratuita, radio e media globali per paese con un’interfaccia pulita e un globo 3D interattivo.', 'La piattaforma non ospita stream. Organizza link pubblici e aiuta a esplorare canali di culture diverse.', 'Per suggerimenti, link non funzionanti o richieste copyright, contatta lindaraymane@gmail.com.']]
    },
    privacy: {
      en: ['Privacy Policy', ['WatchNations does not require accounts, subscriptions, or personal profiles to browse available media.', 'Favorites are stored locally in your browser. Advertising or analytics partners may use cookies according to their own policies.', 'You can manage cookies and local storage from your browser settings at any time.']],
      es: ['Política de privacidad', ['WatchNations no requiere cuentas, suscripciones ni perfiles personales para navegar por los medios disponibles.', 'Los favoritos se guardan localmente en tu navegador. Los socios de publicidad o analítica pueden usar cookies según sus políticas.', 'Puedes gestionar cookies y almacenamiento local desde la configuración del navegador en cualquier momento.']],
      fr: ['Politique de confidentialité', ['WatchNations ne demande pas de compte, d’abonnement ni de profil personnel pour parcourir les médias disponibles.', 'Les favoris sont stockés localement dans votre navigateur. Les partenaires publicitaires ou analytiques peuvent utiliser des cookies selon leurs politiques.', 'Vous pouvez gérer les cookies et le stockage local dans les paramètres de votre navigateur à tout moment.']],
      ar: ['سياسة الخصوصية', ['لا يتطلب WatchNations حسابات أو اشتراكات أو ملفات شخصية لتصفح الوسائط المتاحة.', 'تُحفظ المفضلة محلياً في متصفحك. وقد تستخدم خدمات الإعلانات أو التحليلات ملفات تعريف الارتباط حسب سياساتها.', 'يمكنك إدارة الكوكيز والتخزين المحلي من إعدادات المتصفح في أي وقت.']],
      it: ['Privacy Policy', ['WatchNations non richiede account, abbonamenti o profili personali per esplorare i media disponibili.', 'I preferiti sono salvati localmente nel browser. Partner pubblicitari o analitici possono usare cookie secondo le proprie policy.', 'Puoi gestire cookie e archiviazione locale dalle impostazioni del browser in qualsiasi momento.']]
    },
    faq: {
      en: ['Frequently Asked Questions', ['Is WatchNations free? Yes. It is free TV with no account required.', 'How do I watch? Choose a country on the interactive 3D globe, browse categories, then select a channel, radio station, or e-newspaper.', 'Can I discover something random? Yes. WatchNations supports random TV channel discovery.', 'Why are some channels unavailable? External streams can change, go offline, or be restricted by region.']],
      es: ['Preguntas frecuentes', ['¿WatchNations es gratis? Sí, es gratis y no requiere registro.', '¿Cómo veo contenido? Elige un país en el globo, navega por categorías y selecciona un canal o emisora.', '¿Por qué algunos canales no están disponibles? Los streams externos pueden cambiar, desconectarse o tener restricciones regionales.']],
      fr: ['Questions fréquentes', ['WatchNations est-il gratuit ? Oui, il est gratuit et ne demande pas d’inscription.', 'Comment regarder ? Choisissez un pays sur le globe, parcourez les catégories, puis sélectionnez une chaîne ou une radio.', 'Pourquoi certaines chaînes sont indisponibles ? Les streams externes peuvent changer, être hors ligne ou limités par région.']],
      ar: ['الأسئلة الشائعة', ['هل WatchNations مجاني؟ نعم، مشاهدة مجانية بدون إنشاء حساب.', 'كيف أشاهد؟ اختر دولة من الكرة ثلاثية الأبعاد، تصفح التصنيفات، ثم اختر قناة أو محطة راديو أو جريدة إلكترونية.', 'هل يدعم الموقع القنوات العربية؟ نعم، يمكن استهداف مشاهدة قنوات عربية بث مباشر مجانا وقنوات عربية بث مباشر بدون اشتراك حسب الدولة.', 'لماذا بعض القنوات غير متاحة؟ الروابط الخارجية قد تتغير أو تتوقف أو تكون محدودة حسب المنطقة.']],
      it: ['Domande frequenti', ['WatchNations è gratis? Sì, è gratuito e non richiede registrazione.', 'Come guardo? Scegli un paese sul globo, esplora le categorie e seleziona un canale o una radio.', 'Perché alcuni canali non sono disponibili? Gli stream esterni possono cambiare, andare offline o essere limitati per regione.']]
    },
    feedback: {
      en: ['Tell Us What You Think', ['Your feedback helps improve WatchNations. Send channel suggestions, broken links, feature ideas, or copyright requests to lindaraymane@gmail.com.', 'Please include the channel name, page or stream link, and a short explanation so we can review it quickly.']],
      es: ['Dinos qué opinas', ['Tus comentarios ayudan a mejorar WatchNations. Envía sugerencias, enlaces rotos, ideas o solicitudes de copyright a lindaraymane@gmail.com.', 'Incluye el nombre del canal, la página o enlace del stream y una breve explicación para revisarlo rápido.']],
      fr: ['Dites-nous ce que vous pensez', ['Vos retours aident à améliorer WatchNations. Envoyez suggestions, liens cassés, idées ou demandes de droits à lindaraymane@gmail.com.', 'Incluez le nom de la chaîne, la page ou le lien du stream et une courte explication pour accélérer l’examen.']],
      ar: ['أخبرنا برأيك', ['ملاحظاتك تساعد على تحسين WatchNations. أرسل اقتراحات القنوات أو الروابط المعطلة أو أفكار الميزات أو طلبات الحقوق إلى lindaraymane@gmail.com.', 'يرجى تضمين اسم القناة ورابط الصفحة أو البث وشرح قصير حتى نراجع الطلب بسرعة.']],
      it: ['Dicci cosa ne pensi', ['Il tuo feedback aiuta a migliorare WatchNations. Invia suggerimenti, link rotti, idee o richieste copyright a lindaraymane@gmail.com.', 'Includi nome del canale, pagina o link stream e una breve spiegazione per una verifica rapida.']]
    }
  };
  return pages[page]?.[currentLanguage] || pages[page]?.en;
}

function renderInfoPage(page) {
  const modal = document.getElementById(`${page}Modal`);
  const copy = modal?.querySelector('.about-copy');
  const content = infoPageContent(page);
  if (!copy || !content) return;
  const [title, paragraphs] = content;
  copy.innerHTML = `<h2 id="${page}Title">${escapeHtml(title)}</h2>${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}`;
}

function setLanguage(language) {
  if (!translations[language]) return;
  currentLanguage = language;
  localStorage.setItem('watchnations:language', language);
  applyLanguage();
}

function applyLanguage() {
  const rtl = currentLanguage === 'ar';
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  document.body.classList.toggle('localized-rtl', rtl);

  document.getElementById('menuButton').setAttribute('aria-label', t('openMenu'));
  document.getElementById('closeMenu').setAttribute('aria-label', t('closeMenu'));
  document.getElementById('focusGlobeButton').title = t('focusGlobe');
  document.getElementById('randomButton').title = t('randomCountry');
  document.getElementById('searchFocusButton').title = t('search');
  document.getElementById('tvMode').textContent = t('tv');
  document.getElementById('radioMode').textContent = t('radio');
  document.getElementById('newspapersMode').textContent = t('newspapers');
  document.getElementById('zoomInButton').title = t('zoomIn');
  document.getElementById('zoomOutButton').title = t('zoomOut');
  document.getElementById('zoomResetButton').title = t('resetZoom');
  document.getElementById('openPanelHint').querySelector('span').textContent = t('chooseCountry');
  document.getElementById('changeCountryButton').textContent = t('changeCountry');
  countrySearch.placeholder = t('searchCountry');
  pipPlayerButton.title = t('pip');
  closePlayerButton.title = t('close');
  document.querySelectorAll('.about-close, .developer-close').forEach((button) => {
    button.title = t('close');
  });

  document.querySelector('.nav-title').textContent = t('explore');
  document.querySelectorAll('.nav-link').forEach((link) => {
    const label = link.querySelector('span');
    if (!label) return;
    if (link.dataset.category) label.textContent = tCategory(link.dataset.category);
    if (link.dataset.action) label.textContent = t(link.dataset.action);
  });

  document.querySelector('.hero-card span').innerHTML = `${icons.bolt} ${t('fastMode')}`;
  document.querySelector('.hero-card small').textContent = t('heroHint');
  if (!appState.selectedCountry && !appState.globalMode) {
    document.getElementById('countryTitle').textContent = t('selectCountry');
    document.getElementById('heroCountry').textContent = t('chooseFromGlobe');
    document.getElementById('aiInsight').textContent = appState.mediaMode === 'radio' ? t('clickCountryRadio') : t('clickCountryChannels');
    document.getElementById('channelGrid').innerHTML = `<p class="muted">${appState.mediaMode === 'radio' ? t('radioWillAppear') : t('channelsWillAppear')}</p>`;
    setGlobeStatus(t('ready'), t('readyDetail'));
  }

  updateMediaLabels();
  applyDeveloperLanguage();
  document.getElementById('newspaperReaderTitle').textContent = nt('readerTitle');
  document.getElementById('newspaperReaderOpen').textContent = nt('open');
  document.getElementById('newspaperFrame').title = nt('readerTitle');
  document.querySelector('.newspaper-reader p').textContent = nt('frameNote');
  if (appState.mediaMode === 'newspapers') {
    const newspaperCountryName = appState.selectedNewspaperCountry
      ? getNewspaperCountryDisplayName(appState.selectedNewspaperCountry)
      : null;
    document.getElementById('heroCountry').textContent = newspaperCountryName || nt('title');
    document.getElementById('countryTitle').textContent = newspaperCountryName || nt('select');
  }
  renderCountries();
  renderChannels();
  ['about', 'privacy', 'faq', 'feedback'].forEach(renderInfoPage);
}

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
  <svg class="tv-logo" viewBox="0 0 104 78" aria-hidden="true">
    <defs>
      <linearGradient id="tvLogoRed" x1="18" y1="10" x2="88" y2="72" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ff3b32"/>
        <stop offset="0.45" stop-color="#ff0800"/>
        <stop offset="1" stop-color="#b90000"/>
      </linearGradient>
      <linearGradient id="tvLogoGloss" x1="18" y1="30" x2="82" y2="64" gradientUnits="userSpaceOnUse">
        <stop stop-color="#ffffff" stop-opacity="0.45"/>
        <stop offset="0.32" stop-color="#ffffff" stop-opacity="0.1"/>
        <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect x="23" y="66" width="15" height="6" rx="4" fill="#bd0000"/>
    <rect x="65" y="66" width="15" height="6" rx="4" fill="#bd0000"/>
    <rect x="28" y="13" width="8" height="29" rx="4" fill="#ff0800" transform="rotate(-27 32 27.5)"/>
    <rect x="68" y="13" width="8" height="29" rx="4" fill="#ff0800" transform="rotate(27 72 27.5)"/>
    <circle cx="25" cy="12" r="10" fill="url(#tvLogoRed)"/>
    <circle cx="79" cy="12" r="10" fill="url(#tvLogoRed)"/>
    <circle cx="22" cy="9" r="4" fill="#fff" opacity="0.9"/>
    <circle cx="76" cy="9" r="4" fill="#fff" opacity="0.9"/>
    <path d="M40 35a12 12 0 0 1 24 0Z" fill="url(#tvLogoRed)"/>
    <rect x="8" y="30" width="88" height="40" rx="13" fill="url(#tvLogoRed)"/>
    <rect x="13" y="35" width="78" height="30" rx="9" fill="none" stroke="#070707" stroke-width="5"/>
    <path d="M13 35h78v12C68 48 48 55 13 65Z" fill="url(#tvLogoGloss)"/>
    <text x="23" y="59" fill="#050505" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="31" font-weight="900">TV</text>
  </svg>
`;

const appState = {
  countries: [],
  availableCountryCodes: new Set(),
  selectedCountry: null,
  mediaMode: 'tv',
  selectedCategory: 'all',
  newspaperCategory: 'all',
  globalMode: false,
  renderLimit: INITIAL_CHANNEL_RENDER_LIMIT,
  hoveredCountry: null,
  query: '',
  channelQuery: '',
  currentChannels: [],
  newspapers: [],
  newspaperCountries: [],
  currentNewspapers: [],
  selectedNewspaperCountry: null,
  renderedChannels: [],
  aiChannels: null,
  aiInsight: '',
  videoReadyPromise: null,
  failedStreams: new Set(),
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
      <button class="icon-button" id="menuButton" aria-label="${t('openMenu')}">${icons.menu}</button>
      <div class="brand"><span class="brand-mark">${brandLogo}</span><strong><span class="brand-watch">Watch</span>Nations</strong></div>
      <div class="top-actions">
        <label class="language-picker" title="Language">
          <select id="languageSelect" aria-label="Language">
            ${supportedLanguages.map(([code, label]) => `<option value="${code}" ${code === currentLanguage ? 'selected' : ''}>${label}</option>`).join('')}
          </select>
        </label>
        <button class="icon-button" id="focusGlobeButton" title="${t('focusGlobe')}">${icons.globe}</button>
        <button class="icon-button" id="randomButton" title="${t('randomCountry')}">${icons.spark}</button>
        <button class="icon-button" id="searchFocusButton" title="${t('search')}">${icons.search}</button>
      </div>
    </header>

    <aside class="left-nav" id="leftNav">
      <button class="close-menu" id="closeMenu" aria-label="${t('closeMenu')}">${icons.close}</button>
      <div class="nav-section">
        ${primaryNavItems.map(([action, label, icon, category]) => (
          category
            ? `<a class="nav-link" data-category="${category}">${icons[icon]} <span>${tCategory(category)}</span></a>`
            : `<a class="nav-link" data-action="${action}">${icons[icon]} <span>${t(action)}</span></a>`
        )).join('')}
      </div>
      <div class="nav-title">${t('explore')}</div>
      <div class="nav-section nav-section-explore">
        ${categories.map(([id, label, icon]) => `<a class="nav-link" data-category="${id}">${icons[icon]} <span>${tCategory(id)}</span></a>`).join('')}
      </div>
      <div class="nav-section nav-section-footer">
        ${footerNavItems.map(([action, label, icon]) => `<a class="nav-link" data-action="${action}">${icons[icon]} <span>${t(action)}</span></a>`).join('')}
      </div>
    </aside>

    <section class="hero">
      <div class="mode-switch">
        <button class="active" id="tvMode">${t('tv')}</button>
        <button id="radioMode">${t('radio')}</button>
        <button id="newspapersMode">${t('newspapers')}</button>
      </div>
      <div class="globe-stage" id="globeStage"></div>
      <div class="globe-controls" aria-label="${t('globeZoomControls')}">
        <button class="icon-button" id="zoomInButton" title="${t('zoomIn')}">+</button>
        <button class="icon-button" id="zoomOutButton" title="${t('zoomOut')}">-</button>
        <button class="icon-button" id="zoomResetButton" title="${t('resetZoom')}">${icons.globe}</button>
      </div>
      <div class="globe-label" id="globeLabel">${t('clickCountry')}</div>
      <div class="globe-aim" id="globeAim"></div>
      <div class="globe-status" id="globeStatus"><strong>${t('ready')}</strong><span>${t('readyDetail')}</span></div>
      <div class="hero-card">
        <span>${icons.bolt} ${t('fastMode')}</span>
        <strong id="heroCountry">${t('chooseFromGlobe')}</strong>
        <small>${t('heroHint')}</small>
      </div>
      <button class="hint" id="openPanelHint"><span>${t('chooseCountry')}</span>${icons.arrow}</button>
    </section>

    <aside class="country-panel" id="countryPanel">
      <div class="panel-head">
        <div><small>WatchNations</small><h1 id="countryTitle">${t('selectCountry')}</h1></div>
        <div class="panel-actions">
          <button class="change-country" id="changeCountryButton">${t('changeCountry')}</button>
          <strong id="clock"></strong>
        </div>
      </div>
      <section class="country-picker" id="countryPicker">
        <label class="search-box">${icons.search}<input id="countrySearch" placeholder="${t('searchCountry')}" /></label>
        <div class="country-list" id="countryList"><p class="muted">${t('loadingCountries')}</p></div>
      </section>
      <div class="channels">
        <section class="player-panel" id="playerPanel">
          <div class="player-head">
            <strong id="playerTitle">${t('selectChannel')}</strong>
            <button class="mini-text-button" id="pipPlayerButton" title="${t('pip')}">PiP</button>
            <button class="mini-button" id="closePlayerButton" title="${t('close')}">${icons.close}</button>
          </div>
          <video id="livePlayer" class="video-js vjs-default-skin" controls preload="none" playsinline></video>
          <audio id="radioPlayer" controls preload="none"></audio>
        </section>
        <section class="newspaper-reader" id="newspaperReader" aria-hidden="true">
          <div class="newspaper-reader-head">
            <strong id="newspaperReaderTitle">${nt('readerTitle')}</strong>
            <a class="mini-text-button" id="newspaperReaderOpen" target="_blank" rel="noopener noreferrer">${nt('open')}</a>
            <button class="mini-button" id="closeNewspaperReader" title="${t('close')}">${icons.close}</button>
          </div>
          <p>${nt('frameNote')}</p>
          <iframe id="newspaperFrame" title="${nt('readerTitle')}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
        </section>
        <div class="channels-head">
          <div><h2 id="mediaTitle">${t('freeChannels')}</h2><small id="aiInsight">${t('smartReady')}</small></div>
          <div class="channels-tools">
            <span id="channelCount">0</span>
          </div>
        </div>
        <label class="search-box channel-search">${icons.search}<input id="channelSearch" placeholder="${t('searchChannels')}" /></label>
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
        <p>At WatchNations, we care about your privacy and want you to feel safe while using our platform. This Privacy Policy explains how we handle data, external links, cookies, analytics, and your browsing experience.</p>
        <h3>Introduction</h3>
        <p>Your privacy is important to us. This policy explains how WatchNations operates and how we protect users while they explore free live TV channels from around the world.</p>
        <p>By using WatchNations, you agree to the terms described in this Privacy Policy.</p>
        <h3>External Links</h3>
        <p>WatchNations may contain links to external video streams hosted on third-party websites or public platforms.</p>
        <p>While we try to organize and display publicly available sources in good faith, we do not own, host, or control these external websites or streams. Therefore, WatchNations is not responsible for the privacy practices, content, or policies of third-party websites.</p>
        <p>We recommend reviewing the privacy policies of any external websites you visit through WatchNations.</p>
        <h3>No Display Advertising</h3>
        <p>WatchNations currently keeps the main browsing interface focused on media discovery without sponsored display blocks.</p>
        <p>If sponsorship features are added in the future, this policy will be updated clearly before those features are enabled.</p>
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
        <p>WatchNations does not intentionally embed third-party trackers except for services related to analytics or basic website functionality.</p>
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
        <p>WatchNations does not require an account, subscription, or signup to browse the available media guide.</p>
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
  <div class="developer-modal" id="developerModal" aria-hidden="true">
    <div class="developer-backdrop" data-close-developer></div>
    <section class="developer-dialog" role="dialog" aria-modal="true" aria-labelledby="developerTitle" lang="en" dir="ltr">
      <button class="mini-button developer-close" id="developerCloseButton" title="Close">${icons.close}</button>
      <div class="developer-copy">
        <div class="developer-kicker">Developer Area</div>
        <h2 id="developerTitle">WatchNations Developer</h2>
        <form class="developer-login" id="developerLoginForm">
          <label>Access code<input id="developerPassword" type="password" autocomplete="current-password" placeholder="Enter code" /></label>
          <button class="developer-primary" type="submit">Open developer page</button>
        </form>
        <section class="developer-panel" id="developerPanel" hidden>
          <div class="developer-stats">
            <div>
              <small>Real visitors</small>
              <strong id="developerVisitors">0</strong>
            </div>
            <div>
              <small>Total visits</small>
              <strong id="developerTotalVisits">0</strong>
            </div>
          </div>
          <p class="developer-meta" id="developerLastVisit">Last visit: -</p>
          <form class="developer-code-form" id="developerCodeForm">
            <label>Current code<input id="developerCurrentCode" type="password" autocomplete="current-password" /></label>
            <label>New code<input id="developerNewCode" type="password" autocomplete="new-password" minlength="4" /></label>
            <button class="developer-primary" type="submit">Change code</button>
          </form>
        </section>
        <p class="developer-message" id="developerMessage" aria-live="polite"></p>
      </div>
    </section>
  </div>
`;

const leftNav = document.getElementById('leftNav');
const menuButton = document.getElementById('menuButton');
const closeMenu = document.getElementById('closeMenu');
const countrySearch = document.getElementById('countrySearch');
const channelSearch = document.getElementById('channelSearch');
const languageSelect = document.getElementById('languageSelect');
const countryList = document.getElementById('countryList');
const channelGrid = document.getElementById('channelGrid');
const countryPanel = document.getElementById('countryPanel');
const changeCountryButton = document.getElementById('changeCountryButton');
const closePlayerButton = document.getElementById('closePlayerButton');
const pipPlayerButton = document.getElementById('pipPlayerButton');
const closeNewspaperReaderButton = document.getElementById('closeNewspaperReader');
const aboutModal = document.getElementById('aboutModal');
const aboutCloseButton = document.getElementById('aboutCloseButton');
const privacyModal = document.getElementById('privacyModal');
const privacyCloseButton = document.getElementById('privacyCloseButton');
const faqModal = document.getElementById('faqModal');
const faqCloseButton = document.getElementById('faqCloseButton');
const feedbackModal = document.getElementById('feedbackModal');
const feedbackCloseButton = document.getElementById('feedbackCloseButton');
const developerModal = document.getElementById('developerModal');
const developerCloseButton = document.getElementById('developerCloseButton');
const developerLoginForm = document.getElementById('developerLoginForm');
const developerCodeForm = document.getElementById('developerCodeForm');

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
document.getElementById('newspapersMode').addEventListener('click', () => setMediaMode('newspapers'));
languageSelect.addEventListener('change', (event) => setLanguage(event.target.value));
makePlayerPanelDraggable();
changeCountryButton.addEventListener('click', () => {
  countryPanel.classList.remove('channels-only');
  countrySearch.focus();
});
closePlayerButton.addEventListener('click', closePlayer);
pipPlayerButton.addEventListener('click', requestPlayerPictureInPicture);
closeNewspaperReaderButton.addEventListener('click', closeNewspaperReader);
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
developerCloseButton.addEventListener('click', closeDeveloperModal);
developerModal.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-developer]')) closeDeveloperModal();
});
developerLoginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  loginDeveloper();
});
developerCodeForm.addEventListener('submit', (event) => {
  event.preventDefault();
  changeDeveloperCode();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'F10') {
    event.preventDefault();
    openDeveloperModal();
  }
  if (event.key === 'Escape' && aboutModal.classList.contains('open')) closeAboutModal();
  if (event.key === 'Escape' && privacyModal.classList.contains('open')) closePrivacyModal();
  if (event.key === 'Escape' && faqModal.classList.contains('open')) closeFaqModal();
  if (event.key === 'Escape' && feedbackModal.classList.contains('open')) closeFeedbackModal();
  if (event.key === 'Escape' && developerModal.classList.contains('open')) closeDeveloperModal();
});

scheduleIdleTask(trackRealVisitor, 8000);

countrySearch.addEventListener('input', (event) => {
  appState.query = event.target.value;
  scheduleCountryRender();
});
channelSearch.addEventListener('input', (event) => {
  appState.channelQuery = event.target.value;
  appState.aiChannels = null;
  appState.renderLimit = INITIAL_CHANNEL_RENDER_LIMIT;
  scheduleChannelRender();
});
countryList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-code]');
  if (button) selectCountryByCode(button.dataset.code, { keepPicker: false, source: 'search' });
});
countryList.addEventListener('error', (event) => {
  if (event.target.matches('.country-flag img')) event.target.hidden = true;
}, true);
channelGrid.addEventListener('click', (event) => {
  const favoriteButton = event.target.closest('[data-favorite-index]');
  if (favoriteButton) {
    toggleFavorite(getRenderedChannel(favoriteButton.dataset.favoriteIndex));
    return;
  }
  const playButton = event.target.closest('.play-channel');
  if (playButton) {
    const channel = getRenderedChannel(playButton.dataset.channelIndex)
      || { url: playButton.dataset.url, name: playButton.dataset.title, id: playButton.dataset.id, type: playButton.dataset.type };
    playChannel(channel.url, channel.name, {
      channel,
      id: channel.id,
      type: channel.type || playButton.dataset.type
    });
    return;
  }
  if (event.target.closest('[data-load-more-channels]')) {
    appState.renderLimit += CHANNEL_RENDER_INCREMENT;
    renderChannels();
    return;
  }
  const readButton = event.target.closest('[data-read-newspaper]');
  if (readButton) {
    openNewspaperReader(readButton.dataset.url, readButton.dataset.title);
  }
});
channelGrid.addEventListener('error', (event) => {
  if (!event.target.matches('.channel-logo img')) return;
  event.target.hidden = true;
  event.target.closest('.channel-logo')?.classList.add('show-fallback');
}, true);
leftNav.addEventListener('click', (event) => {
  const link = event.target.closest('.nav-link');
  if (!link) return;

  if (link.dataset.category) {
    handleCategoryNavigation(link.dataset.category).catch(() => {
      document.getElementById('channelCount').textContent = '0';
      document.getElementById('aiInsight').textContent = t('couldNotLoadChannels');
      document.getElementById('channelGrid').innerHTML = `<p class="muted">${t('channelsCouldNotLoad')}</p>`;
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
  if (appState.mediaMode === 'newspapers') {
    appState.newspaperCategory = 'all';
    renderNewspapers();
    leftNav.classList.remove('open');
    return;
  }
  appState.selectedCategory = categoryId;
  appState.aiChannels = null;
  appState.channelQuery = '';
  appState.renderLimit = INITIAL_CHANNEL_RENDER_LIMIT;
  channelSearch.value = '';
  leftNav.classList.remove('open');

  if (categoryId === 'favorites') {
    appState.globalMode = false;
    countryPanel.classList.add('channels-only');
    document.getElementById('countryTitle').textContent = t('favorites');
    document.getElementById('heroCountry').textContent = t('favorites');
    document.getElementById('mediaTitle').textContent = appState.mediaMode === 'radio' ? t('favoriteRadio') : t('favoriteChannels');
    renderChannels();
    requestPythonAI();
    return;
  }

  if (appState.mediaMode === 'radio') {
    if (!appState.currentChannels.length && !appState.selectedCountry) {
      document.getElementById('countryTitle').textContent = t('selectCountry');
      document.getElementById('aiInsight').textContent = t('chooseCountryRadioFirst');
      document.getElementById('channelGrid').innerHTML = `<p class="muted">${t('chooseCountryRadioFirstBody')}</p>`;
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
  appState.renderLimit = INITIAL_CHANNEL_RENDER_LIMIT;
  countryPanel.classList.add('channels-only');
  document.getElementById('countryTitle').textContent = label;
  document.getElementById('heroCountry').textContent = label;
  document.getElementById('channelCount').textContent = '...';
  document.getElementById('aiInsight').textContent = categoryId === 'all'
    ? t('loadingChannelsAll')
    : t('loadingCategoryAll', { label });
  document.getElementById('channelGrid').innerHTML = skeletonCards();
  setGlobeStatus(label, t('loadingChannelsAll'));

  try {
    appState.currentChannels = await loadGlobalCategoryChannels(categoryId);
    const filteredCount = smartFilterChannels(appState.currentChannels).length;
    appState.aiInsight = t('mediaAvailable', { count: filteredCount, label: categoryId === 'all' ? mediaTypeLabel('tv') : label });
    setGlobeStatus(label, t('mediaAvailable', { count: filteredCount, label: mediaTypeLabel('tv') }));
    renderCountries();
    renderChannels();
  } catch (error) {
    appState.currentChannels = [];
    document.getElementById('channelCount').textContent = '0';
    document.getElementById('aiInsight').textContent = t('couldNotLoadGlobal');
    document.getElementById('channelGrid').innerHTML = `<p class="muted">${t('globalCouldNotLoad')}</p>`;
  }
}

function categoryLabel(categoryId) {
  return tCategory(categoryId) || t('freeChannels');
}

setInterval(updateClock, 1000);
updateClock();
updateMediaLabels();
showGlobeLoading();
loadCountries();
scheduleIdleTask(initGlobe, 1600);
applyLanguage();

function scheduleIdleTask(task, timeout = 4000) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(task, { timeout });
    return;
  }
  setTimeout(task, Math.min(timeout, 3000));
}

async function initGlobe() {
  showGlobeLoading();
  try {
    if ('connection' in navigator && navigator.connection?.saveData) {
      setGlobeStatus(t('ready'), t('chooseFromGlobe'));
      return;
    }
  } catch (error) {
    // Keep the globe enabled if the Network Information API is unavailable.
  }

  await nextFrame();
  const mount = document.getElementById('globeStage');

  try {
    const threeModule = await loadGlobeModules();
    THREE = threeModule;
    mount.innerHTML = '';
    createGlobe();
  } catch (error) {
    mount.innerHTML = `<div class="globe-loading error-state"><span>${brandLogo}</span><strong>${t('globeError')}</strong></div>`;
  }
}

function showGlobeLoading() {
  const mount = document.getElementById('globeStage');
  if (!mount || mount.dataset.loadingReady === 'true') return;
  mount.dataset.loadingReady = 'true';
  mount.innerHTML = `<div class="globe-loading"><span>${brandLogo}</span><strong>${t('loadingGlobe')}</strong></div>`;
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
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
    const initialCountryCode = normalizeCountryCode(new URLSearchParams(window.location.search).get('country'));
    if (initialCountryCode && isAvailableCountryCode(initialCountryCode)) {
      selectCountryByCode(initialCountryCode, { keepPicker: false, source: 'url', silent: true });
      return;
    }
    const initialCategory = normalize(new URLSearchParams(window.location.search).get('category')).replace(/\s+/g, '-');
    if (initialCategory && categoryIds.has(initialCategory)) {
      handleCategoryNavigation(initialCategory).catch(() => {});
      return;
    }
    if (!appState.selectedCountry && !appState.globalMode) {
      document.getElementById('countryTitle').textContent = t('selectCountry');
      document.getElementById('heroCountry').textContent = t('chooseFromGlobe');
      document.getElementById('aiInsight').textContent = t('clickCountryChannels');
      document.getElementById('channelGrid').innerHTML = `<p class="muted">${t('channelsWillAppear')}</p>`;
    }
  } catch (error) {
    document.getElementById('countryList').innerHTML =
      `<p class="error">${t('channelsCouldNotLoad')}</p>`;
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
  appState.renderLimit = INITIAL_CHANNEL_RENDER_LIMIT;
  channelSearch.value = '';
  document.getElementById('countryTitle').textContent = country.name;
  document.getElementById('heroCountry').textContent = country.name;
  const mediaLabel = mediaTypeLabel();
  setGlobeStatus(country.name, `${country.flag || flag(country.code)} Loading ${mediaLabel}`);
  document.getElementById('channelCount').textContent = '...';
  document.getElementById('aiInsight').textContent = options.fromGlobe ? t('selectedFromGlobe') : t('loadingMediaForCountry', { label: mediaLabel });
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
    setGlobeStatus(country.name, `${country.flag || flag(country.code)} ${t('mediaAvailable', { count: appState.currentChannels.length, label: mediaLabel })}`);
    renderChannels();
    requestPythonAI();
    if (appState.mediaMode === 'tv') mergeIptvApiChannels(country).catch(() => {});
  } catch (error) {
    appState.currentChannels = [];
    document.getElementById('channelCount').textContent = '0';
    document.getElementById('aiInsight').textContent = t('noMediaFound', { label: mediaLabel });
    setGlobeStatus(country.name, `${country.flag || flag(country.code)} ${t('noMediaFound', { label: mediaLabel })}`);
    document.getElementById('channelGrid').innerHTML =
      `<p class="muted">${t('noMediaFoundDetail', { label: escapeHtml(mediaLabel) })}</p>`;
  }
}

function setMediaMode(mode) {
  if (!['tv', 'radio', 'newspapers'].includes(mode) || appState.mediaMode === mode) return;
  appState.mediaMode = mode;
  appState.globalMode = false;
  appState.aiChannels = null;
  appState.aiInsight = '';
  appState.channelQuery = '';
  appState.renderLimit = INITIAL_CHANNEL_RENDER_LIMIT;
  channelSearch.value = '';
  closePlayer();
  if (mode !== 'newspapers') closeNewspaperReader();
  countryPanel.classList.toggle('newspapers-only', mode === 'newspapers');
  updateMediaLabels();
  document.getElementById('tvMode').classList.toggle('active', mode === 'tv');
  document.getElementById('radioMode').classList.toggle('active', mode === 'radio');
  document.getElementById('newspapersMode').classList.toggle('active', mode === 'newspapers');
  showToast(mode === 'radio' ? t('radioActive') : (mode === 'newspapers' ? nt('title') : t('tvActive')));
  if (mode === 'newspapers') {
    openNewspapersMode();
    return;
  }
  if (appState.selectedCountry) {
    selectCountry(appState.selectedCountry, { keepPicker: false, silent: true });
  } else {
    document.getElementById('aiInsight').textContent =
      mode === 'radio' ? t('clickCountryRadio') : t('clickCountryChannels');
    document.getElementById('channelGrid').innerHTML =
      `<p class="muted">${mode === 'radio' ? t('radioWillAppear') : t('channelsWillAppear')}</p>`;
  }
}

function updateMediaLabels() {
  const isRadio = appState.mediaMode === 'radio';
  const isNewspapers = appState.mediaMode === 'newspapers';
  document.getElementById('mediaTitle').textContent = isNewspapers ? nt('title') : (isRadio ? t('freeRadio') : t('freeChannels'));
  document.getElementById('playerTitle').textContent = isRadio ? t('selectRadio') : t('selectChannel');
  channelSearch.placeholder = isNewspapers ? nt('search') : (isRadio ? t('searchRadio') : t('searchChannels'));
}

async function loadCountryMedia(code) {
  return appState.mediaMode === 'radio' ? loadRadioStations(code) : loadCountryChannels(code);
}

async function openNewspapersMode() {
  countryPanel.classList.remove('channels-only');
  countryPanel.classList.add('newspapers-only');
  document.getElementById('countryTitle').textContent = nt('select');
  document.getElementById('heroCountry').textContent = nt('title');
  document.getElementById('aiInsight').textContent = nt('loading');
  document.getElementById('channelCount').textContent = '...';
  channelGrid.innerHTML = skeletonCards();
  setGlobeStatus(nt('title'), nt('hint'));
  await loadNewspapers();
  renderCountries();
  if (appState.selectedNewspaperCountry) {
    selectNewspaperCountry(appState.selectedNewspaperCountry.key, { silent: true });
  } else {
    document.getElementById('channelCount').textContent = String(appState.newspapers.length);
    document.getElementById('aiInsight').textContent = nt('hint');
    channelGrid.innerHTML = `<p class="muted">${nt('hint')}</p>`;
  }
}

async function loadNewspapers() {
  if (appState.newspapers.length) return appState.newspapers;
  const response = await fetch(NEWSPAPERS_DATA, { signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error('Newspapers data failed');
  const data = await response.json();
  appState.newspapers = Array.isArray(data.items) ? data.items.map(sanitizeNewspaper).filter((item) => item.url) : [];
  const byCountry = new Map();
  appState.newspapers.forEach((item) => {
    const key = item.countryCode || item.country;
    if (!byCountry.has(key)) {
      byCountry.set(key, {
        key,
        code: item.countryCode,
        name: item.country,
        nameEn: item.countryEn,
        continent: item.continent,
        count: 0
      });
    }
    byCountry.get(key).count += 1;
  });
  appState.newspaperCountries = [...byCountry.values()].sort((a, b) => a.name.localeCompare(b.name));
  return appState.newspapers;
}

function sanitizeNewspaper(item) {
  return {
    id: String(item?.id || '').slice(0, 40),
    continent: String(item?.continent || '').slice(0, 80),
    country: String(item?.country || '').slice(0, 120),
    countryEn: String(item?.countryEn || '').slice(0, 120),
    countryCode: normalizeCountryCode(item?.countryCode || ''),
    category: String(item?.category || 'general').slice(0, 40),
    categoryAr: String(item?.categoryAr || '').slice(0, 80),
    categoryEn: String(item?.categoryEn || '').slice(0, 80),
    name: String(item?.name || '').slice(0, 180),
    url: sanitizeUrl(item?.url),
    domain: String(item?.domain || '').slice(0, 120),
    sourceType: String(item?.sourceType || '').slice(0, 100),
    official: Boolean(item?.official),
    language: String(item?.language || '').slice(0, 80),
    description: String(item?.description || '').slice(0, 240)
  };
}

function getNewspaperCountryDisplayName(countryOrItem) {
  if (!countryOrItem) return nt('title');
  const code = normalizeCountryCode(countryOrItem.code || countryOrItem.countryCode || '');
  const knownCountry = code ? findCountryByCode(code) : null;
  if (currentLanguage === 'ar') {
    return countryOrItem.name || countryOrItem.country || countryOrItem.nameEn || knownCountry?.name || code || nt('title');
  }
  return countryOrItem.nameEn || knownCountry?.name || countryOrItem.countryEn || countryOrItem.name || countryOrItem.country || code || nt('title');
}

function newspaperCategoryName(category) {
  return newspaperLocale[currentLanguage]?.categoryNames?.[category]
    || newspaperLocale.en.categoryNames[category]
    || nt(category);
}

function newspaperDescription(item) {
  const country = getNewspaperCountryDisplayName({
    code: item.countryCode,
    countryCode: item.countryCode,
    name: item.country,
    nameEn: item.countryEn
  });
  const template = newspaperLocale[currentLanguage]?.description || newspaperLocale.en.description;
  return template
    .replace('{name}', item.name || item.domain || nt('source'))
    .replace('{category}', newspaperCategoryName(item.category))
    .replace('{country}', country);
}

function newspaperMeta(item) {
  const sourceLabel = item.official ? nt('official') : (newspaperLocale[currentLanguage]?.sourceMeta || nt('source'));
  return [item.domain, sourceLabel, item.language].filter(Boolean).join(' - ');
}

function selectNewspaperCountry(key, options = {}) {
  const country = appState.newspaperCountries.find((item) => item.key === key || item.code === key || item.name === key);
  if (!country) return;
  const countryName = getNewspaperCountryDisplayName(country);
  appState.selectedNewspaperCountry = country;
  appState.currentNewspapers = appState.newspapers.filter((item) => (item.countryCode || item.country) === country.key);
  appState.channelQuery = '';
  appState.newspaperCategory = 'all';
  channelSearch.value = '';
  countryPanel.classList.add('channels-only', 'newspapers-only');
  document.getElementById('countryTitle').textContent = countryName;
  document.getElementById('heroCountry').textContent = countryName;
  document.getElementById('aiInsight').textContent = nt('loaded', { count: appState.currentNewspapers.length });
  document.getElementById('channelCount').textContent = String(appState.currentNewspapers.length);
  if (country.code) focusCountry(country.code);
  if (!options.silent) leftNav.classList.remove('open');
  renderCountries();
  renderNewspapers();
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
  if (appState.mediaMode === 'newspapers') {
    await loadNewspapers();
    selectNewspaperCountry(rawCode, options);
    return;
  }
  const code = normalizeCountryCode(rawCode);
  debugCountrySelection(rawCode, code, options.source || 'unknown');
  if (!isAvailableCountryCode(code)) {
    showToast(t('countryUnavailable'));
    return;
  }

  const country = findCountryByCode(code);
  if (!country) {
    showToast(t('countryLoading'));
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
  setGlobeStatus(country.name, `${country.flag || flag(code)} ${t('mediaAvailable', { count: merged.length, label: mediaTypeLabel('tv') })}`);
  appState.aiInsight = t('mediaAvailable', { count: merged.length, label: mediaTypeLabel('tv') });
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
    showToast(t('globalTvOnly'));
    return;
  }
  appState.globalMode = true;
  appState.selectedCountry = null;
  appState.currentChannels = [];
  appState.aiChannels = null;
  appState.aiInsight = '';
  appState.channelQuery = '';
  appState.renderLimit = INITIAL_CHANNEL_RENDER_LIMIT;
  channelSearch.value = '';
  countryPanel.classList.add('channels-only');
  document.getElementById('countryTitle').textContent = t('allChannels');
  document.getElementById('heroCountry').textContent = t('allChannels');
  document.getElementById('channelCount').textContent = '...';
  document.getElementById('aiInsight').textContent = t('loadingChannelsAll');
  document.getElementById('channelGrid').innerHTML = skeletonCards();
  setGlobeStatus(t('allChannels'), t('loadingChannelsAll'));

  try {
    appState.currentChannels = await loadGlobalIptvChannels();
    appState.aiInsight = t('loadedStreams', { count: appState.currentChannels.length });
    setGlobeStatus(t('allChannels'), t('streamsLoaded', { count: appState.currentChannels.length }));
    renderCountries();
    renderChannels();
  } catch (error) {
    appState.currentChannels = [];
    document.getElementById('channelCount').textContent = '0';
    document.getElementById('aiInsight').textContent = t('globalIndexError');
    document.getElementById('channelGrid').innerHTML = `<p class="muted">${t('globalIndexErrorBody')}</p>`;
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
    const channels = Array.isArray(data.channels) ? dedupeChannels(data.channels) : [];
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
  const byChannel = new Map();
  channels
    .map(sanitizeChannel)
    .filter((channel) => channel.url && isLikelyPlayableTvUrl(channel.url, channel.type))
    .sort((a, b) => channelReliabilityScore(b) - channelReliabilityScore(a) || a.name.localeCompare(b.name))
    .forEach((channel) => {
      const stableId = /^[A-Z]{2}-\d+$/i.test(channel.id) ? '' : channel.id;
      const key = `${normalize(stableId || channel.name)}|${normalizeCountryCode(channel.country)}`;
      const existing = byChannel.get(key);
      if (!existing) {
        byChannel.set(key, { ...channel, alternateUrls: collectAlternateUrls(channel) });
        return;
      }
      const alternates = new Set([...(existing.alternateUrls || []), ...collectAlternateUrls(channel)]);
      existing.alternateUrls = [...alternates].slice(0, 8);
      if (channelReliabilityScore(channel) > channelReliabilityScore(existing)) {
        byChannel.set(key, { ...channel, alternateUrls: existing.alternateUrls });
      }
    });
  return [...byChannel.values()].sort((a, b) => channelReliabilityScore(b) - channelReliabilityScore(a) || a.name.localeCompare(b.name));
}

function scheduleCountryRender() {
  clearTimeout(scheduleCountryRender.timer);
  scheduleCountryRender.timer = setTimeout(renderCountries, 80);
}

function scheduleChannelRender() {
  clearTimeout(scheduleChannelRender.timer);
  scheduleChannelRender.timer = setTimeout(() => {
    renderChannels();
    requestPythonAI();
  }, 120);
}

function renderCountries() {
  if (appState.mediaMode === 'newspapers') {
    renderNewspaperCountries();
    return;
  }
  const countries = smartRankCountries(appState.countries, appState.query);

  countryList.innerHTML = countries
    .map(
      (country) => `
        <button data-code="${escapeHtml(country.code)}" class="${country.code === appState.selectedCountry?.code ? 'selected' : ''}">
          <span class="country-flag" aria-hidden="true">
            <img src="${escapeHtml(flagImageUrl(country.code, 40))}" srcset="${escapeHtml(flagSrcSet(country.code, 40))}" alt="" loading="lazy" decoding="async" fetchpriority="low" />
            <span class="country-flag-fallback">${escapeHtml(country.code)}</span>
          </span>
          <span>${escapeHtml(country.name)}</span>
          <small>${escapeHtml(country.code)}</small>
        </button>
      `
    )
    .join('');
}

function renderNewspaperCountries() {
  const query = normalize(appState.query);
  const countries = appState.newspaperCountries
    .filter((country) => {
      const displayName = getNewspaperCountryDisplayName(country);
      return !query || normalize(`${displayName} ${country.name} ${country.nameEn} ${country.code || ''}`).includes(query);
    })
    .sort((a, b) => getNewspaperCountryDisplayName(a).localeCompare(getNewspaperCountryDisplayName(b)));
  countryList.innerHTML = countries
    .map((country) => {
      const displayName = getNewspaperCountryDisplayName(country);
      return `
        <button data-code="${escapeHtml(country.key)}" class="${country.key === appState.selectedNewspaperCountry?.key ? 'selected' : ''}">
          <span class="country-flag" aria-hidden="true">
            ${country.code ? `<img src="${escapeHtml(flagImageUrl(country.code, 40))}" srcset="${escapeHtml(flagSrcSet(country.code, 40))}" alt="" loading="lazy" decoding="async" fetchpriority="low" />` : ''}
            <span class="country-flag-fallback">${escapeHtml(country.code || 'NP')}</span>
          </span>
          <span>${escapeHtml(displayName)}</span>
          <small>${country.count}</small>
        </button>
      `;
    })
    .join('');
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
  if (appState.mediaMode === 'newspapers') {
    renderNewspapers();
    return;
  }
  syncFavoriteMetadata(appState.currentChannels);
  const channels = smartFilterChannels(appState.aiChannels || appState.currentChannels);

  document.getElementById('channelCount').textContent = channels.length;
  document.getElementById('aiInsight').textContent = appState.aiInsight || getInsight(channels);

  if (!channels.length) {
    const label = mediaTypeLabel();
    channelGrid.innerHTML = appState.selectedCategory === 'favorites'
      ? `<p class="muted">${t('noFavorites')}</p>`
      : `<p class="muted">${t('noMatch', { label })}</p>`;
    return;
  }

  const renderedChannels = channels.slice(0, appState.renderLimit);
  appState.renderedChannels = renderedChannels;

  channelGrid.innerHTML = renderedChannels
    .map(
      (channel, index) => `
        <article class="channel-card">
          ${channelLogoMarkup(channel)}
          <div>
            <strong>${escapeHtml(channel.name)}</strong>
            <small>${escapeHtml(channelMeta(channel))}</small>
          </div>
          <div class="channel-actions">
            <button class="mini-button favorite ${appState.favorites.has(channel.url) ? 'active' : ''}" data-favorite-index="${index}" title="${appState.favorites.has(channel.url) ? t('removeFavorite') : t('addFavorite')}">${icons.star}</button>
            <button class="mini-button play-channel" data-channel-index="${index}" data-url="${escapeHtml(sanitizeUrl(channel.url))}" data-title="${escapeHtml(channel.name)}" data-id="${escapeHtml(channel.id)}" data-type="${escapeHtml(channel.type || appState.mediaMode)}" title="${t('play')}">${icons.play}</button>
          </div>
        </article>
      `
    )
    .join('') + renderMoreChannelsButton(channels.length);
}

function renderNewspapers() {
  const query = normalize(appState.channelQuery);
  const categories = ['all', 'politics', 'economy', 'society', 'sports', 'technology'];
  let items = appState.currentNewspapers;
  if (appState.newspaperCategory !== 'all') items = items.filter((item) => item.category === appState.newspaperCategory);
  if (query) {
    items = items.filter((item) => normalize(`${item.name} ${item.domain} ${item.categoryAr} ${item.categoryEn} ${item.description} ${item.sourceType}`).includes(query));
  }
  document.getElementById('channelCount').textContent = String(items.length);
  document.getElementById('aiInsight').textContent = nt('loaded', { count: items.length });
  if (!appState.selectedNewspaperCountry) {
    channelGrid.innerHTML = `<p class="muted">${nt('hint')}</p>`;
    return;
  }
  const categoryBar = `
    <div class="newspaper-category-bar" aria-label="${nt('categories')}">
      ${categories.map((category) => `<button class="${category === appState.newspaperCategory ? 'active' : ''}" data-newspaper-category="${category}">${nt(category)}</button>`).join('')}
    </div>
  `;
  if (!items.length) {
    channelGrid.innerHTML = `${categoryBar}<p class="muted">${nt('empty')}</p>`;
    return;
  }
  channelGrid.innerHTML = categoryBar + items
    .slice(0, appState.renderLimit)
    .map((item) => `
      <article class="newspaper-card">
        <div class="newspaper-icon">${icons.news}</div>
        <div class="newspaper-body">
          <div class="newspaper-tags">
            <span>${escapeHtml(nt(item.category))}</span>
            ${item.official ? `<span>${escapeHtml(nt('official'))}</span>` : ''}
          </div>
          <strong><a class="newspaper-title-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.name)}</a></strong>
          <small><a class="newspaper-domain-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(newspaperMeta(item))}</a></small>
          <p>${escapeHtml(newspaperDescription(item))}</p>
          <div class="newspaper-actions">
            <button class="mini-text-button" data-read-newspaper data-url="${escapeHtml(item.url)}" data-title="${escapeHtml(item.name)}">${nt('read')}</button>
            <a class="mini-text-button" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${nt('open')}</a>
          </div>
        </div>
      </article>
    `)
    .join('') + renderMoreChannelsButton(items.length);
  channelGrid.querySelectorAll('[data-newspaper-category]').forEach((button) => {
    button.addEventListener('click', () => {
      appState.newspaperCategory = button.dataset.newspaperCategory;
      appState.renderLimit = INITIAL_CHANNEL_RENDER_LIMIT;
      renderNewspapers();
    });
  });
}

function openNewspaperReader(url, title) {
  const safe = sanitizeUrl(url);
  if (!safe) return;
  const reader = document.getElementById('newspaperReader');
  document.getElementById('newspaperReaderTitle').textContent = title || nt('readerTitle');
  document.getElementById('newspaperReaderOpen').href = safe;
  document.getElementById('newspaperFrame').src = safe;
  reader.classList.add('open');
  reader.setAttribute('aria-hidden', 'false');
}

function closeNewspaperReader() {
  const reader = document.getElementById('newspaperReader');
  if (!reader) return;
  reader.classList.remove('open');
  reader.setAttribute('aria-hidden', 'true');
  document.getElementById('newspaperFrame').src = 'about:blank';
}

function channelMeta(channel) {
  const country = findCountryByCode(channel.country);
  const parts = channel.type === 'radio'
    ? [country?.name || channel.country || '', channel.group || t('radio'), channel.quality || '']
    : [country?.name || channel.country || '', channel.group || tCategory('general'), channel.quality || ''];
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
      ${t('showMore', { count: Math.min(remaining, CHANNEL_RENDER_INCREMENT), remaining })}
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
      appState.aiInsight = t('mediaAvailable', { count: appState.aiChannels.length, label: mediaTypeLabel() });
      renderChannels();
    } catch (error) {
      appState.aiInsight = '';
    }
  }, 520);
}

function sanitizeChannel(channel) {
  const sourceCategory = String(channel?.sourceCategory || channel?.group || channel?.category || 'General').slice(0, 120);
  const alternateUrls = Array.isArray(channel?.alternateUrls)
    ? channel.alternateUrls.map(sanitizeUrl).filter(Boolean).slice(0, 8)
    : [];
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
    type: String(channel?.type || appState.mediaMode || 'tv').slice(0, 12),
    alternateUrls
  };
}

function collectAlternateUrls(channel) {
  const urls = [channel.url, ...(Array.isArray(channel.alternateUrls) ? channel.alternateUrls : [])]
    .map(sanitizeUrl)
    .filter(Boolean);
  return [...new Set(urls)].sort((a, b) => urlReliabilityScore(b) - urlReliabilityScore(a));
}

function isLikelyPlayableTvUrl(url, type = 'tv') {
  if (type === 'radio') return Boolean(url);
  const normalized = String(url || '').toLowerCase();
  if (!normalized) return false;
  if (normalized.includes('/youtube.com/') || normalized.includes('youtu.be/')) return false;
  if (normalized.includes('/facebook.com/') || normalized.includes('/twitch.tv/')) return false;
  if (/\.(m3u8|mpd|mp4)(?:[?#]|$)/i.test(normalized)) return true;
  return normalized.includes('m3u8') || normalized.includes('mpegts') || normalized.includes('playlist');
}

function urlReliabilityScore(url) {
  const normalized = String(url || '').toLowerCase();
  let score = 0;
  if (normalized.startsWith('https://')) score += 10;
  if (normalized.includes('.m3u8')) score += 12;
  if (normalized.includes('/index.m3u8') || normalized.includes('/playlist.m3u8')) score += 3;
  if (normalized.includes('.mpd')) score += 7;
  if (normalized.includes('.mp4')) score += 5;
  if (normalized.includes('token=') || normalized.includes('expires=') || normalized.includes('sig=')) score -= 4;
  if (normalized.includes('youtube') || normalized.includes('facebook') || normalized.includes('twitch')) score -= 40;
  return score;
}

function channelReliabilityScore(channel) {
  let score = urlReliabilityScore(channel.url);
  if (channel.quality) score += 2;
  if (channel.id) score += 1;
  if (Array.isArray(channel.alternateUrls) && channel.alternateUrls.length) score += Math.min(channel.alternateUrls.length, 4);
  return score;
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
  if (appState.selectedCategory === 'favorites') return t('mediaAvailable', { count: channels.length, label: appState.mediaMode === 'radio' ? t('favoriteRadio') : t('favoriteChannels') });
  if (appState.globalMode) return appState.aiInsight || t('loadedStreams', { count: channels.length });
  if (!appState.currentChannels.length) return appState.mediaMode === 'radio' ? t('clickCountryRadio') : t('clickCountryChannels');
  if (appState.channelQuery) return t('mediaAvailable', { count: channels.length, label: mediaTypeLabel() });
  const groups = new Set(channels.map((channel) => channel.group).filter(Boolean));
  return `${channels.length} ${mediaTypeLabel()} / ${groups.size || 1}`;
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
    showToast(t('removedFavorite'));
  } else {
    appState.favorites.add(favoriteChannel.url);
    appState.favoriteChannels.set(favoriteChannel.url, favoriteChannel);
    showToast(t('addedFavorite'));
  }

  saveFavorites();
  renderChannels();
}

function saveFavorites() {
  try {
    localStorage.setItem('watchnations:favorites', JSON.stringify([...appState.favorites]));
    localStorage.setItem('watchnations:favorite-channels', JSON.stringify([...appState.favoriteChannels.values()]));
  } catch (error) {
    showToast(t('favoritesFull'));
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
    showToast(appState.mediaMode === 'radio' ? t('noRadioAvailable') : t('noChannelsAvailable'));
    return;
  }
  const channel = channels[Math.floor(Math.random() * channels.length)];
  const url = sanitizeUrl(channel.url);
  if (!url) {
    showToast(t('unsafeChannel'));
    return;
  }
  playChannel(url, channel.name);
}

async function playChannel(rawUrl, rawTitle = 'Live TV', options = {}) {
  const candidateUrls = collectAlternateUrls({
    url: rawUrl,
    alternateUrls: options.channel?.alternateUrls || []
  }).filter((candidate) => !appState.failedStreams.has(candidate));
  const url = candidateUrls[0];
  if (!url) {
    showToast(t('unsafeStream'));
    return;
  }

  const playerPanel = document.getElementById('playerPanel');
  const playerTitle = document.getElementById('playerTitle');
  playerPanel.classList.add('open');
  playerTitle.textContent = rawTitle || (options.type === 'radio' ? t('radio') : t('tv'));

  if (options.type === 'radio' || appState.mediaMode === 'radio') {
    playRadio(url, rawTitle, options.id);
    return;
  }

  playerPanel.classList.remove('radio-player');
  showToast(t('loadingLiveStream'));

  try {
    document.getElementById('radioPlayer').pause();
    document.getElementById('radioPlayer').classList.remove('open');
    document.getElementById('livePlayer').classList.add('open');
    await ensureVideoPlayer();

    await playTvCandidate(candidateUrls, rawTitle, options);
  } catch (error) {
    showToast(t('playerError'));
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

async function playTvCandidate(urls, title, options = {}, attempt = 0) {
  const url = sanitizeUrl(urls[attempt]);
  if (!url) throw new Error('No playable TV URL');
  const player = appState.player;
  let fallbackTimer;
  let finished = false;
  const clearFallback = () => {
    finished = true;
    window.clearTimeout(fallbackTimer);
    player.off('loadedmetadata', clearFallback);
    player.off('playing', clearFallback);
  };
  const onError = () => {
    if (finished) return;
    finished = true;
    clearFallback();
    player.off('error', onError);
    appState.failedStreams.add(url);
    const nextAttempt = attempt + 1;
    if (nextAttempt < urls.length) {
      showToast(t('tryingAlternateStream'));
      playTvCandidate(urls, title, options, nextAttempt).catch(() => {
        showToast(t('playerError'));
        window.open(urls[nextAttempt], '_blank', 'noopener,noreferrer');
      });
      return;
    }
    showToast(t('playerError'));
  };

  player.off('error');
  player.one('error', onError);
  player.one('loadedmetadata', clearFallback);
  player.one('playing', clearFallback);
  fallbackTimer = window.setTimeout(onError, 10_000);
  player.src({ src: url, type: streamType(url) });
  player.ready(() => {
    const playResult = appState.player.play();
    if (playResult?.catch) {
      playResult.catch(() => {
        clearFallback();
        appState.failedStreams.add(url);
        if (attempt + 1 < urls.length) {
          showToast(t('tryingAlternateStream'));
          playTvCandidate(urls, title, options, attempt + 1);
          return;
        }
        showToast(t('pressPlayStream'));
      });
    }
  });
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
  showToast(t('loadingRadio', { title: title || mediaTypeLabel('radio') }));
  const playResult = audio.play();
  if (playResult?.catch) {
    playResult.catch(() => showToast(t('pressPlayRadio')));
  }
}

function closePlayer() {
  const playerPanel = document.getElementById('playerPanel');
  playerPanel.classList.remove('open');
  playerPanel.classList.remove('radio-player');
  document.getElementById('playerTitle').textContent = appState.mediaMode === 'radio' ? t('selectRadio') : t('selectChannel');
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
    showToast(t('pipTvOnly'));
    return;
  }

  try {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      return;
    }
    if (!document.pictureInPictureEnabled || typeof video.requestPictureInPicture !== 'function') {
      showToast(t('pipUnsupported'));
      return;
    }
    await video.requestPictureInPicture();
  } catch (error) {
    showToast(t('startVideoFirst'));
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
  renderInfoPage('about');
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
  renderInfoPage('privacy');
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
  renderInfoPage('faq');
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
  renderInfoPage('feedback');
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

function openDeveloperModal() {
  applyDeveloperLanguage();
  developerModal.classList.add('open');
  developerModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  setDeveloperMessage('');
  if (document.getElementById('developerPanel').hidden) {
    document.getElementById('developerPassword').focus();
  } else {
    refreshDeveloperStats();
    document.getElementById('developerCurrentCode').focus();
  }
}

function closeDeveloperModal() {
  developerModal.classList.remove('open');
  developerModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  developerLoginForm.hidden = false;
  document.getElementById('developerPanel').hidden = true;
  document.getElementById('developerPassword').value = '';
  document.getElementById('developerCurrentCode').value = '';
  document.getElementById('developerNewCode').value = '';
  setDeveloperMessage('');
}

async function loginDeveloper() {
  const passwordInput = document.getElementById('developerPassword');
  const password = passwordInput.value;
  setDeveloperMessage(t('checkingCode'));
  try {
    const result = await postJson('/api/developer/login', { password });
    if (!result.ok) throw new Error(result.error || t('wrongCode'));
    developerLoginForm.hidden = true;
    document.getElementById('developerPanel').hidden = false;
    document.getElementById('developerCurrentCode').value = password;
    passwordInput.value = '';
    renderDeveloperStats(result.stats);
    setDeveloperMessage(t('developerOpen'));
  } catch (error) {
    setDeveloperMessage(error.message || t('wrongCode'));
    passwordInput.select();
  }
}

async function changeDeveloperCode() {
  const currentInput = document.getElementById('developerCurrentCode');
  const newInput = document.getElementById('developerNewCode');
  const currentPassword = currentInput.value;
  const newPassword = newInput.value.trim();
  setDeveloperMessage(t('savingCode'));
  try {
    const result = await postJson('/api/developer/password', { currentPassword, newPassword });
    if (!result.ok) throw new Error(result.error || t('requestFailed'));
    currentInput.value = newPassword;
    newInput.value = '';
    renderDeveloperStats(result.stats);
    setDeveloperMessage(t('codeChanged'));
  } catch (error) {
    setDeveloperMessage(error.message || t('requestFailed'));
  }
}

async function refreshDeveloperStats() {
  const currentPassword = document.getElementById('developerCurrentCode').value;
  if (!currentPassword) return;
  try {
    const result = await postJson('/api/developer/login', { password: currentPassword });
    if (result.ok) renderDeveloperStats(result.stats);
  } catch (error) {
    setDeveloperMessage(t('refreshStatsError'));
  }
}

function applyDeveloperLanguage() {
  document.querySelector('.developer-kicker').textContent = t('developerArea');
  document.getElementById('developerTitle').textContent = t('developerTitle');
  document.querySelector('.developer-login label').firstChild.textContent = t('accessCode');
  document.getElementById('developerPassword').placeholder = t('enterCode');
  document.querySelector('#developerLoginForm .developer-primary').textContent = t('openDeveloper');
  const statLabels = document.querySelectorAll('.developer-stats small');
  if (statLabels[0]) statLabels[0].textContent = t('realVisitors');
  if (statLabels[1]) statLabels[1].textContent = t('totalVisits');
  const codeLabels = document.querySelectorAll('.developer-code-form label');
  if (codeLabels[0]) codeLabels[0].firstChild.textContent = t('currentCode');
  if (codeLabels[1]) codeLabels[1].firstChild.textContent = t('newCode');
  document.querySelector('#developerCodeForm .developer-primary').textContent = t('changeCode');
}

function renderDeveloperStats(stats = {}) {
  document.getElementById('developerVisitors').textContent = Number(stats.visitors || 0).toLocaleString();
  document.getElementById('developerTotalVisits').textContent = Number(stats.totalVisits || 0).toLocaleString();
  document.getElementById('developerLastVisit').textContent = t('lastVisit', { date: formatDeveloperDate(stats.lastVisitAt) });
}

function setDeveloperMessage(message) {
  document.getElementById('developerMessage').textContent = message;
}

function formatDeveloperDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

async function trackRealVisitor() {
  try {
    const key = 'watchnations:visitor-id';
    let visitorId = localStorage.getItem(key);
    if (!visitorId) {
      visitorId = window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(key, visitorId);
    }
    await postJson('/api/visitors/track', { visitorId });
  } catch (error) {
    // Visitor counting should never block the TV experience.
  }
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {})
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || t('requestFailed'));
  return result;
}

function navActionMessage(action) {
  const messages = {
    about: t('about'),
    embed: 'Embed tools will be available in the next build.',
    faq: t('faq'),
    privacy: t('privacy'),
    feedback: t('feedback')
  };
  return messages[action] || t('ready');
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

    const moroccoFeatures = [];

    appState.geojson.features.forEach((feature, index) => {
      const iso = getFeatureCountryCode(feature);
      if (!iso) return;
      const countryColor = countryDisplayColor(index, iso === selectedCode, iso);
      appState.globe.featureByCode.set(iso, feature);
      appState.countryCenters.set(iso, featureCenter(feature));
      if (isUnifiedMoroccoCode(iso)) moroccoFeatures.push({ feature, color: countryColor });

      ctx.beginPath();
      drawGeoFeature(ctx, feature, textureCanvas);
      ctx.fillStyle = countryColor;
      ctx.fill();
      if (isUnifiedMoroccoCode(iso)) return;
      ctx.strokeStyle = iso === selectedCode ? '#ffffff' : 'rgba(0, 0, 0, 0.72)';
      ctx.lineWidth = iso === selectedCode ? 3.2 : 1.15;
      ctx.stroke();
    });

    moroccoFeatures.forEach(({ feature, color }) => {
      ctx.beginPath();
      drawGeoFeature(ctx, feature, textureCanvas);
      ctx.fillStyle = color;
      ctx.fill();
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

function countryDisplayColor(index, selected, code = '') {
  if (selected) return '#f4fff0';
  const normalized = normalizeCountryCode(code);
  const colorIndex = normalized ? stableCountryColorIndex(normalized) : index;
  const base = palette[colorIndex % palette.length];
  return base;
}

function stableCountryColorIndex(code) {
  return [...code].reduce((total, char) => total + char.charCodeAt(0), 0);
}

function isUnifiedMoroccoCode(code = '') {
  return normalizeCountryCode(code) === 'MA';
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

function flagSrcSet(code, width = 80) {
  code = normalizeCountryCode(code).toLowerCase();
  if (!/^[a-z]{2}$/.test(code)) return '';
  const baseWidth = [40, 80, 120, 160].includes(Number(width)) ? Number(width) : 80;
  const doubleWidth = Math.min(baseWidth * 2, 320);
  const tripleWidth = Math.min(baseWidth * 3, 320);
  return [
    `https://flagcdn.com/w${baseWidth}/${code}.png 1x`,
    `https://flagcdn.com/w${doubleWidth}/${code}.png 2x`,
    `https://flagcdn.com/w${tripleWidth}/${code}.png 3x`
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
