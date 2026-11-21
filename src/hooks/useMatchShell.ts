import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useMatchShell() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator) || !navigator.onLine ||
      '__PRERENDER_INJECTED' in window) return;
    let cancelled = false;
    void navigator.serviceWorker.register('/match-center-sw.js', { scope: '/scoreboard' })
      .then(async () => {
        const { active } = await navigator.serviceWorker.ready;
        if (cancelled) return;
        active?.postMessage({ type: 'CACHE_MATCH_SHELL', path: pathname,
          assets: performance.getEntriesByType('resource').map(entry => entry.name) });
      }).catch(() => {});
    return () => { cancelled = true; };
  }, [pathname]);
}
