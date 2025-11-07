import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ContentFilters, ContentItemSummary, ContentStatus } from '../types/admin/content';

interface SupabaseContentRow {
  id: string;
  title: string;
  language: string;
  status: ContentStatus;
  updated_at: string;
  vector_jobs: { status: string }[] | null;
}

interface State {
  items: ContentItemSummary[];
  loading: boolean;
  total: number;
  error?: string;
}

interface Options {
  page: number;
  pageSize: number;
}

const defaultState: State = { items: [], loading: false, total: 0 };
const defaultOptions: Options = { page: 1, pageSize: 20 };

export const useAdminContent = (filters: ContentFilters, options: Options = defaultOptions) => {
  const [state, setState] = useState<State>(defaultState);
  const [refreshKey, setRefreshKey] = useState(0);

  const payload = useMemo(
    () => ({
      search: filters.search.trim(),
      status: filters.status,
      language: filters.language,
      page: options.page > 0 ? options.page : 1,
      pageSize: options.pageSize > 0 ? options.pageSize : defaultOptions.pageSize,
    }),
    [filters, options.page, options.pageSize],
  );

  const refresh = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setState((prev) => ({ ...prev, loading: true, error: undefined }));

      const from = (payload.page - 1) * payload.pageSize;
      const to = from + payload.pageSize - 1;

      const query = supabase
        .from('content_items')
        .select('id, title, language, status, updated_at, vector_jobs(status)', { count: 'exact' });

      if (payload.status !== 'all') {
        query.eq('status', payload.status);
      }
      if (payload.language !== 'all') {
        query.eq('language', payload.language);
      }
      if (payload.search) {
        query.ilike('title', `%${payload.search}%`);
      }

      const { data, error, count } = await query
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (cancelled) return;

      if (error) {
        setState({ items: [], loading: false, total: 0, error: error.message });
        return;
      }

      const items: ContentItemSummary[] = (data as SupabaseContentRow[]).map((row) => ({
        id: row.id,
        title: row.title,
        language: row.language,
        status: row.status,
        updatedAt: row.updated_at,
        pendingJobs: row.vector_jobs?.filter((job) => job.status !== 'completed').length ?? 0,
      }));

      setState({ items, loading: false, total: count ?? items.length });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [payload, refreshKey]);

  return { ...state, refresh };
};
