import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui';
import { Seo } from '@/components/Seo';
import { MatchScore, SetReport, matchPage } from '@/components/MatchScore';
import { useMatchText } from '@/data/matchTranslations';
import { usePublicScore, usePublicScores } from '@/hooks/usePublicScores';
import { formatMatchDate } from '@/lib/matchApi';
import type { MatchState } from '@/lib/matchRules';

export default function MatchSpectatorPage({ display = false }: { display?: boolean }) {
  const { matchId = '' } = useParams();
  return <Spectator key={matchId} id={matchId} display={display} />;
}

const TIMEOUT_SECONDS = 30;

function useTimeoutOverlay(match: { state: MatchState; updated_at: string } | null | undefined) {
  const [started, setStarted] = useState(0);
  const total = match?.state.sets.reduce((sum, s) =>
    sum + (s.timeouts_a ?? 0) + (s.timeouts_b ?? 0), 0) ?? 0;
  const previous = useRef<{ total: number; initialized: boolean }>({ total: 0, initialized: false });
  const [, force] = useState(0);
  useEffect(() => {
    if (!previous.current.initialized) {
      // Spectators joining mid-match must not see a phantom overlay for old timeouts.
      previous.current = { total, initialized: true };
      return;
    }
    if (total > previous.current.total) {
      previous.current.total = total;
      setStarted(Date.now());
    } else {
      previous.current.total = total;
    }
    if (!started) return;
    const timer = window.setInterval(() => {
      if (Date.now() - started >= TIMEOUT_SECONDS * 1000) setStarted(0);
      else force(x => x + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [total, started, match?.updated_at]);
  if (!started || !match || match.state.status !== 'live') return 0;
  return Math.max(0, TIMEOUT_SECONDS - Math.floor((Date.now() - started) / 1000));
}

function useClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function useBeep(enabled: boolean) {
  const context = useRef<AudioContext>();
  return useCallback((kind: 'set' | 'match') => {
    if (!enabled) return;
    try {
      context.current ??= new AudioContext();
      const audio = context.current;
      if (audio.state === 'suspended') void audio.resume();
      const pattern = kind === 'match' ? [880, 660, 880] : [880, 880];
      pattern.forEach((frequency, index) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.frequency.value = frequency;
        oscillator.type = 'square';
        gain.gain.setValueAtTime(0.0001, audio.currentTime + index * 0.35);
        gain.gain.exponentialRampToValueAtTime(0.12, audio.currentTime + index * 0.35 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + index * 0.35 + 0.3);
        oscillator.connect(gain).connect(audio.destination);
        oscillator.start(audio.currentTime + index * 0.35);
        oscillator.stop(audio.currentTime + index * 0.35 + 0.32);
      });
    } catch { /* Audio is optional. */ }
  }, [enabled]);
}

function Spectator({ id, display }: { id: string; display: boolean }) {
  const { t, language } = useMatchText();
  const navigate = useNavigate();
  const { data: match, isLoading, isError, connected } = usePublicScore(id);
  const [notice, setNotice] = useState('');
  const [qr, setQr] = useState('');
  const timeoutLeft = useTimeoutOverlay(match);
  const now = useClock();
  const [soundOn, setSoundOn] = useState(() => {
    try { return localStorage.getItem('skv-sound') === '1'; } catch { return false; }
  });
  const beep = useBeep(soundOn && display);
  const set = match?.state.sets[match.state.sets.length - 1];
  const lastSetSignal = useRef('');
  useEffect(() => {
    if (!match) return;
    const key = `${match.state.sets.length}:${set?.winner ?? ''}:${match.state.winner ?? ''}`;
    if (set?.winner && lastSetSignal.current && lastSetSignal.current !== key) {
      beep(match.state.winner ? 'match' : 'set');
    }
    if (!lastSetSignal.current) lastSetSignal.current = key;
    else if (lastSetSignal.current !== key) lastSetSignal.current = key;
  }, [match, set?.winner, beep]);
  const spectatorUrl = `${window.location.origin}/scoreboard/${id}`;
  const published = !!match;
  const finished = !!match && ['completed', 'cancelled'].includes(match.state.status);
  const siblings = usePublicScores(undefined, display && finished);
  const next = finished ? siblings.data?.find(m => m.match_id !== id &&
    m.court === match?.court && m.state.status === 'scheduled') : undefined;
  useEffect(() => {
    if (!published || display) return;
    let active = true;
    void import('qrcode').then(qrcode => qrcode.toDataURL(spectatorUrl, {
      errorCorrectionLevel: 'M', width: 180, margin: 4,
    })).then(url => { if (active) setQr(url); }).catch(() => {});
    return () => { active = false; };
  }, [display, published, spectatorUrl]);
  useEffect(() => {
    if (!display || !('wakeLock' in navigator)) return;
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
  }, [display]);
  useEffect(() => {
    if (!display || !next) return;
    const timer = window.setTimeout(
      () => navigate(`/scoreboard/${next.match_id}/display`), 60000);
    return () => window.clearTimeout(timer);
  }, [display, navigate, next]);
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
        {display && <div className="flex gap-2">
          <Button variant="outline" aria-pressed={soundOn} onClick={() => {
            const next = !soundOn;
            setSoundOn(next);
            try { localStorage.setItem('skv-sound', next ? '1' : '0'); } catch { /* Optional. */ }
            if (next) beep('set');
          }}>{t('sound')}</Button>
          <Button variant="accent" onClick={() => {
            const root = document.documentElement;
            const request = document.fullscreenElement ? document.exitFullscreen?.() :
              root.requestFullscreen?.();
            if (!request) setNotice(t('unavailable'));
            void request?.catch(() => setNotice(t('unavailable')));
          }}>{t('fullscreen')}</Button>
        </div>}
      </header>
      {match.state.status === 'scheduled' && match.scheduled_at && (() => {
        const minutes = Math.round((Date.parse(match.scheduled_at) - now) / 60000);
        return <p role="status" className={`rounded-md p-3 text-center font-semibold ${display ?
          'bg-white/10 text-white' : 'bg-primary-50 text-primary-900'}`}>
          {minutes >= 2 ? `${t('startsIn')} ${minutes} ${t('minutesShort')}` :
            minutes >= 0 ? t('startsNow') : `${t('delayed')} · ${formatMatchDate(match.scheduled_at, language)}`}
        </p>;
      })()}
      {timeoutLeft > 0 && <p role="status" className={`rounded-md p-3 text-center text-lg
        font-bold ${display ? 'bg-accent-500 text-primary-950' : 'bg-accent-100 text-primary-900'}`}>
        {t('timeout')} · {timeoutLeft} {t('secondsShort')}
      </p>}
      <MatchScore match={match} display={display} />
      <div className={display ? 'text-neutral-900' : ''}><SetReport state={match.state} /></div>
      <p aria-live="polite" className="text-sm">
        {t('updated')}: {formatMatchDate(match.updated_at, language)}
        {(!connected || isError) && ` · ${t(isError || !navigator.onLine ? 'offline' : 'fallback')}`}
      </p>
      {display && next && <p className="text-sm font-semibold">
        {t('upNext')}: {next.team_a} – {next.team_b}
      </p>}
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
