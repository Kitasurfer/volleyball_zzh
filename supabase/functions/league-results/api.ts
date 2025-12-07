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
const CURRENT_SEASON_UUID = 'fde078d8-b9d5-4202-be3d-5c2614cc8d95'; // 2025/26
const LEAGUE_UUID = '1a68afc9-a3cc-4fbf-b79b-ac0ca3fd985d'; // Mixed 2/4 C2 Ost
const TEAM_NAME = 'SG TSV Zizishausen/SKV Unterensingen';

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

// Fetch league rankings (standings)
export const fetchStandings = async (): Promise<Standing[]> => {
  interface RankingsResponse {
    content: ApiRanking[];
  }

  const data = await fetchApi<RankingsResponse>(`/leagues/${LEAGUE_UUID}/rankings`);
  
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
const fetchMatchDays = async (): Promise<ApiMatchDay[]> => {
  interface MatchDaysResponse {
    content: ApiMatchDay[];
  }

  const data = await fetchApi<MatchDaysResponse>(`/leagues/${LEAGUE_UUID}/match-days?size=50`);
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
export const fetchSchedule = async (): Promise<MatchInfo[]> => {
  const matchDays = await fetchMatchDays();
  const allMatches: MatchInfo[] = [];

  // Fetch matches from all match days in parallel
  const matchPromises = matchDays.map((md) => fetchMatchDayMatches(md.uuid));
  const matchDayResults = await Promise.all(matchPromises);

  for (const matches of matchDayResults) {
    for (const match of matches) {
      const team1Name = match._embedded?.team1?.name || match.team1Description;
      const team2Name = match._embedded?.team2?.name || match.team2Description;
      
      // Filter only matches involving our team
      const isTeam1 = team1Name.includes('Zizishausen') || team1Name.includes('Unterensingen');
      const isTeam2 = team2Name.includes('Zizishausen') || team2Name.includes('Unterensingen');
      
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

// Find our team in standings
export const findTeamStanding = (standings: Standing[]): Standing | undefined => {
  return standings.find((s) => 
    s.name.includes('Zizishausen') || s.name.includes('Unterensingen')
  );
};

// Main function to fetch all league data
export const fetchLeagueData = async (): Promise<{
  standings: Standing[];
  schedule: MatchInfo[];
}> => {
  console.log('Fetching league data from VLW API...');
  
  const [standings, schedule] = await Promise.all([
    fetchStandings(),
    fetchSchedule(),
  ]);

  console.log(`Fetched ${standings.length} standings, ${schedule.length} matches`);

  return { standings, schedule };
};
