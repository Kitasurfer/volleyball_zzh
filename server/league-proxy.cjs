/**
 * Local development server proxy for VLW league results
 * Run with: node server/league-proxy.js
 */

const http = require('http');
const https = require('https');

const SERIES_URL = 'https://www.vlw-online.de/cms/home/spielbetrieb/mixed/mixed_24.xhtml?LeaguePresenter.view=resultTable&LeaguePresenter.matchSeriesId=95219095';
const TEAM_DETAILS_URL = 'https://www.vlw-online.de/popup/matchSeries/teamDetails.xhtml?teamId=95219114';
const TEAM_NAME = 'SG TSV Zizishausen/SKV Unterensingen';
const PORT = 3001;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const standingsRegex = /data_scoreHistory_\d+\.push\((\{[\s\S]*?\})\);/g;
const rowRegex = /<tr class="samsDataTableRow"[\s\S]*?<\/tr>/g;
const scheduleTableRegex = /<table class="samsDataTable">[\s\S]*?<\/table>/;

const sanitizeText = (input) => {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const normalizeWhitespace = (input) => {
  return (input ?? '')
    .replace(/\s+/g, ' ')
    .trim();
};

const parseDateToIso = (raw) => {
  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
  const datePart = parts.find((part) => /\d{2}\.\d{2}\.\d{2}/.test(part));
  const timePart = parts.find((part) => /\d{2}:\d{2}/.test(part));
  if (!datePart) return null;

  const [day, month, shortYear] = datePart.split('.');
  if (!day || !month || !shortYear) return null;

  const yearNumber = Number(shortYear);
  const year = yearNumber >= 70 ? 1900 + yearNumber : 2000 + yearNumber;
  const paddedDay = day.padStart(2, '0');
  const paddedMonth = month.padStart(2, '0');
  const time = timePart ?? '00:00';
  return `${year}-${paddedMonth}-${paddedDay}T${time}:00`;
};

const formatResult = (value) => {
  const cleaned = normalizeWhitespace(value);
  const setsMatch = cleaned.match(/\(([^)]+)\)/);
  if (!setsMatch) return cleaned;
  const formattedSets = setsMatch[1]
    .split(/\s+/)
    .filter(Boolean)
    .join(', ');
  return cleaned.replace(setsMatch[0], `(${formattedSets})`);
};

const extractLocationFromRow = (row) => {
  const match = row.match(/locationDetails[^>]*>([\s\S]*?)<\/a>/);
  return match ? normalizeWhitespace(sanitizeText(match[1])) : null;
};

const extractSchedule = (html) => {
  const tableMatch = html.match(scheduleTableRegex);
  if (!tableMatch) return [];

  const rows = tableMatch[0].match(/<tr[\s\S]*?<\/tr>/g);
  if (!rows) return [];

  const schedule = [];

  for (const row of rows) {
    if (row.includes('<th')) continue;

    const cells = row.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/g);
    if (!cells || cells.length < 7) continue;

    const sanitizedCells = cells.map((cell) => sanitizeText(cell));
    const rawDate = sanitizedCells[0] ?? '';
    const matchNumber = normalizeWhitespace(sanitizedCells[1]) || null;
    const homeTeam = sanitizedCells[4] ?? '';
    const awayTeam = sanitizedCells[5] ?? '';
    const locationOrResult = sanitizedCells[6] ?? '';

    const hasScore = /(\d+:\d+)/.test(locationOrResult) && locationOrResult.includes('/');
    const result = hasScore ? formatResult(locationOrResult) : null;
    const location = extractLocationFromRow(row) ?? (hasScore ? null : normalizeWhitespace(locationOrResult) || null);

    const idMatch = row.match(/id="match_(\d+)"/);
    const matchId = idMatch?.[1] ?? (matchNumber ? `match-${matchNumber}` : `match-${schedule.length}`);

    const isoDate = parseDateToIso(rawDate);
    const isHome = homeTeam.includes(TEAM_NAME);
    const opponent = isHome ? awayTeam : homeTeam;

    schedule.push({
      id: matchId,
      matchNumber,
      date: rawDate,
      isoDate,
      homeTeam,
      awayTeam,
      opponent,
      location,
      result,
      isHome,
    });
  }

  return schedule;
};

// Extract standings from injected JSON
const extractStandingsFromJson = (html) => {
  const matches = [...html.matchAll(standingsRegex)];
  console.log(`Found ${matches.length} JSON data objects`);
  if (!matches.length) return null;

  try {
    const entries = matches.map((match) => JSON.parse(match[1]));
    const standings = entries
      .map((entry, index) => {
        const score = entry?.scoreTableHistory?.[0]?.score;
        if (!score) {
          console.log(`Entry ${index}: no score data`);
          return null;
        }
        const standing = {
          position: score.ranking,
          name: entry.shortNameOrName ?? entry.name,
          matches: score.matchesPlayed,
          wins: score.totalWins,
          sets: `${score.setWinScore}:${score.setLoseScore}`,
          points: score.winScore,
        };
        
        // Log our team if found
        if (standing.name.includes('Zizishausen')) {
          console.log(`Found our team in JSON:`, standing);
        }
        
        return standing;
      })
      .filter(Boolean)
      .sort((a, b) => a.position - b.position);
    
    console.log(`Extracted ${standings.length} teams from JSON`);
    return standings.length ? standings : null;
  } catch (error) {
    console.error('Failed to parse standings JSON', error);
    return null;
  }
};

// Fallback: scrape HTML tables (try all tables, return the most complete one)
const extractStandingsFromTable = (html) => {
  // Find all tables on the page
  const tableMatches = html.match(/<table class="samsDataTable">[\s\S]*?<\/table>/g);
  if (!tableMatches || tableMatches.length === 0) return null;

  console.log(`Found ${tableMatches.length} table(s) on the page`);

  // Try to extract standings from each table
  const allStandings = [];
  
  for (let i = 0; i < tableMatches.length; i++) {
    const table = tableMatches[i];
    const rows = table.match(rowRegex);
    if (!rows || rows.length === 0) continue;

    const standings = [];
    for (const row of rows) {
      const cells = row.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/g);
      if (!cells || cells.length < 6) continue;

      const position = Number(sanitizeText(cells[0] ?? ''));
      if (Number.isNaN(position)) continue;

      standings.push({
        position,
        name: sanitizeText(cells[1] ?? ''),
        matches: Number(sanitizeText(cells[2] ?? '')) || 0,
        wins: Number(sanitizeText(cells[3] ?? '')) || 0,
        sets: sanitizeText(cells[4] ?? ''),
        points: Number(sanitizeText(cells[5] ?? '')) || 0,
      });
    }

    if (standings.length > 0) {
      console.log(`Table ${i + 1}: ${standings.length} teams found`);
      allStandings.push(standings);
    }
  }

  if (allStandings.length === 0) return null;

  // Return the table with the most teams (most likely the current standings)
  // Or prefer the table that has our team with non-zero stats
  const ourTeamIndex = allStandings.findIndex(standings => {
    const team = standings.find(s => s.name.includes('Zizishausen'));
    return team && (team.matches > 0 || team.points > 0);
  });

  if (ourTeamIndex >= 0) {
    console.log(`Selected table ${ourTeamIndex + 1} (has our team with stats)`);
    return allStandings[ourTeamIndex];
  }

  // If no table has our team with stats, return the most complete one
  const mostCompleteTable = allStandings.reduce((prev, current) => 
    current.length > prev.length ? current : prev
  );
  
  console.log(`Selected most complete table with ${mostCompleteTable.length} teams`);
  return mostCompleteTable;
};

const fetchHtml = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      }
    }, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        resolve(data);
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
};

const fetchLeagueData = async () => {
  const [seriesHtml, teamHtml] = await Promise.all([
    fetchHtml(SERIES_URL),
    fetchHtml(TEAM_DETAILS_URL),
  ]);

  const standingsFromJson = extractStandingsFromJson(seriesHtml);
  const standingsFromHtml = extractStandingsFromTable(seriesHtml);
  const standings = standingsFromJson?.length
    ? standingsFromJson
    : standingsFromHtml?.length
      ? standingsFromHtml
      : [];

  if (!standings.length) {
    throw new Error('Unable to parse standings data');
  }

  const schedule = extractSchedule(teamHtml);

  return { standings, schedule };
};

const findTeamStanding = (standings) => {
  return standings.find((item) => item.name.includes('Zizishausen'));
};

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Only handle GET requests to /league-results
  if (req.method === 'GET' && req.url === '/league-results') {
    try {
      const { standings, schedule } = await fetchLeagueData();
      const responseData = {
        standings,
        schedule,
        team: findTeamStanding(standings),
        lastUpdated: new Date().toISOString(),
      };

      res.writeHead(200, {
        ...corsHeaders,
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify(responseData));
    } catch (error) {
      console.error('league-results error', error);
      res.writeHead(500, {
        ...corsHeaders,
        'Content-Type': 'application/json',
      });
      res.end(JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  } else {
    res.writeHead(404, corsHeaders);
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(PORT, () => {
  console.log(`🏐 League results proxy server running at http://localhost:${PORT}`);
  console.log(`   Endpoint: http://localhost:${PORT}/league-results`);
  console.log(`   Press Ctrl+C to stop`);
});
