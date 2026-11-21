import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import { MatchLogin, matchCard, matchInput, matchPage } from '@/components/MatchScore';
import { matchError, useMatchText } from '@/data/matchTranslations';
import { useMatchShell } from '@/hooks/useMatchShell';
import { useAuth } from '@/lib/AuthContext';
import { matchClient, matchRpc, type ControlledMatch, type Team } from '@/lib/matchApi';
import { indoorRules, initialMatch, type MatchRules } from '@/lib/matchRules';
import { saveDraft, seedDraft } from '@/lib/matchStorage';

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
  </div>;
}

export default function NewMatchPage() {
  const { t } = useMatchText();
  const { user, role } = useAuth();
  const admin = role === 'admin';
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [local, setLocal] = useState(!params.has('signin') && !params.has('vlw'));
  const [rules, setRules] = useState(indoorRules);
  const [a, setA] = useState(params.get('a') ?? '');
  const [b, setB] = useState(params.get('b') ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const teams = useQuery({ queryKey: ['skv-teams', 'saved', user?.id], enabled: admin,
    queryFn: async () => {
    const { data, error } = await matchClient().from('skv_teams').select('id,name').order('name');
    if (error) throw new Error(error.message);
    return data as Team[];
  } });
  useMatchShell();

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(undefined);
    const form = new FormData(event.currentTarget);
    const team_a = a.trim() || t('teamA');
    const team_b = b.trim() || t('teamB');
    const court = String(form.get('court') ?? '').trim();
    try {
      let id: string;
      if (local) {
        id = `local-${crypto.randomUUID()}`;
        const match: ControlledMatch = {
          id, team_a, team_b, court, rules, state: initialMatch(), competition_id: null,
          external_match_id: null, published: false, scheduled_at: null, duration_minutes: 60,
          updated_at: new Date().toISOString(), started_at: null, finished_at: null, version: 0,
        };
        await saveDraft(seedDraft(id, match), undefined);
      } else {
        if (!user) return;
        id = await matchRpc<string>('skv_create_match', { config: {
          team_a, team_b, court, rules, published: admin && form.has('published'),
          external_match_id: admin ? String(form.get('external') ?? '') : null,
        } });
      }
      navigate(`/scoreboard/${id}/control`, { state: { takeControl: !local } });
    } catch (cause) { setError(cause); }
    finally { setBusy(false); }
  }

  return <main className={matchPage}>
    <header>
      <h1 className="text-3xl font-bold text-primary-900">{t('newMatch')}</h1>
      <p>{t('friendly')}</p>
    </header>
    {!local && !user && <MatchLogin />}
    <form className={`${matchCard} max-w-3xl space-y-4`} onSubmit={save}>
      <div className="flex flex-wrap gap-4">
        <label><input type="radio" name="mode" checked={local} onChange={() => setLocal(true)} />
          {' '}{t('local')}</label>
        <label><input type="radio" name="mode" checked={!local} onChange={() => setLocal(false)} />
          {' '}{t('cloud')}</label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {([['teamA', a, setA], ['teamB', b, setB]] as const).map(([label, value, setter]) =>
          <label key={label}>{t(label)}
            <input className={matchInput} value={value} onChange={e => setter(e.target.value)}
              placeholder={t(label)} list="skv-team-names" maxLength={80} />
          </label>)}
      </div>
      <datalist id="skv-team-names">{admin && teams.data?.map(team =>
        <option value={team.name} key={team.id} />)}</datalist>
      <label className="block">{t('court')} <input className={matchInput} name="court" maxLength={80} /></label>
      <details>
        <summary className="cursor-pointer font-semibold">{t('format')}</summary>
        <div className="mt-3"><RuleFields rules={rules} onChange={setRules} /></div>
      </details>
      {!local && admin && <>
        <label className="block">{t('external')}
          <input className={matchInput} name="external" defaultValue={params.get('vlw') ?? ''}
            maxLength={100} />
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="published" defaultChecked={params.has('vlw')} />
          {t('publish')}
        </label>
      </>}
      {error && <p role="alert">{matchError(error, t)}</p>}
      <Button disabled={busy || (!local && !user)} type="submit" variant="accent">{t('start')}</Button>
    </form>
  </main>;
}
