import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { VectorJobSummary } from '../types/admin/vector';

interface SupabaseVectorJobRow {
  id: string;
  content_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
  content_items: {
    title: string;
    language: string;
  }[] | null;
}

interface State {
  jobs: VectorJobSummary[];
  loading: boolean;
  error?: string;
}

const defaultState: State = { jobs: [], loading: false };

export const useAdminVectorJobs = () => {
  const [state, setState] = useState<State>(defaultState);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: undefined }));

      const { data, error } = await supabase
        .from('vector_jobs')
        .select('id, content_id, status, started_at, completed_at, error, content_items(title, language)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (cancelled) return;

      if (error) {
        setState({ jobs: [], loading: false, error: error.message });
        return;
      }

      const jobs: VectorJobSummary[] = (data as SupabaseVectorJobRow[]).map((row) => {
        const firstContentItem = row.content_items?.[0];

        return {
          id: row.id,
          contentId: row.content_id,
          title: firstContentItem?.title ?? 'Untitled content',
          language: firstContentItem?.language ?? '—',
          status: row.status,
          startedAt: row.started_at ?? undefined,
          completedAt: row.completed_at ?? undefined,
          error: row.error,
        };
      });

      setState({ jobs, loading: false });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return { ...state, refresh };
};
