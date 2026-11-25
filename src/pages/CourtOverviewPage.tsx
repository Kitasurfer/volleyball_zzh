import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui';
import { Seo } from '@/components/Seo';
import { MatchScore, stageLabel } from '@/components/MatchScore';
import { useMatchText } from '@/data/matchTranslations';
import { usePublicScores } from '@/hooks/usePublicScores';
import { formatMatchDate, getCompetition } from '@/lib/matchApi';

function useClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

/** Hall display: every court of the tournament with its live or next match. */
export default function CourtOverviewPage() {
  const { competitionId = '' } = useParams();
  return <Overview key={competitionId} id={competitionId} />;
}

function Overview({ id }: { id: string }) {
  const { t, language } = useMatchText();
  const valid = /^[a-f0-9-]{36}$/i.test(id);
  const competition = useQuery({ queryKey: ['skv-competition', id], enabled: valid,
    queryFn: () => getCompetition(id) });
  const scores = usePublicScores(valid ? id : undefined);
  const now = useClock();
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | undefined;
    const acquire = () => {
      if (document.visibilityState !== 'visible' || sentinel) return;
      void navigator.wakeLock.request('screen').then(s => {
        sentinel = s;
        s.onrelease = () => { sentinel = undefined; };
      }).catch(() => {});
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      document.removeEventListener('visibilitychange', acquire);
      void sentinel?.release();
    };
  }, []);
  if (!competition.data) return <main className="flex min-h-[100dvh] items-center justify-center
    bg-primary-950 p-5 text-white">
    <p role="status">{t(competition.isLoading ? 'loading' : competition.isError ? 'error' : 'unavailable')}</p>
  </main>;
  const matches = scores.data ?? [];
  const courts = [...new Set(matches.map(m => m.court).filter(Boolean))].sort((x, y) =>
    x.localeCompare(y, undefined, { numeric: true }));
  const unassigned = matches.filter(m => !m.court);
  const columns = (court: string) => {
    const here = matches.filter(m => m.court === court);
    const live = here.filter(m => ['live', 'paused'].includes(m.state.status))
      .sort((x, y) => y.updated_at.localeCompare(x.updated_at))[0];
    const next = here.filter(m => m.state.status === 'scheduled')
      .sort((x, y) => (x.scheduled_at ?? '').localeCompare(y.scheduled_at ?? ''))[0];
    return { live, next };
  };
  return <main className="flex min-h-[100dvh] flex-col gap-3 bg-primary-950 p-3 text-white sm:p-5">
    <Seo title={competition.data.name} description={t('courtOverview')} noIndex />
    <header className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-sm font-semibold text-accent-500">SKV Unterensingen Volleyball</p>
        <h1 className="break-words text-xl font-bold sm:text-3xl">{competition.data.name}</h1>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" asChild><Link to={`/competitions/${id}`}>{t('schedule')}</Link></Button>
        <Button variant="accent" onClick={() => {
          const request = document.fullscreenElement ? document.exitFullscreen?.() :
            document.documentElement.requestFullscreen?.();
          if (!request) setNotice(t('unavailable'));
          void request?.catch(() => setNotice(t('unavailable')));
        }}>{t('fullscreen')}</Button>
      </div>
    </header>
    {notice && <p role="status" className="text-sm">{notice}</p>}
    {scores.isError && <p role="alert">{t('offline')}</p>}
    {!courts.length && !scores.isLoading && <p>{t('empty')}</p>}
    <div className={`grid flex-1 gap-3 ${courts.length > 1 ? 'sm:grid-cols-2' : ''} ${
      courts.length > 4 ? 'xl:grid-cols-3' : ''}`}>
      {courts.map(court => {
        const { live, next } = columns(court);
        return <section key={court} className="flex flex-col gap-2 rounded-2xl bg-white/5 p-3">
          <h2 className="text-center text-lg font-bold uppercase tracking-widest text-accent-500">
            {court}
          </h2>
          {live ? <>
            <MatchScore match={live} display />
            {live.match_number && <p className="text-center text-sm font-semibold">
              #{live.match_number}{live.stage && ` · ${stageLabel(live.stage, t)}`}</p>}
          </> : next ? <div className="flex flex-1 flex-col items-center justify-center gap-2
              rounded-xl border border-white/10 p-5 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-white/60">
              {t('upNext')}</p>
            <p className="break-words text-2xl font-bold sm:text-4xl">
              {next.team_a} – {next.team_b}</p>
            {next.match_number && <p className="text-sm font-semibold">#{next.match_number}</p>}
            {next.scheduled_at && <p className="text-lg font-semibold text-accent-500">
              {(() => {
                const minutes = Math.round((Date.parse(next.scheduled_at) - now) / 60000);
                return minutes >= 2 ? `${t('startsIn')} ${minutes} ${t('minutesShort')}` :
                  minutes >= 0 ? t('startsNow') :
                    `${t('delayed')} · ${formatMatchDate(next.scheduled_at, language)}`;
              })()}
            </p>}
            {next.referee_team && <p className="text-sm text-white/70">
              {t('refereeTeam')}: {next.referee_team}</p>}
          </div> : <div className="flex flex-1 items-center justify-center rounded-xl border
            border-white/10 p-5 text-white/50">{t('noMoreMatches')}</div>}
          {live && next && <p className="text-center text-sm font-semibold text-white/80">
            {t('upNext')}: {next.team_a} – {next.team_b}
            {next.referee_team && ` · ${t('refereeTeam')}: ${next.referee_team}`}
          </p>}
        </section>;
      })}
    </div>
    {!!unassigned.length && <p className="text-center text-sm text-white/60">
      {unassigned.filter(m => m.state.status === 'scheduled').length} {t('withoutCourt')}
    </p>}
  </main>;
}
