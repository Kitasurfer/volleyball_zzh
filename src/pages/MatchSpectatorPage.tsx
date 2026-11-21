import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui';
import { Seo } from '@/components/Seo';
import { MatchScore, SetReport, matchPage } from '@/components/MatchScore';
import { useMatchText } from '@/data/matchTranslations';
import { usePublicScore } from '@/hooks/usePublicScores';
import { formatMatchDate } from '@/lib/matchApi';

export default function MatchSpectatorPage({ display = false }: { display?: boolean }) {
  const { matchId = '' } = useParams();
  return <Spectator key={matchId} id={matchId} display={display} />;
}

function Spectator({ id, display }: { id: string; display: boolean }) {
  const { t, language } = useMatchText();
  const { data: match, isLoading, isError, connected } = usePublicScore(id);
  const [notice, setNotice] = useState('');
  const [qr, setQr] = useState('');
  const spectatorUrl = `${window.location.origin}/scoreboard/${id}`;
  const published = !!match;
  useEffect(() => {
    if (!published || display) return;
    let active = true;
    void import('qrcode').then(qrcode => qrcode.toDataURL(spectatorUrl, {
      errorCorrectionLevel: 'M', width: 180, margin: 4,
    })).then(url => { if (active) setQr(url); }).catch(() => {});
    return () => { active = false; };
  }, [display, published, spectatorUrl]);
  if (!match) return <main className={matchPage}>
    <p role={isError ? 'alert' : 'status'}>
      {isLoading ? t('loading') : isError ? t('offline') : t('unavailable')}
    </p>
    <Link to="/scoreboard">{t('nav')}</Link>
  </main>;
  const title = `${match.team_a} – ${match.team_b}`;
  return (
    <main className={display
      ? 'flex min-h-[100dvh] flex-col gap-3 bg-primary-950 p-3 text-white sm:p-5'
      : `${matchPage} print:pt-0`}>
      <Seo title={title} description={t('title')} noIndex={display} />
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">SKV Unterensingen Volleyball</p>
          <h1 className="break-words font-bold">{match.competition_name || title}</h1>
          {match.external_match_id && <p className="text-sm">{t('unofficial')}</p>}
        </div>
        {display && <Button variant="accent" onClick={() => {
          const root = document.documentElement;
          const request = document.fullscreenElement ? document.exitFullscreen?.() :
            root.requestFullscreen?.();
          if (!request) setNotice(t('unavailable'));
          void request?.catch(() => setNotice(t('unavailable')));
        }}>{t('fullscreen')}</Button>}
      </header>
      <MatchScore match={match} display={display} />
      <div className={display ? 'text-neutral-900' : ''}><SetReport state={match.state} /></div>
      <p aria-live="polite" className="text-sm">
        {t('updated')}: {formatMatchDate(match.updated_at, language)}
        {(!connected || isError) && ` · ${t(isError || !navigator.onLine ? 'offline' : 'fallback')}`}
      </p>
      {!display && (
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button asChild><Link to={`/scoreboard/${id}/display`}>{t('display')}</Link></Button>
          <Button variant="outline" onClick={() => {
            if (!navigator.clipboard) setNotice(spectatorUrl);
            else void navigator.clipboard.writeText(spectatorUrl)
              .then(() => setNotice(t('copied')), () => setNotice(spectatorUrl));
          }}>{t('share')}</Button>
          <Button variant="outline" onClick={() => window.print()}>{t('print')}</Button>
        </div>
      )}
      {!display && qr && <img src={qr} width={180} height={180} alt={t('qr')} />}
      <p role="status" className="text-sm print:hidden">{notice}</p>
    </main>
  );
}
