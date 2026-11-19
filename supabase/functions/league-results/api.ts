/**
 * SAMS REST API client for VLW (Volleyball-Landesverband Württemberg)
 * Official API documentation: http://wiki.sams-server.de/wiki/XML-Schnittstelle
 */

declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

// Configuration
const VLW_API_BASE = 'https://www.vlw-online.de/api/v2';
const VLW_ASSOCIATION_UUID = 'bd80ee61-1794-4f4b-4834-917bb58b349c';
const LEAGUE_NAME = 'Mixed 2/4 C2 Ost';
const TEAM_NAME_MARKERS = ['Zizishausen', 'Unterensingen', 'Schnakenbatscher'];

// Get API key from environment
const getApiKey = (): string => {
  const key = Deno.env.get('VLW_API_KEY');
  if (!key) {
    throw new Error('VLW_API_KEY environment variable is not set');
  }
  return key;
};

// Types
export interface Standing {
  position: number;
  name: string;
  matches: number;
  wins: number;
  sets: string;
  points: number;
}

export interface MatchInfo {
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

export interface ArchiveTable {
  season: string;
  leagueName: string;
  standings: Standing[];
}

interface ApiRanking {
  uuid: string;
  teamName: string;
  rank: number;
  matchesPlayed: number;
  points: number;
  wins: number;
  losses: number;
  setWins: number;
  setLosses: number;
}

interface ApiMatch {
  uuid: string;
  date: string;
  time: string;
  matchNumber: number;
  team1Description: string;
  team2Description: string;
  _embedded?: {
    team1?: { name: string; uuid: string };
    team2?: { name: string; uuid: string };
  };
  location?: {
    name: string;
    address?: {
      street?: string;
      city?: string;
    };
  };
  results?: {
    setPoints: string;
    sets?: Array<{ ballPoints: string }>;
  };
  host?: string;
}

interface ApiMatchDay {
  uuid: string;
  name: string;
  matchdate: string;
}

interface ApiSeason {
  uuid: string;
  name: string;
  startDate?: string;
  endDate?: string;
  currentSeason?: boolean;
}

interface ApiLeague {
  uuid: string;
  name: string;
  seasonUuid?: string;
}

// API fetch helper
const fetchApi = async <T>(endpoint: string): Promise<T> => {
  const apiKey = getApiKey();
  const url = `${VLW_API_BASE}${endpoint}`;

  console.log(`Fetching: ${url}`);

  const response = await fetch(url, {
    headers: {
      'X-API-KEY': apiKey,
      'Accept': 'application/hal+json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`API error ${response.status}: ${text}`);
    throw new Error(`VLW API error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
};

const isOurTeamName = (name: string): boolean =>
  TEAM_NAME_MARKERS.some((marker) => name.includes(marker));

// Fetch league rankings (standings)
const fetchStandings = async (leagueUuid: string): Promise<Standing[]> => {
  interface RankingsResponse {
    content: ApiRanking[];
  }

  const data = await fetchApi<RankingsResponse>(`/leagues/${leagueUuid}/rankings`);

  return data.content.map((r) => ({
    position: r.rank,
    name: r.teamName,
    matches: r.matchesPlayed,
    wins: r.wins,
    sets: `${r.setWins}:${r.setLosses}`,
    points: r.points,
  }));
};

// Fetch all match days for the league
const fetchMatchDays = async (leagueUuid: string): Promise<ApiMatchDay[]> => {
  interface MatchDaysResponse {
    content: ApiMatchDay[];
  }

  const data = await fetchApi<MatchDaysResponse>(`/leagues/${leagueUuid}/match-days?size=50`);
  return data.content;
};

// Fetch matches for a specific match day
const fetchMatchDayMatches = async (matchDayUuid: string): Promise<ApiMatch[]> => {
  interface MatchesResponse {
    content: ApiMatch[];
  }

  const data = await fetchApi<MatchesResponse>(`/match-days/${matchDayUuid}/league-matches`);
  return data.content;
};

// Format result string
const formatResult = (match: ApiMatch): string | null => {
  if (!match.results?.setPoints) return null;

  const setPoints = match.results.setPoints;
  const sets = match.results.sets;

  if (sets && sets.length > 0) {
    const setsStr = sets.map((s) => s.ballPoints).join(', ');
    return `${setPoints} (${setsStr})`;
  }

  return setPoints;
};

// Format location string
const formatLocation = (match: ApiMatch): string | null => {
  if (!match.location) return null;

  const loc = match.location;
  if (loc.address?.city) {
    return `${loc.name}, ${loc.address.city}`;
  }
  return loc.name;
};

// Fetch all matches for our team
const fetchSchedule = async (leagueUuid: string): Promise<MatchInfo[]> => {
  const matchDays = await fetchMatchDays(leagueUuid);
  const allMatches: MatchInfo[] = [];

  // Fetch matches from all match days in parallel
  const matchPromises = matchDays.map((md) => fetchMatchDayMatches(md.uuid));
  const matchDayResults = await Promise.all(matchPromises);

  for (const matches of matchDayResults) {
    for (const match of matches) {
      const team1Name = match._embedded?.team1?.name || match.team1Description;
      const team2Name = match._embedded?.team2?.name || match.team2Description;

      // Filter only matches involving our team
      const isTeam1 = isOurTeamName(team1Name);
      const isTeam2 = isOurTeamName(team2Name);

      if (!isTeam1 && !isTeam2) continue;

      const isHome = isTeam1;
      const opponent = isHome ? team2Name : team1Name;
      const isoDate = match.date && match.time
        ? `${match.date}T${match.time}:00`
        : match.date
          ? `${match.date}T00:00:00`
          : null;

      allMatches.push({
        id: match.uuid,
        matchNumber: match.matchNumber?.toString() || null,
        date: match.date,
        isoDate,
        homeTeam: team1Name,
        awayTeam: team2Name,
        opponent,
        location: formatLocation(match),
        result: formatResult(match),
        isHome,
      });
    }
  }

  // Sort by date
  allMatches.sort((a, b) => {
    if (!a.isoDate) return 1;
    if (!b.isoDate) return -1;
    return new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime();
  });

  return allMatches;
};

// Fetch all seasons
const fetchSeasons = async (): Promise<ApiSeason[]> => {
  return fetchApi<ApiSeason[]>('/seasons');
};

const seasonStart = (season: ApiSeason): number =>
  Date.parse(season.startDate ?? '') || 0;

// Pick the running season; fall back to the most recent one by start date
const pickCurrentSeason = (seasons: ApiSeason[]): ApiSeason | undefined => {
  const flagged = seasons.find((s) => s.currentSeason);
  if (flagged) return flagged;
  return [...seasons].sort((a, b) => seasonStart(b) - seasonStart(a))[0];
};

// Pick the season right before the current one (for the archive table)
const pickPreviousSeason = (
  seasons: ApiSeason[],
  current: ApiSeason,
): ApiSeason | undefined => {
  const others = seasons.filter((s) => s.uuid !== current.uuid);
  if (others.length === 0) return undefined;

  const currentStart = seasonStart(current);
  const earlier = others.filter((s) => !currentStart || seasonStart(s) < currentStart);
  const pool = earlier.length > 0 ? earlier : others;

  return pool.sort((a, b) => seasonStart(b) - seasonStart(a))[0];
};

// Find our league (match series) within a season
const findLeague = async (seasonUuid: string): Promise<ApiLeague | undefined> => {
  interface LeaguesResponse {
    content: ApiLeague[];
  }

  const data = await fetchApi<LeaguesResponse>(
    `/leagues?association=${VLW_ASSOCIATION_UUID}&season=${seasonUuid}&size=100`,
  );

  return (
    data.content.find((l) => l.name === LEAGUE_NAME) ??
    data.content.find((l) => l.name.includes(LEAGUE_NAME)) ??
    data.content.find((l) => LEAGUE_NAME.includes(l.name))
  );
};

// Find our team in standings
export const findTeamStanding = (standings: Standing[]): Standing | undefined => {
  return standings.find((s) => isOurTeamName(s.name));
};

// Fetch the previous season's table for the same league (archive)
const fetchArchive = async (
  seasons: ApiSeason[],
  currentSeason: ApiSeason,
): Promise<ArchiveTable | null> => {
  try {
    const previousSeason = pickPreviousSeason(seasons, currentSeason);
    if (!previousSeason) return null;

    const league = await findLeague(previousSeason.uuid);
    if (!league) return null;

    const standings = await fetchStandings(league.uuid);
    if (standings.length === 0) return null;

    return {
      season: previousSeason.name,
      leagueName: league.name,
      standings,
    };
  } catch (error) {
    console.error('Failed to fetch archive standings:', error);
    return null;
  }
};

// Main function to fetch all league data
export const fetchLeagueData = async (): Promise<{
  standings: Standing[];
  schedule: MatchInfo[];
  season: string;
  leagueName: string;
  archive: ArchiveTable | null;
}> => {
  console.log('Fetching league data from VLW API...');

  const seasons = await fetchSeasons();
  const currentSeason = pickCurrentSeason(seasons);
  if (!currentSeason) {
    throw new Error('No seasons returned by VLW API');
  }
  console.log(`Current season: ${currentSeason.name} (${currentSeason.uuid})`);

  const league = await findLeague(currentSeason.uuid);
  if (!league) {
    throw new Error(`League "${LEAGUE_NAME}" not found for season ${currentSeason.name}`);
  }
  console.log(`League resolved: ${league.name} (${league.uuid})`);

  const [standings, schedule] = await Promise.all([
    fetchStandings(league.uuid),
    fetchSchedule(league.uuid),
  ]);

  const archive = await fetchArchive(seasons, currentSeason);

  console.log(`Fetched ${standings.length} standings, ${schedule.length} matches`);

  return {
    standings,
    schedule,
    season: currentSeason.name,
    leagueName: league.name,
    archive,
  };
};
