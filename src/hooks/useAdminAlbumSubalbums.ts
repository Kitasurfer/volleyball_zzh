import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SUPPORTED_LANGUAGES, type Language } from '../types';

export type AdminSubalbumTranslationState = Record<Language, {
  title: string;
  subtitle: string;
  description: string;
}>;

export type AdminSubalbumItem = {
  id: string;
  albumId: string;
  slug: string;
  eventDate: string;
  sortOrder: number;
  status: string;
  translations: AdminSubalbumTranslationState;
};

const defaultTranslations = (): AdminSubalbumTranslationState => ({
  de: { title: '', subtitle: '', description: '' },
  en: { title: '', subtitle: '', description: '' },
  ru: { title: '', subtitle: '', description: '' },
  it: { title: '', subtitle: '', description: '' },
});

export const useAdminAlbumSubalbums = () => {
  const [items, setItems] = useState<AdminSubalbumItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSubalbums = useCallback(async (albumId: string) => {
    if (!albumId || !supabase) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: subalbumError } = await supabase
      .from('gallery_subalbums')
      .select('id, album_id, slug, event_date, sort_order, status')
      .eq('album_id', albumId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (subalbumError) {
      setItems([]);
      setError(subalbumError.message);
      setLoading(false);
      return;
    }

    const rows = (data as {
      id: string;
      album_id: string;
      slug: string;
      event_date: string | null;
      sort_order: number;
      status: string;
    }[] | null) ?? [];

    const ids = rows.map((row) => row.id);
    const translationState: Record<string, AdminSubalbumTranslationState> = {};

    ids.forEach((id) => {
      translationState[id] = defaultTranslations();
    });

    if (ids.length > 0) {
      const { data: translationData, error: translationError } = await supabase
        .from('gallery_subalbum_translations')
        .select('subalbum_id, language, title, subtitle, description')
        .in('subalbum_id', ids);

      if (translationError) {
        setError(translationError.message);
      } else {
        (translationData as {
          subalbum_id: string;
          language: string;
          title: string;
          subtitle: string | null;
          description: string | null;
        }[] | null)?.forEach((row) => {
          const lang = row.language as Language;
          if (!SUPPORTED_LANGUAGES.includes(lang)) return;
          translationState[row.subalbum_id][lang] = {
            title: row.title ?? '',
            subtitle: row.subtitle ?? '',
            description: row.description ?? '',
          };
        });
      }
    }

    setItems(rows.map((row) => ({
      id: row.id,
      albumId: row.album_id,
      slug: row.slug,
      eventDate: row.event_date ?? '',
      sortOrder: row.sort_order ?? 0,
      status: row.status,
      translations: translationState[row.id] ?? defaultTranslations(),
    })));
    setLoading(false);
  }, []);

  const saveSubalbum = useCallback(async (input: Omit<AdminSubalbumItem, 'id'> & { id?: string }) => {
    if (!supabase) {
      setError('Supabase is not configured.');
      return false;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let subalbumId = input.id;

      if (!subalbumId) {
        const { data, error } = await supabase
          .from('gallery_subalbums')
          .insert({
            album_id: input.albumId,
            slug: input.slug,
            event_date: input.eventDate || null,
            sort_order: input.sortOrder,
            status: input.status,
          })
          .select('id')
          .single();

        if (error || !data) {
          throw new Error(error?.message ?? 'Failed to create subalbum.');
        }

        subalbumId = (data as { id: string }).id;
      } else {
        const { error } = await supabase
          .from('gallery_subalbums')
          .update({
            slug: input.slug,
            event_date: input.eventDate || null,
            sort_order: input.sortOrder,
            status: input.status,
          })
          .eq('id', subalbumId);

        if (error) {
          throw new Error(error.message);
        }
      }

      for (const language of SUPPORTED_LANGUAGES) {
        const translation = input.translations[language];
        if (!translation.title.trim() && !translation.subtitle.trim() && !translation.description.trim()) {
          continue;
        }

        const { data: existing, error: existingError } = await supabase
          .from('gallery_subalbum_translations')
          .select('id')
          .eq('subalbum_id', subalbumId)
          .eq('language', language)
          .maybeSingle();

        if (existingError) {
          throw new Error(existingError.message);
        }

        if (existing) {
          const { error } = await supabase
            .from('gallery_subalbum_translations')
            .update({
              title: translation.title.trim() || input.slug,
              subtitle: translation.subtitle.trim() || null,
              description: translation.description.trim() || null,
            })
            .eq('id', (existing as { id: string }).id);

          if (error) {
            throw new Error(error.message);
          }
        } else {
          const { error } = await supabase
            .from('gallery_subalbum_translations')
            .insert({
              subalbum_id: subalbumId,
              language,
              title: translation.title.trim() || input.slug,
              subtitle: translation.subtitle.trim() || null,
              description: translation.description.trim() || null,
            });

          if (error) {
            throw new Error(error.message);
          }
        }
      }

      setSuccess('Subalbum saved successfully.');
      await loadSubalbums(input.albumId);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save subalbum.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [loadSubalbums]);

  return {
    items,
    loading,
    saving,
    error,
    success,
    loadSubalbums,
    saveSubalbum,
    defaultTranslations,
  };
};
