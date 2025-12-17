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
      it: 'Drill breve: attacco e muro',
    },
    descriptions: {
      de: 'Spielnahes Technik-Drill mit Fokus auf Angriff und Block.',
      en: 'Game-like technical drill focusing on attack and block.',
      ru: 'Игровой технический дрилл с фокусом на атаку и блок.',
      it: 'Drill tecnico in situazione di gioco con focus su attacco e muro.',
    },
  },
  {
    id: 'featured-short-2',
    url: 'https://youtube.com/shorts/6NmHfM9XWXU?si=mQYEDt3NR2qOFaY_',
    titles: {
      de: 'Kurzes Drill: Annahme & Defense',
      en: 'Short drill: reception & defense',
      ru: 'Короткий дрилл: приём и защита',
      it: 'Drill breve: ricezione e difesa',
    },
    descriptions: {
      de: 'Kurze Sequenz mit Fokus auf Annahme und Verteidigung.',
      en: 'Short sequence focusing on serve receive and defense.',
      ru: 'Короткая серия с акцентом на приём подачи и защиту.',
      it: 'Sequenza breve con focus su ricezione del servizio e difesa.',
    },
  },
  {
    id: 'featured-video-1',
    url: 'https://youtu.be/cZFjFK3Pf7c?si=XY15-b3TyORgp4gN',
    titles: {
      de: 'Beachvolleyball-Regeln erklärt',
      en: 'Beach Volleyball Rules Explained',
      ru: 'Правила пляжного волейбола',
      it: 'Regole del beach volley spiegate',
    },
    descriptions: {
      de: 'Video-Erklärung der wichtigsten Beachvolleyball-Regeln für Spieler und Zuschauer.',
      en: 'Video explanation of the key beach volleyball rules for players and spectators.',
      ru: 'Видео-объяснение основных правил пляжного волейбола для игроков и зрителей.',
      it: 'Video che spiega le principali regole del beach volley per giocatori e spettatori.',
    },
  },
  {
    id: 'featured-video-2',
    url: 'https://www.youtube.com/watch?v=7QmFbAVC5Y4',
    titles: {
      de: 'Änderungen der Volleyballregeln 2025',
      en: 'Volleyball Rule Changes 2025',
      ru: 'Изменения правил волейбола 2025',
      it: 'Cambiamenti delle regole di pallavolo 2025',
    },
    descriptions: {
      de: 'Übersicht über neue und geänderte Volleyballregeln ab der Saison 2025.',
      en: 'Overview of new and changed volleyball rules starting in the 2025 season.',
      ru: 'Обзор новых и изменённых правил волейбола, которые вступают в силу с сезона 2025.',
      it: 'Panoramica delle nuove regole e delle modifiche a partire dalla stagione 2025.',
    },
  },
  {
    id: 'featured-video-3',
    url: 'https://www.youtube.com/watch?v=2tj8qe9pc38',
    titles: {
      de: 'Was die neuen Volleyballregeln bedeuten',
      en: 'What to Expect from the New Volleyball Rules',
      ru: 'Чего ждать от новых правил волейбола',
      it: 'Cosa aspettarsi dalle nuove regole di pallavolo',
    },
    descriptions: {
      de: 'Erklärung, wie sich die neuen FIVB-Regeln auf Spielstil und Taktik auswirken.',
      en: 'Explains how the new FIVB rules will affect playing style and tactics.',
      ru: 'Объяснение того, как новые правила FIVB повлияют на стиль игры и тактику.',
      it: 'Spiega come le nuove regole FIVB influenzeranno stile di gioco e tattica.',
    },
  },
];

const FALLBACK_TRAINING_VIDEO_TITLE: Record<Language, string> = {
  de: 'Training-Video',
  en: 'Training video',
  ru: 'Тренировочное видео',
  it: 'Video di allenamento',
};

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

        const fallbackTitle =
          FALLBACK_TRAINING_VIDEO_TITLE[language as Language] ??
          FALLBACK_TRAINING_VIDEO_TITLE.ru;

        const baseTitle =
          i18nTitle ||
          i18nAlt ||
          row.title ||
          album?.slug ||
          fallbackTitle;

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
