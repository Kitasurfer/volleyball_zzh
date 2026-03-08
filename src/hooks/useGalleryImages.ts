import { useEffect, useState } from 'react';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import type { Language } from '../types';

export type GalleryImage = {
  id: string;
  src: string;
  category: string;
  title: string;
  caption?: string | null;
  description?: string | null;
  albumId?: string | null;
  albumTitle?: string;
  albumSlug?: string;
  subalbumId?: string | null;
  subalbumTitle?: string | null;
  subalbumSlug?: string | null;
  eventDate?: string | null;
  createdAt?: string;
  isFeatured?: boolean;
  isBestOfTournament?: boolean;
};

export type GallerySubalbum = {
  id: string;
  albumId: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  eventDate: string | null;
  createdAt: string;
  sortOrder: number;
  imageCount: number;
  coverImage: GalleryImage | null;
  images: GalleryImage[];
};

export type GalleryAlbum = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  category: string;
  season?: string | null;
  eventDate: string | null;
  createdAt: string;
  imageCount: number;
  coverImage: GalleryImage | null;
  subalbums: GallerySubalbum[];
};

export type GalleryAlbumDetail = GalleryAlbum & {
  featuredPhotos: GalleryImage[];
  bestPhotos: GalleryImage[];
  popularSeedPhotos: GalleryImage[];
};

interface UseGalleryImagesResult {
  images: GalleryImage[];
  albums: GalleryAlbum[];
  albumDetails: GalleryAlbumDetail[];
  featuredImages: GalleryImage[];
  loading: boolean;
  error: string | null;
}

const FALLBACK_IMAGE_TITLE: Record<Language, string> = {
  de: 'Foto',
  en: 'Photo',
  ru: 'Фото',
  it: 'Foto',
};

const FALLBACK_ALBUM_TITLE: Record<Language, string> = {
  de: 'Album',
  en: 'Album',
  ru: 'Альбом',
  it: 'Album',
};

export const useGalleryImages = (): UseGalleryImagesResult => {
  const { language } = useLanguage();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [albumDetails, setAlbumDetails] = useState<GalleryAlbumDetail[]>([]);
  const [featuredImages, setFeaturedImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    type AlbumRow = {
      id: string;
      slug: string;
      category: string;
      season: string | null;
      status: string;
      event_date: string | null;
      created_at: string;
    };

    type AlbumTranslationRow = {
      album_id: string;
      language: string;
      title: string;
      subtitle: string | null;
      description: string | null;
    };

    type SubalbumRow = {
      id: string;
      album_id: string;
      slug: string;
      event_date: string | null;
      sort_order: number;
      status: string;
      created_at: string;
    };

    type SubalbumTranslationRow = {
      subalbum_id: string;
      language: string;
      title: string;
      subtitle: string | null;
      description: string | null;
    };

    type MediaRow = {
      id: string;
      album_id: string | null;
      subalbum_id: string | null;
      title: string | null;
      description: string | null;
      title_i18n: Record<string, string> | null;
      alt_text: Record<string, string> | null;
      caption_i18n: Record<string, string> | null;
      media_type: string;
      storage_path: string;
      language: string | null;
      is_featured_gallery: boolean | null;
      is_best_of_tournament: boolean | null;
      created_at: string;
    };

    const load = async () => {
      setLoading(true);
      setError(null);

      if (!hasSupabaseConfig || !supabase) {
        setImages([]);
        setAlbums([]);
        setAlbumDetails([]);
        setFeaturedImages([]);
        setError('Gallery is unavailable locally because Supabase is not configured.');
        setLoading(false);
        return;
      }

      const { data: albumData, error: albumsError } = await supabase
        .from('gallery_albums')
        .select('id, slug, category, season, status, event_date, created_at')
        .eq('status', 'published')
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (albumsError) {
        setError(albumsError.message);
        setImages([]);
        setAlbums([]);
        setAlbumDetails([]);
        setFeaturedImages([]);
        setLoading(false);
        return;
      }

      const albumRows = (albumData as AlbumRow[] | null) ?? [];
      const albumIds = albumRows.map((item) => item.id);

      if (albumIds.length === 0) {
        setImages([]);
        setAlbums([]);
        setAlbumDetails([]);
        setFeaturedImages([]);
        setLoading(false);
        return;
      }

      const albumTitleById: Record<string, string> = {};
      const albumSubtitleById: Record<string, string> = {};
      const albumDescriptionById: Record<string, string> = {};

      const { data: albumTranslationData, error: albumTranslationsError } = await supabase
        .from('gallery_album_translations')
        .select('album_id, language, title, subtitle, description')
        .in('album_id', albumIds)
        .eq('language', language);

      if (cancelled) return;

      if (albumTranslationsError) {
        setError(albumTranslationsError.message);
        setImages([]);
        setAlbums([]);
        setAlbumDetails([]);
        setFeaturedImages([]);
        setLoading(false);
        return;
      }

      (albumTranslationData as AlbumTranslationRow[] | null)?.forEach((row) => {
        if (!albumTitleById[row.album_id]) {
          albumTitleById[row.album_id] = row.title;
        }
        if (!albumSubtitleById[row.album_id] && row.subtitle) {
          albumSubtitleById[row.album_id] = row.subtitle;
        }
        if (!albumDescriptionById[row.album_id] && row.description) {
          albumDescriptionById[row.album_id] = row.description;
        }
      });

      const { data: subalbumData, error: subalbumsError } = await supabase
        .from('gallery_subalbums')
        .select('id, album_id, slug, event_date, sort_order, status, created_at')
        .in('album_id', albumIds)
        .eq('status', 'published')
        .order('sort_order', { ascending: true })
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (subalbumsError) {
        setError(subalbumsError.message);
        setImages([]);
        setAlbums([]);
        setAlbumDetails([]);
        setFeaturedImages([]);
        setLoading(false);
        return;
      }

      const subalbumRows = (subalbumData as SubalbumRow[] | null) ?? [];
      const subalbumIds = subalbumRows.map((item) => item.id);
      const subalbumTitleById: Record<string, string> = {};
      const subalbumSubtitleById: Record<string, string> = {};
      const subalbumDescriptionById: Record<string, string> = {};

      if (subalbumIds.length > 0) {
        const { data: subalbumTranslationData, error: subalbumTranslationsError } = await supabase
          .from('gallery_subalbum_translations')
          .select('subalbum_id, language, title, subtitle, description')
          .in('subalbum_id', subalbumIds)
          .eq('language', language);

        if (cancelled) return;

        if (subalbumTranslationsError) {
          setError(subalbumTranslationsError.message);
          setImages([]);
          setAlbums([]);
          setAlbumDetails([]);
          setFeaturedImages([]);
          setLoading(false);
          return;
        }

        (subalbumTranslationData as SubalbumTranslationRow[] | null)?.forEach((row) => {
          if (!subalbumTitleById[row.subalbum_id]) {
            subalbumTitleById[row.subalbum_id] = row.title;
          }
          if (!subalbumSubtitleById[row.subalbum_id] && row.subtitle) {
            subalbumSubtitleById[row.subalbum_id] = row.subtitle;
          }
          if (!subalbumDescriptionById[row.subalbum_id] && row.description) {
            subalbumDescriptionById[row.subalbum_id] = row.description;
          }
        });
      }

      const { data: mediaData, error: mediaError } = await supabase
        .from('media_assets')
        .select('id, album_id, subalbum_id, title, description, title_i18n, alt_text, caption_i18n, media_type, storage_path, language, is_featured_gallery, is_best_of_tournament, created_at')
        .in('album_id', albumIds)
        .eq('media_type', 'image')
        .order('album_id', { ascending: true })
        .order('subalbum_id', { ascending: true })
        .order('order_position', { ascending: true })
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (mediaError) {
        setError(mediaError.message);
        setImages([]);
        setAlbums([]);
        setAlbumDetails([]);
        setFeaturedImages([]);
        setLoading(false);
        return;
      }

      const mediaRows = (mediaData as MediaRow[] | null) ?? [];

      if (mediaRows.length === 0) {
        setImages([]);
        setAlbums([]);
        setAlbumDetails([]);
        setFeaturedImages([]);
        setLoading(false);
        return;
      }

      const bucketPrefix = 'media-public/';
      const signedUrls: Record<string, string> = {};
      const bucketRows = mediaRows.filter((row) => row.storage_path.startsWith(bucketPrefix));
      const bucketPaths = bucketRows.map((row) => row.storage_path.slice(bucketPrefix.length));

      if (bucketPaths.length > 0) {
        const signed = await supabase.storage.from('media-public').createSignedUrls(bucketPaths, 60 * 60);

        if (!signed.error && signed.data) {
          signed.data.forEach((item, index) => {
            const key = bucketRows[index]?.storage_path;
            if (key) {
              signedUrls[key] = item.signedUrl;
            }
          });
        }
      }

      const imagesByAlbum: Record<string, GalleryImage[]> = {};
      const imagesBySubalbum: Record<string, GalleryImage[]> = {};

      const nextImages: GalleryImage[] = mediaRows.map((row) => {
        const album = albumRows.find((item) => item.id === row.album_id);
        const subalbum = subalbumRows.find((item) => item.id === row.subalbum_id);
        const category = album?.category ?? 'other';

        const i18nTitle =
          row.title_i18n && typeof row.title_i18n === 'object'
            ? (row.title_i18n as Record<string, string>)[language]
            : undefined;

        const i18nCaption =
          row.caption_i18n && typeof row.caption_i18n === 'object'
            ? (row.caption_i18n as Record<string, string>)[language]
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

        const albumTitle =
          fallbackAlbumTitle ||
          album?.slug ||
          (FALLBACK_ALBUM_TITLE[language as Language] ?? FALLBACK_ALBUM_TITLE.ru);

        const fallbackSubalbumTitle = row.subalbum_id ? subalbumTitleById[row.subalbum_id] : undefined;
        const subalbumTitle = fallbackSubalbumTitle || subalbum?.slug || albumTitle;

        const src = row.storage_path.startsWith(bucketPrefix)
          ? signedUrls[row.storage_path] ?? row.storage_path
          : row.storage_path;

        const image: GalleryImage = {
          id: row.id,
          src,
          category,
          title: baseTitle,
          caption: i18nCaption || row.description || i18nAlt || row.title || null,
          description: row.description ?? null,
          albumId: row.album_id,
          albumTitle: row.album_id ? albumTitle : undefined,
          albumSlug: album?.slug,
          subalbumId: row.subalbum_id,
          subalbumTitle: row.subalbum_id ? subalbumTitle : null,
          subalbumSlug: subalbum?.slug ?? null,
          eventDate: subalbum?.event_date ?? album?.event_date ?? null,
          createdAt: row.created_at,
          isFeatured: Boolean(row.is_featured_gallery),
          isBestOfTournament: Boolean(row.is_best_of_tournament),
        };

        if (row.album_id) {
          if (!imagesByAlbum[row.album_id]) {
            imagesByAlbum[row.album_id] = [];
          }
          imagesByAlbum[row.album_id].push(image);
        }

        if (row.subalbum_id) {
          if (!imagesBySubalbum[row.subalbum_id]) {
            imagesBySubalbum[row.subalbum_id] = [];
          }
          imagesBySubalbum[row.subalbum_id].push(image);
        }

        return image;
      });

      const subalbumsByAlbum: Record<string, GallerySubalbum[]> = {};

      subalbumRows.forEach((subalbum) => {
        const subalbumImages = imagesBySubalbum[subalbum.id] ?? [];
        const album = albumRows.find((item) => item.id === subalbum.album_id);
        const fallbackAlbumTitle = album ? albumTitleById[album.id] || album.slug : null;

        const title =
          subalbumTitleById[subalbum.id] ||
          subalbum.slug ||
          fallbackAlbumTitle ||
          (FALLBACK_ALBUM_TITLE[language as Language] ?? FALLBACK_ALBUM_TITLE.ru);

        const nextSubalbum: GallerySubalbum = {
          id: subalbum.id,
          albumId: subalbum.album_id,
          slug: subalbum.slug,
          title,
          subtitle: subalbumSubtitleById[subalbum.id] ?? null,
          description: subalbumDescriptionById[subalbum.id] ?? null,
          eventDate: subalbum.event_date,
          createdAt: subalbum.created_at,
          sortOrder: subalbum.sort_order,
          imageCount: subalbumImages.length,
          coverImage: subalbumImages[0] ?? null,
          images: subalbumImages,
        };

        if (!subalbumsByAlbum[subalbum.album_id]) {
          subalbumsByAlbum[subalbum.album_id] = [];
        }
        subalbumsByAlbum[subalbum.album_id].push(nextSubalbum);
      });

      const nextAlbums = albumRows
        .map((album) => {
          const albumImages = imagesByAlbum[album.id] ?? [];
          if (!albumImages.length) return null;

          const title =
            albumTitleById[album.id] ||
            album.slug ||
            (FALLBACK_ALBUM_TITLE[language as Language] ?? FALLBACK_ALBUM_TITLE.ru);

          return {
            id: album.id,
            slug: album.slug,
            title,
            subtitle: albumSubtitleById[album.id] ?? null,
            description: albumDescriptionById[album.id] ?? null,
            category: album.category,
            season: album.season,
            eventDate: album.event_date,
            createdAt: album.created_at,
            imageCount: albumImages.length,
            coverImage: albumImages[0] ?? null,
            subalbums: (subalbumsByAlbum[album.id] ?? []).filter((subalbum) => subalbum.imageCount > 0),
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

      const nextFeaturedImages = sortedAlbums
        .map((album) => album.coverImage)
        .filter((image): image is GalleryImage => Boolean(image))
        .slice(0, 6);

      const nextAlbumDetails: GalleryAlbumDetail[] = sortedAlbums.map((album) => {
        const albumImages = imagesByAlbum[album.id] ?? [];

        return {
          ...album,
          featuredPhotos: albumImages.filter((image) => image.isFeatured).slice(0, 8),
          bestPhotos: albumImages.filter((image) => image.isBestOfTournament).slice(0, 12),
          popularSeedPhotos: [...albumImages]
            .sort((a, b) => {
              const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return bTime - aTime;
            })
            .slice(0, 12),
        };
      });

      if (cancelled) return;

      setImages(nextImages);
      setAlbums(sortedAlbums);
      setAlbumDetails(nextAlbumDetails);
      setFeaturedImages(nextFeaturedImages);
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [language]);

  return { images, albums, albumDetails, featuredImages, loading, error };
};
