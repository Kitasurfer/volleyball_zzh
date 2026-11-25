import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui';
import { PublicMatchCards, matchCard, matchPage, stageLabel } from '@/components/MatchScore';
import { useMatchText } from '@/data/matchTranslations';
import { useClubStandings, usePublicScores } from '@/hooks/usePublicScores';
import { formatMatchDate, getCompetition, type Standing } from '@/lib/matchApi';
import { csvField, downloadMatchFile } from '@/lib/matchStorage';
import { setWins } from '@/lib/matchRules';

export function StandingsTable({ rows }: { rows: Standing[] }) {
  const { t } = useMatchText();
  if (!rows.length) return <p>{t('empty')}</p>;
  const headers = ['place', 'team', 'played', 'wins', 'losses', 'sets', 'ballFor', 'points'] as const;
  return <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
    <table className="w-full text-left text-sm tabular-nums">
      <thead className="bg-neutral-100"><tr>{headers.map(key =>
        <th key={key} scope="col" className="px-3 py-3">{t(key)}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.team} className="border-t border-neutral-200">
        {[row.place, row.team, row.played, row.wins, row.losses,
          `${row.sets_for}:${row.sets_against}`, `${row.ball_for}:${row.ball_against}`,
          row.points].map((cell, i) =>
          <td key={i} className={`px-3 py-3 ${i === 1 ? 'font-semibold' : 'whitespace-nowrap'}`}>
            {cell}</td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}

function GroupStandings({ id, stage }: { id: string; stage: string }) {
  const { t } = useMatchText();
  const standings = useClubStandings(id, stage);
  return <section className="space-y-3">
    <h3 className="text-xl font-bold text-primary-900">{stageLabel(stage, t)}</h3>
    {standings.isError ? <p role="alert">{t('error')}</p> : standings.isLoading ?
      <p>{t('loading')}</p> : <StandingsTable rows={standings.data ?? []} />}
  </section>;
}

export default function ClubCompetitionPage() {
  const { competitionId = '' } = useParams();
  const { t, language } = useMatchText();
  const valid = /^[a-f0-9-]{36}$/i.test(competitionId);
  const competition = useQuery({
    queryKey: ['skv-competition', competitionId], enabled: valid,
    queryFn: () => getCompetition(competitionId),
  });
  const info = competition.data;
  const fixtures = usePublicScores(valid ? competitionId : undefined);
  const standings = useClubStandings(valid ? competitionId : undefined);
  if (!info) return <main className={matchPage}>
    {t(competition.isLoading ? 'loading' : competition.isError ? 'error' : 'unavailable')}
  </main>;
  const matches = fixtures.data ?? [];
  const groupStages = [...new Set(matches.map(m => m.stage).filter(s => s.startsWith('group:')))].sort();
  const playoffOrder = ['playoff:semi1', 'playoff:semi2', 'playoff:third', 'playoff:final'];
  const playoffs = matches.filter(m => m.stage.startsWith('playoff:'))
    .sort((x, y) => playoffOrder.indexOf(x.stage) - playoffOrder.indexOf(y.stage));
  const grouped = (stage: string) => matches.filter(m => m.stage === stage);
  return <main className={matchPage}>
    <header className={`${matchCard} space-y-2`}>
      <p className="text-sm font-semibold text-primary-700">{t('tournaments')}</p>
      <h1 className="break-words text-3xl font-bold text-primary-900">{info.name}</h1>
      <p>{info.venue}{info.starts_at && ` · ${formatMatchDate(info.starts_at, language)}`}</p>
      <p className="whitespace-pre-wrap break-words">{info.description}</p>
      <p><Link className="font-semibold text-primary-700 underline"
        to={`/competitions/${competitionId}/courts`}>{t('courtOverview')}</Link></p>
    </header>
    {groupStages.length ? <div className="space-y-5">
      <h2 className="text-2xl font-bold text-primary-900">{t('standings')}</h2>
      {groupStages.map(stage => <GroupStandings key={stage} id={competitionId} stage={stage} />)}
    </div> : <section className="space-y-3">
      <h2 className="text-2xl font-bold text-primary-900">{t('standings')}</h2>
      {standings.isError ? <p role="alert">{t('error')}</p> : standings.isLoading ?
        <p>{t('loading')}</p> : <StandingsTable rows={standings.data ?? []} />}
    </section>}
    {!!playoffs.length && <section className="space-y-3">
      <h2 className="text-2xl font-bold text-primary-900">{t('playoffs')}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {playoffs.map(m => <div key={m.match_id} className={`${matchCard} space-y-1`}>
          <p className="text-sm font-bold uppercase tracking-wide text-accent-600">
            {stageLabel(m.stage, t)}{m.match_number ? ` · #${m.match_number}` : ''}</p>
          <p className="break-words text-lg font-bold">
            {m.team_a} – {m.team_b}</p>
          <p className="text-2xl font-black tabular-nums">
            {m.state.status === 'completed' || m.state.status === 'live' || m.state.status === 'paused'
              ? `${setWins(m.state, 'a')}:${setWins(m.state, 'b')}`
              : m.scheduled_at ? formatMatchDate(m.scheduled_at, language) : t(m.state.status)}
          </p>
          <p className="text-sm">{m.state.sets.filter(s => s.a || s.b || s.winner)
            .map(s => `${s.a}:${s.b}`).join(' / ')}</p>
          <Link className="text-sm font-semibold text-primary-700 underline print:hidden"
            to={`/scoreboard/${m.match_id}`}>{t('spectate')}</Link>
        </div>)}
      </div>
    </section>}
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <h2 className="text-2xl font-bold text-primary-900">{t('schedule')}</h2>
        <div className="flex gap-2">
        <Button variant="outline" onClick={() => window.print()}>{t('print')}</Button>
        <Button variant="outline" disabled={!matches.some(m => m.state.status === 'completed')}
          onClick={() => {
            const rows = [
              [t('teamA'), t('teamB'), t('starts'), t('court'), t('sets'), t('protocol')],
              ...matches.filter(m => m.state.status === 'completed').map(m =>
                [m.team_a, m.team_b, m.finished_at ?? m.updated_at, m.court,
                  m.state.outcome === 'walkover' ? t('forfeit') :
                    `${setWins(m.state, 'a')}:${setWins(m.state, 'b')}`,
                  m.state.sets.map(s => `${s.a}:${s.b}`).join(' / ')]),
            ];
            downloadMatchFile('skv-results.csv', '\ufeff' +
              rows.map(row => row.map(csvField).join(';')).join('\r\n'), 'text/csv;charset=utf-8');
          }}>{t('export')}</Button>
        </div>
      </div>
      {fixtures.isError && <p role="alert">{t('offline')}</p>}
      {!matches.length && <p>{t(fixtures.isLoading ? 'loading' : 'empty')}</p>}
      {groupStages.length ? <div className="space-y-5">
        {[...groupStages, '', ...playoffOrder.filter(s => playoffs.some(m => m.stage === s))]
          .filter((stage, index, all) => all.indexOf(stage) === index &&
            (stage !== '' || matches.some(m => !m.stage)))
          .map(stage => grouped(stage).length ? <div key={stage || 'main'} className="space-y-3">
            {stage && <h3 className="text-lg font-bold text-primary-900">{stageLabel(stage, t)}</h3>}
            <PublicMatchCards matches={grouped(stage)} />
          </div> : null)}
      </div> : <PublicMatchCards matches={matches} />}
    </section>
    <footer className="mt-10 hidden print:block">
      <p className="text-lg font-bold">{t('protocol')} · {info.name}</p>
      <p>{info.venue}{info.starts_at && ` · ${formatMatchDate(info.starts_at, language)}`}</p>
      <div className="mt-8 grid grid-cols-2 gap-8">
        <p className="border-t border-black pt-1">{t('organizerSignature')}</p>
        <p className="border-t border-black pt-1">{t('refereeSignature')}</p>
      </div>
    </footer>
  </main>;
}
