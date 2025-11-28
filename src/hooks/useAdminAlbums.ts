import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface AlbumRow {
  id: string;
  slug: string;
  category: string;
  season: string | null;
  status: string;
  event_date: string | null;
}

export type LanguageCode = 'de' | 'en' | 'ru';

export interface TranslationFormState {
  title: string;
  subtitle: string;
  description: string;
}

export type TranslationsState = Record<LanguageCode, TranslationFormState>;

export const LANGUAGES: LanguageCode[] = ['de', 'en', 'ru'];

const defaultTranslations = (): TranslationsState => ({
  de: { title: '', subtitle: '', description: '' },
  en: { title: '', subtitle: '', description: '' },
  ru: { title: '', subtitle: '', description: '' },
});

const generateSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export interface UseAdminAlbumsResult {
  albums: AlbumRow[];
  selectedId: string | 'new';
  slug: string;
  category: string;
  season: string;
  status: string;
  eventDate: string;
  translations: TranslationsState;
  activeLang: LanguageCode;
  loading: boolean;
  saving: boolean;
  error: string | null;
  success: string | null;
  resetForm: () => void;
  selectAlbum: (albumId: string | 'new') => Promise<void>;
  setSlug: (value: string) => void;
  setCategory: (value: string) => void;
  setSeason: (value: string) => void;
  setStatus: (value: string) => void;
  setEventDate: (value: string) => void;
  setActiveLang: (lang: LanguageCode) => void;
  handleTranslationChange: (lang: LanguageCode, field: keyof TranslationFormState, value: string) => void;
  handleSubmit: (event: FormEvent) => Promise<void>;
}

export const useAdminAlbums = (): UseAdminAlbumsResult => {
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | 'new'>('new');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('team');
  const [season, setSeason] = useState('');
  const [status, setStatus] = useState('published');
  const [eventDate, setEventDate] = useState('');
  const [translations, setTranslations] = useState<TranslationsState>(defaultTranslations);
  const [activeLang, setActiveLang] = useState<LanguageCode>('de');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      const { data: albumRows, error: albumsError } = await supabase
        .from('gallery_albums')
        .select('id, slug, category, season, status, event_date')
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (albumsError) {
        setError(albumsError.message);
        setAlbums([]);
        setLoading(false);
        return;
      }

      setAlbums((albumRows as AlbumRow[]) ?? []);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadTranslationsForAlbum = async (albumId: string) => {
    const { data, error: tError } = await supabase
      .from('gallery_album_translations')
      .select('id, album_id, language, title, subtitle, description')
      .eq('album_id', albumId);

    if (tError) {
      console.error('Failed to load album translations', tError.message);
      setTranslations(defaultTranslations());
      return;
    }

    const next = defaultTranslations();
    (data as {
      language: string;
      title: string;
      subtitle: string | null;
      description: string | null;
    }[] | null)?.forEach((row) => {
      const lang = row.language as LanguageCode;
      if (!LANGUAGES.includes(lang)) return;
      next[lang] = {
        title: row.title ?? '',
        subtitle: row.subtitle ?? '',
        description: row.description ?? '',
      };
    });
    setTranslations(next);
  };

  const resetForm = () => {
    setSelectedId('new');
    setSlug('');
    setCategory('team');
    setSeason('');
    setStatus('published');
    setEventDate('');
    setTranslations(defaultTranslations());
    setActiveLang('de');
    setError(null);
    setSuccess(null);
  };

  const selectAlbum = async (albumId: string | 'new') => {
    if (albumId === 'new') {
      resetForm();
      return;
    }

    const album = albums.find((a) => a.id === albumId);
    if (!album) return;

    setSelectedId(album.id);
    setSlug(album.slug);
    setCategory(album.category);
    setSeason(album.season ?? '');
    setStatus(album.status);
    setEventDate(album.event_date ?? '');
    setError(null);
    setSuccess(null);

    await loadTranslationsForAlbum(album.id);
  };

  const handleTranslationChange = (
    lang: LanguageCode,
    field: keyof TranslationFormState,
    value: string,
  ) => {
    setTranslations((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const slugTrimmed = slug.trim();

      const firstTitle = LANGUAGES.map((lang) => translations[lang].title.trim()).find(Boolean) || slugTrimmed || 'album';

      const nextSlugRaw = slugTrimmed || generateSlug(firstTitle);
      const nextSlug = nextSlugRaw || `album-${Date.now()}`;

      let albumId = selectedId !== 'new' ? selectedId : undefined;

      if (!albumId) {
        const { data, error: insertError } = await supabase
          .from('gallery_albums')
          .insert({
            slug: nextSlug,
            category,
            season: season || null,
            status,
            event_date: eventDate || null,
          })
          .select('id')
          .single();

        if (insertError || !data) {
          throw new Error(insertError?.message ?? 'Failed to create album');
        }

        albumId = (data as { id: string }).id;
        setAlbums((prev) => [
          {
            id: albumId!,
            slug: nextSlug,
            category,
            season: season || null,
            status,
            event_date: eventDate || null,
          },
          ...prev,
        ]);
      } else {
        const { error: updateError } = await supabase
          .from('gallery_albums')
          .update({
            slug: nextSlug,
            category,
            season: season || null,
            status,
            event_date: eventDate || null,
          })
          .eq('id', albumId);

        if (updateError) {
          throw new Error(updateError.message);
        }

        setAlbums((prev) =>
          prev.map((a) =>
            a.id === albumId
              ? {
                  ...a,
                  slug: nextSlug,
                  category,
                  season: season || null,
                  status,
                  event_date: eventDate || null,
                }
              : a,
          ),
        );
      }

      for (const lang of LANGUAGES) {
        const t = translations[lang];
        const hasContent = t.title.trim() || t.subtitle.trim() || t.description.trim();
        if (!hasContent) {
          continue;
        }

        const { data: existing, error: selectError } = await supabase
          .from('gallery_album_translations')
          .select('id')
          .eq('album_id', albumId)
          .eq('language', lang)
          .maybeSingle();

        if (selectError) {
          throw new Error(selectError.message);
        }

        if (existing) {
          const { error: updError } = await supabase
            .from('gallery_album_translations')
            .update({
              title: t.title.trim() || slug.trim(),
              subtitle: t.subtitle.trim() || null,
              description: t.description.trim() || null,
            })
            .eq('id', (existing as { id: string }).id);

          if (updError) {
            throw new Error(updError.message);
          }
        } else {
          const { error: insError } = await supabase
            .from('gallery_album_translations')
            .insert({
              album_id: albumId,
              language: lang,
              title: t.title.trim() || slug.trim(),
              subtitle: t.subtitle.trim() || null,
              description: t.description.trim() || null,
            });

          if (insError) {
            throw new Error(insError.message);
          }
        }
      }

      setSelectedId(albumId!);
      setSlug(nextSlug);
      setSuccess('Album saved successfully.');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to save album.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return {
    albums,
    selectedId,
    slug,
    category,
    season,
    status,
    eventDate,
    translations,
    activeLang,
    loading,
    saving,
    error,
    success,
    resetForm,
    selectAlbum,
    setSlug,
    setCategory,
    setSeason,
    setStatus,
    setEventDate,
    setActiveLang,
    handleTranslationChange,
    handleSubmit,
  };
};
