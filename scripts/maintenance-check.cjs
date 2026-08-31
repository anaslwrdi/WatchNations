const { spawn } = require('child_process');

const port = 5197;
const baseUrl = `http://127.0.0.1:${port}`;
const productionUrl = 'https://watchnations.com';
const seoPlan = require('../data/seo-implementation-plan.json');
const server = spawn(process.execPath, ['server.cjs'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverOutput = '';
server.stdout.on('data', (chunk) => { serverOutput += chunk; });
server.stderr.on('data', (chunk) => { serverOutput += chunk; });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function waitForServer() {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/robots.txt`);
      if (response.ok) return;
    } catch (error) {
      // The server may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Server did not start. ${serverOutput}`);
}

function extract(html, pattern) {
  return html.match(pattern)?.[1] || '';
}

function normalizeVisibleText(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function validateStructuredData(html, pathname, canonical) {
  const pageText = normalizeVisibleText(html);
  const blocks = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  assert(blocks.length > 0, `${pathname} is missing JSON-LD`);

  for (const block of blocks) {
    const data = JSON.parse(block[1]);
    const graph = Array.isArray(data['@graph']) ? data['@graph'] : [data];
    assert(!block[1].includes('"@type":"SearchAction"'), `${pathname} must not advertise a placeholder SearchAction URL`);

    const pageNode = graph.find((item) => ['WebPage', 'CollectionPage', 'AboutPage', 'ContactPage'].includes(item['@type']));
    assert(pageNode?.url === canonical, `${pathname} schema URL must match its canonical`);

    for (const faq of graph.filter((item) => item['@type'] === 'FAQPage')) {
      for (const question of faq.mainEntity || []) {
        const answer = question.acceptedAnswer?.text || '';
        assert(pageText.includes(normalizeVisibleText(question.name)), `${pathname} FAQ schema question is not visible`);
        assert(pageText.includes(normalizeVisibleText(answer)), `${pathname} FAQ schema answer is not visible`);
      }
    }
  }
}

async function auditSitemap(acceptEncoding) {
  const headers = { 'accept-encoding': acceptEncoding };
  const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`, { headers });
  assert(sitemapResponse.status === 200, `Sitemap returned ${sitemapResponse.status}`);
  const sitemap = await sitemapResponse.text();
  const paths = [...sitemap.matchAll(/<loc>https:\/\/watchnations\.com([^<]*)<\/loc>/g)].map((match) => match[1]);
  assert(paths.length >= 280, `Expected at least 280 sitemap URLs, received ${paths.length}`);
  assert(new Set(paths).size === paths.length, 'Sitemap contains duplicate URLs');

  for (let index = 0; index < paths.length; index += 20) {
    await Promise.all(paths.slice(index, index + 20).map(async (pathname) => {
      const response = await fetch(`${baseUrl}${pathname}`, { headers });
      const html = await response.text();
      assert(response.status === 200, `${pathname} returned ${response.status}`);
      assert(extract(html, /<title>([^<]+)<\/title>/i), `${pathname} is missing a title`);
      assert(extract(html, /<meta name="description" content="([^"]+)/i), `${pathname} is missing a description`);
      assert(extract(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i), `${pathname} is missing an H1`);
      assert(html.split('gtag/js?id=G-GSTBY7DVHJ').length - 1 === 1, `${pathname} must contain exactly one Google Analytics tag`);
      assert(html.split("gtag('config', 'G-GSTBY7DVHJ')").length - 1 === 1, `${pathname} must configure Google Analytics exactly once`);
      assert(html.includes("'GTM-NRL24HGJ'"), `${pathname} is missing the Google Tag Manager head script`);
      assert(html.includes('ns.html?id=GTM-NRL24HGJ'), `${pathname} is missing the Google Tag Manager noscript fallback`);
      assert(!extract(html, /<meta name="robots" content="([^"]+)/i).includes('noindex'), `${pathname} is noindex but present in the sitemap`);
      const canonical = extract(html, /<link rel="canonical" href="([^"]+)/i);
      assert(canonical === `${productionUrl}${pathname}`, `${pathname} has incorrect canonical ${canonical}`);
      assert(!html.includes('href="/?country='), `${pathname} exposes a query-based country link`);
      assert(!html.includes('href="/?category='), `${pathname} exposes a query-based category link`);
      validateStructuredData(html, pathname, canonical);
    }));
  }
}

async function run() {
  await waitForServer();
  await auditSitemap('identity');
  await auditSitemap('gzip, deflate, br');

  const homeResponse = await fetch(`${baseUrl}/`);
  const homeHtml = await homeResponse.text();
  const contentSecurityPolicy = homeResponse.headers.get('content-security-policy') || '';
  assert(homeResponse.status === 200, 'Homepage is unavailable');
  assert(homeHtml.split('gtag/js?id=G-GSTBY7DVHJ').length - 1 === 1, 'Homepage must contain exactly one Google Analytics tag');
  assert(homeHtml.split("gtag('config', 'G-GSTBY7DVHJ')").length - 1 === 1, 'Homepage must configure Google Analytics exactly once');
  assert(homeHtml.indexOf('G-GSTBY7DVHJ') < homeHtml.indexOf('GTM-NRL24HGJ'), 'Google Analytics must remain immediately after the head element');
  assert(homeHtml.includes("'GTM-NRL24HGJ'"), 'Homepage Google Tag Manager head script is missing');
  assert(homeHtml.includes('ns.html?id=GTM-NRL24HGJ'), 'Homepage Google Tag Manager noscript fallback is missing');
  assert(homeHtml.indexOf('GTM-NRL24HGJ') < homeHtml.indexOf('<meta charset='), 'Google Tag Manager must remain at the top of the head');
  assert(homeHtml.includes('__watchnationsLoadAds'), 'Clickadilla bootstrap code is missing');
  assert(homeHtml.includes('js.wpadmngr.com'), 'Clickadilla ad manager source is missing');
  assert(contentSecurityPolicy.includes("script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:"), 'Content Security Policy may block the ad script');
  assert(extract(homeHtml, /<title>([^<]+)<\/title>/i) === 'Free Live TV, Radio & World Media | WatchNations', 'Homepage title must remain unchanged');
  assert(normalizeVisibleText(extract(homeHtml, /<h1[^>]*>([\s\S]*?)<\/h1>/i)) === 'explore free live tv, radio, and world media', 'Homepage H1 must remain unchanged');

  const stylesheetPath = extract(homeHtml, /<link rel="stylesheet" href="([^\"]+)/i);
  const modulePath = extract(homeHtml, /<script[^>]+type="module" src="([^\"]+)/i);
  assert(stylesheetPath, 'Homepage stylesheet reference is missing');
  assert(modulePath, 'Homepage module script reference is missing');
  const [stylesheetResponse, moduleResponse] = await Promise.all([
    fetch(new URL(stylesheetPath, baseUrl)),
    fetch(new URL(modulePath, baseUrl))
  ]);
  assert(stylesheetResponse.ok && moduleResponse.ok, 'A primary static asset is unavailable');
  assert((stylesheetResponse.headers.get('cache-control') || '').includes('immutable'), 'Stylesheet is missing immutable caching');
  assert((moduleResponse.headers.get('cache-control') || '').includes('immutable'), 'Module script is missing immutable caching');

  const queryResponse = await fetch(`${baseUrl}/?country=MA`, { redirect: 'manual' });
  assert(queryResponse.status === 301, `Country query URLs must redirect to clean country pages, received ${queryResponse.status}`);
  assert(queryResponse.headers.get('location') === '/countries/ma', 'Country query URLs must redirect to the matching country SEO page');

  for (const code of seoPlan.phasePolicy.gscRecoveryCountryCodes || []) {
    const plan = seoPlan.countryByCode[code];
    const response = await fetch(`${baseUrl}/countries/${code.toLowerCase()}`);
    const html = await response.text();
    assert(extract(html, /<title>([^<]+)<\/title>/i) === plan.title, `${code} must use the verified recovery title`);
    assert(normalizeVisibleText(extract(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)) === normalizeVisibleText(plan.h1), `${code} must use the verified recovery H1`);
    assert(!html.includes('"@type":"FAQPage"'), `${code} must not emit FAQ schema without complete visible answers`);
    assert(html.includes(`href="/#country=${code}"`), `${code} must open the app through a fragment URL`);
  }

  for (const slug of seoPlan.phasePolicy.gscRecoveryCategorySlugs || []) {
    const plan = seoPlan.categoryBySlug[slug];
    const response = await fetch(`${baseUrl}/categories/${slug}`);
    const html = await response.text();
    assert(extract(html, /<title>([^<]+)<\/title>/i) === plan.title, `${slug} must use the verified recovery title`);
    assert(normalizeVisibleText(extract(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i)) === normalizeVisibleText(plan.h1), `${slug} must use the verified recovery H1`);
    assert(html.includes(`href="/#category=${slug}"`), `${slug} must open the app through a fragment URL`);
  }

  const missingResponse = await fetch(`${baseUrl}/not-a-real-page`);
  assert(missingResponse.status === 404, `Unknown paths must return 404, received ${missingResponse.status}`);

  console.log('Maintenance checks passed: expanded sitemap pages, visible schema, GSC recovery pages, GA4, GTM, ads, canonicals, query redirects, assets, and 404 handling.');
}

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    server.kill();
  });
