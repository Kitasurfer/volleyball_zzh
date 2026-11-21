import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui';
import { PublicMatchCards, matchCard, matchPage } from '@/components/MatchScore';
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
  return <main className={matchPage}>
    <header className={`${matchCard} space-y-2`}>
      <p className="text-sm font-semibold text-primary-700">{t('tournaments')}</p>
      <h1 className="break-words text-3xl font-bold text-primary-900">{info.name}</h1>
      <p>{info.venue}{info.starts_at && ` · ${formatMatchDate(info.starts_at, language)}`}</p>
      <p className="whitespace-pre-wrap break-words">{info.description}</p>
    </header>
    <section className="space-y-3">
      <h2 className="text-2xl font-bold text-primary-900">{t('standings')}</h2>
      {standings.isError ? <p role="alert">{t('error')}</p> : standings.isLoading ?
        <p>{t('loading')}</p> : <StandingsTable rows={standings.data ?? []} />}
    </section>
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold text-primary-900">{t('schedule')}</h2>
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
      {fixtures.isError && <p role="alert">{t('offline')}</p>}
      {!matches.length && <p>{t(fixtures.isLoading ? 'loading' : 'empty')}</p>}
      <PublicMatchCards matches={matches} />
    </section>
  </main>;
}
