import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  acquireLease, matchRpc, readSnapshot, readMatch, sendEvent, scoresKey, scoreKey,
  type ControlledMatch,
} from '@/lib/matchApi';
import { queueAction, readDraft, saveDraft, seedDraft, type MatchDraft } from '@/lib/matchStorage';
import type { Action } from '@/lib/matchRules';

const conflictErrors = ['lease_taken', 'lease_lost', 'version_conflict', 'access_denied',
  'event_reused', 'invalid_action'];
const message = (error: unknown) => error instanceof Error ? error.message : 'unknown';

export function useMatchControl(
  id: string, actor: string | undefined, authenticated: boolean, autoTake = false,
) {
  const local = id.startsWith('local-');
  const key = local ? id : `${actor ?? ''}:${id}`;
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<MatchDraft>();
  const [server, setServer] = useState<ControlledMatch>();
  const [error, setError] = useState<unknown>();
  const [offline, setOffline] = useState(!navigator.onLine);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [held, setHeld] = useState(false);
  const value = useRef<MatchDraft>();
  const wantsLease = useRef(autoTake);
  const running = useRef(false);
  const serial = useRef<Promise<unknown>>(Promise.resolve());
  const mounted = useRef(false);

  const update = useCallback((change: (current: MatchDraft) => MatchDraft) => {
    const write = serial.current.then(async () => {
      const current = value.current;
      if (!current || !mounted.current) throw new Error('access_denied');
      const next = await saveDraft(change(current), current.revision);
      value.current = next;
      if (mounted.current) setDraft(next);
      return next;
    });
    serial.current = write.catch(() => {});
    return write;
  }, []);

  const refresh = useCallback(async () => {
    const { match, history } = await readSnapshot(id);
    await update(current => current.pending.length || current.confirmed.version > match.version ? current :
      { ...current, confirmed: match, projected: match, history });
  }, [id, update]);

  const connect = useCallback(async (force = false) => {
    if (local || !actor || !authenticated || !navigator.onLine ||
        running.current || !value.current) return;
    running.current = true;
    setSyncing(true);
    try {
      if (value.current.conflict) return;
      if (!wantsLease.current && !value.current.pending.length && !force) {
        const match = await readMatch(id);
        setServer(match);
        if (match.updated_at !== value.current.confirmed.updated_at) await refresh();
        setOffline(false);
        return;
      }

      const { device, pending, fence } = value.current;
      const lease = await acquireLease(id, device, force, pending.length ? fence ?? undefined : undefined);
      setServer(lease.match);
      if (!mounted.current) return;
      if (value.current.pending.length && lease.fence !== value.current.fence) {
        throw new Error('lease_lost');
      }
      if (value.current.fence !== lease.fence) {
        await update(current => ({ ...current, fence: lease.fence }));
      }
      setHeld(true);
      while (mounted.current && value.current.pending.length) {
        const { device, pending: [head] } = value.current;
        const result = await sendEvent(id, device, lease.fence, head);
        setServer(result.match);
        const next = await update(current => {
          if (current.pending[0]?.id !== head.id) throw new Error('device_conflict');
          const pending = current.pending.slice(1);
          return { ...current, pending, confirmed: result.match,
            projected: pending.length ? current.projected : result.match };
        });
        if (result.match.version > result.ack) {
          if (next.pending.length) throw new Error('version_conflict');
          await refresh();
        }
        void queryClient.invalidateQueries({ queryKey: scoreKey(id) });
        void queryClient.invalidateQueries({ queryKey: scoresKey });
      }
      const latest = value.current.confirmed;
      if (lease.match.version > latest.version ||
          (lease.match.version === latest.version && lease.match.updated_at !== latest.updated_at)) {
        await refresh();
      }
      setError(undefined);
      setOffline(false);
    } catch (cause) {
      const problem = message(cause);
      if (conflictErrors.includes(problem)) {
        setHeld(false);
        wantsLease.current = false;
        if (value.current?.pending.length) {
          await update(current => ({ ...current, conflict: current.conflict ?? crypto.randomUUID() }))
            .catch(setError);
          void readMatch(id).then(setServer).catch(() => {});
        }
      }
      setError(cause);
      if (!conflictErrors.includes(problem) && problem !== 'device_conflict') setOffline(true);
    } finally {
      running.current = false;
      if (mounted.current) setSyncing(false);
    }
  }, [actor, authenticated, id, local, queryClient, refresh, update]);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    async function load() {
      const cached = await readDraft(key);
      if (cancelled) return;
      if (cached) {
        value.current = cached;
        setDraft(cached);
        wantsLease.current = (wantsLease.current || !!cached.fence) && !cached.conflict;
        setHeld(!!cached.fence && !cached.conflict);
      }
      if (!local && actor && authenticated && navigator.onLine && !cached) {
        const { match, history } = await readSnapshot(id);
        if (cancelled) return;
        const created = await saveDraft({ ...seedDraft(key, match), history }, undefined);
        if (cancelled) return;
        value.current = created;
        setDraft(created);
        setServer(match);
      }
      if (!cancelled) void connect();
    }
    void load().catch(cause => { if (!cancelled) setError(cause); })
      .finally(() => { if (!cancelled) setLoading(false); });
    const online = () => { void connect(); };
    const disconnected = () => setOffline(true);
    window.addEventListener('online', online);
    window.addEventListener('offline', disconnected);
    const timer = window.setInterval(online, 4000);
    return () => {
      cancelled = true;
      mounted.current = false;
      window.clearInterval(timer);
      window.removeEventListener('online', online);
      window.removeEventListener('offline', disconnected);
    };
  }, [actor, authenticated, connect, id, key, local]);

  const dispatch = async (action: Action) => {
    try {
      await update(current => {
        if (!local && (!held || !current.fence || current.conflict)) {
          throw new Error('access_denied');
        }
        if (current.pending.length >= 1000) throw new Error('queue_full');
        return queueAction(current, action, local);
      });
      setError(undefined);
      void connect();
    } catch (cause) { setError(cause); }
  };

  const take = (force = false) => {
    wantsLease.current = true;
    void connect(force);
  };

  async function keepServer() {
    const current = value.current;
    if (!current?.conflict || !authenticated || running.current) return;
    running.current = true;
    try {
      const { match, history } = await readSnapshot(id);
      await matchRpc('skv_archive_conflict', { mid: id, cid: current.conflict,
        events: current.pending, local_state: current.projected.state });
      await update(latest => ({ ...latest, conflict: null, pending: [], history, fence: null,
        confirmed: match, projected: match }));
      setHeld(false);
      setServer(match);
      setError(undefined);
    } catch (cause) { setError(cause); }
    finally { running.current = false; }
  }

  async function release() {
    if (running.current) return;
    running.current = true;
    try {
      await serial.current;
      const current = value.current;
      if (!current?.fence || current.pending.length || current.conflict) return;
      const { device, fence } = current;
      setHeld(false);
      wantsLease.current = false;
      await matchRpc('skv_release_lease', { mid: id, device, lease_fence: fence });
      await update(current => ({ ...current, fence: null }));
    } catch (cause) { setError(cause); }
    finally { running.current = false; }
  }

  return { draft, server, loading, syncing, offline, held, error, dispatch, take, release,
    keepServer };
}
