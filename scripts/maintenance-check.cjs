const { spawn } = require('child_process');

const port = 5197;
const baseUrl = `http://127.0.0.1:${port}`;
const productionUrl = 'https://watchnations.com';
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

async function auditSitemap(acceptEncoding) {
  const headers = { 'accept-encoding': acceptEncoding };
  const sitemapResponse = await fetch(`${baseUrl}/sitemap.xml`, { headers });
  assert(sitemapResponse.status === 200, `Sitemap returned ${sitemapResponse.status}`);
  const sitemap = await sitemapResponse.text();
  const paths = [...sitemap.matchAll(/<loc>https:\/\/watchnations\.com([^<]*)<\/loc>/g)].map((match) => match[1]);
  assert(paths.length === 240, `Expected 240 sitemap URLs, received ${paths.length}`);
  assert(new Set(paths).size === paths.length, 'Sitemap contains duplicate URLs');

  for (let index = 0; index < paths.length; index += 20) {
    await Promise.all(paths.slice(index, index + 20).map(async (pathname) => {
      const response = await fetch(`${baseUrl}${pathname}`, { headers });
      const html = await response.text();
      assert(response.status === 200, `${pathname} returned ${response.status}`);
      assert(extract(html, /<title>([^<]+)<\/title>/i), `${pathname} is missing a title`);
      assert(extract(html, /<meta name="description" content="([^"]+)/i), `${pathname} is missing a description`);
      assert(extract(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i), `${pathname} is missing an H1`);
      assert(html.includes("'GTM-NRL24HGJ'"), `${pathname} is missing the Google Tag Manager head script`);
      assert(html.includes('ns.html?id=GTM-NRL24HGJ'), `${pathname} is missing the Google Tag Manager noscript fallback`);
      assert(!extract(html, /<meta name="robots" content="([^"]+)/i).includes('noindex'), `${pathname} is noindex but present in the sitemap`);
      const canonical = extract(html, /<link rel="canonical" href="([^"]+)/i);
      assert(canonical === `${productionUrl}${pathname}`, `${pathname} has incorrect canonical ${canonical}`);
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
  assert(homeHtml.includes("'GTM-NRL24HGJ'"), 'Homepage Google Tag Manager head script is missing');
  assert(homeHtml.includes('ns.html?id=GTM-NRL24HGJ'), 'Homepage Google Tag Manager noscript fallback is missing');
  assert(homeHtml.indexOf('GTM-NRL24HGJ') < homeHtml.indexOf('<meta charset='), 'Google Tag Manager must remain at the top of the head');
  assert(homeHtml.includes('__watchnationsLoadAds'), 'Clickadilla bootstrap code is missing');
  assert(homeHtml.includes('js.wpadmngr.com'), 'Clickadilla ad manager source is missing');
  assert(contentSecurityPolicy.includes("script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:"), 'Content Security Policy may block the ad script');

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

  const queryResponse = await fetch(`${baseUrl}/?country=MA`);
  const queryHtml = await queryResponse.text();
  assert(queryResponse.status === 200, 'Country app deep link is unavailable');
  assert(extract(queryHtml, /<meta name="robots" content="([^"]+)/i) === 'noindex, follow', 'Query app pages must be noindex');
  assert(extract(queryHtml, /<link rel="canonical" href="([^"]+)/i) === `${productionUrl}/`, 'Query app pages must canonicalize to the homepage');

  const missingResponse = await fetch(`${baseUrl}/not-a-real-page`);
  assert(missingResponse.status === 404, `Unknown paths must return 404, received ${missingResponse.status}`);

  console.log('Maintenance checks passed: 240 sitemap pages, GTM, ads, compression, canonicals, query noindex, assets, and 404 handling.');
}

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    server.kill();
  });
