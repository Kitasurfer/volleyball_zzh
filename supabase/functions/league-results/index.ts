declare const Deno: {
  serve: (
    handler: (request: Request) => Response | Promise<Response>,
    options?: {
      hostname?: string;
      port?: number;
      onError?: (error: unknown) => Response | Promise<Response>;
    },
  ) => Promise<void> | void;
};

import { fetchLeagueData as fetchLeagueDataImpl, findTeamStanding as findTeamStandingImpl } from './league.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface Standing {
  position: number;
  name: string;
  matches: number;
  wins: number;
  sets: string;
  points: number;
}

interface MatchInfo {
  id: string;
  matchNumber: string | null;
  date: string;
  isoDate: string | null;
  homeTeam: string;
  awayTeam: string;
  opponent: string;
  location: string | null;
  result: string | null;
  isHome: boolean;
}

const SERIES_URL =
  "https://www.vlw-online.de/cms/home/spielbetrieb/mixed/mixed_24.xhtml?LeaguePresenter.view=resultTable&LeaguePresenter.matchSeriesId=95219095";
const TEAM_DETAILS_URL =
  "https://www.vlw-online.de/popup/matchSeries/teamDetails.xhtml?teamId=95219114";

const TEAM_NAME = "SG TSV Zizishausen/SKV Unterensingen";

const standingsRegex = /data_scoreHistory_\d+\.push\((\{[\s\S]*?\})\);/g;
const rowRegex = /<tr[\s\S]*?<\/tr>/g;
const scheduleTableRegex = /<table[^>]*class="[^"]*samsDataTable[^"]*"[\s\S]*?<\/table>/;

const sanitizeText = (input: string) =>
  input
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeWhitespace = (input: string | null | undefined) =>
  (input ?? "")
    .replace(/\s+/g, " ")
    .trim();

const parseDateToIso = (raw: string): string | null => {
  const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
  const datePart = parts.find((part) => /\d{2}\.\d{2}\.\d{2}/.test(part));
  const timePart = parts.find((part) => /\d{2}:\d{2}/.test(part));
  if (!datePart) return null;

  const [day, month, shortYear] = datePart.split(".");
  if (!day || !month || !shortYear) return null;

  const yearNumber = Number(shortYear);
  const year = yearNumber >= 70 ? 1900 + yearNumber : 2000 + yearNumber;
  const paddedDay = day.padStart(2, "0");
  const paddedMonth = month.padStart(2, "0");
  const time = timePart ?? "00:00";
  return `${year}-${paddedMonth}-${paddedDay}T${time}:00`;
};

const formatResult = (value: string) => {
  const cleaned = normalizeWhitespace(value);
  const setsMatch = cleaned.match(/\(([^)]+)\)/);
  if (!setsMatch) return cleaned;
  const formattedSets = setsMatch[1]
    .split(/\s+/)
    .filter(Boolean)
    .join(", ");
  return cleaned.replace(setsMatch[0], `(${formattedSets})`);
};

const extractLocationFromRow = (row: string): string | null => {
  const match = row.match(/locationDetails[^>]*>([\s\S]*?)<\/a>/);
  return match ? normalizeWhitespace(sanitizeText(match[1])) : null;
};

const extractSchedule = (html: string): MatchInfo[] => {
  const tableMatch = html.match(scheduleTableRegex);
  if (!tableMatch) return [];

  const rows = tableMatch[0].match(/<tr[\s\S]*?<\/tr>/g);
  if (!rows) return [];

  const schedule: MatchInfo[] = [];

  for (const row of rows) {
    if (row.includes("<th")) continue;

    const cells = row.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/g);
    if (!cells || cells.length < 7) continue;

    const sanitizedCells = cells.map((cell) => sanitizeText(cell));
    const rawDate = sanitizedCells[0] ?? "";
    const matchNumber = normalizeWhitespace(sanitizedCells[1]) || null;
    const homeTeam = sanitizedCells[4] ?? "";
    const awayTeam = sanitizedCells[5] ?? "";
    const locationOrResult = sanitizedCells[6] ?? "";

    const hasScore = /(\d+:\d+)/.test(locationOrResult) && locationOrResult.includes("/");
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

// Attempt to extract standings from injected JSON
const extractStandingsFromJson = (html: string): Standing[] | null => {
  const matches = [...html.matchAll(standingsRegex)];
  if (!matches.length) return null;

  try {
    const entries = matches.map((match) => JSON.parse(match[1]));
    return entries
      .map((entry: any) => {
        const score = entry?.scoreTableHistory?.[0]?.score;
        if (!score) return null;
        return {
          position: score.ranking,
          name: entry.shortNameOrName ?? entry.name,
          matches: score.matchesPlayed,
          wins: score.totalWins,
          sets: `${score.setWinScore}:${score.setLoseScore}`,
          points: score.winScore,
        } satisfies Standing;
      })
      .filter((item): item is Standing => Boolean(item))
      .sort((a, b) => a.position - b.position);
  } catch (error) {
    console.error("Failed to parse standings JSON", error);
    return null;
  }
};

// Fallback: scrape HTML tables (try all tables, return the best match)
const extractStandingsFromTable = (html: string): Standing[] | null => {
  const tableMatches = html.match(/<table[^>]*class="[^"]*samsDataTable[^"]*"[\s\S]*?<\/table>/g);
  if (!tableMatches || tableMatches.length === 0) {
    console.error("No samsDataTable tables found in standings HTML excerpt:", html.slice(0, 500));
    return null;
  }

  const allStandings: Standing[][] = [];

  for (const table of tableMatches) {
    const rows = table.match(rowRegex);
    if (!rows || rows.length === 0) {
      console.error("Table had no rows:", table.slice(0, 200));
      continue;
    }

    const standings: Standing[] = [];

    for (const row of rows) {
      if (/<th/i.test(row)) continue;
      const cells = row.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/g);
      if (!cells || cells.length < 6) continue;

      const position = Number(sanitizeText(cells[0] ?? ""));
      if (Number.isNaN(position)) continue;

      standings.push({
        position,
        name: sanitizeText(cells[1] ?? ""),
        matches: Number(sanitizeText(cells[2] ?? "")) || 0,
        wins: Number(sanitizeText(cells[3] ?? "")) || 0,
        sets: sanitizeText(cells[4] ?? ""),
        points: Number(sanitizeText(cells[5] ?? "")) || 0,
      });
    }

    if (standings.length > 0) {
      allStandings.push(standings);
    }
  }

  if (allStandings.length === 0) {
    console.error("No standings rows parsed from tables. First table excerpt:", tableMatches[0]?.slice(0, 500));
    return null;
  }

  const ourTeamIndex = allStandings.findIndex((standings) =>
    standings.some((team) => team.name.includes("Zizishausen"))
  );

  if (ourTeamIndex >= 0) {
    return allStandings[ourTeamIndex];
  }

  return allStandings.reduce((prev, current) =>
    current.length > prev.length ? current : prev
  );
};

const fetchHtml = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
};

const fetchLeagueData = async (): Promise<{ standings: Standing[]; schedule: MatchInfo[] }> => {
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
    throw new Error("Unable to parse standings data");
  }

  const schedule = extractSchedule(teamHtml);

  return { standings, schedule };
};

const findTeamStanding = (standings: Standing[]) =>
  standings.find((item) => item.name.includes("Zizishausen"));

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { standings, schedule } = await fetchLeagueDataImpl();
    return new Response(
      JSON.stringify({
        standings,
        schedule,
        team: findTeamStandingImpl(standings),
        lastUpdated: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("league-results error", error);
    return new Response(
      JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
