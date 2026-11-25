import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/AuthContext';
import { currentSet, opposite, setWins, teamName, timeoutLimit, type MatchRules, type MatchState } from '@/lib/matchRules';
import { useMatchText } from '@/data/matchTranslations';
import { formatMatchDate, type PublicScore } from '@/lib/matchApi';

export const matchInput = 'w-full min-w-0 rounded-md border border-neutral-200 bg-white px-3 py-2';
export const matchCard = 'rounded-xl border border-neutral-200 bg-white p-5 shadow-sm';
export const matchPage = 'container min-h-[60vh] space-y-6 pb-16 pt-28';

export function MatchLogin() {
  const { t } = useMatchText();
  const { signInWithPassword } = useAuth();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setFailed(false);
    try {
      setFailed(!!(await signInWithPassword(String(form.get('email')), String(form.get('password')))));
    } catch { setFailed(true); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={login} className={`${matchCard} max-w-md space-y-3`}>
      <h2 className="text-lg font-bold">{t('login')}</h2>
      <label className="block">{t('email')}
        <input name="email" type="email" autoComplete="username" required className={matchInput} />
      </label>
      <label className="block">{t('password')}
        <input name="password" type="password" autoComplete="current-password"
          required className={matchInput} />
      </label>
      {failed && <p role="alert">{t('denied')}</p>}
      <Button type="submit" disabled={busy}>{t('login')}</Button>
    </form>
  );
}

export function MatchScore({
  match, display = false,
}: {
  match: { team_a: string; team_b: string; court: string; state: MatchState;
    rules?: MatchRules | null };
  display?: boolean;
}) {
  const { t } = useMatchText();
  const s = match.state;
  const set = currentSet(s);
  const timeoutsMax = timeoutLimit(match.rules);
  return (
    <section className={`rounded-xl bg-gradient-to-br from-[#1f4588] via-[#25509a] to-[#1f4588]
      p-4 text-white sm:p-7 ${display ? 'flex flex-1 flex-col justify-center' : 'shadow-lg'}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold uppercase">
        <span className={s.status === 'live' ? 'text-accent-500' : ''}>{t(s.status)}</span>
        <span>{s.sets.length > 0 && `${t('set')} ${s.sets.length}`}</span>
        <span className="break-words">{match.court}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-center sm:gap-8">
        {[s.left, opposite(s.left)].map(side => (
          <div key={side} className="flex min-w-0 flex-col justify-end">
            <h2 className={`mt-3 break-words font-bold ${display ?
              'text-[clamp(1.25rem,4.8vw,5rem)] leading-tight' : 'text-lg sm:text-3xl'}`}>
              {teamName(match, side)}
            </h2>
            <span className="mt-1 min-h-6 text-sm font-semibold text-accent-500">
              {s.serve === side && ['live', 'paused'].includes(s.status) &&
                !set?.winner && t('serve')}
            </span>
            <strong className={`block leading-none tabular-nums ${display ?
              'text-[clamp(3rem,min(16vw,30vh),24rem)]' : 'text-6xl sm:text-8xl'}`}>
              {set?.[side] ?? 0}
            </strong>
            <span className="mt-1 flex h-3 items-center justify-center gap-1.5"
              title={t('timeout')}>
              {set && Array.from({ length: timeoutsMax }, (_, i) => <span key={i}
                className={`rounded-full ${display ? 'h-3 w-3' : 'h-2 w-2'} ${
                i < (side === 'a' ? set.timeouts_a ?? 0 : set.timeouts_b ?? 0)
                  ? 'bg-accent-500' : 'bg-white/25'}`} />)}
            </span>
            <span className="mt-2 text-base font-semibold">{t('sets')} {setWins(s, side)}</span>
          </div>
        ))}
      </div>
      {s.winner && <p className="mt-3 break-words text-center text-lg font-bold text-accent-500">
        {t('winner')}: {teamName(match, s.winner)}{s.outcome === 'walkover' && ` · ${t('forfeit')}`}
      </p>}
    </section>
  );
}

export function SetReport({ state, activeLast = false }: {
  state: MatchState; activeLast?: boolean;
}) {
  const { t } = useMatchText();
  if (!state.sets.length) return null;
  return (
    <ol className="flex flex-wrap gap-2">
      {state.sets.map((set, i) => {
        const active = activeLast && i === state.sets.length - 1 &&
          state.status === 'live' && !set.winner;
        return <li key={i} className={`rounded-md border px-3 py-2 text-sm ${active ?
          'border-primary-800 bg-primary-800 font-semibold text-white' :
          'border-neutral-200 bg-white'}`}>
          {t('set')} {i + 1} <strong className="ml-2 tabular-nums">{set.a}:{set.b}</strong>
        </li>;
      })}
    </ol>
  );
}

export function RuleFields({ rules, onChange }: {
  rules: MatchRules; onChange: (value: MatchRules) => void;
}) {
  const { t } = useMatchText();
  return <div className="grid gap-3 sm:grid-cols-2">
    <label>{t('format')}
      <select className={matchInput} value={rules.bestOf} onChange={e =>
        onChange({ ...rules, bestOf: Number(e.target.value) as MatchRules['bestOf'] })}>
        {[1, 3, 5].map(n => <option key={n} value={n}>{t('sets')} · {n}</option>)}
      </select>
    </label>
    <label>{t('target')}
      <input className={matchInput} type="number" min={1} max={100} required
        value={rules.points || ''} onChange={e => onChange({ ...rules, points: +e.target.value })} />
    </label>
    {rules.bestOf > 1 && <label>{t('decider')}
      <input className={matchInput} type="number" min={1} max={100} required
        value={rules.deciding || ''} onChange={e =>
          onChange({ ...rules, deciding: +e.target.value,
            switchAt: Math.min(rules.switchAt, +e.target.value) })} />
    </label>}
    {rules.bestOf > 1 && <label>{t('changeAt')}
      <input className={matchInput} type="number" min={0} max={rules.deciding} required
        value={rules.switchAt} onChange={e => onChange({ ...rules, switchAt: +e.target.value })} />
    </label>}
    <label>{t('margin')}
      <input className={matchInput} type="number" min={1} max={5} required
        value={rules.margin || ''} onChange={e => onChange({ ...rules, margin: +e.target.value })} />
    </label>
    <label>{t('timeoutsPerSet')}
      <input className={matchInput} type="number" min={0} max={3} required
        value={rules.timeouts ?? 2} onChange={e =>
          onChange({ ...rules, timeouts: +e.target.value })} />
    </label>
    <label>{t('subsPerSet')}
      <input className={matchInput} type="number" min={0} max={12} required
        value={rules.substitutions ?? 6} onChange={e =>
          onChange({ ...rules, substitutions: +e.target.value })} />
    </label>
    <label>{t('switchEvery')}
      <input className={matchInput} type="number" min={0} max={50} required
        value={rules.switchEvery ?? 0} onChange={e =>
          onChange({ ...rules, switchEvery: +e.target.value })} />
    </label>
    {rules.bestOf > 1 && <label>{t('switchEveryDecider')}
      <input className={matchInput} type="number" min={0} max={50} required
        value={rules.switchEveryDecider ?? 0} onChange={e =>
          onChange({ ...rules, switchEveryDecider: +e.target.value })} />
    </label>}
  </div>;
}

export function ScoreLink({ id, children }: { id: string; children?: React.ReactNode }) {
  const { t } = useMatchText();
  return <Link className="font-semibold text-primary-700 underline" to={`/scoreboard/${id}`}>
    {children ?? t('board')}
  </Link>;
}

export function PublicMatchCards({ matches }: { matches: PublicScore[] }) {
  const { t, language } = useMatchText();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {matches.map(match => {
        const { state } = match;
        const set = currentSet(state);
        return <article key={match.match_id} className={`${matchCard} min-w-0 space-y-2`}>
          <p className="text-xs font-bold uppercase tracking-wide text-primary-700">
            {[match.match_number ? `#${match.match_number}` : '', t(state.status), match.court,
              stageLabel(match.stage, t), match.competition_name].filter(Boolean).join(' · ')}
          </p>
          <h3 className="break-words font-bold">{match.team_a} – {match.team_b}</h3>
          <p className="font-bold tabular-nums text-primary-900">
            {setWins(state, 'a')}:{setWins(state, 'b')} {t('sets')}
            {set && <> · {t('set')} {state.sets.length} · {set.a}:{set.b}</>}
          </p>
          {state.status === 'completed' && <>
            <p className="text-sm">{formatMatchDate(match.finished_at ?? match.updated_at, language)}</p>
            <SetReport state={state} />
          </>}
          {match.scheduled_at && state.status === 'scheduled' &&
            <p className="text-sm">{formatMatchDate(match.scheduled_at, language)}</p>}
          {match.external_match_id && <p className="text-xs">{t('unofficial')}</p>}
          <div className="flex flex-wrap gap-3">
            <ScoreLink id={match.match_id}>
              {t(state.status === 'completed' ? 'protocol' : 'board')}
            </ScoreLink>
            <Link className="font-semibold text-primary-700 underline"
              to={`/scoreboard/${match.match_id}/display`}>{t('display')}</Link>
          </div>
        </article>;
      })}
    </div>
  );
}

type StageKey = 'group' | 'playoff' | 'stageSemi' | 'stageThird' | 'stageFinal';

export function stageLabel(stage: string, t: (key: StageKey) => string) {
  if (!stage) return '';
  const [kind, label] = stage.split(':');
  if (kind === 'group') return `${t('group')} ${label}`;
  if (kind === 'playoff') {
    if (label === 'semi1') return `${t('stageSemi')} 1`;
    if (label === 'semi2') return `${t('stageSemi')} 2`;
    if (label === 'third') return t('stageThird');
    if (label === 'final') return t('stageFinal');
    return `${t('playoff')} ${label}`;
  }
  return stage;
}
