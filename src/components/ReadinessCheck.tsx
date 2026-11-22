import { useCallback, useEffect, useState } from 'react';
import { matchCard } from '@/components/MatchScore';
import { Button } from '@/components/ui';
import { useMatchText } from '@/data/matchTranslations';
import { useAuth } from '@/lib/AuthContext';
import { matchClient } from '@/lib/matchApi';
import { supabase } from '@/lib/supabase';

type Status = 'ok' | 'warn' | 'fail';
type Row = { key: string; status: Status; detail: string };

async function storageProbe() {
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('skv-readiness-probe', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('probe');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('probe', 'readwrite');
      tx.objectStore('probe').put(1, 'k');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    indexedDB.deleteDatabase('skv-readiness-probe');
    return true;
  } catch { return false; }
}

async function realtimeProbe() {
  if (!supabase) return false;
  const service = supabase;
  return new Promise<boolean>(resolve => {
    const channel = service.channel(`skv:probe:${crypto.randomUUID()}`);
    const timer = window.setTimeout(() => finish(false), 8000);
    const finish = (ok: boolean) => {
      window.clearTimeout(timer);
      resolve(ok);
      void service.removeChannel(channel);
    };
    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') finish(true);
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') finish(false);
    });
  });
}

async function workerProbe() {
  if (!('serviceWorker' in navigator)) return false;
  const registrations = await navigator.serviceWorker.getRegistrations()
    .catch(() => [] as ServiceWorkerRegistration[]);
  return registrations.some(r => r.active && r.scope.includes('/scoreboard'));
}

export function ReadinessCheck() {
  const { t } = useMatchText();
  const { user, role } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const run = useCallback(async () => {
    setRunning(true);
    const probes: [string, Promise<boolean>][] = [
      ['checkStore', storageProbe()],
      ['checkServer', supabase
        ? (async () => {
            try {
              const { error } = await matchClient().from('skv_public_scores')
                .select('match_id').limit(1);
              return !error;
            } catch { return false; }
          })()
        : Promise.resolve(false)],
      ['checkRt', realtimeProbe()],
      ['checkSw', workerProbe()],
    ];
    const settled = await Promise.all(probes.map(([, p]) => p));
    const results: Row[] = [
      { key: 'checkNet', status: navigator.onLine ? 'ok' : 'fail', detail: '' },
      { key: 'checkServer', status: settled[1] ? 'ok' : 'fail', detail: '' },
      { key: 'checkRt', status: settled[2] ? 'ok' : 'warn', detail: '' },
      { key: 'checkStore', status: settled[0] ? 'ok' : 'fail', detail: '' },
      { key: 'checkSw', status: settled[3] ? 'ok' : 'warn', detail: '' },
      { key: 'checkSignIn', status: user ? 'ok' : 'warn', detail: user?.email ?? '' },
      { key: 'checkWake', status: 'wakeLock' in navigator ? 'ok' : 'warn', detail: '' },
    ];
    setRows(results);
    setRunning(false);
  }, [user]);
  useEffect(() => { void run(); }, [run]);
  const worst = rows.some(r => r.status === 'fail') ? 'fail' :
    rows.some(r => r.status === 'warn') ? 'warn' : 'ok';
  const colors: Record<Status, string> = {
    ok: 'bg-emerald-500', warn: 'bg-amber-400', fail: 'bg-red-500',
  };
  return <details className={matchCard}>
    <summary className="flex cursor-pointer items-center gap-2 font-semibold">
      <span aria-hidden className={`h-3 w-3 shrink-0 rounded-full ${colors[worst]}`} />
      {t('readiness')}
      {role && <span className="text-xs font-normal">· {role}</span>}
    </summary>
    <ul className="mt-3 space-y-1.5 text-sm">
      {rows.map(row => <li key={row.key} className="flex items-center gap-2">
        <span aria-hidden className={`h-2.5 w-2.5 shrink-0 rounded-full ${colors[row.status]}`} />
        <span>{t(row.key as Parameters<typeof t>[0])}</span>
        {row.detail && <span className="text-neutral-500">{row.detail}</span>}
      </li>)}
      {!rows.length && <li>{t('loading')}</li>}
    </ul>
    <Button variant="outline" className="mt-3" disabled={running} onClick={() => void run()}>
      {t('checkAgain')}
    </Button>
  </details>;
}
