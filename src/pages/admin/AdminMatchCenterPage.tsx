import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
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

function useTeamsQuery(cid: string | null) {
  return useQuery({ queryKey: ['skv-teams', cid], enabled: !!cid, queryFn: async () => {
    const { data, error } = await matchClient().from('skv_competition_teams')
      .select('skv_teams(id,name)').eq('competition_id', cid!);
    if (error) throw new Error(error.message);
    return (data as unknown as { skv_teams: Team }[]).map(row => row.skv_teams).filter(Boolean);
  } });
}

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
        client.invalidateQueries({ queryKey: ['skv-referee-requests'] }),
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

/** Shareable referee access link with QR: scanning it opens the control page
 *  where the referee enters a name; the admin then approves the request. */
function RefereeAccessLink({ id }: { id: string }) {
  const { t } = useMatchText();
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/scoreboard/${id}/control`;
  useEffect(() => {
    let live = true;
    void import('qrcode').then(qrcode => qrcode.toDataURL(url, { margin: 1, width: 180 }))
      .then(image => { if (live) setQr(image); });
    return () => { live = false; };
  }, [url]);
  return <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary-200 p-3">
    {qr && <img src={qr} width={120} height={120} alt={t('refereeAccess')} className="shrink-0" />}
    <div className="min-w-0 flex-1 space-y-2">
      <p className="text-sm font-semibold">{t('refereeAccess')}</p>
      <p className="break-all text-xs text-primary-700">{url}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => {
          void navigator.clipboard?.writeText(url).then(() => {
            setCopied(true); window.setTimeout(() => setCopied(false), 2000);
          });
        }}>{copied ? t('copied') : t('copyLink')}</Button>
      </div>
      <p className="text-xs text-primary-600">{t('accessLinkHint')}</p>
    </div>
  </div>;
}

/** Referee team select listing all competition teams; keeps a foreign current
 *  value selectable so nothing is lost when editing older matches. */
function RefereeTeamInput({ teams, name = 'referee_team', defaultValue = '' }: {
  teams: Team[]; name?: string; defaultValue?: string;
}) {
  const { t } = useMatchText();
  const known = teams.some(team => team.name === defaultValue);
  const [custom, setCustom] = useState(Boolean(defaultValue && !known));
  if (custom) {
    return <div className="flex items-center gap-2">
      <input className={matchInput} name={name} maxLength={100} autoComplete="off"
        defaultValue={defaultValue} placeholder={t('refereeCustomHint')} />
      <button type="button" className="shrink-0 text-sm text-primary-700 underline"
        onClick={() => setCustom(false)}>{t('refereePickTeam')}</button>
    </div>;
  }
  return <select key={teams.length ? 'ready' : 'loading'} className={matchInput}
    name={name} defaultValue={known ? defaultValue : ''}
    onChange={event => { if (event.target.value === '__custom__') setCustom(true); }}>
    <option value="">—</option>
    {teams.map(team => <option key={team.id} value={team.name}>{team.name}</option>)}
    <option value="__custom__">{t('refereeCustom')}</option>
  </select>;
}

function groupSplit<T>(items: T[], count: number): T[][] {
  const groups: T[][] = Array.from({ length: count }, () => []);
  items.forEach((item, index) => {
    const round = Math.floor(index / count);
    const pos = index % count;
    groups[round % 2 ? count - 1 - pos : pos].push(item);
  });
  return groups.filter(g => g.length);
}

const groupName = (index: number) => String.fromCharCode(65 + index);

function SchedulePlanner({ competition, teams }: { competition: Competition; teams: Team[] }) {
  const { t } = useMatchText();
  const save = useSave();
  const wipe = useSave();
  const [groups, setGroups] = useState(1);
  return <>
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
        const split = groupSplit(teams.map(team => team.id), groups);
        const roundRobins = split.map((ids, gi) => ({
          stage: split.length > 1 ? `group:${groupName(gi)}` : '',
          rounds: roundRobin(ids),
        }));
        // Interleave the rounds of all groups so courts and breaks are shared fairly.
        let slot = 0;
        const fixtures: Record<string, unknown>[] = [];
        const maxRounds = Math.max(...roundRobins.map(g => g.rounds.length));
        for (let roundIndex = 0; roundIndex < maxRounds; roundIndex++) {
          for (const group of roundRobins) {
            const round = group.rounds[roundIndex];
            if (!round) continue;
            round.forEach(([a, b], index) => {
              fixtures.push({
                competition_id: competition.id, team_a_id: a, team_b_id: b,
                court: courts[index % courts.length], duration_minutes: duration,
                scheduled_at: new Date(start + (slot + Math.floor(index / courts.length)) *
                  duration * 60000).toISOString(), published: form.has('published'),
                stage: group.stage,
              });
            });
            slot += Math.ceil(round.length / courts.length);
          }
        }
        // Auto-assign referee teams: within one time slot a team may neither
        // play nor cover two matches; the least-loaded idle team gets the duty.
        const load = new Map<string, number>(teams.map(team => [team.id, 0]));
        const slots = new Map<string, typeof fixtures>();
        for (const fixture of fixtures) {
          const key = String(fixture.scheduled_at);
          slots.set(key, [...slots.get(key) ?? [], fixture]);
        }
        for (const sameSlot of slots.values()) {
          const busy = new Set(sameSlot.flatMap(f => [f.team_a_id, f.team_b_id]));
          const covering = new Set<string>();
          for (const fixture of sameSlot) {
            const idle = teams.filter(team => !busy.has(team.id) && !covering.has(team.id));
            idle.sort((x, y) => (load.get(x.id) ?? 0) - (load.get(y.id) ?? 0));
            const pick = idle[0];
            if (!pick) continue;
            fixture.referee_team = pick.name;
            load.set(pick.id, (load.get(pick.id) ?? 0) + 1);
            covering.add(pick.id);
          }
        }
        await matchRpc('skv_create_schedule', { fixtures });
      });
    }}>
      <h2 className="font-bold">{t('roundRobin')}</h2>
      <FixtureTime defaultStart={competition.starts_at} requiredTime />
      <Field label={t('courts')}><input className={matchInput} name="courts" required
        maxLength={400} /></Field>
      <Field label={t('groupsCount')}>
        <select className={matchInput} value={groups} onChange={e => setGroups(+e.target.value)}>
          {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </Field>
      {groups > 1 && <p className="text-sm">{t('groupsHint')}</p>}
      <Result save={save} />
      <Button type="submit" disabled={save.busy || teams.length < 2 || teams.length > 20}>
        {t('roundRobin')}</Button>
    </form>
    <div className={`${matchCard} space-y-3`}>
      <h2 className="font-bold">{t('scheduleReset')}</h2>
      <p className="text-sm">{t('scheduleResetHint')}</p>
      <Result save={wipe} />
      <Button variant="danger" disabled={wipe.busy} onClick={() => {
        if (window.confirm(t('scheduleReset'))) {
          void wipe.run(() => matchRpc('skv_delete_schedule', { cid: competition.id }));
        }
      }}>{t('scheduleReset')}</Button>
    </div>
  </>;
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
        referee_team: text(form, 'referee_team'), stage: text(form, 'stage'),
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
      <Field label={t('stageOptional')}><input className={matchInput} name="stage" maxLength={40}
        placeholder="group:A" /></Field>
      <Field label={t('refereeTeam')}><RefereeTeamInput teams={teams} /></Field>
      <Result save={save} />
      <Button type="submit" disabled={save.busy || teams.length < 2}>{t('save')}</Button>
    </form>
    <SchedulePlanner competition={competition} teams={teams} />
    <PlayoffCreation competition={competition} teams={teams} />
  </div>;
}

/** Semi-finals crossed between the first two groups plus final and third place.
 *  Matches are created one by one so numbering and validation stay server-side. */
function PlayoffCreation({ competition, teams }: { competition: Competition; teams: Team[] }) {
  const { t } = useMatchText();
  const save = useSave();
  return <form className={`${matchCard} space-y-3 lg:col-span-2`} onSubmit={event => {
    const form = formData(event);
    if (!window.confirm(t('createPlayoffs'))) return;
    void save.run(async () => {
      const courts = [...new Set(text(form, 'courts').split(',').map(s => s.trim()).filter(Boolean))];
      if (!courts.length) throw new Error('invalid_action');
      const start = Date.parse(berlinTime(text(form, 'starts')) ?? '');
      const duration = +text(form, 'duration');
      const base = { competition_id: competition.id, duration_minutes: duration,
        published: form.has('published') };
      const parallel = courts.length > 1;
      // Parallel courts: both semis in slot 0, third place and final in slot 1.
      // Single court: four consecutive slots.
      const slots = parallel
        ? { semi1: 0, semi2: 0, third: 1, final: 1 }
        : { semi1: 0, semi2: 1, third: 2, final: 3 };
      const at = (slot: number) => new Date(start + slot * duration * 60000).toISOString();
      const fixtures = [
        { ...base, team_a: '1A', team_b: '2B', stage: 'playoff:semi1',
          court: courts[0], scheduled_at: at(slots.semi1) },
        { ...base, team_a: '2A', team_b: '1B', stage: 'playoff:semi2',
          court: courts[Math.min(1, courts.length - 1)], scheduled_at: at(slots.semi2) },
        { ...base, team_a: 'Verlierer HF1', team_b: 'Verlierer HF2', stage: 'playoff:third',
          court: courts[0], scheduled_at: at(slots.third) },
        { ...base, team_a: 'Sieger HF1', team_b: 'Sieger HF2', stage: 'playoff:final',
          court: courts[Math.min(1, courts.length - 1)], scheduled_at: at(slots.final) },
      ];
      for (const fixture of fixtures) {
        await matchRpc('skv_create_match', { config: fixture });
      }
    });
  }}>
    <h2 className="font-bold">{t('createPlayoffs')}</h2>
    <p className="text-sm">{t('playoffsHint')}</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <FixtureTime defaultStart={competition.starts_at} requiredTime />
      <Field label={t('courts')}><input className={matchInput} name="courts" required
        maxLength={400} /></Field>
    </div>
    <Result save={save} />
    <Button type="submit" disabled={save.busy || teams.length < 4}>{t('createPlayoffs')}</Button>
  </form>;
}

/** One-shot result entry for matches played without live scoring. */
function QuickResult({ match }: { match: ControlledMatch }) {
  const { t } = useMatchText();
  const save = useSave();
  const [open, setOpen] = useState(false);
  const [setCount, setSetCount] = useState(2);
  if (!open) return <Button variant="outline" onClick={() => setOpen(true)}>
    {t('enterResult')}</Button>;
  return <form className="w-full space-y-2 rounded-md border border-neutral-200 p-3
      dark:border-neutral-700" onSubmit={event => {
    const form = formData(event);
    const sets: { a: number; b: number }[] = [];
    for (let index = 1; index <= setCount; index++) {
      sets.push({ a: +text(form, `a${index}`), b: +text(form, `b${index}`) });
    }
    void save.run(() => matchRpc('skv_enter_result', { mid: match.id, sets,
      note: text(form, 'note') }));
  }}>
    <h3 className="font-bold">{t('enterResult')}</h3>
    <Field label={t('setsPlayed')}>
      <select className={matchInput} value={setCount} onChange={e => setSetCount(+e.target.value)}>
        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
      </select>
    </Field>
    <div className="grid gap-2">
      {Array.from({ length: setCount }, (_, index) => index + 1).map(index =>
        <div key={index} className="flex items-center gap-2">
          <span className="w-14 text-sm font-semibold">{t('setN')} {index}</span>
          <input name={`a${index}`} aria-label={`${match.team_a} ${index}`} required type="number"
            min={0} max={99} defaultValue={0} className={`${matchInput} w-20`} />
          <span>:</span>
          <input name={`b${index}`} aria-label={`${match.team_b} ${index}`} required type="number"
            min={0} max={99} defaultValue={0} className={`${matchInput} w-20`} />
        </div>)}
    </div>
    <Field label={t('note')}><input name="note" className={matchInput} required minLength={1}
      maxLength={500} defaultValue={t('enterResult')} /></Field>
    <p className="text-sm">{t('enterResultHint')}</p>
    <Result save={save} />
    <div className="flex gap-2">
      <Button type="submit" disabled={save.busy}>{t('save')}</Button>
      <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('dismiss')}</Button>
    </div>
  </form>;
}

/** Replace playoff placeholder labels ("1A", "Sieger HF1") with the real teams. */
function ResolveTeams({ match }: { match: ControlledMatch }) {
  const { t } = useMatchText();
  const save = useSave();
  const teams = useTeamsQuery(match.competition_id);
  return <form className="w-full space-y-2 rounded-md border border-accent-300 p-3
      dark:border-accent-700" onSubmit={event => {
    const form = formData(event);
    void save.run(() => matchRpc('skv_edit_match', { mid: match.id, config: {
      team_a_id: text(form, 'team_a') || null, team_b_id: text(form, 'team_b') || null,
    } }));
  }}>
    <h3 className="font-bold">{t('resolveTeams')}</h3>
    {([['team_a', match.team_a, match.team_a_id], ['team_b', match.team_b, match.team_b_id]] as const)
      .map(([name, label, current]) =>
        <Field key={name} label={`${name === 'team_a' ? t('teamA') : t('teamB')}: ${label}`}>
          <select name={name} className={matchInput} defaultValue={current ?? ''} required>
            <option value="">{t('chooseTeam')}</option>
            {(teams.data ?? []).map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
        </Field>)}
    <Result save={save} />
    <Button type="submit" disabled={save.busy}>{t('save')}</Button>
  </form>;
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
      <RefereeRequests />
      <AdminFixtures />
    </> : <>
      {query.isError && <p role="alert">{t('error')}</p>}
      <Field label={t('tournaments')}><select className={matchInput} value={selected}
        onChange={e => select(e.target.value)}>
        <option value="">{t('newTournament')}</option>
        {query.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select></Field>
      <CompetitionForm key={`form-${competition?.id ?? 'new'}`} competition={competition} onSave={select} />
      {competition && <CompetitionManagement key={`mgmt-${competition.id}`} competition={competition} />}
    </>}
  </div>;
}

function CompetitionManagement({ competition }: { competition: Competition }) {
  const { t } = useMatchText();
  const save = useSave();
  const standings = useClubStandings(competition.id);
  const teams = useTeamsQuery(competition.id);
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
        {teams.data?.map(team => <li key={team.id}
          className="flex items-center gap-1 rounded bg-neutral-100 px-2 py-1 dark:bg-neutral-800">
          {team.name}
          <button type="button" className="ml-1 text-neutral-400 hover:text-primary-600"
            title={t('renameTeam')} aria-label={t('renameTeam')} onClick={() => {
              const renamed = window.prompt(t('renameTeam'), team.name)?.trim();
              if (renamed && renamed !== team.name) {
                void save.run(() => matchRpc('skv_rename_team', { tid: team.id, new_name: renamed }));
              }
            }}>✎</button>
        </li>)}
      </ul>
      <Field label={t('name')}><input name="name" className={matchInput} required maxLength={80} /></Field>
      {teams.isError && <p role="alert">{t('error')}</p>}
      <Result save={save} />
      <Button disabled={save.busy} type="submit">{t('addTeam')}</Button>
    </form>
    <TournamentFixtures competition={competition} teams={teams.data ?? []} />
    <RefereeRequests cid={competition.id} />
    <AdminFixtures cid={competition.id} />
    <h2 className="text-xl font-bold text-primary-900">{t('standings')}</h2>
    <StandingsTable rows={standings.data ?? []} />
    {competition.visibility === 'public' && <Button asChild variant="outline">
      <Link to={`/competitions/${competition.id}`}>{t('schedule')}</Link>
    </Button>}
  </>;
}

interface RefereeRequest {
  id: string;
  match_id: string;
  name: string;
  status: 'pending' | 'approved';
  created_at: string;
  team_a: string;
  team_b: string;
  court: string;
  scheduled_at: string | null;
  competition_id: string | null;
  referee_team: string | null;
}

function RefereeRequests({ cid }: { cid?: string }) {
  const { t, language } = useMatchText();
  const review = useSave();
  const requests = useQuery({ queryKey: ['skv-referee-requests', cid ?? 'all'],
    queryFn: () => matchRpc<RefereeRequest[]>('skv_referee_requests', { cid: cid ?? null }),
    staleTime: 0, refetchInterval: 10000 });
  if (!requests.data?.length) return null;
  const send = (id: string, approve: boolean, scope: string) =>
    void review.run(() => matchRpc('skv_review_referee',
      { rid: id, approve, scope, expires: null }));
  return <section className={`${matchCard} space-y-3`}>
    <h2 className="font-bold">{t('refereeRequests')}</h2>
    {requests.data.map(request => <div key={request.id}
      className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-3">
      <span className="font-semibold">{request.name}</span>
      <span className="min-w-0 break-words text-sm">{request.team_a} – {request.team_b}
        {request.court && ` · ${request.court}`}
        {request.referee_team && ` · ${t('refereeTeam')}: ${request.referee_team}`}
        {request.scheduled_at && ` · ${formatMatchDate(request.scheduled_at, language)}`}</span>
      {request.status === 'pending' ? <div className="flex flex-wrap gap-2">
        {request.competition_id && <Button size="sm" disabled={review.busy}
          onClick={() => send(request.id, true, 'competition')}>{t('approveTournament')}</Button>}
        <Button size="sm" variant={request.competition_id ? 'outline' : 'default'}
          disabled={review.busy}
          onClick={() => send(request.id, true, 'match')}>
          {request.competition_id ? t('approveMatch') : t('approve')}</Button>
        {request.competition_id && request.court && <Button size="sm" variant="outline"
          disabled={review.busy}
          onClick={() => send(request.id, true, 'court')}>{t('approveCourt')}</Button>}
        <Button size="sm" variant="danger" disabled={review.busy}
          onClick={() => send(request.id, false, 'match')}>{t('reject')}</Button>
      </div> : <Button size="sm" variant="danger" disabled={review.busy}
        onClick={() => send(request.id, false, 'match')}>{t('revoke')}</Button>}
    </div>)}
    <Result save={review} />
  </section>;
}

function AdminFixtures({ cid }: { cid?: string }) {
  const { t } = useMatchText();
  const fixtures = useQuery({ queryKey: ['skv-admin-matches', cid],
    queryFn: () => matchRpc<ControlledMatch[]>('skv_list_matches', { cid: cid ?? null }),
    staleTime: 0, refetchInterval: 10000 });
  const comps = useQuery({ queryKey: ['skv-competitions', 'admin'],
    queryFn: () => listCompetitions(true), enabled: !cid });
  const [fComp, setFComp] = useState('');
  const [fDate, setFDate] = useState('');
  const [fStatus, setFStatus] = useState('');
  const compName = (id: string | null) =>
    id ? comps.data?.find(c => c.id === id)?.name ?? '' : '';
  const visible = fixtures.data?.filter(match => {
    if (!cid) {
      if (fComp === 'standalone' && match.competition_id) return false;
      if (fComp && fComp !== 'standalone' && match.competition_id !== fComp) return false;
      if (fStatus && match.state.status !== fStatus) return false;
      if (fDate) {
        const day = match.scheduled_at ? berlinInput(match.scheduled_at).slice(0, 10) : '';
        if (day !== fDate) return false;
      }
    }
    return true;
  }) ?? [];
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
    {!cid && <div className="flex flex-wrap items-end gap-3">
      <Field label={t('tournaments')}>
        <select className={matchInput} value={fComp} onChange={e => setFComp(e.target.value)}>
          <option value="">{t('allCompetitions')}</option>
          <option value="standalone">{t('standaloneMatches')}</option>
          {(comps.data ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>
      <Field label={t('filterDate')}>
        <input type="date" className={matchInput} value={fDate} onChange={e => setFDate(e.target.value)} />
      </Field>
      <Field label={t('filterStatus')}>
        <select className={matchInput} value={fStatus} onChange={e => setFStatus(e.target.value)}>
          <option value="">—</option>
          {(['scheduled', 'live', 'paused', 'completed', 'cancelled'] as const).map(st =>
            <option key={st} value={st}>{t(st === 'live' || st === 'paused' ? 'statusLive' :
              st === 'scheduled' ? 'statusScheduled' : st === 'completed' ? 'statusCompleted' : 'statusCancelled')}</option>)}
        </select>
      </Field>
    </div>}
    {fixtures.isError && <p role="alert">{t('error')}</p>}
    {fixtures.data?.length === 0 && <p>{t('empty')}</p>}
    {visible.map(match => <Fixture match={match} key={match.id}
      compLabel={!cid && match.competition_id ? compName(match.competition_id) : ''} />)}
  </section>;
}

function Fixture({ match, compLabel = '' }: { match: ControlledMatch; compLabel?: string }) {
  const { t, language } = useMatchText();
  const editTeams = useTeamsQuery(match.competition_id);
  const edit = useSave();
  const access = useSave();
  const del = useSave();
  const scheduled = match.state.status === 'scheduled';
  const deletable = match.state.status !== 'completed';
  return <details className={matchCard}>
    {compLabel && match.competition_id && <div className="mb-1 flex items-center gap-2 px-2 pt-1 text-sm">
      <Link className="font-semibold text-primary-700 underline" to={`/competitions/${match.competition_id}`}>{compLabel}</Link>
      <Link className="text-accent-700 underline" to={`/competitions/${match.competition_id}/courts`}>{t('courtsOverview')}</Link>
    </div>}
    <summary className="cursor-pointer break-words font-semibold">
      {match.match_number ? `#${match.match_number} · ` : ''}
      {match.stage ? `${match.stage} · ` : ''}
      {match.team_a} – {match.team_b} · {match.court} · {t(match.state.status)}
      {match.referee_team && ` · ${t('refereeTeam')}: ${match.referee_team}`}
      {match.scheduled_at && ` · ${formatMatchDate(match.scheduled_at, language)}`}
    </summary>
    <div className="my-3 flex flex-wrap gap-2">
      <Button asChild><Link to={`/scoreboard/${match.id}/control`}>
        {t('control')}</Link></Button>
      {scheduled && match.team_a_id && match.team_b_id &&
        <QuickResult match={match} />}
    </div>
    {scheduled && (!match.team_a_id || !match.team_b_id) &&
      <ResolveTeams match={match} />}
    <div className="grid gap-4 lg:grid-cols-2">
      <form className="space-y-2" onSubmit={event => {
        const form = formData(event);
        const aId = text(form, 'team_a_id');
        const bId = text(form, 'team_b_id');
        const swap = aId && bId && (aId !== (match.team_a_id ?? '') || bId !== (match.team_b_id ?? ''));
        void edit.run(() => matchRpc('skv_edit_match', { mid: match.id, config: {
          court: text(form, 'court'), scheduled_at: berlinTime(text(form, 'starts')),
          duration_minutes: +text(form, 'duration'), published: form.has('published'),
          referee_team: text(form, 'referee_team'),
          ...(swap ? { team_a_id: aId, team_b_id: bId } : {}),
        } }));
      }}>
        <div className="grid gap-3 sm:grid-cols-2">
          {([['team_a_id', 'teamA', match.team_a_id], ['team_b_id', 'teamB', match.team_b_id]] as const)
            .map(([name, label, current]) =>
              <Field key={name} label={t(label)}>
                <select key={(editTeams.data?.length ? 'ready' : 'loading') + name}
                  name={name} className={matchInput} disabled={!scheduled}
                  defaultValue={current ?? ''} required={scheduled}>
                  <option value="">{t('chooseTeam')}</option>
                  {(editTeams.data ?? []).map(team =>
                    <option key={team.id} value={team.id}>{team.name}</option>)}
                </select>
              </Field>)}
        </div>
        <Field label={t('court')}><input name="court" className={matchInput}
          disabled={!scheduled} maxLength={80} defaultValue={match.court} /></Field>
        <Field label={t('refereeTeam')}><RefereeTeamInput teams={editTeams.data ?? []}
          defaultValue={match.referee_team ?? ''} /></Field>
        <Field label={t('starts')}><input name="starts" className={matchInput}
          disabled={!scheduled} type="datetime-local" defaultValue={berlinInput(match.scheduled_at)} /></Field>
        <Field label={t('duration')}><input name="duration" className={matchInput}
          disabled={!scheduled} type="number" min={5} max={480} defaultValue={match.duration_minutes} /></Field>
        <label className="flex items-center gap-2"><input name="published" type="checkbox"
          defaultChecked={match.published} />{t('publish')}</label>
        <Result save={edit} />
        <Button type="submit" disabled={edit.busy}>{t('save')}</Button>
      </form>
      <RefereeAccessLink id={match.id} />
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
