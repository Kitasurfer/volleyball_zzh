import { useQuery } from '@tanstack/react-query';

export type Standing = {
  position: number;
  name: string;
  matches: number;
  wins: number;
  sets: string;
  points: number;
};

export type CompetitionMatch = {
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
};

export type StandingsResponse = {
  standings: Standing[];
  team: Standing | null;
  lastUpdated: string;
  schedule?: CompetitionMatch[];
};

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL;

const fetchStandings = async (): Promise<StandingsResponse> => {
  const baseUrl = FUNCTIONS_URL?.replace(/\/$/, '') ?? '';
  const endpoint = `${baseUrl}/league-results`;

  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch standings (${response.status})`);
  }

  return response.json();
};

export const useStandings = () =>
  useQuery<StandingsResponse, Error>({
    queryKey: ['league-standings'],
    queryFn: fetchStandings,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
