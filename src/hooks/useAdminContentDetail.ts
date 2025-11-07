import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ContentItemDetail, ContentMediaLink } from '../types/admin/content';

interface SupabaseContentDetailRow {
  id: string;
  title: string;
  slug: string;
  language: string;
  status: string | null;
  summary: string | null;
  body_markdown: string | null;
  body_html: string | null;
  type: string;
  tags: string[] | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  content_media_links: Array<{
    media_id: string;
    role: string;
    position: number;
    media_assets:
      | {
          title: string | null;
          media_type: string;
          storage_path: string;
          language: string | null;
        }
      | Array<{
          title: string | null;
          media_type: string;
          storage_path: string;
          language: string | null;
        }>
      | null;
  }> | null;
}

interface State {
  item: ContentItemDetail | null;
  loading: boolean;
  error?: string;
}

const defaultState: State = { item: null, loading: false };

export const useAdminContentDetail = (contentId: string | null) => {
  const [state, setState] = useState<State>(defaultState);

  useEffect(() => {
    let cancelled = false;

    if (!contentId) {
      setState(defaultState);
      return;
    }

    const load = async () => {
      setState({ item: null, loading: true });

      const { data, error } = await supabase
        .from('content_items')
        .select(
          `id, title, slug, language, status, summary, body_markdown, body_html, type, tags, published_at, created_at, updated_at,
           content_media_links(media_id, role, position, media_assets(title, media_type, storage_path, language))`,
        )
        .eq('id', contentId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setState({ item: null, loading: false, error: error.message });
        return;
      }

      if (!data) {
        setState({ item: null, loading: false, error: 'Content not found.' });
        return;
      }

      const row = data as unknown as SupabaseContentDetailRow;

      const media: ContentMediaLink[] = row.content_media_links?.map((link) => ({
        mediaId: link.media_id,
        role: link.role,
        position: link.position,
        title: Array.isArray(link.media_assets)
          ? link.media_assets[0]?.title ?? null
          : link.media_assets?.title ?? null,
        mediaType: Array.isArray(link.media_assets)
          ? link.media_assets[0]?.media_type
          : link.media_assets?.media_type,
        storagePath: Array.isArray(link.media_assets)
          ? link.media_assets[0]?.storage_path
          : link.media_assets?.storage_path,
        language: Array.isArray(link.media_assets)
          ? link.media_assets[0]?.language ?? null
          : link.media_assets?.language ?? null,
      })) ?? [];

      const item: ContentItemDetail = {
        id: row.id,
        title: row.title,
        slug: row.slug,
        language: row.language,
        status: (row.status as ContentItemDetail['status']) ?? 'draft',
        summary: row.summary,
        bodyMarkdown: row.body_markdown,
        bodyHtml: row.body_html,
        type: row.type,
        tags: Array.isArray(row.tags) ? row.tags : [],
        publishedAt: row.published_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        media: media.sort((a, b) => a.position - b.position),
      };

      setState({ item, loading: false });
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [contentId]);

  return state;
};
