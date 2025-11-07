import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { AdminChatMessage } from '../types/admin/chat';

interface SupabaseChatMessageRow {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  citations: unknown;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface State {
  messages: AdminChatMessage[];
  loading: boolean;
  error?: string;
}

const defaultState: State = { messages: [], loading: false };

export const useAdminChatMessages = (sessionId: string | null) => {
  const [state, setState] = useState<State>(defaultState);
  const [refreshKey, setRefreshKey] = useState(0);

  const normalizedSessionId = useMemo(() => sessionId?.trim() ?? null, [sessionId]);

  const refresh = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!normalizedSessionId) {
      setState(defaultState);
      return;
    }

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: undefined }));

      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, role, content, citations, metadata, created_at')
        .eq('session_id', normalizedSessionId)
        .order('created_at', { ascending: true })
        .limit(500);

      if (cancelled) return;

      if (error) {
        setState({ messages: [], loading: false, error: error.message });
        return;
      }

      const messages: AdminChatMessage[] = (data as SupabaseChatMessageRow[]).map((row) => ({
        id: row.id,
        role: row.role,
        content: row.content,
        citations: row.citations,
        metadata: row.metadata,
        createdAt: row.created_at,
      }));

      setState({ messages, loading: false });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [normalizedSessionId, refreshKey]);

  return { ...state, refresh };
};
