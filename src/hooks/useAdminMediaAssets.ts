import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { MediaAssetSummary, MediaFilters } from '../types/admin/media';

interface SupabaseMediaRow {
  id: string;
  title: string | null;
  description: string | null;
  language: string | null;
  media_type: string;
  storage_path: string;
  album_id: string | null;
  alt_text: Record<string, unknown> | null;
  title_i18n: Record<string, unknown> | null;
  created_at: string;
}

interface State {
  items: MediaAssetSummary[];
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
const MEDIA_BUCKET = 'media-public';

export const useAdminMediaAssets = (filters: MediaFilters, options: Options = defaultOptions) => {
  const [state, setState] = useState<State>(defaultState);
  const [refreshKey, setRefreshKey] = useState(0);

  const payload = useMemo(
    () => ({
      search: filters.search.trim(),
      language: filters.language,
      mediaType: filters.mediaType,
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
        .from('media_assets')
        .select(
          'id, title, description, language, media_type, storage_path, album_id, alt_text, title_i18n, created_at',
          { count: 'exact' },
        )
        .order('created_at', { ascending: false });

      if (payload.language !== 'all') {
        query.eq('language', payload.language);
      }

      if (payload.mediaType !== 'all') {
        query.eq('media_type', payload.mediaType);
      }

      if (payload.search) {
        const pattern = `%${payload.search}%`;
        query.or(`title.ilike.${pattern},description.ilike.${pattern},storage_path.ilike.${pattern}`);
      }

      const { data, error, count } = await query.range(from, to);

      if (cancelled) return;

      if (error) {
        setState({ items: [], loading: false, total: 0, error: error.message });
        return;
      }

      const rows = (data as SupabaseMediaRow[]) ?? [];
      const signedUrls: Record<string, string> = {};

      if (rows.length) {
        const bucketPrefix = `${MEDIA_BUCKET}/`;
        const bucketRows = rows.filter((row) => row.storage_path.startsWith(bucketPrefix));
        const paths = bucketRows.map((row) => row.storage_path.slice(bucketPrefix.length));

        if (paths.length) {
          const { data: urlData, error: signedUrlError } = await supabase.storage
            .from(MEDIA_BUCKET)
            .createSignedUrls(paths, 60 * 60);

          if (!signedUrlError && urlData) {
            urlData.forEach((item, index) => {
              signedUrls[bucketRows[index].storage_path] = item.signedUrl;
            });
          }
        }
      }

      const items: MediaAssetSummary[] = rows.map((row) => {
        const hasAlt = !!(
          row.alt_text &&
          typeof row.alt_text === 'object' &&
          Object.keys(row.alt_text as Record<string, unknown>).length > 0
        );

        const hasI18n = !!(
          row.title_i18n &&
          typeof row.title_i18n === 'object' &&
          Object.keys(row.title_i18n as Record<string, unknown>).length > 0
        );

        const bucketPrefix = `${MEDIA_BUCKET}/`;

        return {
          id: row.id,
          title: row.title,
          description: row.description,
          language: row.language,
          mediaType: row.media_type,
          storagePath: row.storage_path,
          createdAt: row.created_at,
          signedUrl: row.storage_path.startsWith(bucketPrefix)
            ? signedUrls[row.storage_path]
            : row.storage_path,
          albumId: row.album_id,
          hasAltText: hasAlt,
          hasTitleI18n: hasI18n,
        };
      });

      setState({ items, loading: false, total: count ?? items.length });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [payload, refreshKey]);

  return { ...state, refresh };
};
