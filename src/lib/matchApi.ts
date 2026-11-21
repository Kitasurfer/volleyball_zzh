import { supabase } from '@/lib/supabase';
import type { Action, MatchEvent, MatchRules, MatchState } from '@/lib/matchRules';

export interface PublicScore {
  match_id: string;
  competition_id: string | null;
  competition_name: string | null;
  external_match_id: string | null;
  team_a: string;
  team_b: string;
  court: string;
  scheduled_at: string | null;
  finished_at: string | null;
  state: MatchState;
  version: number;
  updated_at: string;
}

export interface ControlledMatch extends Omit<PublicScore, 'match_id' | 'competition_name'> {
  id: string;
  rules: MatchRules;
  published: boolean;
  duration_minutes: number;
  started_at: string | null;
}

export interface HistoryEvent {
  id: string;
  action: Action;
  sequence: number;
  before: MatchState;
  reference: string | null;
  at: string;
}

export const decisionKeys = [
  'points', 'wins', 'setDifference', 'ballDifference', 'ballFor',
] as const;
export const awardKeys = [
  'win', 'loss', 'decidingWin', 'decidingLoss', 'walkoverWin', 'walkoverLoss',
] as const;
export interface Competition {
  id: string;
  name: string;
  venue: string;
  description: string;
  starts_at: string | null;
  visibility: 'public' | 'private';
  rules: MatchRules;
  standings: {
    order: (typeof decisionKeys)[number][];
    points: Record<(typeof awardKeys)[number], number>;
  };
}
export interface Standing {
  place: number; team: string; played: number; wins: number; losses: number;
  sets_for: number; sets_against: number; ball_for: number; ball_against: number; points: number;
}
export interface Team { id: string; name: string }

export function matchClient() {
  if (!supabase) throw new Error('not_configured');
  return supabase;
}

export async function matchRpc<T>(name: string, parameters?: Record<string, unknown>): Promise<T> {
  const result = await matchClient().rpc(name, parameters);
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export const readMatch = (mid: string) => matchRpc<ControlledMatch>('skv_read_match', { mid });
export const readSnapshot = (mid: string) =>
  matchRpc<{ match: ControlledMatch; history: HistoryEvent[] }>('skv_control_snapshot', { mid });
export const acquireLease = (mid: string, device: string, force: boolean, expected?: number) =>
  matchRpc<{ fence: number; match: ControlledMatch }>('skv_acquire_lease',
    { mid, device, force_takeover: force, expected_fence: expected ?? null });
export const sendEvent = (mid: string, device: string, fence: number, event: MatchEvent) =>
  matchRpc<{ ack: number; match: ControlledMatch }>('skv_apply_event', {
    mid, device, lease_fence: fence, eid: event.id, base: event.base,
    happened_at: event.at, action: event.action,
  });

export const scoreKey = (id: string) => ['skv-score', id] as const;
export const scoresKey = ['skv-scores'] as const;
const fields = 'id,name,venue,description,starts_at,visibility,rules,standings';

export async function getCompetition(id: string) {
  const { data, error } = await matchClient().from('skv_competitions').select(fields)
    .eq('id', id).eq('visibility', 'public').maybeSingle();
  if (error) throw new Error(error.message);
  return data as Competition | null;
}

export async function listCompetitions(admin = false) {
  let query = matchClient().from('skv_competitions').select(fields);
  if (!admin) query = query.eq('visibility', 'public');
  const { data, error } = await query.order('starts_at', { ascending: false }).limit(100);
  if (error) throw new Error(error.message);
  return data as Competition[];
}

export function formatMatchDate(value: string, language: string) {
  return new Intl.DateTimeFormat(language, {
    timeZone: 'Europe/Berlin', dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(value));
}

const berlinClock = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Berlin', dateStyle: 'short', timeStyle: 'short',
});
export const berlinInput = (value: string | null) => value
  ? berlinClock.format(new Date(value)).replace(' ', 'T') : '';

/** Parse a Berlin wall time, rejecting DST gaps and ambiguous repeated hours. */
export function berlinTime(value: string) {
  if (!value) return null;
  const utc = Date.parse(`${value}:00Z`);
  const candidates = [1, 2].map(hours => new Date(utc - hours * 3600000))
    .filter(date => Number.isFinite(+date) && berlinInput(date.toISOString()) === value);
  if (candidates.length !== 1) throw new Error('invalid_time');
  return candidates[0].toISOString();
}

export function roundRobin(ids: string[]) {
  const ring = [...ids];
  if (ring.length % 2) ring.push('');
  const rounds: [string, string][][] = [];
  for (let round = 0; round < ring.length - 1; round++) {
    const pairs: [string, string][] = [];
    for (let i = 0; i < ring.length / 2; i++) {
      const a = ring[i];
      const b = ring[ring.length - i - 1];
      if (a && b) pairs.push((round + i) % 2 ? [b, a] : [a, b]);
    }
    rounds.push(pairs);
    ring.splice(1, 0, ring.pop()!);
  }
  return rounds;
}
