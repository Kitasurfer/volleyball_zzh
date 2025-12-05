import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import type { GalleryImage } from '../hooks/useGalleryImages';
import { useGalleryImages } from '../hooks/useGalleryImages';
import GalleryFilters from '../components/gallery/GalleryFilters';
import GalleryAlbumGrid from '../components/gallery/GalleryAlbumGrid';
import GalleryLightbox from '../components/gallery/GalleryLightbox';

const GalleryPage: React.FC = () => {
  const { language } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { images, albums, loading, error } = useGalleryImages();
  const [activeImages, setActiveImages] = useState<GalleryImage[]>([]);

  const content = {
    de: {
      filters: {
        all: 'Alle',
        spieltage: 'Spieltage',
        events: 'Events',
        beach: 'Beach',
        training: 'Training',
      },
      eventLabel: 'Event',
      photosLabel: 'Fotos',
      loading: 'Galerie wird geladen…',
      errorPrefix: 'Fehler beim Laden der Galerie:',
      empty: 'Noch keine Bilder in der Galerie.',
      navigationHelp:
        'Nutzen Sie die Pfeiltasten oder Buttons, um durch die Galerie zu navigieren.',
    },
    en: {
      filters: {
        all: 'All',
        spieltage: 'Spieltage',
        events: 'Events',
        beach: 'Beach',
        training: 'Training',
      },
      eventLabel: 'Event',
      photosLabel: 'Photos',
      loading: 'Loading gallery…',
      errorPrefix: 'Failed to load gallery:',
      empty: 'No images in the gallery yet.',
      navigationHelp:
        'Use the arrow keys or buttons to navigate the gallery.',
    },
    ru: {
      filters: {
        all: 'Все',
        spieltage: 'Spieltage',
        events: 'События',
        beach: 'Пляж',
        training: 'Тренировки',
      },
      eventLabel: 'Событие',
      photosLabel: 'Фото',
      loading: 'Загружаем галерею…',
      errorPrefix: 'Ошибка при загрузке галереи:',
      empty: 'В галерее пока нет изображений.',
      navigationHelp:
        'Используйте стрелки или кнопки для навигации по галерее.',
    },
  };

  const t = content[language];

  const filteredAlbums = useMemo(
    () => (filter === 'all' ? albums : albums.filter((album) => album.category === filter)),
    [filter, albums],
  );

  useEffect(() => {
    if (!activeImages[currentIndex]) {
      setCurrentIndex(0);
    }
  }, [activeImages, currentIndex]);

  const handleAlbumOpen = useCallback(
    (albumId: string) => {
      const albumImages = images.filter((img) => img.albumId === albumId);
      if (!albumImages.length) return;
      setActiveImages(albumImages);
      setCurrentIndex(0);
      setIsDialogOpen(true);
    },
    [images],
  );

  const handleDialogChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
  }, []);

  const showPrevious = useCallback(() => {
    const total = activeImages.length;
    if (!total) return;
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  }, [activeImages.length]);

  const showNext = useCallback(() => {
    const total = activeImages.length;
    if (!total) return;
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  }, [activeImages.length]);

  useEffect(() => {
    if (!isDialogOpen) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showPrevious();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showNext();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isDialogOpen, showNext, showPrevious]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-950 via-primary-900/95 to-neutral-900 pt-20 pb-16 text-white">
      <div className="container mx-auto px-4 lg:px-8">
        <GalleryFilters filters={t.filters} activeFilter={filter} onFilterChange={setFilter} />

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center text-sm text-white/70">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent-400" />
              <span>{t.loading}</span>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-rose-400/60 bg-rose-900/40 p-4 text-sm text-rose-100">
            {`${t.errorPrefix} ${error}`}
          </div>
        ) : albums.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center text-sm text-white/70">
            {t.empty}
          </div>
        ) : (
          <GalleryAlbumGrid
            albums={filteredAlbums}
            eventLabel={t.eventLabel}
            photosLabel={t.photosLabel}
            onAlbumOpen={handleAlbumOpen}
          />
        )}
      </div>

      <GalleryLightbox
        open={isDialogOpen}
        images={activeImages}
        currentIndex={currentIndex}
        onOpenChange={handleDialogChange}
        onPrevious={showPrevious}
        onNext={showNext}
        navigationHelp={t.navigationHelp}
      />
    </div>
  );
};

export default GalleryPage;
