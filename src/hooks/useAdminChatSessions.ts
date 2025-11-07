import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ChatSessionFilters, ChatSessionSummary } from '../types/admin/chat';

interface SupabaseChatSessionRow {
  id: string;
  user_hash: string;
  language: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  last_activity: string;
  chat_messages: Array<{ count: number }> | null;
}

interface State {
  sessions: ChatSessionSummary[];
  loading: boolean;
  error?: string;
}

const defaultFilters: ChatSessionFilters = { search: '', language: 'all' };
const defaultState: State = { sessions: [], loading: false };

export const useAdminChatSessions = (filters: ChatSessionFilters = defaultFilters) => {
  const [state, setState] = useState<State>(defaultState);
  const [refreshKey, setRefreshKey] = useState(0);

  const payload = useMemo(
    () => ({
      search: filters.search.trim(),
      language: filters.language,
    }),
    [filters],
  );

  const refresh = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: undefined }));

      const query = supabase
        .from('chat_sessions')
        .select('id, user_hash, language, metadata, created_at, last_activity, chat_messages(count)')
        .order('last_activity', { ascending: false })
        .limit(100);

      if (payload.language !== 'all') {
        query.eq('language', payload.language);
      }

      if (payload.search) {
        const pattern = `%${payload.search}%`;
        query.ilike('user_hash', pattern);
      }

      const { data, error } = await query;

      if (cancelled) return;

      if (error) {
        setState({ sessions: [], loading: false, error: error.message });
        return;
      }

      const sessions: ChatSessionSummary[] = (data as SupabaseChatSessionRow[]).map((row) => ({
        id: row.id,
        userHash: row.user_hash,
        language: row.language,
        metadata: row.metadata,
        createdAt: row.created_at,
        lastActivity: row.last_activity,
        messageCount: row.chat_messages?.[0]?.count ?? 0,
      }));

      setState({ sessions, loading: false });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [payload, refreshKey]);

  return { ...state, refresh };
};
