import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import type { Language } from '../types';

export type GalleryImage = {
  id: string;
  src: string;
  category: string;
  title: string;
  albumId?: string | null;
  albumTitle?: string;
  eventDate?: string | null;
};

export type GalleryAlbum = {
  id: string;
  slug: string;
  title: string;
  category: string;
  eventDate: string | null;
  createdAt: string;
  imageCount: number;
  coverImage: GalleryImage | null;
};

interface UseGalleryImagesResult {
  images: GalleryImage[];
  albums: GalleryAlbum[];
  featuredImages: GalleryImage[];
  loading: boolean;
  error: string | null;
}

const FALLBACK_IMAGE_TITLE: Record<Language, string> = {
  de: 'Foto',
  en: 'Photo',
  ru: 'Фото',
};

const FALLBACK_ALBUM_TITLE: Record<Language, string> = {
  de: 'Album',
  en: 'Album',
  ru: 'Альбом',
};

export const useGalleryImages = (): UseGalleryImagesResult => {
  const { language } = useLanguage();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [albumsState, setAlbumsState] = useState<GalleryAlbum[]>([]);
  const [featuredImages, setFeaturedImages] = useState<GalleryImage[]>([]);
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
        setAlbumsState([]);
        setFeaturedImages([]);
        setLoading(false);
        return;
      }

      const albumRows = (albumData as AlbumRow[] | null) ?? [];
      const albumIds = albumRows.map((a) => a.id);

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
        setAlbumsState([]);
        setFeaturedImages([]);
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
        setAlbumsState([]);
        setFeaturedImages([]);
        setLoading(false);
        return;
      }

      const rows = (mediaData as MediaRow[] | null) ?? [];

      if (rows.length === 0) {
        setImages([]);
        setAlbumsState([]);
        setFeaturedImages([]);
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

      const imagesByAlbum: Record<string, GalleryImage[]> = {};

      const nextImages: GalleryImage[] = rows.map((row) => {
        const album = albumRows.find((a) => a.id === row.album_id);
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

        const fallbackTitle =
          FALLBACK_IMAGE_TITLE[language as Language] ?? FALLBACK_IMAGE_TITLE.ru;

        const baseTitle =
          i18nTitle ||
          i18nAlt ||
          row.title ||
          fallbackAlbumTitle ||
          album?.slug ||
          fallbackTitle;

        const storagePath = row.storage_path;
        const isBucketPath = storagePath.startsWith(bucketPrefix);
        const src = isBucketPath ? signedUrls[storagePath] ?? storagePath : storagePath;

        const eventDate = album?.event_date ?? null;
        const albumTitle =
          fallbackAlbumTitle ||
          album?.slug ||
          (FALLBACK_ALBUM_TITLE[language as Language] ?? FALLBACK_ALBUM_TITLE.ru);

        const image: GalleryImage = {
          id: row.id,
          src,
          category,
          title: baseTitle,
          albumId: row.album_id,
          albumTitle: row.album_id ? albumTitle : undefined,
          eventDate,
        };

        if (row.album_id) {
          if (!imagesByAlbum[row.album_id]) {
            imagesByAlbum[row.album_id] = [];
          }
          imagesByAlbum[row.album_id].push(image);
        }

        return image;
      });

      const nextAlbums: GalleryAlbum[] = albumRows
        .map((album) => {
          const albumImages = imagesByAlbum[album.id] ?? [];
          if (!albumImages.length) {
            return null;
          }

          const title =
            albumTitleById[album.id] ||
            album.slug ||
            (FALLBACK_ALBUM_TITLE[language as Language] ?? FALLBACK_ALBUM_TITLE.ru);

          return {
            id: album.id,
            slug: album.slug,
            title,
            category: album.category,
            eventDate: album.event_date,
            createdAt: album.created_at,
            imageCount: albumImages.length,
            coverImage: albumImages[0] ?? null,
          } as GalleryAlbum;
        })
        .filter((album): album is GalleryAlbum => Boolean(album));

      const sortedAlbums = [...nextAlbums].sort((a, b) => {
        if (a.eventDate && b.eventDate) {
          return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
        }
        if (a.eventDate && !b.eventDate) return -1;
        if (!a.eventDate && b.eventDate) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const featuredFromAlbums: GalleryImage[] = [];
      for (const album of sortedAlbums) {
        if (album.coverImage) {
          featuredFromAlbums.push(album.coverImage);
        }
      }

      const MAX_FEATURED = 6;
      const nextFeaturedImages = featuredFromAlbums.slice(0, MAX_FEATURED);

      setImages(nextImages);
      setAlbumsState(sortedAlbums);
      setFeaturedImages(nextFeaturedImages);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [language]);

  return { images, albums: albumsState, featuredImages, loading, error };
};
