const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
const { createClient } = require('@supabase/supabase-js');

const prerender = createRequire(require.resolve('vite-plugin-prerender'));
const renderer = createRequire(prerender.resolve('@prerenderer/renderer-puppeteer'));
const puppeteer = renderer('puppeteer');
const {
  CHROME_BIN, MATCH_CENTER_ANON_KEY, MATCH_CENTER_SERVICE_KEY,
  MATCH_CENTER_API_URL = 'http://127.0.0.1:54321',
  MATCH_CENTER_BASE_URL = 'http://127.0.0.1:4317',
} = process.env;

function checked(result) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

function button(page, label) {
  return page.waitForFunction(text => [...document.querySelectorAll('button')]
    .some(b => !b.disabled && b.innerText.trim() === text), { timeout: 15000 }, label);
}

async function click(page, label) {
  await button(page, label);
  await page.evaluate(text => [...document.querySelectorAll('button')]
    .find(b => !b.disabled && b.innerText.trim() === text).click(), label);
}

function elementsScore(page, a, b, timeout = 12000) {
  return page.waitForFunction((x, y) => [...document.querySelectorAll('main section strong.block')]
    .map(e => e.innerText).join(':') === `${x}:${y}`, { timeout }, a, b);
}

async function login(page, mid, credentials) {
  page.on('dialog', dialog => void dialog.accept());
  await page.goto(`${MATCH_CENTER_BASE_URL}/scoreboard/${mid}/control`);
  await page.waitForSelector('input[name=email]');
  await page.type('input[name=email]', credentials.email);
  await page.type('input[name=password]', credentials.password);
  await click(page, 'Als Schiedsrichter anmelden');
  await click(page, 'Leitung übernehmen');
  await button(page, 'Starten');
}

function event(mid, device, fence, base, action) {
  return { mid, device, lease_fence: fence, base, eid: randomUUID(),
    happened_at: new Date().toISOString(), action };
}

async function test() {
  if (!CHROME_BIN || !MATCH_CENTER_ANON_KEY || !MATCH_CENTER_SERVICE_KEY) {
    throw new Error('Set browser and isolated Supabase test configuration.');
  }
  for (const hostname of [MATCH_CENTER_API_URL, MATCH_CENTER_BASE_URL].map(x => new URL(x).hostname)) {
    if (hostname !== '127.0.0.1') throw new Error('Run against an isolated local stack only.');
  }
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const service = createClient(MATCH_CENTER_API_URL, MATCH_CENTER_SERVICE_KEY, options);
  const suffix = randomUUID().slice(0, 8);
  async function user(name, admin = false) {
    const account = { email: `${name}.${suffix}@example.com`, password: randomUUID() };
    checked(await service.auth.admin.createUser({ ...account, email_confirm: true,
      ...(admin ? { app_metadata: { role: 'admin' } } : {}) }));
    return account;
  }
  const accounts = await Promise.all([user('admin', true), user('referee-one'), user('referee-two')]);
  const admin = createClient(MATCH_CENTER_API_URL, MATCH_CENTER_ANON_KEY, options);
  checked(await admin.auth.signInWithPassword(accounts[0]));
  const call = async (name, args) => checked(await admin.rpc(name, args));
  const cid = await call('skv_save_competition', { cid: null, config: {
    name: `SKV smoke ${suffix}`, visibility: 'public',
    rules: { bestOf: 1, points: 25, deciding: 15, margin: 2, switchAt: 8 },
    standings: { order: ['points', 'wins'], points: { win: 2, loss: 0, decidingWin: 2,
      decidingLoss: 0, walkoverWin: 1, walkoverLoss: 0 } },
  } });
  const teams = await Promise.all(['A', 'B', 'C', 'D'].map(name =>
    call('skv_add_team', { cid, team_name: `${name} ${suffix}` })));
  const [first, second] = await Promise.all([0, 1].map(i =>
    call('skv_create_match', { config: { competition_id: cid,
      team_a_id: teams[2*i], team_b_id: teams[2*i+1], court: `Feld ${i+1}`, published: true } })));
  await Promise.all([first, second].map((mid, i) =>
    call('skv_assign_referee', { mid, email_address: accounts[i+1].email,
      expires: new Date(Date.now() + 3600000).toISOString(), revoke_access: false })));

  const browser = await puppeteer.launch({
    executablePath: CHROME_BIN, headless: false, args: ['--headless=new', '--disable-background-networking'],
  });
  try {
    const ref1 = await (await browser.createIncognitoBrowserContext()).newPage();
    const ref2 = await (await browser.createIncognitoBrowserContext()).newPage();
    const viewer = await browser.newPage();
    await viewer.setViewport({ width: 1920, height: 1080 });
    await Promise.all([login(ref1, first, accounts[1]), login(ref2, second, accounts[2]),
      viewer.goto(`${MATCH_CENTER_BASE_URL}/scoreboard/${first}/display`)]);
    await elementsScore(viewer, 0, 0);
    assert.equal(await viewer.$('header nav'), null);
    await viewer.waitForFunction(() => !document.body.innerText.includes('Live-Verbindung'),
      { timeout: 10000 });
    await Promise.all([click(ref1, 'Starten'), click(ref2, 'Starten')]);
    await Promise.all([click(ref1, `+1 A ${suffix}`), click(ref2, `+1 D ${suffix}`)]);
    await elementsScore(viewer, 1, 0, 3500);
    await elementsScore(ref2, 0, 1);
    await ref1.waitForFunction(async () => {
      const cache = await caches.open('skv-match-shell-v1');
      return !!navigator.serviceWorker.controller &&
        !!await cache.match(location.href, { ignoreVary: true });
    }, { timeout: 15000 });
    await ref1.setOfflineMode(true);
    await click(ref1, `+1 A ${suffix}`);
    await click(ref1, `+1 B ${suffix}`);
    await elementsScore(ref1, 2, 1);
    await ref1.reload({ waitUntil: 'domcontentloaded' });
    await elementsScore(ref1, 2, 1);
    assert.ok(await ref1.evaluate(() => document.body.innerText.includes('Ausstehende Aktionen: 2')));
    await elementsScore(viewer, 1, 0);
    await ref1.setOfflineMode(false);
    await elementsScore(viewer, 2, 1);
    await ref1.waitForFunction(() => !document.body.innerText.includes('Ausstehende Aktionen'));

    await ref1.setOfflineMode(true);
    await click(ref1, `+1 A ${suffix}`);
    await elementsScore(ref1, 3, 1);
    const device = randomUUID();
    const lease = await call('skv_acquire_lease', { mid: first, device, force_takeover: true });
    const scores = await Promise.all(['a', 'b'].map(side =>
      admin.rpc('skv_apply_event', event(first, device, lease.fence, lease.match.version,
        { type: 'POINT_AWARDED', side }))));
    assert.equal(scores.filter(r => r.data).length, 1);
    assert.equal(scores.filter(r => r.error?.message === 'version_conflict').length, 1);
    await ref1.setOfflineMode(false);
    await ref1.waitForFunction(() => document.body.innerText.includes('Synchronisierungskonflikt'),
      { timeout: 15000 });
    const archiveLabel = 'Entwurf archivieren und Serverstand übernehmen';
    await click(ref1, archiveLabel);
    await ref1.waitForFunction(() => !document.body.innerText.includes('Ausstehende Aktionen'));
    const { match } = await call('skv_control_snapshot', { mid: first });
    assert.equal(match.version, lease.match.version + 1);
    const archives = checked(await service.from('skv_match_conflicts').select('queued_events')
      .eq('match_id', first));
    assert.equal(archives[0].queued_events.length, 1);

    const current = await call('skv_apply_event', event(first, device, lease.fence, match.version,
      { type: 'POINT_CORRECTED', a: 25, b: 20, reason: 'Rehearsal correction' }));
    const confirm = event(first, device, lease.fence, current.match.version, { type: 'MATCH_COMPLETED' });
    await call('skv_apply_event', confirm);
    await call('skv_apply_event', confirm);
    const table = await call('skv_standings', { cid });
    assert.equal(table[0].points, 2);
    assert.equal(table[0].played, 1);
    await elementsScore(viewer, 25, 20);
    await viewer.goto(`${MATCH_CENTER_BASE_URL}/scoreboard/${first}`);
    await viewer.waitForSelector('img[src^="data:image/png"]');
    await viewer.goto(`${MATCH_CENTER_BASE_URL}/competitions/${cid}`);
    await viewer.waitForFunction(name => document.querySelector('tbody')?.innerText.includes(name),
      { timeout: 12000 }, `A ${suffix}`);
    console.log('Browser + Supabase: two courts, Realtime, offline replay and reload, takeover conflict,');
    console.log('concurrent versions, idempotency, reviewed result, standings and public QR: PASS');
  } finally { await browser.close(); }
}

test().catch(error => { console.error(error); process.exitCode = 1; });
