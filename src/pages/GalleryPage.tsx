import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useGalleryImages } from '../hooks/useGalleryImages';
import GalleryHero from '../components/gallery/GalleryHero';
import GalleryFilters from '../components/gallery/GalleryFilters';
import GalleryGrid from '../components/gallery/GalleryGrid';
import GalleryLightbox from '../components/gallery/GalleryLightbox';

const GalleryPage: React.FC = () => {
  const { language } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { images, loading, error } = useGalleryImages();

  const content = {
    de: {
      title: 'Galerie',
      filters: {
        all: 'Alle',
        team: 'Team',
        action: 'Action',
        beach: 'Beach',
        training: 'Training',
      },
    },
    en: {
      title: 'Gallery',
      filters: {
        all: 'All',
        team: 'Team',
        action: 'Action',
        beach: 'Beach',
        training: 'Training',
      },
    },
    ru: {
      title: 'Галерея',
      filters: {
        all: 'Все',
        team: 'Команда',
        action: 'Действие',
        beach: 'Пляж',
        training: 'Тренировки',
      },
    },
  };

  const t = content[language];

  const filteredImages = useMemo(() => {
    const baseList = filter === 'all' ? images : images.filter((img) => img.category === filter);
    return baseList;
  }, [filter, images]);

  useEffect(() => {
    if (!filteredImages[currentIndex]) {
      setCurrentIndex(0);
    }
  }, [filteredImages, currentIndex]);

  const handleImageOpen = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      setIsDialogOpen(true);
    },
    []
  );

  const handleDialogChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
  }, []);

  const showPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? filteredImages.length - 1 : prev - 1));
  }, [filteredImages.length]);

  const showNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === filteredImages.length - 1 ? 0 : prev + 1));
  }, [filteredImages.length]);

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

  const fullscreenLabel =
    language === 'de' ? 'Vollbild' : language === 'en' ? 'Fullscreen' : 'На весь экран';

  const navigationHelp =
    language === 'de'
      ? 'Nutzen Sie die Pfeiltasten oder Buttons, um durch die Galerie zu navigieren.'
      : language === 'en'
      ? 'Use the arrow keys or buttons to navigate the gallery.'
      : 'Используйте стрелки или кнопки для навигации по галерее.';

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-950 via-primary-900/95 to-neutral-900 pt-28 pb-24 text-white">
      <div className="container mx-auto px-6 lg:px-12">
        <GalleryHero
          title={t.title}
          description={
            language === 'de'
              ? 'Erleben Sie die Highlights unserer Volleyball-Community – von emotionalen Team-Momenten bis zu intensiven Trainingseinheiten.'
              : language === 'en'
              ? 'Experience the highlights of our volleyball community—from emotional team moments to intense training sessions.'
              : 'Погрузитесь в атмосферу нашей волейбольной команды — от эмоциональных командных моментов до интенсивных тренировок.'
          }
        />

        <GalleryFilters filters={t.filters} activeFilter={filter} onFilterChange={setFilter} />

        {loading ? (
          <div className="mt-14 flex min-h-[200px] items-center justify-center text-sm text-white/70">
            {language === 'de'
              ? 'Galerie wird geladen…'
              : language === 'en'
              ? 'Loading gallery…'
              : 'Загружаем галерею…'}
          </div>
        ) : error ? (
          <div className="mt-14 rounded-lg border border-rose-400/60 bg-rose-900/40 p-4 text-sm text-rose-100">
            {language === 'de'
              ? `Fehler beim Laden der Galerie: ${error}`
              : language === 'en'
              ? `Failed to load gallery: ${error}`
              : `Ошибка при загрузке галереи: ${error}`}
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="mt-14 flex min-h-[200px] items-center justify-center text-sm text-white/70">
            {language === 'de'
              ? 'Noch keine Bilder in der Galerie.'
              : language === 'en'
              ? 'No images in the gallery yet.'
              : 'В галерее пока нет изображений.'}
          </div>
        ) : (
          <GalleryGrid
            images={filteredImages}
            filters={t.filters}
            fullscreenLabel={fullscreenLabel}
            onImageOpen={handleImageOpen}
          />
        )}
      </div>

      <GalleryLightbox
        open={isDialogOpen}
        images={filteredImages}
        currentIndex={currentIndex}
        onOpenChange={handleDialogChange}
        onPrevious={showPrevious}
        onNext={showNext}
        navigationHelp={navigationHelp}
      />
    </div>
  );
};

export default GalleryPage;
