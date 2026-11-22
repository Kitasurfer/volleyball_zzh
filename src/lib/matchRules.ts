export type Side = 'a' | 'b';
export type MatchStatus = 'scheduled' | 'live' | 'paused' | 'completed' | 'cancelled';
export interface MatchRules {
  bestOf: 1 | 3 | 5;
  points: number;
  deciding: number;
  margin: number;
  switchAt: number;
}
export interface SetScore {
  a: number; b: number; target: number; winner: Side | null;
  /** Timeouts taken by each side in this set (0-2); absent in states stored before. */
  timeouts_a?: number; timeouts_b?: number;
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

type SideAction = 'SET_STARTED' | 'POINT_AWARDED' | 'SERVE_CHANGED' | 'TIMEOUT_CALLED';
export type Action =
  | { [T in SideAction]: { type: T; side: Side } }[SideAction]
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
export const canSwitchDecider = (s: MatchState, r: MatchRules) =>
  s.status === 'live' && s.sets.length === r.bestOf && r.bestOf > 1 && !s.switched &&
  !currentSet(s)?.winner && r.switchAt > 0 &&
  Math.max(currentSet(s).a, currentSet(s).b) >= r.switchAt;

/** Pure optimistic counterpart of skv_reduce_score; SQL remains authoritative. */
export function applyScore(
  state: MatchState, rules: MatchRules, action: Action, undoState?: MatchState,
): MatchState {
  const invalid = (): never => { throw new Error('invalid_action'); };
  const set = currentSet(state);
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
        sets: [...state.sets, { a: 0, b: 0, target: deciding ? rules.deciding : rules.points,
          winner: null, timeouts_a: 0, timeouts_b: 0 }],
      };
    }
    case 'POINT_AWARDED':
    case 'EARLIER_SET_CORRECTED':
    case 'POINT_CORRECTED': {
      const point = action.type === 'POINT_AWARDED';
      const earlier = action.type === 'EARLIER_SET_CORRECTED';
      const index = earlier ? action.setNumber - 1 : state.sets.length - 1;
      if (earlier && index >= state.sets.length - 1) return invalid();
      const selected = state.sets[index];
      if (state.status !== 'live' || !selected || (point && selected.winner)) return invalid();
      const a = point ? selected.a + Number(action.side === 'a') : action.a;
      const b = point ? selected.b + Number(action.side === 'b') : action.b;
      if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b) || a < 0 || b < 0 ||
          a > 2147483646 || b > 2147483646) return invalid();
      if (!point && (!action.reason.trim() || action.reason.trim().length > 500)) return invalid();
      const winner = Math.max(a, b) >= selected.target && Math.abs(a - b) >= rules.margin
        ? a > b ? 'a' : 'b' : null;
      const sets = state.sets.slice();
      sets[index] = { ...selected, a, b, winner };
      const needed = (rules.bestOf + 1) / 2;
      if (earlier && (!winner || sets.slice(0, -1).filter(s => s.winner === winner).length >= needed)) {
        throw new Error('invalid_set_history');
      }
      const next: MatchState = {
        ...state, sets,
        serve: point ? action.side : state.serve, winner: null,
      };
      if (setWins(next, 'a') >= needed) next.winner = 'a';
      else if (setWins(next, 'b') >= needed) next.winner = 'b';
      return next;
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
      if (used >= 2) return invalid();
      const sets = state.sets.slice();
      sets[sets.length - 1] = action.side === 'a'
        ? { ...set, timeouts_a: used + 1 } : { ...set, timeouts_b: used + 1 };
      return { ...state, sets };
    }
    case 'SIDES_SWITCHED':
      if (state.status !== 'live') return invalid();
      return { ...state, left: opposite(state.left),
        switched: state.switched || canSwitchDecider(state, rules) };
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
