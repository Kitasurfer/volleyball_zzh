import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';

export type GalleryImage = {
  src: string;
  category: string;
  title: string;
};

interface UseGalleryImagesResult {
  images: GalleryImage[];
  loading: boolean;
  error: string | null;
}

export const useGalleryImages = (): UseGalleryImagesResult => {
  const { language } = useLanguage();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    type AlbumRow = {
      id: string;
      slug: string;
      category: string;
      status: string;
      event_date: string | null;
      created_at: string;
    };

    type AlbumTranslationRow = {
      album_id: string;
      language: string;
      title: string;
    };

    type MediaRow = {
      id: string;
      album_id: string | null;
      title: string | null;
      title_i18n: Record<string, string> | null;
      alt_text: Record<string, string> | null;
      media_type: string;
      storage_path: string;
      language: string | null;
      created_at: string;
    };

    const load = async () => {
      setLoading(true);
      setError(null);

      const { data: albumData, error: albumsError } = await supabase
        .from('gallery_albums')
        .select('id, slug, category, status, event_date, created_at')
        .eq('status', 'published')
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (albumsError) {
        setError(albumsError.message);
        setImages([]);
        setLoading(false);
        return;
      }

      const albums = (albumData as AlbumRow[] | null) ?? [];
      const albumIds = albums.map((a) => a.id);

      const albumTitleById: Record<string, string> = {};
      if (albumIds.length > 0) {
        const { data: translationData, error: translationsError } = await supabase
          .from('gallery_album_translations')
          .select('album_id, language, title')
          .in('album_id', albumIds)
          .eq('language', language);

        if (!translationsError && translationData) {
          (translationData as AlbumTranslationRow[]).forEach((row) => {
            if (!albumTitleById[row.album_id]) {
              albumTitleById[row.album_id] = row.title;
            }
          });
        }
      }

      if (albumIds.length === 0) {
        setImages([]);
        setLoading(false);
        return;
      }

      const { data: mediaData, error: mediaError } = await supabase
        .from('media_assets')
        .select('id, album_id, title, title_i18n, alt_text, media_type, storage_path, language, created_at')
        .in('album_id', albumIds)
        .in('media_type', ['image'])
        .order('album_id', { ascending: true })
        .order('order_position', { ascending: true })
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (mediaError) {
        setError(mediaError.message);
        setImages([]);
        setLoading(false);
        return;
      }

      const rows = (mediaData as MediaRow[] | null) ?? [];

      if (rows.length === 0) {
        setImages([]);
        setLoading(false);
        return;
      }

      const bucketPrefix = 'media-public/';
      const signedUrls: Record<string, string> = {};

      const bucketRows = rows.filter((row) => row.storage_path.startsWith(bucketPrefix));
      const paths = bucketRows.map((row) => row.storage_path.slice(bucketPrefix.length));

      if (paths.length) {
        const { data: urlData, error: signedError } = await supabase.storage
          .from('media-public')
          .createSignedUrls(paths, 60 * 60);

        if (!signedError && urlData) {
          urlData.forEach((item, index) => {
            const key = bucketRows[index].storage_path;
            signedUrls[key] = item.signedUrl;
          });
        }
      }

      if (cancelled) return;

      const nextImages: GalleryImage[] = rows.map((row) => {
        const album = albums.find((a) => a.id === row.album_id);
        const category = album?.category ?? 'other';

        const i18nTitle =
          row.title_i18n && typeof row.title_i18n === 'object'
            ? (row.title_i18n as Record<string, string>)[language]
            : undefined;

        const i18nAlt =
          row.alt_text && typeof row.alt_text === 'object'
            ? (row.alt_text as Record<string, string>)[language]
            : undefined;

        const fallbackAlbumTitle = row.album_id ? albumTitleById[row.album_id] : undefined;

        const baseTitle =
          i18nTitle ||
          i18nAlt ||
          row.title ||
          fallbackAlbumTitle ||
          album?.slug ||
          (language === 'de'
            ? 'Foto'
            : language === 'en'
            ? 'Photo'
            : 'Фото');

        const storagePath = row.storage_path;
        const isBucketPath = storagePath.startsWith(bucketPrefix);
        const src = isBucketPath ? signedUrls[storagePath] ?? storagePath : storagePath;

        return {
          src,
          category,
          title: baseTitle,
        };
      });

      setImages(nextImages);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [language]);

  return { images, loading, error };
};
