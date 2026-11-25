export type Side = 'a' | 'b';
export type MatchStatus = 'scheduled' | 'live' | 'paused' | 'completed' | 'cancelled';
export type SanctionKind = 'warning' | 'penalty' | 'expulsion' | 'disqualification';
export interface MatchRules {
  bestOf: 1 | 3 | 5;
  points: number;
  deciding: number;
  margin: number;
  switchAt: number;
  /** Max timeouts per team and set; default 2, beach usually 1. */
  timeouts?: number;
  /** Max substitutions per team and set; default 6, 0 disables tracking. */
  substitutions?: number;
  /** Beach: switch sides every N total rallies in regular sets; 0/off by default. */
  switchEvery?: number;
  /** Beach: switch every N total rallies in the deciding set; overrides switchAt when > 0. */
  switchEveryDecider?: number;
}
export interface Sanction {
  side: Side;
  kind: SanctionKind;
}
export interface SetScore {
  a: number; b: number; target: number; winner: Side | null;
  /** Timeouts taken by each side in this set (0-2); absent in states stored before. */
  timeouts_a?: number; timeouts_b?: number;
  /** Substitutions per side in this set; absent in states stored before. */
  subs_a?: number; subs_b?: number;
  /** Completed side switches in this set; absent in states stored before. */
  switches?: number;
  /** Recorded sanctions in rally order; absent in states stored before. */
  sanctions?: Sanction[];
}
export interface MatchState {
  status: MatchStatus;
  sets: SetScore[];
  serve: Side | null;
  firstServe: Side | null;
  left: Side;
  switched: boolean;
  winner: Side | null;
  outcome: 'played' | 'walkover' | null;
}

type SideAction = 'SET_STARTED' | 'POINT_AWARDED' | 'SERVE_CHANGED' | 'TIMEOUT_CALLED'
  | 'POINT_REMOVED' | 'SUBSTITUTION';
export type Action =
  | { [T in SideAction]: { type: T; side: Side } }[SideAction]
  | { type: 'SANCTION'; side: Side; kind: SanctionKind }
  | { type: 'MATCH_STARTED'; side: Side; left?: Side }
  | { type: 'POINT_CORRECTED'; a: number; b: number; reason: string }
  | { type: 'EARLIER_SET_CORRECTED'; setNumber: number; a: number; b: number; reason: string }
  | { type: 'MATCH_REOPENED' | 'MATCH_CANCELLED'; reason: string }
  | { type: 'WALKOVER'; side: Side; reason: string }
  | { type: 'EVENT_UNDONE' | 'SIDES_SWITCHED' | 'MATCH_PAUSED' | 'MATCH_RESUMED'
    | 'MATCH_COMPLETED' };

export interface MatchEvent {
  id: string;
  action: Action;
  base: number;
  at: string;
}

/** Indoor presets; club matches can override the targets before starting. */
export const indoorRules = (bestOf: MatchRules['bestOf'] = 3): MatchRules => ({
  bestOf, points: 25, deciding: 15, margin: 2, switchAt: 8,
});

/** Beach presets: sets to 21, best of 3, one timeout, side switch every 7/5 rallies. */
export const beachRules = (): MatchRules => ({
  bestOf: 3, points: 21, deciding: 15, margin: 2, switchAt: 0,
  timeouts: 1, substitutions: 0, switchEvery: 7, switchEveryDecider: 5,
});

export const initialMatch = (): MatchState => ({
  status: 'scheduled', sets: [], serve: null, firstServe: null, left: 'a',
  switched: false, winner: null, outcome: null,
});

export const opposite = (side: Side): Side => side === 'a' ? 'b' : 'a';
export const setWins = (state: MatchState, side: Side) =>
  state.sets.filter(set => set.winner === side).length;
export const currentSet = (state: MatchState) => state.sets[state.sets.length - 1];
export const teamName = (match: { team_a: string; team_b: string }, side: Side) =>
  side === 'a' ? match.team_a : match.team_b;
export const shortScore = (state: MatchState) =>
  `${setWins(state, 'a')}:${setWins(state, 'b')} · ${currentSet(state)?.a ?? 0}:${currentSet(state)?.b ?? 0}`;
export const timeoutLimit = (rules: { timeouts?: number } | null | undefined) =>
  rules?.timeouts ?? 2;
export const subLimit = (rules: { substitutions?: number } | null | undefined) =>
  rules?.substitutions ?? 6;

export const canSwitchDecider = (s: MatchState, r: MatchRules) =>
  s.status === 'live' && s.sets.length === r.bestOf && r.bestOf > 1 && !s.switched &&
  !currentSet(s)?.winner && r.switchAt > 0 &&
  Math.max(currentSet(s).a, currentSet(s).b) >= r.switchAt;

/** Side switch is due now: beach interval logic in every set, indoor logic in the decider. */
export function switchDue(state: MatchState, rules: MatchRules) {
  if (state.status !== 'live') return false;
  const set = currentSet(state);
  if (!set || set.winner) return false;
  const total = set.a + set.b;
  const switches = set.switches ?? 0;
  const deciding = state.sets.length === rules.bestOf && rules.bestOf > 1;
  if (deciding) {
    if ((rules.switchEveryDecider ?? 0) > 0) {
      return Math.floor(total / rules.switchEveryDecider!) > switches;
    }
    return canSwitchDecider(state, rules);
  }
  return (rules.switchEvery ?? 0) > 0 && Math.floor(total / rules.switchEvery!) > switches;
}

function newSet(target: number): SetScore {
  return { a: 0, b: 0, target, winner: null, timeouts_a: 0, timeouts_b: 0,
    subs_a: 0, subs_b: 0, switches: 0, sanctions: [] };
}

/** Pure optimistic counterpart of skv_reduce_score; SQL remains authoritative. */
export function applyScore(
  state: MatchState, rules: MatchRules, action: Action, undoState?: MatchState,
): MatchState {
  const invalid = (): never => { throw new Error('invalid_action'); };
  const set = currentSet(state);
  /** Shared rally outcome for points and penalties; mirrors the SQL reducer. */
  const pointState = (selected: SetScore, index: number, a: number, b: number,
    extra?: Partial<SetScore>, serve?: Side,
  ): MatchState => {
    if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b) || a < 0 || b < 0 ||
        a > 2147483646 || b > 2147483646) return invalid();
    const winner = Math.max(a, b) >= selected.target && Math.abs(a - b) >= rules.margin
      ? a > b ? 'a' : 'b' : null;
    const sets = state.sets.slice();
    sets[index] = { ...selected, ...extra, a, b, winner };
    const needed = (rules.bestOf + 1) / 2;
    const next: MatchState = {
      ...state, sets, serve: serve ?? state.serve, winner: null,
    };
    if (setWins(next, 'a') >= needed) next.winner = 'a';
    else if (setWins(next, 'b') >= needed) next.winner = 'b';
    return next;
  };
  switch (action.type) {
    case 'MATCH_STARTED':
    case 'SET_STARTED': {
      const first = action.type === 'MATCH_STARTED';
      if (first ? state.status !== 'scheduled' :
        state.status !== 'live' || !set?.winner || !!state.winner) return invalid();
      const deciding = state.sets.length + 1 === rules.bestOf && rules.bestOf > 1;
      return {
        ...state, status: 'live', serve: action.side, firstServe: action.side, switched: false,
        left: action.type === 'MATCH_STARTED' ? action.left ?? state.left : opposite(state.left),
        sets: [...state.sets, newSet(deciding ? rules.deciding : rules.points)],
      };
    }
    case 'POINT_AWARDED':
    case 'POINT_REMOVED':
    case 'EARLIER_SET_CORRECTED':
    case 'POINT_CORRECTED': {
      const point = action.type === 'POINT_AWARDED';
      const removed = action.type === 'POINT_REMOVED';
      const earlier = action.type === 'EARLIER_SET_CORRECTED';
      const index = earlier ? action.setNumber - 1 : state.sets.length - 1;
      if (earlier && index >= state.sets.length - 1) return invalid();
      const selected = state.sets[index];
      if (state.status !== 'live' || !selected || (point && selected.winner)) return invalid();
      const a = point ? selected.a + Number(action.side === 'a') :
        removed ? selected.a - Number(action.side === 'a') : action.a;
      const b = point ? selected.b + Number(action.side === 'b') :
        removed ? selected.b - Number(action.side === 'b') : action.b;
      if (!point && !removed && (!action.reason.trim() || action.reason.trim().length > 500))
        return invalid();
      if (earlier) {
        // History validation needs the winner computation of pointState; run it and inspect.
        const trial = pointState(selected, index, a, b);
        const winner = trial.sets[index].winner;
        const needed = (rules.bestOf + 1) / 2;
        if (!winner ||
          trial.sets.slice(0, -1).filter(s => s.winner === winner).length >= needed) {
          throw new Error('invalid_set_history');
        }
        return trial;
      }
      return pointState(selected, index, a, b, undefined, point ? action.side : undefined);
    }
    case 'EVENT_UNDONE':
      if (!undoState || !['live', 'paused'].includes(state.status)) return invalid();
      return undoState;
    case 'SERVE_CHANGED':
      if (state.status !== 'live' || !set || set.winner) return invalid();
      return { ...state, serve: action.side };
    case 'TIMEOUT_CALLED': {
      if (state.status !== 'live' || !set || set.winner) return invalid();
      const used = (action.side === 'a' ? set.timeouts_a : set.timeouts_b) ?? 0;
      if (used >= timeoutLimit(rules)) return invalid();
      const sets = state.sets.slice();
      sets[sets.length - 1] = action.side === 'a'
        ? { ...set, timeouts_a: used + 1 } : { ...set, timeouts_b: used + 1 };
      return { ...state, sets };
    }
    case 'SUBSTITUTION': {
      if (state.status !== 'live' || !set || set.winner || subLimit(rules) === 0) return invalid();
      const used = (action.side === 'a' ? set.subs_a : set.subs_b) ?? 0;
      if (used >= subLimit(rules)) return invalid();
      const sets = state.sets.slice();
      sets[sets.length - 1] = action.side === 'a'
        ? { ...set, subs_a: used + 1 } : { ...set, subs_b: used + 1 };
      return { ...state, sets };
    }
    case 'SANCTION': {
      if (state.status !== 'live' || !set || set.winner) return invalid();
      const sanctioned: SetScore = { ...set,
        sanctions: [...(set.sanctions ?? []), { side: action.side, kind: action.kind }] };
      if (action.kind !== 'penalty') {
        const sets = state.sets.slice();
        sets[sets.length - 1] = sanctioned;
        return { ...state, sets };
      }
      const scorer = opposite(action.side);
      return pointState(sanctioned, state.sets.length - 1,
        sanctioned.a + Number(scorer === 'a'), sanctioned.b + Number(scorer === 'b'),
        undefined, scorer);
    }
    case 'SIDES_SWITCHED': {
      if (state.status !== 'live') return invalid();
      const sets = state.sets.slice();
      if (set && !set.winner) {
        sets[sets.length - 1] = { ...set, switches: (set.switches ?? 0) + 1 };
      }
      return { ...state, left: opposite(state.left), sets,
        switched: state.switched || canSwitchDecider(state, rules) };
    }
    case 'MATCH_PAUSED':
      if (state.status !== 'live') return invalid();
      return { ...state, status: 'paused' };
    case 'MATCH_RESUMED':
      if (state.status !== 'paused') return invalid();
      return { ...state, status: 'live' };
    case 'MATCH_COMPLETED':
      if (state.status !== 'live' || !state.winner) return invalid();
      return { ...state, status: 'completed', outcome: 'played' };
    case 'MATCH_REOPENED':
      if (state.status !== 'completed' || state.outcome !== 'played' ||
          !action.reason.trim()) return invalid();
      return { ...state, status: 'live', outcome: null };
    case 'MATCH_CANCELLED':
      if (['completed', 'cancelled'].includes(state.status) || !action.reason.trim()) {
        return invalid();
      }
      return { ...state, status: 'cancelled', winner: null, outcome: null };
    case 'WALKOVER':
      if (!['scheduled', 'live', 'paused'].includes(state.status) ||
          !action.reason.trim()) return invalid();
      return { ...state, status: 'completed', winner: action.side, outcome: 'walkover' };
  }
}
