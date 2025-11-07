const https = require('https');

const SERIES_URL = 'https://www.vlw-online.de/cms/home/spielbetrieb/mixed/mixed_24.xhtml?LeaguePresenter.view=resultTable&LeaguePresenter.matchSeriesId=95219095';

const standingsRegex = /data_scoreHistory_\d+\.push\((\{[\s\S]*?\})\);/g;
const rowRegex = /<tr class="samsDataTableRow"[\s\S]*?<\/tr>/g;

const sanitizeText = (input) => {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
      const team = standings.find(s => s.name.includes('Zizishausen'));
      if (team) {
        console.log(`  └─ Our team in this table:`, team);
      }
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
    console.log(`\nSelected table ${ourTeamIndex + 1} (has our team with stats)`);
    return allStandings[ourTeamIndex];
  }

  // If no table has our team with stats, return the most complete one
  const mostCompleteTable = allStandings.reduce((prev, current) => 
    current.length > prev.length ? current : prev
  );
  
  const tableIndex = allStandings.indexOf(mostCompleteTable);
  console.log(`\nSelected table ${tableIndex + 1} (most complete with ${mostCompleteTable.length} teams)`);
  return mostCompleteTable;
};

https.get(SERIES_URL, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  }
}, (response) => {
  let data = '';

  response.on('data', (chunk) => {
    data += chunk;
  });

  response.on('end', () => {
    console.log('HTML received, length:', data.length);
    
    const standingsFromJson = extractStandingsFromJson(data);
    if (standingsFromJson?.length) {
      console.log('\n=== STANDINGS FROM JSON ===');
      console.log(JSON.stringify(standingsFromJson, null, 2));
      
      const team = standingsFromJson.find(s => s.name.includes('Zizishausen'));
      console.log('\n=== OUR TEAM ===');
      console.log(JSON.stringify(team, null, 2));
      return;
    }

    const standingsFromHtml = extractStandingsFromTable(data);
    if (standingsFromHtml?.length) {
      console.log('\n=== STANDINGS FROM HTML ===');
      console.log(JSON.stringify(standingsFromHtml, null, 2));
      
      const team = standingsFromHtml.find(s => s.name.includes('Zizishausen'));
      console.log('\n=== OUR TEAM ===');
      console.log(JSON.stringify(team, null, 2));
      return;
    }

    console.error('Unable to parse standings data');
  });
}).on('error', (error) => {
  console.error('Request error:', error);
});
