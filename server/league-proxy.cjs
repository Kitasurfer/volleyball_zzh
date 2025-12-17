const http = require('http');

const PORT = Number.parseInt(process.env.LEAGUE_PROXY_PORT || process.env.PORT || '3001', 10);
const DEFAULT_SERIES_URL =
  'https://www.vlw-online.de/cms/home/spielbetrieb/mixed/mixed_24.xhtml?LeaguePresenter.view=resultTable&LeaguePresenter.matchSeriesId=53522667';
const SERIES_URL = process.env.SERIES_URL || process.env.VLW_SERIES_URL || DEFAULT_SERIES_URL;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const sendJson = (res, status, body) => {
  res.writeHead(status, {
    ...corsHeaders,
    'Content-Type': 'application/json',
  });
  res.end(JSON.stringify(body));
};

const decodeHtml = (value) => {
  if (!value) return '';

  return String(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));
};

const stripTags = (html) =>
  decodeHtml(String(html).replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

const parseIntSafe = (value) => {
  const cleaned = String(value ?? '').replace(/[^0-9-]/g, '');
  const num = Number.parseInt(cleaned, 10);
  return Number.isFinite(num) ? num : 0;
};

const isSetsValue = (value) => /^\d+\s*:\s*\d+$/.test(value);

const findSets = (cells) => {
  for (let i = cells.length - 1; i >= 0; i -= 1) {
    const cell = cells[i];
    if (isSetsValue(cell)) {
      return cell.replace(/\s+/g, '');
    }
  }
  return '';
};

const findPoints = (cells) => {
  for (let i = cells.length - 1; i >= 0; i -= 1) {
    const cell = cells[i];
    if (/^\d+$/.test(cell)) {
      return parseIntSafe(cell);
    }
  }

  return parseIntSafe(cells[cells.length - 1] ?? '');
};

const isOurTeamName = (name) =>
  typeof name === 'string' && (name.includes('Zizishausen') || name.includes('Unterensingen'));

const findTeamStanding = (standings) => standings.find((s) => isOurTeamName(s.name)) ?? null;

const extractStandingsFromTable = (tableHtml) => {
  const rows = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
  const standings = [];

  for (const rowHtml of rows) {
    const cellMatches = rowHtml.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) ?? [];
    const cells = cellMatches.map((cellHtml) => stripTags(cellHtml));

    if (cells.length < 4) continue;

    const position = parseIntSafe(cells[0]);
    if (!position) continue;

    const name = cells[1] ?? '';
    const matches = parseIntSafe(cells[2]);
    const wins = parseIntSafe(cells[3]);
    const sets = findSets(cells);
    const points = findPoints(cells);

    standings.push({ position, name, matches, wins, sets, points });
  }

  return standings;
};

const pickBestStandings = (allStandings) => {
  let best = null;

  for (const standings of allStandings) {
    const team = findTeamStanding(standings);
    const hasStats = team && (team.matches > 0 || team.points > 0);

    if (hasStats) {
      best = { standings, team, reason: 'has our team with stats' };
      break;
    }
  }

  if (!best) {
    const standings = allStandings.reduce((prev, current) => (current.length > prev.length ? current : prev));
    best = { standings, team: findTeamStanding(standings), reason: 'most complete table' };
  }

  return best;
};

const fetchHtml = async (url) => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (league-proxy)',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch source page (${response.status}): ${text.slice(0, 200)}`);
  }

  return response.text();
};

const fetchLeagueResults = async () => {
  if (!SERIES_URL) {
    throw new Error('SERIES_URL (or VLW_SERIES_URL) environment variable is not set');
  }

  const html = await fetchHtml(SERIES_URL);
  const tableMatches = html.match(/<table[^>]*class="[^"]*samsDataTable[^"]*"[^>]*>[\s\S]*?<\/table>/gi) ?? [];

  console.log(`Found ${tableMatches.length} table(s) on the page`);

  const allStandings = [];

  for (let i = 0; i < tableMatches.length; i += 1) {
    const standings = extractStandingsFromTable(tableMatches[i]);
    console.log(`Table ${i + 1}: ${standings.length} teams found`);

    const team = findTeamStanding(standings);
    if (team) {
      console.log('  └─ Our team in this table:', team);
    }

    if (standings.length > 0) {
      allStandings.push(standings);
    }
  }

  if (allStandings.length === 0) {
    throw new Error('Unable to parse standings data');
  }

  const selected = pickBestStandings(allStandings);
  console.log(`Selected table (${selected.reason})`);

  return {
    standings: selected.standings,
    team: selected.team,
    lastUpdated: new Date().toISOString(),
    schedule: [],
  };
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (url.pathname !== '/league-results') {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  try {
    const result = await fetchLeagueResults();
    sendJson(res, 200, result);
  } catch (error) {
    console.error('league-proxy error:', error);
    sendJson(res, 500, { error: true, message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

server.listen(PORT, () => {
  console.log(`League proxy listening on http://localhost:${PORT}`);
  console.log('Endpoint: /league-results');
});
