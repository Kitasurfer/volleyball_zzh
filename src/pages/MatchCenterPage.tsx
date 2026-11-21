import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MatchScore, PublicMatchCards, matchCard, matchPage } from '@/components/MatchScore';
import { Button } from '@/components/ui';
import { Seo } from '@/components/Seo';
import { useMatchText } from '@/data/matchTranslations';
import { useMatchShell } from '@/hooks/useMatchShell';
import { usePublicScores } from '@/hooks/usePublicScores';
import { useAuth } from '@/lib/AuthContext';
import { matchRpc, type ControlledMatch } from '@/lib/matchApi';
import { localMatches } from '@/lib/matchStorage';

export default function MatchCenterPage() {
  const { t } = useMatchText();
  const { user, role, signOut } = useAuth();
  const publicScores = usePublicScores();
  const stored = useQuery({ queryKey: ['skv-local'], queryFn: localMatches, staleTime: 0 });
  const managed = useQuery({
    queryKey: ['skv-managed', user?.id], enabled: !!user,
    queryFn: () => matchRpc<ControlledMatch[]>('skv_list_matches'),
    staleTime: 0, refetchInterval: 15000,
  });
  useMatchShell();
  const active = publicScores.data?.filter(m => ['live', 'paused'].includes(m.state.status)) ?? [];
  const completed = publicScores.data?.filter(m => m.state.status === 'completed') ?? [];
  return (
    <main className={matchPage}>
      <Seo title={t('nav')} description={t('title')} />
      <header className="rounded-2xl bg-gradient-to-br from-[#1f4588] via-[#25509a] to-[#1f4588] p-6 text-white sm:p-10">
        <p className="mb-2 text-sm font-semibold tracking-wide text-accent-500">
          SKV Unterensingen Volleyball
        </p>
        <h1 className="text-3xl font-bold sm:text-5xl">{t('title')}</h1>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="accent" asChild><Link to="/scoreboard/new">{t('newMatch')}</Link></Button>
          {role === 'admin' && <Button variant="outline" asChild>
            <Link to="/admin/competitions">{t('newTournament')}</Link>
          </Button>}
          <Button variant="outline" asChild><a href="#skv-live">{t('liveGames')}</a></Button>
          <Button variant="outline" asChild><a href="#skv-results">{t('history')}</a></Button>
        </div>
      </header>
      {publicScores.isError && <p role="status" className={matchCard}>{t('offline')}</p>}
      <section id="skv-live" className="scroll-mt-24 space-y-3">
        <h2 className="text-2xl font-bold text-primary-900">{t('liveGames')}</h2>
        {!active.length && <p>{t(publicScores.isLoading ? 'loading' : 'noLive')}</p>}
        <PublicMatchCards matches={active} />
      </section>
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold text-primary-900">{t('control')}</h2>
          {user ? <Button variant="outline" onClick={() => {
            try { sessionStorage.removeItem('skv-last-referee'); } catch { /* Optional cache. */ }
            void signOut();
          }}>{t('logout')}</Button> : <Button variant="outline" asChild>
            <Link to="/scoreboard/new?signin=1">{t('login')}</Link>
          </Button>}
        </div>
        {managed.isError && <p role="alert">{t('error')}</p>}
        {managed.data?.length === 0 && <p>{t('empty')}</p>}
        {!!managed.data?.length && <ul className="grid gap-3 sm:grid-cols-2">
          {managed.data.map(m => <li key={m.id} className={matchCard}>
            <p className="break-words font-semibold">{m.team_a} – {m.team_b}</p>
            <p className="text-sm">{t(m.state.status)} · {m.court}</p>
            <Link className="font-semibold text-primary-700 underline" to={`/scoreboard/${m.id}/control`}>
              {t('control')}
            </Link>
          </li>)}
        </ul>}
      </section>
      {!!stored.data?.length && <section className="space-y-3">
        <h2 className="text-xl font-bold text-primary-900">{t('localGames')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {stored.data.map(record => <article key={record.key} className="space-y-2">
            <MatchScore match={record.projected} />
            <Link className="font-semibold text-primary-700 underline"
              to={`/scoreboard/${record.key}/control`}>{t('control')}</Link>
          </article>)}
        </div>
      </section>}
      <section id="skv-results" className="scroll-mt-24 space-y-3">
        <h2 className="text-2xl font-bold text-primary-900">{t('history')}</h2>
        {!completed.length && <p>{t('empty')}</p>}
        <PublicMatchCards matches={completed.slice(0, 30)} />
      </section>
    </main>
  );
}
