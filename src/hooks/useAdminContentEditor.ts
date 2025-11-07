import { useCallback, useState } from 'react';
import type { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import type { ContentEditorInput } from '../types/admin/content';

type EditorAction = 'create' | 'update';

interface SaveResult {
  contentId: string;
}

interface State {
  saving: boolean;
  error?: string;
  success?: string;
}

const defaultState: State = { saving: false };

const sanitizePayload = (input: ContentEditorInput) => ({
  title: input.title,
  slug: input.slug,
  language: input.language,
  status: input.status,
  type: input.type,
  tags: input.tags,
  publishedAt: input.publishedAt,
  mediaLinks: input.mediaLinks,
});

export const useAdminContentEditor = () => {
  const { user } = useAuth();
  const [state, setState] = useState<State>(defaultState);

  const logAction = useCallback(
    async (contentId: string, action: EditorAction, input: ContentEditorInput) => {
      await supabase.from('content_action_logs').insert({
        content_id: contentId,
        admin_id: user?.id ?? null,
        action,
        payload: sanitizePayload(input),
      });
    },
    [user?.id],
  );

  const upsertMediaLinks = useCallback(async (contentId: string, mediaLinks: ContentEditorInput['mediaLinks']) => {
    await supabase.from('content_media_links').delete().eq('content_id', contentId);

    if (!mediaLinks.length) return;

    const rows = mediaLinks.map((link, index) => ({
      content_id: contentId,
      media_id: link.mediaId,
      role: link.role || 'inline',
      position: typeof link.position === 'number' ? link.position : index,
    }));

    const { error } = await supabase.from('content_media_links').insert(rows);
    if (error) throw error;
  }, []);

  const createContent = useCallback(
    async (input: ContentEditorInput): Promise<SaveResult> => {
      setState({ saving: true });

      try {
        const { data, error } = await supabase
          .from('content_items')
          .insert({
            title: input.title,
            slug: input.slug,
            language: input.language,
            status: input.status,
            summary: input.summary,
            body_markdown: input.bodyMarkdown,
            body_html: input.bodyHtml,
            type: input.type,
            tags: input.tags,
            published_at: input.publishedAt ? new Date(input.publishedAt).toISOString() : null,
          })
          .select('id')
          .single();

        if (error || !data) throw error ?? new Error('Failed to create content');

        const contentId = data.id as string;

        await upsertMediaLinks(contentId, input.mediaLinks);
        await logAction(contentId, 'create', input);

        setState({ saving: false, success: 'Content created successfully.' });
        return { contentId };
      } catch (error) {
        const message = (error as PostgrestError)?.message ?? (error as Error)?.message ?? 'Failed to create content.';
        setState({ saving: false, error: message });
        throw error;
      }
    },
    [logAction, upsertMediaLinks],
  );

  const updateContent = useCallback(
    async (contentId: string, input: ContentEditorInput): Promise<SaveResult> => {
      setState({ saving: true });

      try {
        const { error } = await supabase
          .from('content_items')
          .update({
            title: input.title,
            slug: input.slug,
            language: input.language,
            status: input.status,
            summary: input.summary,
            body_markdown: input.bodyMarkdown,
            body_html: input.bodyHtml,
            type: input.type,
            tags: input.tags,
            published_at: input.publishedAt ? new Date(input.publishedAt).toISOString() : null,
          })
          .eq('id', contentId);

        if (error) throw error;

        await upsertMediaLinks(contentId, input.mediaLinks);
        await logAction(contentId, 'update', input);

        setState({ saving: false, success: 'Content updated successfully.' });
        return { contentId };
      } catch (error) {
        const message = (error as PostgrestError)?.message ?? (error as Error)?.message ?? 'Failed to update content.';
        setState({ saving: false, error: message });
        throw error;
      }
    },
    [logAction, upsertMediaLinks],
  );

  const resetStatus = useCallback(() => {
    setState(defaultState);
  }, []);

  return {
    saving: state.saving,
    error: state.error,
    success: state.success,
    createContent,
    updateContent,
    resetStatus,
  };
};
