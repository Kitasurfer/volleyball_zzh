const assert = require('node:assert/strict');
const { createRequire } = require('node:module');

const prerender = createRequire(require.resolve('vite-plugin-prerender'));
const renderer = createRequire(prerender.resolve('@prerenderer/renderer-puppeteer'));
const puppeteer = renderer('puppeteer');

async function waitButton(page, text) {
  await page.waitForFunction(label =>
    [...document.querySelectorAll('button')].some(b => !b.disabled && b.innerText.trim() === label),
  { timeout: 15000 }, text);
}

async function click(page, text) {
  await waitButton(page, text);
  await page.evaluate(label => [...document.querySelectorAll('button')]
    .find(b => !b.disabled && b.innerText.trim() === label).click(), text);
}

function score(page, a, b) {
  return page.waitForFunction((x, y) =>
    [...document.querySelectorAll('main section strong.block')].map(e => e.innerText)
      .join(':') === `${x}:${y}`, { timeout: 12000 }, a, b);
}

async function test() {
  const executablePath = process.env.CHROME_BIN;
  if (!executablePath) throw new Error('Set CHROME_BIN to an installed Chromium executable.');
  const base = process.env.MATCH_CENTER_BASE_URL || 'http://127.0.0.1:4317';
  if (new URL(base).hostname !== '127.0.0.1') throw new Error('Run against a local preview only.');
  const browser = await puppeteer.launch({
    executablePath, headless: false, args: ['--headless=new', '--disable-background-networking'],
  });
  try {
    const page = await browser.newPage();
    page.on('dialog', dialog => void dialog.accept());
    await page.setViewport({ width: 360, height: 760 });
    await page.goto(`${base}/scoreboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('a[href="/scoreboard/new"]');
    await page.evaluate(() => document.querySelector('a[href="/scoreboard/new"]').click());
    await waitButton(page, 'Starten');
    const longName = 'A very long visiting team name for a small screen';
    await page.type('input[list="skv-team-names"]', longName);
    await click(page, 'Starten');
    await page.waitForFunction(() => /^\/scoreboard\/local-.+\/control$/.test(location.pathname));
    await click(page, 'Starten');
    await score(page, 0, 0);
    await click(page, `+1 ${longName}`);
    await click(page, '+1 Team B');
    await score(page, 1, 1);
    await click(page, 'Letzte Aktion rückgängig');
    await score(page, 1, 0);
    for (const [width, height] of [
      [360, 760], [390, 844], [430, 932], [768, 1024], [1024, 768], [1440, 900], [1920, 1080],
    ]) {
      await page.setViewport({ width, height });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `Horizontal overflow at ${width}px`);
    }
    await page.waitForFunction(async () => {
      const cache = await caches.open('skv-match-shell-v1');
      return !!navigator.serviceWorker.controller &&
        !!await cache.match(location.href, { ignoreVary: true });
    }, { timeout: 15000 });
    await page.setOfflineMode(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await score(page, 1, 0);
    await click(page, '+1 Team B');
    await score(page, 1, 1);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await score(page, 1, 1);
    await page.setOfflineMode(false);
    const languages = {
      en: 'Referee controls', ru: 'Управлять матчем', it: 'Dirigi partita', de: 'Spiel leiten',
    };
    for (const [language, title] of Object.entries(languages)) {
      await page.evaluate(value => localStorage.setItem('language', value), language);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(label => document.querySelector('main h1')?.textContent === label,
        { timeout: 12000 }, title);
      await score(page, 1, 1);
    }
    console.log('Chrome: local scoring, undo, offline reload, four languages, seven viewports: PASS');
  } finally { await browser.close(); }
}

test().catch(error => { console.error(error); process.exitCode = 1; });
