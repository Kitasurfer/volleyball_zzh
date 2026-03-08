import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, Share2, Star, Trophy, ArrowLeft, Camera, Calendar, Images } from 'lucide-react';
import { Seo } from '../components/Seo';
import GalleryLightbox from '../components/gallery/GalleryLightbox';
import { useGalleryImages, type GalleryImage } from '../hooks/useGalleryImages';
import { useGalleryImageEngagement } from '../hooks/useGalleryImageEngagement';
import { useLanguage } from '../lib/LanguageContext';

// Catches any string ending with an image extension (handles WhatsApp names with dots like 19.49.19)
const isFilenameLike = (s: string) =>
  /\.(?:jpg|jpeg|png|webp|gif|bmp|avif|heic)$/i.test(s.trim());

const CATEGORY_ACCENT: Record<string, string> = {
  spieltage: 'bg-amber-500',
  events: 'bg-sky-500',
  beach: 'bg-teal-500',
  training: 'bg-violet-500',
  action: 'bg-rose-500',
  other: 'bg-neutral-600',
};

const GalleryAlbumPage: React.FC = () => {
  const { albumSlug } = useParams<{ albumSlug: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { albumDetails, loading, error } = useGalleryImages();
  const album = useMemo(
    () => albumDetails.find((item) => item.slug === albumSlug),
    [albumDetails, albumSlug],
  );

  const allImages = useMemo(() => album?.subalbums.flatMap((s) => s.images) ?? [], [album]);
  const imageIds = useMemo(() => allImages.map((i) => i.id), [allImages]);
  const { likeCounts, likedImageIds, favoriteImageIds, toggleLike, toggleFavorite } =
    useGalleryImageEngagement(imageIds);

  const [selectedSubalbumId, setSelectedSubalbumId] = useState<string | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeImages, setActiveImages] = useState<GalleryImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const subalbumSectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const content = {
    de: {
      back: 'Zurück zur Galerie',
      loading: 'Album wird geladen…',
      notFound: 'Album nicht gefunden.',
      subalbums: 'Unteralben',
      allSubalbums: 'Alle Termine',
      photos: 'Fotos',
      season: 'Saison',
      bestOf: 'Highlights',
      popular: 'Beliebt',
      favorites: 'Meine Favoriten',
      topBadge: 'Top',
      featured: 'Featured',
      like: 'Like',
      unlike: 'Unlike',
      favorite: 'Favorit',
      unfavorite: 'Favorit entfernen',
      share: 'Teilen',
      download: 'Download',
      zoomIn: 'Vergrößern',
      zoomOut: 'Verkleinern',
      close: 'Schließen',
      openPhoto: 'Foto öffnen',
      photoCounter: 'Foto',
      untitledPhoto: 'Foto',
      noFavorites: 'Noch keine Favoriten — like ein Foto in der Vollansicht!',
      noPhotos: 'Noch keine Fotos.',
      navigationHelp: 'Pfeiltasten oder Wischen zum Navigieren.',
    },
    en: {
      back: 'Back to gallery',
      loading: 'Loading album…',
      notFound: 'Album not found.',
      subalbums: 'Subalbums',
      allSubalbums: 'All dates',
      photos: 'Photos',
      season: 'Season',
      bestOf: 'Highlights',
      popular: 'Popular',
      favorites: 'My favorites',
      topBadge: 'Top',
      featured: 'Featured',
      like: 'Like',
      unlike: 'Unlike',
      favorite: 'Favorite',
      unfavorite: 'Remove favorite',
      share: 'Share',
      download: 'Download',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      close: 'Close',
      openPhoto: 'Open photo',
      photoCounter: 'Photo',
      untitledPhoto: 'Photo',
      noFavorites: 'No favorites yet — like a photo in fullscreen!',
      noPhotos: 'No photos yet.',
      navigationHelp: 'Use arrow keys or swipe to navigate.',
    },
    ru: {
      back: 'Назад в галерею',
      loading: 'Загружаем альбом…',
      notFound: 'Альбом не найден.',
      subalbums: 'Подальбомы',
      allSubalbums: 'Все даты',
      photos: 'Фото',
      season: 'Сезон',
      bestOf: 'Лучшие моменты',
      popular: 'Популярное',
      favorites: 'Избранное',
      topBadge: 'Топ',
      featured: 'Рекомендуем',
      like: 'Лайк',
      unlike: 'Убрать лайк',
      favorite: 'В избранное',
      unfavorite: 'Убрать из избранного',
      share: 'Поделиться',
      download: 'Скачать',
      zoomIn: 'Увеличить',
      zoomOut: 'Уменьшить',
      close: 'Закрыть',
      openPhoto: 'Открыть фото',
      photoCounter: 'Фото',
      untitledPhoto: 'Фото',
      noFavorites: 'Пока нет — лайкни фото в полноэкранном режиме!',
      noPhotos: 'Фото пока нет.',
      navigationHelp: 'Стрелки или свайп для навигации.',
    },
    it: {
      back: 'Torna alla galleria',
      loading: 'Caricamento album…',
      notFound: 'Album non trovato.',
      subalbums: 'Sottoalbum',
      allSubalbums: 'Tutte le date',
      photos: 'Foto',
      season: 'Stagione',
      bestOf: 'Momenti salienti',
      popular: 'Popolari',
      favorites: 'I miei preferiti',
      topBadge: 'Top',
      featured: 'In evidenza',
      like: 'Mi piace',
      unlike: 'Rimuovi mi piace',
      favorite: 'Preferito',
      unfavorite: 'Rimuovi dai preferiti',
      share: 'Condividi',
      download: 'Scarica',
      zoomIn: 'Ingrandisci',
      zoomOut: 'Riduci',
      close: 'Chiudi',
      openPhoto: 'Apri foto',
      photoCounter: 'Foto',
      untitledPhoto: 'Foto',
      noFavorites: 'Ancora nessuno — metti mi piace in modalità schermo intero!',
      noPhotos: 'Nessuna foto ancora.',
      navigationHelp: 'Usa le frecce o scorri per navigare.',
    },
  } as const;

  const t = content[language];
  const dateLocale =
    language === 'ru' ? 'ru-RU'
    : language === 'it' ? 'it-IT'
    : language === 'en' ? 'en-GB'
    : 'de-DE';

  const subalbums = album?.subalbums ?? [];
  const visibleSubalbums =
    selectedSubalbumId === 'all'
      ? subalbums
      : subalbums.filter((s) => s.id === selectedSubalbumId);

  const scopedImages = useMemo(
    () => visibleSubalbums.flatMap((s) => s.images),
    [visibleSubalbums],
  );

  const scopedBestPhotos = useMemo(
    () => scopedImages.filter((img) => img.isBestOfTournament).slice(0, 12),
    [scopedImages],
  );

  const favorites = useMemo(
    () => scopedImages.filter((img) => favoriteImageIds.has(img.id)).slice(0, 12),
    [scopedImages, favoriteImageIds],
  );

  const popularPhotos = useMemo(
    () =>
      [...scopedImages]
        .sort((a, b) => (likeCounts[b.id] ?? 0) - (likeCounts[a.id] ?? 0))
        .filter((img) => (likeCounts[img.id] ?? 0) > 0)
        .slice(0, 12),
    [scopedImages, likeCounts],
  );

  const openLightbox = useCallback((images: GalleryImage[], index: number) => {
    setActiveImages(images);
    setCurrentIndex(index);
    setIsDialogOpen(true);
  }, []);

  const showPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? activeImages.length - 1 : prev - 1));
  }, [activeImages.length]);

  const showNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === activeImages.length - 1 ? 0 : prev + 1));
  }, [activeImages.length]);

  const handleShare = useCallback(
    async (image: GalleryImage) => {
      const url = `${window.location.origin}/gallery/${albumSlug}#${image.id}`;
      try {
        await navigator.clipboard.writeText(url);
        setShareMessage('✓ Link kopiert');
        window.setTimeout(() => setShareMessage(null), 2000);
      } catch {
        setShareMessage(url);
        window.setTimeout(() => setShareMessage(null), 4000);
      }
    },
    [albumSlug],
  );

  useEffect(() => {
    if (selectedSubalbumId === 'all') return;
    const node = subalbumSectionRefs.current[selectedSubalbumId];
    if (!node) return;

    const timeoutId = window.setTimeout(() => {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [selectedSubalbumId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080f1a] text-white/50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-accent-400" />
          <span className="text-sm">{t.loading}</span>
        </div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="min-h-screen bg-[#080f1a] pt-28 text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/gallery')}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.back}
          </button>
          <div className="rounded-xl border border-rose-500/30 bg-rose-900/20 p-4 text-rose-200">
            {error ?? t.notFound}
          </div>
        </div>
      </div>
    );
  }

  const categoryAccent = CATEGORY_ACCENT[album.category] ?? 'bg-neutral-600';

  const sectionShellClass = 'rounded-[28px] border border-white/8 bg-white/[0.04] p-5 shadow-[0_16px_50px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-6';

  /** Photo grid – image-first, clean, no filenames */
  const renderPhotoGrid = (sectionTitle: string, photos: GalleryImage[], showSectionTitle = true) => (
    <section className={showSectionTitle ? `${sectionShellClass} space-y-4` : 'space-y-4'}>
      {showSectionTitle && (
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white/90">{sectionTitle}</h3>
          <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-xs font-semibold text-white/45">
            {photos.length}
          </span>
        </div>
      )}
      {photos.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5 text-sm text-white/40">
          {t.noPhotos}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {photos.map((image, index) => {
            const isLiked = likedImageIds.has(image.id);
            const isFav = favoriteImageIds.has(image.id);
            const count = likeCounts[image.id] ?? 0;
            const rawImageTitle = image.title?.trim() ?? '';
            const safeImageTitle = rawImageTitle && !isFilenameLike(rawImageTitle) ? rawImageTitle : '';

            return (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-2xl border border-white/8 bg-[#060f1a] shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)]"
              >
                {/* Image – click opens lightbox */}
                <button
                  type="button"
                  onClick={() => openLightbox(photos, index)}
                  className="block w-full cursor-pointer"
                  aria-label={t.openPhoto}
                >
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={image.src}
                      alt={safeImageTitle || image.subalbumTitle || album.title || t.untitledPhoto}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                    />
                    {/* Hover veil */}
                    <div className="absolute inset-0 bg-black/0 transition-all duration-300 group-hover:bg-black/20" />

                    {/* Trophy / Featured badges */}
                    {image.isBestOfTournament && (
                      <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                        <Trophy className="h-3 w-3" />
                        {t.topBadge}
                      </span>
                    )}
                    {image.isFeatured && (
                      <span className="absolute left-2 top-10 flex items-center gap-1 rounded-full bg-sky-500/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                        <Star className="h-3 w-3" />
                        {t.featured}
                      </span>
                    )}

                    {/* Like count badge */}
                    {count > 0 && (
                      <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                        <Heart className="h-3 w-3 fill-rose-400 text-rose-400" />
                        {count}
                      </span>
                    )}
                  </div>
                </button>

                {/* Action bar – slides up on hover */}
                <div className="absolute inset-x-0 bottom-0 flex translate-y-0 items-center justify-between gap-1 bg-gradient-to-t from-black/85 to-black/40 px-2.5 py-2 backdrop-blur-sm transition-transform duration-300 sm:translate-y-full sm:group-hover:translate-y-0">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); void toggleLike(image.id); }}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${
                      isLiked
                        ? 'bg-rose-500 text-white'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                    aria-label={isLiked ? t.unlike : t.like}
                  >
                    <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
                    {count > 0 ? count : ''}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(image.id); }}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${
                      isFav
                        ? 'bg-amber-500 text-white'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                    aria-label={isFav ? t.unfavorite : t.favorite}
                  >
                    <Star className={`h-3.5 w-3.5 ${isFav ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); void handleShare(image); }}
                    className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/20"
                    aria-label={t.share}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-[#080f1a] pt-20 pb-16 text-white">
      <Seo
        title={`${album.title} – Gallery`}
        description={album.description ?? album.subtitle ?? album.title}
        imagePath={album.coverImage?.src}
      />

      {/* Hero banner */}
      <div className="relative mb-8 h-64 overflow-hidden border-b border-white/8 sm:h-80">
        {album.coverImage ? (
          <>
            <img
              src={album.coverImage.src}
              alt={album.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080f1a] via-[#080f1a]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#080f1a]/60 to-transparent" />
          </>
        ) : (
          <div className="h-full bg-[#0d1f35]" />
        )}

        {/* Album info over banner */}
        <div className="absolute inset-x-0 bottom-0 container mx-auto px-4 pb-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-3xl space-y-3 rounded-[24px] border border-white/10 bg-black/30 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-md sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/gallery')}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-semibold text-white/80 backdrop-blur-sm transition hover:bg-black/60"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t.back}
                </button>
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white ${categoryAccent}`}>
                  {album.category}
                </span>
                {album.season && (
                  <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] font-semibold text-white/60 backdrop-blur-sm">
                    {t.season} {album.season}
                  </span>
                )}
                {album.eventDate && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-[11px] font-semibold text-white/60 backdrop-blur-sm">
                    <Calendar className="h-3 w-3" />
                    {new Date(album.eventDate).toLocaleDateString(dateLocale, {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white drop-shadow sm:text-4xl">{album.title}</h1>
              {album.subtitle && <p className="max-w-2xl text-sm leading-6 text-white/70 sm:text-base">{album.subtitle}</p>}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/45 px-5 py-3 backdrop-blur-md">
              <div className="text-center">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/40">{t.subalbums}</div>
                <div className="mt-0.5 text-2xl font-bold text-white">{album.subalbums.length}</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <div className="text-xs font-semibold uppercase tracking-wider text-white/40">{t.photos}</div>
                <div className="mt-0.5 text-2xl font-bold text-white">{album.imageCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto space-y-10 px-4 lg:px-8">

        {/* Subalbum filter tabs */}
        {subalbums.length > 1 && (
          <section className={`${sectionShellClass} space-y-4`}>
            <h2 className="text-base font-semibold uppercase tracking-widest text-white/40">
              {t.subalbums}
            </h2>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedSubalbumId('all')}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                  selectedSubalbumId === 'all'
                    ? 'border-accent-400 bg-accent-400 text-primary-900 shadow-[0_0_18px_rgba(250,204,21,0.22)]'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/8 hover:text-white'
                }`}
              >
                {t.allSubalbums}
              </button>
              {subalbums.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSubalbumId(s.id)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                    selectedSubalbumId === s.id
                      ? 'border-accent-400/40 bg-white/12 text-white ring-1 ring-accent-400/20'
                      : 'border-white/10 bg-white/5 text-white/55 hover:border-white/20 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>

            {/* Subalbum cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subalbums.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSubalbumId(s.id)}
                  className={`group relative overflow-hidden rounded-2xl border bg-white/[0.03] text-left shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.3)] ${
                    selectedSubalbumId === s.id
                      ? 'border-accent-400/40 ring-1 ring-accent-400/20'
                      : 'border-white/8 hover:border-white/15'
                  }`}
                >
                  {s.coverImage ? (
                    <div className="relative aspect-[16/8] overflow-hidden bg-[#060f1a]">
                      <img
                        src={s.coverImage.src}
                        alt={s.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-white/50">
                          {s.eventDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(s.eventDate).toLocaleDateString(dateLocale, {
                                day: 'numeric', month: 'short',
                              })}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Camera className="h-3 w-3" />
                            {s.imageCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 bg-[#0d1f35] p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/8">
                        <Images className="h-5 w-5 text-white/40" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                        <span className="text-xs text-white/40">{s.imageCount} {t.photos}</span>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Highlights */}
        {scopedBestPhotos.length > 0 && renderPhotoGrid(t.bestOf, scopedBestPhotos)}

        {/* Popular (only if any liked) */}
        {popularPhotos.length > 0 && renderPhotoGrid(t.popular, popularPhotos)}

        {/* Favorites */}
        {favorites.length > 0 ? (
          renderPhotoGrid(t.favorites, favorites)
        ) : (
          <section className={`${sectionShellClass} space-y-2`}>
            <h3 className="text-lg font-semibold text-white/90">{t.favorites}</h3>
            <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 p-4 text-sm text-white/35">
              <Star className="h-5 w-5 shrink-0 text-amber-400/50" />
              {t.noFavorites}
            </div>
          </section>
        )}

        {/* Photos by subalbum */}
        {visibleSubalbums.map((s) => (
          <section
            key={s.id}
            id={s.slug}
            ref={(node) => {
              subalbumSectionRefs.current[s.id] = node;
            }}
            className={`${sectionShellClass} space-y-4`}
          >
            <div>
              <h2 className="text-xl font-semibold text-white">{s.title}</h2>
              {s.subtitle && <p className="mt-0.5 text-sm text-white/50">{s.subtitle}</p>}
            </div>
            {renderPhotoGrid(s.title, s.images, false)}
          </section>
        ))}
      </div>

      {/* Share toast */}
      {shareMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/90 px-5 py-2.5 text-sm font-semibold text-white shadow-2xl backdrop-blur-md ring-1 ring-white/10">
          {shareMessage}
        </div>
      )}

      <GalleryLightbox
        open={isDialogOpen}
        images={activeImages}
        currentIndex={currentIndex}
        onOpenChange={setIsDialogOpen}
        onPrevious={showPrevious}
        onNext={showNext}
        navigationHelp={t.navigationHelp}
        onLike={toggleLike}
        onFavorite={toggleFavorite}
        onShare={handleShare}
        likedImageIds={likedImageIds}
        favoriteImageIds={favoriteImageIds}
        likeCounts={likeCounts}
        labels={{
          close: t.close,
          download: t.download,
          zoomIn: t.zoomIn,
          zoomOut: t.zoomOut,
          share: t.share,
          like: t.like,
          unlike: t.unlike,
          favorite: t.favorite,
          unfavorite: t.unfavorite,
          featured: t.featured,
          bestOf: t.topBadge,
          photoCounter: t.photoCounter,
          untitled: t.untitledPhoto,
        }}
      />
    </div>
  );
};

export default GalleryAlbumPage;
