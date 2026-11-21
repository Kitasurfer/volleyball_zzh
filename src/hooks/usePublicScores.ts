import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { matchClient, matchRpc, scoreKey, scoresKey, type PublicScore, type Standing } from '@/lib/matchApi';
import { supabase } from '@/lib/supabase';

function newest(previous: PublicScore | null | undefined, next: PublicScore | null) {
  if (previous && next && (previous.version > next.version ||
      (previous.version === next.version && previous.updated_at > next.updated_at))) {
    return previous;
  }
  return next;
}

export function usePublicScore(id: string) {
  const client = useQueryClient();
  const [connected, setConnected] = useState(false);
  const enabled = Boolean(supabase && /^[a-f0-9-]{36}$/i.test(id));
  const query = useQuery({
    queryKey: scoreKey(id),
    enabled,
    queryFn: async ({ signal }) => {
      const { data, error } = await matchClient().from('skv_public_scores').select('*')
        .eq('match_id', id).abortSignal(signal).maybeSingle();
      if (error) throw new Error(error.message);
      return data as PublicScore | null;
    },
    structuralSharing: (previous, next) =>
      newest(previous as PublicScore | undefined, next as PublicScore | null),
    staleTime: 0,
    refetchInterval: connected ? 30000 : 5000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: 'always',
  });
  useEffect(() => {
    const service = supabase;
    if (!service || !enabled) return;
    let active = true;
    const key = scoreKey(id);
    const channel = service.channel(`skv:${id}:${crypto.randomUUID()}`)
      .on('system', {}, ({ extension, status }) => {
        if (!active || extension !== 'postgres_changes') return;
        const ready = status === 'ok' && navigator.onLine;
        setConnected(ready);
        // Catch up on changes between the initial HTTP read and database subscription.
        if (ready) void client.invalidateQueries({ queryKey: key });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'skv_public_scores',
        filter: `match_id=eq.${id}` }, payload => {
        if (!active) return;
        setConnected(navigator.onLine);
        if (payload.eventType === 'DELETE') void client.invalidateQueries({ queryKey: key });
        else client.setQueryData<PublicScore | null>(key, previous =>
          newest(previous, payload.new as PublicScore));
      }).subscribe(status => {
        if (active && status !== 'SUBSCRIBED') setConnected(false);
      });
    const offline = () => setConnected(false);
    window.addEventListener('offline', offline);
    return () => {
      active = false;
      window.removeEventListener('offline', offline);
      void service.removeChannel(channel);
    };
  }, [client, enabled, id]);
  return { ...query, connected };
}

export function usePublicScores(competition?: string) {
  const client = useQueryClient();
  const enabled = Boolean(supabase && !('__PRERENDER_INJECTED' in window));
  useEffect(() => {
    if (!supabase || !enabled) return;
    const filter = competition ? { filter: `competition_id=eq.${competition}` } : {};
    let timer: number | undefined;
    const invalidate = () => {
      if (timer !== undefined) return;
      timer = window.setTimeout(() => {
        timer = undefined;
        void client.invalidateQueries({ queryKey: scoresKey });
        if (competition) void client.invalidateQueries({ queryKey: ['skv-standings', competition] });
      }, 300);
    };
    const channel = supabase.channel(`skv:list:${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'skv_public_scores',
        ...filter }, invalidate).subscribe(status => { if (status === 'SUBSCRIBED') invalidate(); });
    return () => { window.clearTimeout(timer); void supabase?.removeChannel(channel); };
  }, [client, competition, enabled]);

  return useQuery({
    queryKey: [...scoresKey, competition ?? 'all'],
    enabled,
    queryFn: async () => {
      let request = matchClient().from('skv_public_scores').select('*');
      if (competition) request = request.eq('competition_id', competition);
      const order = request.order(competition ? 'scheduled_at' : 'updated_at', {
        ascending: Boolean(competition), nullsFirst: false,
      });
      if (!competition) order.limit(200);
      const { data, error } = await order;
      if (error) throw new Error(error.message);
      return data as PublicScore[];
    },
    staleTime: 5000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
}

export function useClubStandings(id: string | undefined) {
  return useQuery({ queryKey: ['skv-standings', id], enabled: Boolean(id),
    queryFn: () => matchRpc<Standing[]>('skv_standings', { cid: id }),
    staleTime: 3000, refetchInterval: 10000, refetchOnWindowFocus: true });
}
