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
