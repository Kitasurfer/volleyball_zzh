import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Button } from '@/components/ui';
import { MatchLogin, MatchScore, SetReport, matchCard, matchInput, matchPage } from '@/components/MatchScore';
import { matchError, useMatchText, type MatchText } from '@/data/matchTranslations';
import { useMatchControl } from '@/hooks/useMatchControl';
import { useMatchShell } from '@/hooks/useMatchShell';
import { useAuth } from '@/lib/AuthContext';
import { downloadMatchFile, undoTarget } from '@/lib/matchStorage';
import { canSwitchDecider, currentSet, opposite, shortScore, teamName,
  type Action, type Side } from '@/lib/matchRules';
import { formatMatchDate } from '@/lib/matchApi';

const actionLabels: Record<Action['type'], Parameters<MatchText>[0]> = {
  MATCH_STARTED: 'start', SET_STARTED: 'next', POINT_AWARDED: 'ballFor',
  POINT_CORRECTED: 'correct', EVENT_UNDONE: 'undo', SERVE_CHANGED: 'serve',
  SIDES_SWITCHED: 'switchSide', MATCH_PAUSED: 'pause', MATCH_RESUMED: 'resume',
  MATCH_COMPLETED: 'finish', MATCH_REOPENED: 'reopen', MATCH_CANCELLED: 'cancel',
  WALKOVER: 'forfeit',
};

export default function MatchControlPage() {
  const { matchId = '' } = useParams();
  const location = useLocation();
  const { user, loading, role } = useAuth();
  const { t } = useMatchText();
  useMatchShell();
  const local = matchId.startsWith('local-');
  let actor = user?.id;
  try {
    if (actor) sessionStorage.setItem('skv-last-referee', actor);
    else if (!navigator.onLine) actor = sessionStorage.getItem('skv-last-referee') ?? undefined;
    else if (!loading) sessionStorage.removeItem('skv-last-referee');
  } catch { /* Storage can be disabled in the browser. */ }
  if (!local && loading && !actor) return <main className={matchPage}>{t('loading')}</main>;
  if (!local && !actor) return <main className={matchPage}><MatchLogin /></main>;
  return <Control key={`${actor ?? 'local'}:${matchId}`} id={matchId}
    actor={actor} authenticated={Boolean(user)} admin={role === 'admin'}
    autoTake={location.state?.takeControl === true} />;
}

function Control({ id, actor, authenticated, admin, autoTake }: {
  id: string; actor: string | undefined; authenticated: boolean; admin: boolean; autoTake: boolean;
}) {
  const { t, language } = useMatchText();
  const model = useMatchControl(id, actor, authenticated, autoTake);
  const { draft, server, dispatch, offline, held, syncing, error } = model;
  const [serve, setServe] = useState<Side>('a');
  const [initialSide, setInitialSide] = useState<Side>('a');
  const [notice, setNotice] = useState('');
  const [correction, setCorrection] = useState<Action['type']>();
  const [wake, setWake] = useState<WakeLockSentinel>();
  const local = id.startsWith('local-');
  const match = draft?.projected;
  const state = match?.state;
  useEffect(() => { if (state?.firstServe) setServe(opposite(state.firstServe)); },
    [state?.firstServe, state?.sets.length]);
  useEffect(() => () => { void wake?.release(); }, [wake]);
  if (!draft || !match || !state) return <main className={matchPage}>
    <p role="status">{model.loading ? t('loading') : error ? matchError(error, t) : t('unavailable')}</p>
    {!local && <Link to={`/scoreboard/${id}`}>{t('board')}</Link>}
  </main>;
  const set = currentSet(state);
  const writable = (local || held) && !draft.conflict;
  const canPoint = writable && state.status === 'live' && !set?.winner;
  const highPrivilege = admin && authenticated && !offline && !draft.pending.length;
  const clickFullscreen = () => {
    const request = document.fullscreenElement ? document.exitFullscreen?.() :
      document.documentElement.requestFullscreen?.();
    if (!request) setNotice(t('unavailable'));
    void request?.catch(() => setNotice(t('unavailable')));
  };
  const correctionLabel = correction ? t(actionLabels[correction]) : '';
  const confirmAction = (action: Action, label: string) => {
    if (window.confirm(label)) void dispatch(action);
  };
  const submitCorrection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const reason = String(fields.get('reason') ?? '').trim();
    if (!reason || !window.confirm(correctionLabel)) return;
    if (correction === 'POINT_CORRECTED') {
      void dispatch({ type: correction, a: Number(fields.get('a')), b: Number(fields.get('b')),
        reason });
    } else if (correction === 'MATCH_REOPENED' || correction === 'MATCH_CANCELLED') {
      void dispatch({ type: correction, reason });
    } else if (correction === 'WALKOVER') {
      void dispatch({ type: correction, side: fields.get('side') === 'b' ? 'b' : 'a', reason });
    }
    setCorrection(undefined);
  };

  return (
    <main className={matchPage}>
      <header className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="text-sm font-semibold">SKV Unterensingen Volleyball</p>
          <h1 className="text-2xl font-bold text-primary-900">{t('control')}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {match.published && <Button variant="outline" asChild>
            <Link to={`/scoreboard/${id}`}>{t('board')}</Link>
          </Button>}
          <Button variant="outline" onClick={clickFullscreen}>{t('fullscreen')}</Button>
          {'wakeLock' in navigator && <Button variant="outline" onClick={() => {
            if (wake && !wake.released) void wake.release().then(() => setWake(undefined));
            else void navigator.wakeLock.request('screen').then(lock => {
              lock.addEventListener('release', () => setWake(undefined), { once: true });
              setWake(lock);
            }).catch(() => setNotice(t('unavailable')));
          }} aria-pressed={!!wake}>{t('keepScreen')}</Button>}
        </div>
      </header>
      <section className={`${matchCard} space-y-2 print:hidden`} aria-live="polite">
        <p className="font-semibold">
          {local ? t('local') : draft.conflict ? t('conflict') :
            offline ? t('offline') : syncing ? t('syncing') : t('synced')}
          {!local && draft.pending.length > 0 && ` · ${t('pending')}: ${draft.pending.length}`}
        </p>
        {!local && <p className="text-sm">{t('updated')}: {
          formatMatchDate(draft.confirmed.updated_at, language)}</p>}
        {error && <p role="alert" className="text-rose-800">{matchError(error, t)}</p>}
        {notice && <p role="status">{notice}</p>}
        {draft.conflict && <>
          <p>{t('server')}: {server ? shortScore(server.state) : '—'} · {
            t('device')}: {shortScore(state)}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => downloadMatchFile(`skv-draft-${id}.json`,
              JSON.stringify({ match: draft.projected, events: draft.pending }, null, 2),
              'application/json')}>{t('recovery')}</Button>
            <Button onClick={() => { if (window.confirm(t('keepServer'))) void model.keepServer(); }}
              disabled={!authenticated || !server || syncing}>{t('keepServer')}</Button>
          </div>
        </>}
        {!local && !held && !draft.conflict && <div className="flex flex-wrap gap-2">
          <Button onClick={() => model.take()} disabled={!authenticated || offline || syncing}>
            {t('takeControl')}
          </Button>
          {highPrivilege && <Button variant="outline" disabled={syncing}
            onClick={() => { if (window.confirm(t('force'))) model.take(true); }}>{t('force')}</Button>}
        </div>}
        {!local && held && !draft.conflict && <Button variant="outline"
          disabled={!authenticated || offline || syncing || !!draft.pending.length}
          onClick={() => { if (window.confirm(t('release'))) void model.release(); }}>
          {t('release')}
        </Button>}
      </section>
      <MatchScore match={match} />
      <SetReport state={state} />
      {writable && <section className="space-y-4 print:hidden">
        {state.status === 'live' && set?.winner && !state.winner &&
          <p role="status" className="rounded-md bg-accent-50 p-3 font-bold text-primary-900">
            {t('setFinished')} · {teamName(match, set.winner)}
          </p>}
        {canPoint && <div className="grid grid-cols-2 gap-3">
          {[state.left, opposite(state.left)].map(side => (
            <Button key={side} variant={side === 'a' ? 'accent' : 'default'}
              className="h-auto min-h-24 min-w-0 whitespace-normal break-all px-2 py-4 text-lg sm:text-2xl"
              onClick={() => void dispatch({ type: 'POINT_AWARDED', side })}>
              +1 {teamName(match, side)}
            </Button>
          ))}
        </div>}
        {(state.status === 'scheduled' || (state.status === 'live' && set?.winner && !state.winner)) &&
          <div className={`${matchCard} flex flex-wrap items-end gap-3`}>
            <label className="block">{t('serve')}
              <select className={matchInput} value={serve}
                onChange={e => setServe(e.target.value as Side)}>
                <option value="a">{match.team_a}</option><option value="b">{match.team_b}</option>
              </select>
            </label>
            {state.status === 'scheduled' && <label className="block">{t('switchSide')}
              <select className={matchInput} value={initialSide}
                onChange={e => setInitialSide(e.target.value as Side)}>
                <option value="a">{match.team_a} | {match.team_b}</option>
                <option value="b">{match.team_b} | {match.team_a}</option>
              </select>
            </label>}
            <Button variant="accent" onClick={() => {
              if (state.status === 'scheduled') {
                void dispatch({ type: 'MATCH_STARTED', side: serve, left: initialSide });
              } else void dispatch({ type: 'SET_STARTED', side: serve });
            }}>{t(state.status === 'scheduled' ? 'start' : 'next')}</Button>
          </div>}
        {canSwitchDecider(state, match.rules) &&
          <p role="status" className="rounded-md bg-accent-50 p-3 font-semibold">{t('switchHint')}</p>}
        <div className="flex flex-wrap gap-2">
          {['live', 'paused'].includes(state.status) && undoTarget(draft.history) &&
            <Button variant="outline" onClick={() => void dispatch({ type: 'EVENT_UNDONE' })}>
              {t('undo')}
            </Button>}
          {state.status === 'live' && <>
            <Button variant="outline" onClick={() => void dispatch({ type: 'MATCH_PAUSED' })}>
              {t('pause')}
            </Button>
            <Button variant="outline" onClick={() => void dispatch({ type: 'SIDES_SWITCHED' })}>
              {t('switchSide')}
            </Button>
            {canPoint && <Button variant="outline" onClick={() => void dispatch({
              type: 'SERVE_CHANGED', side: opposite(state.serve ?? 'a'),
            })}>{t('serve')}</Button>}
            {set && <Button variant="outline" onClick={() => setCorrection('POINT_CORRECTED')}>
              {t('correct')}
            </Button>}
            {state.winner && <Button variant="accent" onClick={() =>
              confirmAction({ type: 'MATCH_COMPLETED' }, t('finish'))}>{t('finish')}</Button>}
          </>}
          {state.status === 'paused' && <Button onClick={() =>
            void dispatch({ type: 'MATCH_RESUMED' })}>{t('resume')}</Button>}
          {highPrivilege && state.status === 'completed' && state.outcome === 'played' &&
            <Button variant="outline" onClick={() => setCorrection('MATCH_REOPENED')}>
              {t('reopen')}
            </Button>}
          {highPrivilege && !['completed', 'cancelled'].includes(state.status) && <>
            <Button variant="outline" onClick={() => setCorrection('MATCH_CANCELLED')}>
              {t('cancel')}
            </Button>
            <Button variant="outline" onClick={() => setCorrection('WALKOVER')}>{t('forfeit')}</Button>
          </>}
        </div>
        {correction && <form className={`${matchCard} space-y-3`} onSubmit={submitCorrection}>
          <h2 className="font-semibold">{correctionLabel}</h2>
          {correction === 'POINT_CORRECTED' && <div className="grid grid-cols-2 gap-3">
            {(['a', 'b'] as const).map(side => <label key={side}>{teamName(match, side)}
              <input name={side} className={matchInput} defaultValue={set?.[side] ?? 0}
                type="number" min="0" max="2147483646" required />
            </label>)}
          </div>}
          {correction === 'WALKOVER' && <label>{t('winner')}
            <select name="side" className={matchInput}>
              <option value="a">{match.team_a}</option><option value="b">{match.team_b}</option>
            </select>
          </label>}
          <label className="block">{t('reason')}
            <input name="reason" className={matchInput} required maxLength={500} />
          </label>
          <div className="flex gap-2">
            <Button type="submit">{t('confirm')}</Button>
            <Button variant="outline" type="button" onClick={() => setCorrection(undefined)}>
              {t('dismiss')}
            </Button>
          </div>
        </form>}
      </section>}
      <details className={matchCard}>
        <summary className="cursor-pointer font-bold">{t('protocol')}</summary>
        <p className="my-3 break-words">{match.team_a} · {match.team_b} · {match.court}</p>
        <Button variant="outline" className="print:hidden" onClick={() => window.print()}>
          {t('print')}
        </Button>
        <ol className="mt-3 max-h-80 space-y-1 overflow-auto text-sm print:max-h-none">
          {[...draft.history].reverse().map(event => <li key={event.id} className="break-words">
            #{event.sequence} · {formatMatchDate(event.at, language)} · {
              t(actionLabels[event.action.type])}
            {'side' in event.action && ` · ${teamName(match, event.action.side)}`}
            {'a' in event.action && ` · ${event.action.a}:${event.action.b}`}
            {'reason' in event.action && ` · ${event.action.reason}`}
          </li>)}
        </ol>
      </details>
    </main>
  );
}
