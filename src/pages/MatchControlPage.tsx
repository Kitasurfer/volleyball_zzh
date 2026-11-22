import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui';
import { MatchLogin, RuleFields, SetReport, matchCard, matchInput, matchPage } from '@/components/MatchScore';
import { matchError, useMatchText, type MatchText } from '@/data/matchTranslations';
import { useMatchControl } from '@/hooks/useMatchControl';
import { useMatchShell } from '@/hooks/useMatchShell';
import { usePublicScores } from '@/hooks/usePublicScores';
import { useAuth } from '@/lib/AuthContext';
import { downloadMatchFile, localMatches, undoTarget } from '@/lib/matchStorage';
import { canSwitchDecider, currentSet, opposite, setWins, shortScore, teamName,
  type Action, type MatchRules, type Side } from '@/lib/matchRules';
import { formatMatchDate, matchRpc } from '@/lib/matchApi';

const actionLabels: Record<Action['type'], Parameters<MatchText>[0]> = {
  MATCH_STARTED: 'start', SET_STARTED: 'next', POINT_AWARDED: 'ballFor',
  POINT_CORRECTED: 'correct', EARLIER_SET_CORRECTED: 'correct', EVENT_UNDONE: 'undo', SERVE_CHANGED: 'serve',
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
  const [setNumber, setSetNumber] = useState(1);
  const [publishing, setPublishing] = useState(false);
  const navigate = useNavigate();
  const [wake, setWake] = useState<WakeLockSentinel>();
  const local = id.startsWith('local-');
  const match = draft?.projected;
  const state = match?.state;
  const set = state ? currentSet(state) : undefined;
  const writable = Boolean(draft && (local || held) && !draft.conflict);
  const canPoint = writable && state?.status === 'live' && !set?.winner;
  const undoAvailable = writable && Boolean(draft && state &&
    ['live', 'paused'].includes(state.status) && undoTarget(draft.history));
  const left: Side = state?.left ?? 'a';
  useEffect(() => { if (state?.firstServe) setServe(opposite(state.firstServe)); },
    [state?.firstServe, state?.sets.length]);
  useEffect(() => () => { void wake?.release(); }, [wake]);
  useEffect(() => {
    const press = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || correction) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (canPoint && (event.code === 'Digit1' || event.code === 'Numpad1')) {
        event.preventDefault();
        void dispatch({ type: 'POINT_AWARDED', side: left });
      } else if (canPoint && (event.code === 'Digit2' || event.code === 'Numpad2')) {
        event.preventDefault();
        void dispatch({ type: 'POINT_AWARDED', side: opposite(left) });
      } else if (undoAvailable && event.code === 'KeyZ') {
        event.preventDefault();
        void dispatch({ type: 'EVENT_UNDONE' });
      }
    };
    window.addEventListener('keydown', press);
    return () => window.removeEventListener('keydown', press);
  }, [canPoint, undoAvailable, left, correction, dispatch]);
  const siblings = usePublicScores(
    !local && match?.competition_id ? match.competition_id : undefined,
    !local && Boolean(match?.competition_id));
  const locals = useQuery({ queryKey: ['skv-local-drafts'], enabled: local,
    queryFn: localMatches, refetchInterval: 4000, refetchOnWindowFocus: true });
  const [edited, setEdited] = useState<MatchRules>();
  if (!draft || !match || !state) return <main className={matchPage}>
    <p role="status">{model.loading ? t('loading') : error ? matchError(error, t) : t('unavailable')}</p>
    {!local && <Link to={`/scoreboard/${id}`}>{t('board')}</Link>}
  </main>;
  const highPrivilege = admin && authenticated && !offline && !draft.pending.length;
  const options: { id: string; label: string; done: boolean }[] = local
    ? (locals.data ?? []).map(d => ({
        id: d.key,
        label: `${d.projected.team_a} – ${d.projected.team_b} · ${t(d.projected.state.status)}`,
        done: ['completed', 'cancelled'].includes(d.projected.state.status),
      }))
    : (siblings.data ?? []).map(m => ({
        id: m.match_id,
        label: `${m.team_a} – ${m.team_b} · ${setWins(m.state, 'a')}:${setWins(m.state, 'b')} · ${t(m.state.status)}`,
        done: m.state.status === 'completed',
      }));
  if (!options.some(o => o.id === id)) {
    options.unshift({ id, done: false,
      label: `${match.team_a} – ${match.team_b} · ${t(state.status)}` });
  }
  const done = options.filter(o => o.done).length;
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
      const score = { a: Number(fields.get('a')), b: Number(fields.get('b')), reason };
      void dispatch(setNumber === state.sets.length ? { type: correction, ...score } :
        { type: 'EARLIER_SET_CORRECTED', setNumber, ...score });
    } else if (correction === 'MATCH_REOPENED' || correction === 'MATCH_CANCELLED') {
      void dispatch({ type: correction, reason });
    } else if (correction === 'WALKOVER') {
      void dispatch({ type: correction, side: fields.get('side') === 'b' ? 'b' : 'a', reason });
    }
    setCorrection(undefined);
  };
  const quickMinus = (side: Side) => {
    if (!set || set[side] <= 0) return;
    void dispatch({ type: 'POINT_CORRECTED',
      a: set.a - Number(side === 'a'), b: set.b - Number(side === 'b'), reason: '−1' });
  };
  const renderSide = (side: Side) => {
    const serving = state.serve === side && ['live', 'paused'].includes(state.status) &&
      !set?.winner;
    return <div key={side} className={`flex min-w-0 flex-col items-center gap-2 rounded-xl
      border p-3 text-center sm:gap-3 sm:p-5 ${side === 'a' ?
        'border-primary-100 bg-primary-50' : 'border-neutral-200 bg-neutral-100'}`}>
      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs
        font-semibold ${serving ? 'bg-green-100 text-green-800' : 'bg-white/70 text-neutral-500'}`}>
        ● {t('serve')}
      </span>
      <h2 className="w-full break-words font-bold leading-tight text-primary-900 hyphens-auto
        text-[clamp(0.95rem,3.5vw,1.75rem)]">{teamName(match, side)}</h2>
      <strong className="block leading-none tabular-nums text-primary-900
        text-[clamp(4rem,20vw,12rem)]">{set?.[side] ?? 0}</strong>
      {writable && state.status === 'live' && set && <div className="mt-auto flex w-full
        items-stretch gap-2">
        <Button variant="outline" className="shrink-0 px-3 text-xl"
          aria-label={`${t('removePoint')} · ${teamName(match, side)}`}
          disabled={set[side] <= 0} onClick={() => quickMinus(side)}>−</Button>
        {canPoint && <Button variant="accent"
          className="h-auto min-h-14 min-w-0 flex-1 px-2 text-xl font-bold"
          aria-label={`+1 ${teamName(match, side)}`}
          onClick={() => void dispatch({ type: 'POINT_AWARDED', side })}>+1</Button>}
      </div>}
    </div>;
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
        {local && state.status === 'completed' && (admin ? <Button disabled={publishing || offline}
          onClick={async () => {
            if (!window.confirm(t('publishLocal'))) return;
            setPublishing(true);
            try {
              const mid = await matchRpc<string>('skv_publish_local_match', {
                source_id: id.slice('local-'.length),
                config: { team_a: match.team_a, team_b: match.team_b, court: match.court, rules: match.rules },
                events: draft.history.map(({ id, at, action }) => ({ id, at, action })),
              });
              navigate(`/scoreboard/${mid}`);
            } catch (cause) { setNotice(matchError(cause, t)); }
            finally { setPublishing(false); }
          }}>{t('publishLocal')}</Button> : !authenticated && <details>
          <summary>{t('publishLocal')}</summary><MatchLogin />
        </details>)}
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
      {options.length > 1 && <nav className={`${matchCard} space-y-2 print:hidden`}>
        <label className="block text-sm font-semibold">{t('switchMatch')}
          <select className={`${matchInput} mt-1`} value={id}
            onChange={e => navigate(`/scoreboard/${e.target.value}/control`)}>
            {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>{done}/{options.length} · {t('matchesDone')}</span>
          {local && <Link className="font-semibold text-primary-700 underline"
            to="/scoreboard/new">{t('newMatch')}</Link>}
        </div>
      </nav>}
      <section className={`${matchCard} space-y-3 sm:space-y-4`} aria-label={t('title')}>
        <p className="text-center text-sm font-semibold text-neutral-600">
          {t(state.status)}{set && ` · ${t('set')} ${state.sets.length}`}
          {match.court && ` · ${match.court}`}
        </p>
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 sm:text-xs">
            {t('sets')}
          </span>
          <strong className="tabular-nums text-2xl font-bold text-primary-900 sm:text-3xl">
            {setWins(state, 'a')}:{setWins(state, 'b')}
          </strong>
          <span className="text-xs text-neutral-400">VS</span>
          {set && <span className="rounded-md bg-primary-100 px-2 py-0.5 text-xs font-semibold
            text-primary-900">{t('set')} {state.sets.length}</span>}
        </div>
        <div className="grid grid-cols-2 items-stretch gap-2 sm:gap-4">
          {renderSide(state.left)}
          {renderSide(opposite(state.left))}
        </div>
        {state.winner && <p className="break-words text-center text-lg font-bold text-primary-900">
          {t('winner')}: {teamName(match, state.winner)}
          {state.outcome === 'walkover' && ` · ${t('forfeit')}`}
        </p>}
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold text-primary-900">{t('sets')}</h2>
          <p className="text-sm text-neutral-600">
            {t('ruleTo')} {set?.target ?? match.rules.points} · {t('marginShort')} {match.rules.margin}
          </p>
        </div>
        <SetReport state={state} activeLast />
      </section>
      {writable && <section className="space-y-4 print:hidden">
        {state.status === 'live' && set?.winner && !state.winner &&
          <p role="status" className="rounded-md bg-accent-50 p-3 font-bold text-primary-900">
            {t('setFinished')} · {teamName(match, set.winner)}
          </p>}

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
        {local && state.status === 'scheduled' && <details className={`${matchCard} print:hidden`}>
          <summary className="cursor-pointer font-semibold">{t('editRules')}</summary>
          <div className="mt-3 space-y-3">
            <RuleFields rules={edited ?? match.rules} onChange={setEdited} />
            <Button variant="outline" disabled={!edited} onClick={() => {
              if (edited) void model.setRules(edited).then(() => setEdited(undefined));
            }}>{t('save')}</Button>
          </div>
        </details>}
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
            {set && <Button variant="outline" onClick={() => {
              setSetNumber(state.sets.length);
              setCorrection('POINT_CORRECTED');
            }}>
              {t('correct')}
            </Button>}
            {state.winner && <Button variant="accent" onClick={() =>
              confirmAction({ type: 'MATCH_COMPLETED' }, t('finish'))}>{t('finish')}</Button>}
          </>}
          {state.status === 'paused' && <Button variant="accent" onClick={() =>
            void dispatch({ type: 'MATCH_RESUMED' })}>{t('resume')}</Button>}
          {highPrivilege && state.status === 'completed' && state.outcome === 'played' &&
            <Button variant="danger" onClick={() => setCorrection('MATCH_REOPENED')}>
              {t('reopen')}
            </Button>}
          {highPrivilege && !['completed', 'cancelled'].includes(state.status) && <>
            <Button variant="danger" onClick={() => setCorrection('MATCH_CANCELLED')}>
              {t('cancel')}
            </Button>
            <Button variant="danger" onClick={() => setCorrection('WALKOVER')}>{t('forfeit')}</Button>
          </>}
        </div>
        <p className="text-xs text-neutral-500">{t('shortcuts')}</p>
        {correction && <form className={`${matchCard} space-y-3`} onSubmit={submitCorrection}>
          <h2 className="font-semibold">{correctionLabel}</h2>
          {correction === 'POINT_CORRECTED' && state.sets.length > 1 && <label>{t('set')}
            <select className={matchInput} value={setNumber}
              onChange={e => setSetNumber(Number(e.target.value))}>
              {state.sets.map((_, i) => <option key={i} value={i+1}>{i+1}</option>)}
            </select>
          </label>}
          {correction === 'POINT_CORRECTED' && <div key={setNumber} className="grid grid-cols-2 gap-3">
            {(['a', 'b'] as const).map(side => <label key={side}>{teamName(match, side)}
              <input name={side} className={matchInput} defaultValue={state.sets[setNumber-1]?.[side] ?? 0}
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
            {'setNumber' in event.action && ` · ${t('set')} ${event.action.setNumber}`}
            {'a' in event.action && ` · ${event.action.a}:${event.action.b}`}
            {'reason' in event.action && ` · ${event.action.reason}`}
          </li>)}
        </ol>
      </details>
    </main>
  );
}
