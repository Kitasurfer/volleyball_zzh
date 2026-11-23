import { useState, type FormEvent, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { RuleFields, matchCard, matchInput } from '@/components/MatchScore';
import { matchError, useMatchText } from '@/data/matchTranslations';
import { awardKeys, berlinInput, berlinTime, decisionKeys, formatMatchDate, listCompetitions,
  matchClient, matchRpc, roundRobin, scoresKey, type Competition, type ControlledMatch,
  type Team } from '@/lib/matchApi';
import { indoorRules, shortScore } from '@/lib/matchRules';
import { StandingsTable } from '@/pages/ClubCompetitionPage';
import { useClubStandings } from '@/hooks/usePublicScores';
import { csvField, downloadMatchFile } from '@/lib/matchStorage';

function useSave() {
  const client = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [saved, setSaved] = useState(false);
  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    setSaved(false);
    try {
      await action();
      setSaved(true);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['skv-competitions'] }),
        client.invalidateQueries({ queryKey: ['skv-competition'] }),
        client.invalidateQueries({ queryKey: ['skv-teams'] }),
        client.invalidateQueries({ queryKey: ['skv-standings'] }),
        client.invalidateQueries({ queryKey: ['skv-admin-matches'] }),
        client.invalidateQueries({ queryKey: ['skv-managed'] }),
        client.invalidateQueries({ queryKey: scoresKey }),
      ]);
    } catch (cause) { setError(cause); }
    finally { setBusy(false); }
  }
  return { busy, error, run, saved };
}

function Result({ save }: { save: ReturnType<typeof useSave> }) {
  const { t } = useMatchText();
  return save.error ? <p role="alert" className="text-rose-800">{matchError(save.error, t)}</p>
    : save.saved ? <p role="status">{t('saved')}</p> : null;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block min-w-0 text-sm">{label}{children}</label>;
}

const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim();
const formData = (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  return new FormData(event.currentTarget);
};

function CompetitionForm({ competition, onSave }: {
  competition?: Competition; onSave: (id: string) => void;
}) {
  const { t } = useMatchText();
  const save = useSave();
  const [rules, setRules] = useState(competition?.rules ?? indoorRules());
  const [order, setOrder] = useState(competition?.standings.order ?? [...decisionKeys]);
  const defaultAwards = { win: 1, loss: 0, decidingWin: 1, decidingLoss: 0,
    walkoverWin: 1, walkoverLoss: 0 };
  return <form className={`${matchCard} space-y-4`} onSubmit={event => {
    const form = formData(event);
    void save.run(async () => {
      const id = await matchRpc<string>('skv_save_competition', {
        cid: competition?.id ?? null, config: {
          name: text(form, 'name'), venue: text(form, 'venue'),
          description: text(form, 'description'), starts_at: berlinTime(text(form, 'starts')),
          visibility: form.has('public') ? 'public' : 'private', rules,
          standings: { order, points: Object.fromEntries(awardKeys.map(k => [k, +text(form, k)])) },
        },
      });
      onSave(id);
    });
  }}>
    <h2 className="text-xl font-bold text-primary-900">
      {t(competition ? 'edit' : 'newTournament')}
    </h2>
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label={t('name')}><input className={matchInput} name="name" required
        maxLength={100} defaultValue={competition?.name} /></Field>
      <Field label={t('venue')}><input className={matchInput} name="venue"
        maxLength={100} defaultValue={competition?.venue} /></Field>
      <Field label={t('starts')}><input className={matchInput} name="starts" type="datetime-local"
        defaultValue={berlinInput(competition?.starts_at)} /></Field>
      <p className="self-end text-sm">{t('timezone')}</p>
    </div>
    <Field label={t('description')}><textarea className={matchInput} name="description"
      maxLength={2000} defaultValue={competition?.description} /></Field>
    <label className="flex items-center gap-2"><input type="checkbox" name="public"
      defaultChecked={competition?.visibility === 'public'} />{t('publish')}</label>
    <RuleFields rules={rules} onChange={setRules} />
    <fieldset className="grid gap-3 sm:grid-cols-2">
      <legend className="mb-2 font-bold">{t('points')}</legend>
      {awardKeys.map(key => <Field label={t(key)} key={key}>
        <input className={matchInput} required type="number" min={0} max={100} name={key}
          defaultValue={competition?.standings.points[key] ?? defaultAwards[key]} />
      </Field>)}
    </fieldset>
    <fieldset className="grid gap-2 sm:grid-cols-2">
      <legend className="mb-2 font-bold">{t('ranking')}</legend>
      {order.map((key, index) => <Field key={index} label={`${index + 1}. ${t('place')}`}>
        <select className={matchInput} value={key} onChange={e => {
          const next = [...order];
          const incoming = e.target.value as typeof key;
          const other = next.indexOf(incoming);
          if (other >= 0) next[other] = key;
          next[index] = incoming;
          setOrder(next);
        }}>{decisionKeys.map(option =>
          <option key={option} value={option}>{t(option)}</option>)}</select>
      </Field>)}
      <div className="flex items-end gap-2">
        <Button type="button" variant="outline" size="sm" disabled={order.length === 1}
          onClick={() => setOrder(order.slice(0, -1))}>−</Button>
        <Button type="button" variant="outline" size="sm" disabled={order.length === decisionKeys.length}
          onClick={() => setOrder([...order, decisionKeys.find(key => !order.includes(key))!])}>+</Button>
      </div>
    </fieldset>
    <Result save={save} />
    <Button type="submit" variant="accent" disabled={save.busy}>{t('save')}</Button>
  </form>;
}

function TournamentFixtures({ competition, teams }: { competition: Competition; teams: Team[] }) {
  const { t } = useMatchText();
  const save = useSave();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  return <div className="grid gap-4 lg:grid-cols-2">
    <form className={`${matchCard} space-y-3`} onSubmit={event => {
      const form = formData(event);
      void save.run(() => matchRpc('skv_create_match', { config: {
        competition_id: competition.id, team_a_id: a, team_b_id: b,
        court: text(form, 'court'), scheduled_at: berlinTime(text(form, 'starts')),
        duration_minutes: +text(form, 'duration'), published: form.has('published'),
      } }));
    }}>
      <h2 className="font-bold">{t('newMatch')}</h2>
      {([['teamA', a, setA, b], ['teamB', b, setB, a]] as const).map(([label, value, setter, other]) =>
        <Field key={label} label={t(label)}>
          <select className={matchInput} required value={value} onChange={e => setter(e.target.value)}>
            <option value="">{t('chooseTeam')}</option>
            {teams.filter(team => team.id !== other).map(team =>
              <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
        </Field>)}
      <FixtureTime defaultStart={competition.starts_at} requiredTime={false} />
      <Field label={t('court')}><input className={matchInput} name="court" maxLength={80} /></Field>
      <Result save={save} />
      <Button type="submit" disabled={save.busy || teams.length < 2}>{t('save')}</Button>
    </form>
    <form className={`${matchCard} space-y-3`} onSubmit={event => {
      const form = formData(event);
      if (!window.confirm(t('roundRobin'))) return;
      void save.run(async () => {
        const courts = [...new Set(text(form, 'courts').split(',').map(s => s.trim()).filter(Boolean))];
        if (!courts.length || new Set(courts.map(c => c.toLowerCase())).size !== courts.length) {
          throw new Error('invalid_action');
        }
        const start = Date.parse(berlinTime(text(form, 'starts')) ?? '');
        const duration = +text(form, 'duration');
        let slot = 0;
        const fixtures = roundRobin(teams.map(team => team.id)).flatMap(round => {
          const matches = round.map(([a, b], index) => ({
            competition_id: competition.id, team_a_id: a, team_b_id: b,
            court: courts[index % courts.length], duration_minutes: duration,
            scheduled_at: new Date(start + (slot + Math.floor(index / courts.length)) *
              duration * 60000).toISOString(), published: form.has('published'),
          }));
          slot += Math.ceil(round.length / courts.length);
          return matches;
        });
        await matchRpc('skv_create_schedule', { fixtures });
      });
    }}>
      <h2 className="font-bold">{t('roundRobin')}</h2>
      <FixtureTime defaultStart={competition.starts_at} requiredTime />
      <Field label={t('courts')}><input className={matchInput} name="courts" required
        maxLength={400} /></Field>
      <Button type="submit" disabled={save.busy || teams.length < 2 || teams.length > 20}>
        {t('roundRobin')}</Button>
    </form>
  </div>;
}

function FixtureTime({ defaultStart, requiredTime, duration = 60, disabled = false }: {
  defaultStart?: string | null; requiredTime?: boolean; duration?: number; disabled?: boolean;
}) {
  const { t } = useMatchText();
  return <>
    <Field label={t('starts')}><input className={matchInput} name="starts" type="datetime-local"
      required={requiredTime} disabled={disabled} defaultValue={berlinInput(defaultStart)} /></Field>
    <p className="text-sm">{t('timezone')}</p>
    <Field label={t('duration')}><input className={matchInput} name="duration" type="number"
      min={5} max={480} required disabled={disabled} defaultValue={duration} /></Field>
    <label className="flex items-center gap-2"><input name="published" type="checkbox"
      defaultChecked />{t('publish')}</label>
  </>;
}

export default function AdminMatchCenterPage({ matchesOnly = false }: { matchesOnly?: boolean }) {
  const { t } = useMatchText();
  const [selected, select] = useState('');
  const query = useQuery({ queryKey: ['skv-competitions', 'admin'],
    queryFn: () => listCompetitions(true), enabled: !matchesOnly });
  const competition = query.data?.find(c => c.id === selected);
  return <div className="min-w-0 space-y-4">
    <h1 className="text-2xl font-bold text-primary-900">{t(matchesOnly ? 'nav' : 'tournaments')}</h1>
    {matchesOnly ? <>
      <Button asChild variant="accent"><Link to="/scoreboard/new">{t('newMatch')}</Link></Button>
      <AdminFixtures />
    </> : <>
      {query.isError && <p role="alert">{t('error')}</p>}
      <Field label={t('tournaments')}><select className={matchInput} value={selected}
        onChange={e => select(e.target.value)}>
        <option value="">{t('newTournament')}</option>
        {query.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select></Field>
      <CompetitionForm key={competition?.id ?? 'new'} competition={competition} onSave={select} />
      {competition && <CompetitionManagement key={competition.id} competition={competition} />}
    </>}
  </div>;
}

function CompetitionManagement({ competition }: { competition: Competition }) {
  const { t } = useMatchText();
  const save = useSave();
  const standings = useClubStandings(competition.id);
  const teams = useQuery({ queryKey: ['skv-teams', competition.id], queryFn: async () => {
    const { data, error } = await matchClient().from('skv_competition_teams')
      .select('skv_teams(id,name)').eq('competition_id', competition.id);
    if (error) throw new Error(error.message);
    return (data as unknown as { skv_teams: Team }[]).map(row => row.skv_teams).filter(Boolean);
  } });
  return <>
    <form className={`${matchCard} space-y-3`} onSubmit={event => {
      const form = formData(event);
      const target = event.currentTarget;
      void save.run(async () => {
        await matchRpc('skv_add_team', { cid: competition.id, team_name: text(form, 'name') });
        target.reset();
      });
    }}>
      <h2 className="font-bold">{t('team')} · {teams.data?.length ?? 0}</h2>
      <ul className="flex flex-wrap gap-2">
        {teams.data?.map(team => <li key={team.id} className="rounded bg-neutral-100 px-2 py-1">
          {team.name}</li>)}
      </ul>
      <Field label={t('name')}><input name="name" className={matchInput} required maxLength={80} /></Field>
      {teams.isError && <p role="alert">{t('error')}</p>}
      <Result save={save} />
      <Button disabled={save.busy} type="submit">{t('addTeam')}</Button>
    </form>
    <TournamentFixtures competition={competition} teams={teams.data ?? []} />
    <AdminFixtures cid={competition.id} />
    <h2 className="text-xl font-bold text-primary-900">{t('standings')}</h2>
    <StandingsTable rows={standings.data ?? []} />
    {competition.visibility === 'public' && <Button asChild variant="outline">
      <Link to={`/competitions/${competition.id}`}>{t('schedule')}</Link>
    </Button>}
  </>;
}

function AdminFixtures({ cid }: { cid?: string }) {
  const { t } = useMatchText();
  const fixtures = useQuery({ queryKey: ['skv-admin-matches', cid],
    queryFn: () => matchRpc<ControlledMatch[]>('skv_list_matches', { cid: cid ?? null }),
    staleTime: 0, refetchInterval: 10000 });
  const completed = fixtures.data?.filter(match => match.state.status === 'completed') ?? [];
  return <section className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-xl font-bold text-primary-900">{t('schedule')}</h2>
      <Button variant="outline" disabled={!completed.length} onClick={() => {
        const rows = [
          [t('teamA'), t('teamB'), t('completed'), t('court'), t('sets'), t('winner'), t('protocol')],
          ...completed.map(match => [
            match.team_a, match.team_b, match.finished_at ?? match.updated_at, match.court,
            match.state.outcome === 'walkover' ? t('forfeit') : shortScore(match.state),
            match.state.winner === 'a' ? match.team_a : match.team_b,
            match.state.sets.map(set => `${set.a}:${set.b}`).join(' / '),
          ]),
        ];
        downloadMatchFile('skv-results.csv', '\ufeff' +
          rows.map(row => row.map(csvField).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
      }}>{t('export')}</Button>
    </div>
    {fixtures.isError && <p role="alert">{t('error')}</p>}
    {fixtures.data?.length === 0 && <p>{t('empty')}</p>}
    {fixtures.data?.map(match => <Fixture match={match} key={match.id} />)}
  </section>;
}

function Fixture({ match }: { match: ControlledMatch }) {
  const { t, language } = useMatchText();
  const edit = useSave();
  const access = useSave();
  const del = useSave();
  const scheduled = match.state.status === 'scheduled';
  const deletable = !match.published && match.state.status !== 'completed';
  return <details className={matchCard}>
    <summary className="cursor-pointer break-words font-semibold">
      {match.team_a} – {match.team_b} · {match.court} · {t(match.state.status)}
      {match.scheduled_at && ` · ${formatMatchDate(match.scheduled_at, language)}`}
    </summary>
    <Button asChild className="my-3"><Link to={`/scoreboard/${match.id}/control`}>
      {t('control')}</Link></Button>
    <div className="grid gap-4 lg:grid-cols-2">
      <form className="space-y-2" onSubmit={event => {
        const form = formData(event);
        void edit.run(() => matchRpc('skv_edit_match', { mid: match.id, config: {
          court: text(form, 'court'), scheduled_at: berlinTime(text(form, 'starts')),
          duration_minutes: +text(form, 'duration'), published: form.has('published'),
        } }));
      }}>
        <Field label={t('court')}><input name="court" className={matchInput}
          disabled={!scheduled} maxLength={80} defaultValue={match.court} /></Field>
        <Field label={t('starts')}><input name="starts" className={matchInput}
          disabled={!scheduled} type="datetime-local" defaultValue={berlinInput(match.scheduled_at)} /></Field>
        <Field label={t('duration')}><input name="duration" className={matchInput}
          disabled={!scheduled} type="number" min={5} max={480} defaultValue={match.duration_minutes} /></Field>
        <label className="flex items-center gap-2"><input name="published" type="checkbox"
          defaultChecked={match.published} />{t('publish')}</label>
        <Result save={edit} />
        <Button type="submit" disabled={edit.busy}>{t('save')}</Button>
      </form>
      <form className="space-y-2" onSubmit={event => {
        const revoke = (event.nativeEvent as SubmitEvent).submitter?.getAttribute('value') === 'revoke';
        const form = formData(event);
        if (revoke && !window.confirm(t('revoke'))) return;
        void access.run(() => matchRpc('skv_assign_referee', { mid: match.id,
          email_address: text(form, 'email'), expires: revoke ? null :
            berlinTime(text(form, 'expires')), revoke_access: revoke }));
      }}>
        <h3 className="font-bold">{t('referee')}</h3>
        <Field label={t('email')}><input name="email" type="email" required className={matchInput} /></Field>
        <Field label={t('expires')}><input name="expires" type="datetime-local" className={matchInput} /></Field>
        <p className="text-sm">{t('timezone')}</p>
        <Result save={access} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={access.busy}>{t('assign')}</Button>
          <Button type="submit" variant="outline" value="revoke" disabled={access.busy}>{t('revoke')}</Button>
        </div>
      </form>
    </div>
    {deletable && <div className="mt-4 flex items-center gap-3">
      <Button variant="danger" size="sm" disabled={del.busy} onClick={() => {
        if (window.confirm(t('deleteMatch'))) {
          void del.run(() => matchRpc('skv_delete_match', { mid: match.id }));
        }
      }}>{t('deleteMatch')}</Button>
      <Result save={del} />
    </div>}
  </details>;
}
