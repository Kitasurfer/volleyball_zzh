import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import type { Language } from '../types';

export type TrainingVideo = {
  id: string;
  src: string;
  title: string;
  description?: string;
  embedUrl?: string;
};

interface UseTrainingVideosResult {
  videos: TrainingVideo[];
  loading: boolean;
  error: string | null;
}

const getYoutubeEmbedUrl = (url: string): string | null => {
  const lower = url.toLowerCase();

  if (!lower.includes('youtube.com') && !lower.includes('youtu.be')) {
    return null;
  }

  const shortsMatch = url.match(/youtube\.com\/shorts\/([^?&#/]+)/i);
  if (shortsMatch && shortsMatch[1]) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}`;
  }

  const watchMatch = url.match(/[?&]v=([^?&#/]+)/i);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  const youtuMatch = url.match(/youtu\.be\/([^?&#/]+)/i);
  if (youtuMatch && youtuMatch[1]) {
    return `https://www.youtube.com/embed/${youtuMatch[1]}`;
  }

  return null;
};

const FEATURED_SHORTS: {
  id: string;
  url: string;
  titles: Record<Language, string>;
  descriptions: Record<Language, string>;
}[] = [
  {
    id: 'featured-short-1',
    url: 'https://youtube.com/shorts/rOlMTITjWHk?si=P8jYu779x7-bN7sI',
    titles: {
      de: 'Kurzes Drill: Angriff & Block',
      en: 'Short drill: attack & block',
      ru: 'Короткий дрилл: атака и блок',
    },
    descriptions: {
      de: 'Spielnahes Technik-Drill mit Fokus auf Angriff und Block.',
      en: 'Game-like technical drill focusing on attack and block.',
      ru: 'Игровой технический дрилл с фокусом на атаку и блок.',
    },
  },
  {
    id: 'featured-short-2',
    url: 'https://youtube.com/shorts/6NmHfM9XWXU?si=mQYEDt3NR2qOFaY_',
    titles: {
      de: 'Kurzes Drill: Annahme & Defense',
      en: 'Short drill: reception & defense',
      ru: 'Короткий дрилл: приём и защита',
    },
    descriptions: {
      de: 'Kurze Sequenz mit Fokus auf Annahme und Verteidigung.',
      en: 'Short sequence focusing on serve receive and defense.',
      ru: 'Короткая серия с акцентом на приём подачи и защиту.',
    },
  },
];

const getFeaturedTrainingVideos = (language: Language): TrainingVideo[] =>
  FEATURED_SHORTS.map((short) => {
    const embedUrl = getYoutubeEmbedUrl(short.url) ?? undefined;

    return {
      id: short.id,
      src: short.url,
      title: short.titles[language],
      description: short.descriptions[language],
      embedUrl,
    };
  });

export const useTrainingVideos = (): UseTrainingVideosResult => {
  const { language } = useLanguage();
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    type AlbumRow = {
      id: string;
      slug: string;
      category: string;
      status: string;
      created_at: string;
    };

    type MediaRow = {
      id: string;
      album_id: string | null;
      title: string | null;
      title_i18n: Record<string, string> | null;
      alt_text: Record<string, string> | null;
      description: string | null;
      media_type: string;
      storage_path: string;
      language: string | null;
      created_at: string;
    };

    const loadVideos = async () => {
      setLoading(true);
      setError(null);

      const featuredVideos = getFeaturedTrainingVideos(language as Language);

      const { data: albumData, error: albumsError } = await supabase
        .from('gallery_albums')
        .select('id, slug, category, status, created_at')
        .eq('category', 'training')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (albumsError) {
        setError(albumsError.message);
        setVideos([]);
        setLoading(false);
        return;
      }

      const albums = (albumData as AlbumRow[] | null) ?? [];
      const albumIds = albums.map((a) => a.id);

      if (albumIds.length === 0) {
        setVideos(featuredVideos);
        setLoading(false);
        return;
      }

      const { data: mediaData, error: mediaError } = await supabase
        .from('media_assets')
        .select(
          'id, album_id, title, title_i18n, alt_text, description, media_type, storage_path, language, created_at',
        )
        .in('album_id', albumIds)
        .eq('media_type', 'video')
        .order('album_id', { ascending: true })
        .order('order_position', { ascending: true })
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (mediaError) {
        setError(mediaError.message);
        setVideos([]);
        setLoading(false);
        return;
      }

      const rows = (mediaData as MediaRow[] | null) ?? [];

      if (rows.length === 0) {
        setVideos(featuredVideos);
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

      const nextVideos: TrainingVideo[] = rows.map((row) => {
        const album = albums.find((a) => a.id === row.album_id);

        const i18nTitle =
          row.title_i18n && typeof row.title_i18n === 'object'
            ? (row.title_i18n as Record<string, string>)[language]
            : undefined;

        const i18nAlt =
          row.alt_text && typeof row.alt_text === 'object'
            ? (row.alt_text as Record<string, string>)[language]
            : undefined;

        const baseTitle =
          i18nTitle ||
          i18nAlt ||
          row.title ||
          album?.slug ||
          (language === 'de'
            ? 'Training-Video'
            : language === 'en'
            ? 'Training video'
            : 'Тренировочное видео');

        const storagePath = row.storage_path;
        const isBucketPath = storagePath.startsWith(bucketPrefix);
        const rawUrl = isBucketPath ? signedUrls[storagePath] ?? storagePath : storagePath;
        const embedUrl = getYoutubeEmbedUrl(rawUrl);

        return {
          id: row.id,
          src: rawUrl,
          title: baseTitle,
          description: row.description ?? undefined,
          embedUrl: embedUrl ?? undefined,
        };
      });

      const combined = [...featuredVideos, ...nextVideos];
      const seen = new Set<string>();
      const uniqueVideos: TrainingVideo[] = [];

      combined.forEach((video) => {
        const key = video.embedUrl || video.src;
        if (seen.has(key)) return;
        seen.add(key);
        uniqueVideos.push(video);
      });

      setVideos(uniqueVideos);
      setLoading(false);
    };

    loadVideos();

    return () => {
      cancelled = true;
    };
  }, [language]);

  return { videos, loading, error };
};
