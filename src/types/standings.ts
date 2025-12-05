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

export interface StandingsResponse {
  standings: Standing[];
  team: Standing | null;
  lastUpdated: string | null;
  schedule?: CompetitionMatch[];
}
