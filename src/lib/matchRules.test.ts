import { describe, expect, it } from 'vitest';
import { applyScore, canSwitchDecider, currentSet, indoorRules, initialMatch, setWins,
  type MatchRules, type MatchState, type Side } from '@/lib/matchRules';
import { berlinTime, compareLeagueResult, roundRobin, type ControlledMatch, type PublicScore } from '@/lib/matchApi';
import type { CompetitionMatch } from '@/types/standings';
import { queueAction, seedDraft, undoTarget } from '@/lib/matchStorage';

const start = (r = indoorRules(1), serve: Side = 'a') =>
  applyScore(initialMatch(), r, { type: 'MATCH_STARTED', side: serve });
const correct = (s: MatchState, r: MatchRules, a: number, b: number) =>
  applyScore(s, r, { type: 'POINT_CORRECTED', a, b, reason: 'Score sheet verified' });
const next = (s: MatchState, r: MatchRules) =>
  applyScore(s, r, { type: 'SET_STARTED', side: 'b' });

describe('volleyball rules', () => {
  it('starts at zero and follows the winner of every rally for service', () => {
    const r = indoorRules(1);
    const s = start(r);
    expect(currentSet(s)).toEqual({ a: 0, b: 0, winner: null, target: 25 });
    const a = applyScore(s, r, { type: 'POINT_AWARDED', side: 'a' });
    expect(a.serve).toBe('a');
    const b = applyScore(a, r, { type: 'POINT_AWARDED', side: 'b' });
    expect(b.serve).toBe('b');
    expect(currentSet(b)).toMatchObject({ a: 1, b: 1 });
    expect(applyScore(b, r, { type: 'EVENT_UNDONE' }, a)).toEqual(a);
  });

  it.each([
    [25, 22, 'a'], [25, 24, null], [26, 24, 'a'], [26, 25, null], [27, 25, 'a'],
    [104, 102, 'a'],
  ])('applies the uncapped two-point margin at %i:%i', (a, b, expected) => {
    const r = indoorRules(1);
    const s = correct(start(r), r, a, b);
    expect(currentSet(s)?.winner).toBe(expected);
    expect(s.winner).toBe(expected);
  });

  it.each([[15, 13, 'a'], [15, 14, null], [16, 14, 'a']])(
    'uses 15 points and the two-point margin in the deciding set at %i:%i', (a, b, expected) => {
      const r = indoorRules(3);
      const first = correct(start(r), r, 25, 15);
      const second = correct(next(first, r), r, 18, 25);
      const third = next(second, r);
      expect(currentSet(third)?.target).toBe(15);
      expect(correct(third, r, a, b).winner).toBe(expected);
    },
  );

  it.each([[3, 2], [5, 3]] as const)(
    'wins best-of-%i after %i sets and requires explicit confirmation', (best, wins) => {
      const r = indoorRules(best);
      let s = start(r);
      for (let i = 0; i < wins; i++) {
        s = correct(i ? next(s, r) : s, r, 25, 20);
        expect(s.status).toBe('live');
        expect(setWins(s, 'a')).toBe(i + 1);
        expect(s.winner).toBe(i === wins - 1 ? 'a' : null);
        expect(() => applyScore(s, r, { type: 'POINT_AWARDED', side: 'a' })).toThrow();
      }
      expect(applyScore(s, r, { type: 'MATCH_COMPLETED' }).status).toBe('completed');
      expect(() => next(s, r)).toThrow();
    },
  );

  it('keeps the team identity when switching ends and prompts at eight in the decider', () => {
    const r = indoorRules(3);
    const first = correct(start(r), r, 25, 15);
    const second = correct(next(first, r), r, 18, 25);
    const third = correct(next(second, r), r, 8, 6);
    expect(canSwitchDecider(third, r)).toBe(true);
    const swapped = applyScore(third, r, { type: 'SIDES_SWITCHED' });
    expect(swapped.left).not.toBe(third.left);
    expect(swapped.sets).toEqual(third.sets);
    expect(canSwitchDecider(swapped, r)).toBe(false);
  });

  it('allows corrections to a reopened result but not to a confirmed one', () => {
    const r = indoorRules(1);
    const won = correct(start(r), r, 25, 20);
    const done = applyScore(won, r, { type: 'MATCH_COMPLETED' });
    expect(() => correct(done, r, 20, 25)).toThrow();
    const reopened = applyScore(done, r, { type: 'MATCH_REOPENED', reason: 'Verified score' });
    expect(correct(reopened, r, 20, 25).winner).toBe('b');
  });

  it('supports a custom training target and margin; pause blocks scoring', () => {
    const r: MatchRules = { ...indoorRules(1), points: 21, margin: 1 };
    const paused = applyScore(start(r), r, { type: 'MATCH_PAUSED' });
    expect(() => applyScore(paused, r, { type: 'POINT_AWARDED', side: 'a' })).toThrow();
    const resumed = applyScore(paused, r, { type: 'MATCH_RESUMED' });
    expect(correct(resumed, r, 21, 20).winner).toBe('a');
  });

  it('preserves later rallies and rejects corrections that invalidate a later set', () => {
    const rules = indoorRules(3);
    const split = correct(next(correct(start(rules), rules, 25, 18), rules), rules, 21, 25);
    const decider = correct(next(split, rules), rules, 6, 8);
    const edit = (s: MatchState, a: number, b: number) => applyScore(s, rules, {
      type: 'EARLIER_SET_CORRECTED', setNumber: 1, a, b, reason: 'Verified',
    });
    expect(edit(decider, 25, 22).sets.slice(1)).toEqual(decider.sets.slice(1));
    expect(() => edit(decider, 22, 25)).toThrow('invalid_set_history');
    expect(() => edit(decider, 24, 23)).toThrow('invalid_set_history');
    expect(edit(split, 20, 25).winner).toBe('b');
    const finished = applyScore(edit(split, 20, 25), rules, { type: 'MATCH_COMPLETED' });
    expect(() => edit(finished, 25, 20)).toThrow('invalid_action');
  });
});

describe('VLW result comparison', () => {
  const rules = indoorRules(1);
  const state = applyScore(correct(start(rules), rules, 25, 17), rules, { type: 'MATCH_COMPLETED' });
  const local = { state, team_a: 'Guests', team_b: 'SKV Unterensingen' } as PublicScore;
  const fixture = { homeTeam: 'SG TSV Zizishausen/SKV Unterensingen', awayTeam: 'Guests' } as CompetitionMatch;
  it('compares completed scores in official home/away order, including available rally totals', () => {
    for (const result of ['0:1', '0:1 (17:25)']) {
      expect(compareLeagueResult({ ...fixture, result }, local)).toBe('vlwMatches');
    }
    for (const result of ['1:0', '0:1 (18:25)']) {
      expect(compareLeagueResult({ ...fixture, result }, local)).toBe('vlwDiffers');
    }
    expect(compareLeagueResult({ ...fixture, result: null }, local)).toBeNull();
    expect(compareLeagueResult({ ...fixture, result: 'postponed' }, local)).toBeNull();
    expect(compareLeagueResult({ ...fixture, result: '0:1', homeTeam: 'Other' }, local)).toBe('checkTeams');
  });
});

describe('durable event projection', () => {
  it('retains ordered pending actions, base revisions and undo references', () => {
    const match: ControlledMatch = {
      id: 'test', team_a: 'A', team_b: 'B', court: '1', rules: indoorRules(1), state: initialMatch(),
      version: 0, published: true, competition_id: null, external_match_id: null, scheduled_at: null,
      started_at: null, finished_at: null, updated_at: new Date().toISOString(), duration_minutes: 60,
    };
    let draft = seedDraft('test', match);
    draft = queueAction(draft, { type: 'MATCH_STARTED', side: 'a' }, false);
    draft = queueAction(draft, { type: 'POINT_AWARDED', side: 'b' }, false);
    draft = queueAction(draft, { type: 'EVENT_UNDONE' }, false);
    expect(draft.pending.map(e => e.base)).toEqual([0, 1, 2]);
    expect(new Set(draft.pending.map(e => e.id)).size).toBe(3);
    expect(draft.history[2].reference).toBe(draft.history[1].id);
    expect(undoTarget(draft.history)?.id).toBe(draft.history[0].id);
    expect(draft.projected.state.serve).toBe('a');
    expect(draft.confirmed.version).toBe(0);
  });
});

describe('scheduling', () => {
  it('schedules every team pairing exactly once for both even and odd fields', () => {
    for (const count of [4, 5]) {
      const ids = Array.from({ length: count }, (_, i) => `${i}`);
      const rounds = roundRobin(ids);
      for (const round of rounds) expect(new Set(round.flat()).size).toBe(round.flat().length);
      expect(new Set(rounds.flat().map(pair => [...pair].sort().join())) .size)
        .toBe(count * (count - 1) / 2);
    }
  });

  it('stores Berlin wall time as UTC and refuses DST gaps or ambiguity', () => {
    expect(berlinTime('2026-11-28T13:00')).toBe('2026-11-28T12:00:00.000Z');
    expect(berlinTime('2026-07-01T13:00')).toBe('2026-07-01T11:00:00.000Z');
    expect(() => berlinTime('2026-03-29T02:30')).toThrow('invalid_time');
    expect(() => berlinTime('2026-10-25T02:30')).toThrow('invalid_time');
  });
});
