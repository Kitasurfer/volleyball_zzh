import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import type { GalleryImage } from '../hooks/useGalleryImages';
import { useGalleryImages } from '../hooks/useGalleryImages';
import GalleryFilters from '../components/gallery/GalleryFilters';
import GalleryAlbumGrid from '../components/gallery/GalleryAlbumGrid';
import GalleryLightbox from '../components/gallery/GalleryLightbox';
import { Seo } from '../components/Seo';

const GalleryPage: React.FC = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { images, albums, loading, error } = useGalleryImages();
  const [activeImages, setActiveImages] = useState<GalleryImage[]>([]);
  const [selectedAlbumCategory, setSelectedAlbumCategory] = useState<string | null>(null);
  const [isPageLocationCollapsed, setIsPageLocationCollapsed] = useState(true);
  const [isPageMapOpen, setIsPageMapOpen] = useState(false);

  const content = {
    de: {
      filters: {
        all: 'Alle',
        spieltage: 'Spieltage',
        events: 'Events',
        beach: 'Beach',
        training: 'Training',
        action: 'Action',
        other: 'Andere',
      },
      seasonLabel: 'Saison',
      eventLabel: 'Event',
      photosLabel: 'Fotos',
      loading: 'Galerie wird geladen…',
      errorPrefix: 'Fehler beim Laden der Galerie:',
      empty: 'Noch keine Bilder in der Galerie.',
      close: 'Schließen',
      download: 'Download',
      zoomIn: 'Vergrößern',
      zoomOut: 'Verkleinern',
      previous: 'Zurück',
      next: 'Weiter',
      share: 'Teilen',
      like: 'Like',
      unlike: 'Unlike',
      favorite: 'Favorit',
      unfavorite: 'Favorit entfernen',
      featured: 'Featured',
      bestOf: 'Top',
      photoCounter: 'Foto',
      untitledPhoto: 'Foto',
      showMap: 'Karte anzeigen',
      hideMap: 'Karte ausblenden',
      navigationHelp:
        'Nutzen Sie die Pfeiltasten oder Buttons, um durch die Galerie zu navigieren.',
      locationBlocks: {
        beach: {
          title: 'Beachvolleyball – Anfahrt & Karte',
          addressLabel: 'Adresse',
          address: 'Beachvolleyball TSV Zizishausen, Auf d. Insel 1, 72622 Nürtingen',
          mapLabel: 'Karte',
          mapEmbed: 'https://www.google.com/maps?q=Auf+d.+Insel+1,+72622+Nürtingen&output=embed',
          mapLink: 'https://www.google.com/maps?q=Auf+d.+Insel+1,+72622+Nürtingen',
          cta: 'Route in Google Maps öffnen',
        },
        hall: {
          title: 'Halle – Anfahrt & Karte',
          addressLabel: 'Adresse',
          address: 'Bettwiesenhalle, Schulstraße 43, 72669 Unterensingen',
          mapLabel: 'Karte',
          mapEmbed: 'https://www.google.com/maps?q=Schulstraße+43,+72669+Unterensingen&output=embed',
          mapLink: 'https://www.google.com/maps?q=Schulstraße+43,+72669+Unterensingen',
          cta: 'Route in Google Maps öffnen',
        },
      },
    },
    en: {
      filters: {
        all: 'All',
        spieltage: 'Spieltage',
        events: 'Events',
        beach: 'Beach',
        training: 'Training',
        action: 'Action',
        other: 'Other',
      },
      seasonLabel: 'Season',
      eventLabel: 'Event',
      photosLabel: 'Photos',
      loading: 'Loading gallery…',
      errorPrefix: 'Failed to load gallery:',
      empty: 'No images in the gallery yet.',
      close: 'Close',
      download: 'Download',
      zoomIn: 'Zoom in',
      zoomOut: 'Zoom out',
      previous: 'Previous',
      next: 'Next',
      share: 'Share',
      like: 'Like',
      unlike: 'Unlike',
      favorite: 'Favorite',
      unfavorite: 'Remove favorite',
      featured: 'Featured',
      bestOf: 'Top',
      photoCounter: 'Photo',
      untitledPhoto: 'Photo',
      showMap: 'Show map',
      hideMap: 'Hide map',
      navigationHelp:
        'Use the arrow keys or buttons to navigate the gallery.',
      locationBlocks: {
        beach: {
          title: 'Beach volleyball – directions & map',
          addressLabel: 'Address',
          address: 'Beachvolleyball TSV Zizishausen, Auf d. Insel 1, 72622 Nürtingen',
          mapLabel: 'Map',
          mapEmbed: 'https://www.google.com/maps?q=Auf+d.+Insel+1,+72622+Nürtingen&output=embed',
          mapLink: 'https://www.google.com/maps?q=Auf+d.+Insel+1,+72622+Nürtingen',
          cta: 'Open in Google Maps',
        },
        hall: {
          title: 'Indoor gym – directions & map',
          addressLabel: 'Address',
          address: 'Bettwiesenhalle, Schulstraße 43, 72669 Unterensingen',
          mapLabel: 'Map',
          mapEmbed: 'https://www.google.com/maps?q=Schulstraße+43,+72669+Unterensingen&output=embed',
          mapLink: 'https://www.google.com/maps?q=Schulstraße+43,+72669+Unterensingen',
          cta: 'Open in Google Maps',
        },
      },
    },
    ru: {
      filters: {
        all: 'Все',
        spieltage: 'Spieltage',
        events: 'События',
        beach: 'Пляж',
        training: 'Тренировки',
        action: 'Экшен',
        other: 'Другое',
      },
      seasonLabel: 'Сезон',
      eventLabel: 'Событие',
      photosLabel: 'Фото',
      loading: 'Загружаем галерею…',
      errorPrefix: 'Ошибка при загрузке галереи:',
      empty: 'В галерее пока нет изображений.',
      close: 'Закрыть',
      download: 'Скачать',
      zoomIn: 'Увеличить',
      zoomOut: 'Уменьшить',
      previous: 'Назад',
      next: 'Вперёд',
      share: 'Поделиться',
      like: 'Лайк',
      unlike: 'Убрать лайк',
      favorite: 'В избранное',
      unfavorite: 'Убрать из избранного',
      featured: 'Рекомендуем',
      bestOf: 'Топ',
      photoCounter: 'Фото',
      untitledPhoto: 'Фото',
      showMap: 'Показать карту',
      hideMap: 'Скрыть карту',
      navigationHelp:
        'Используйте стрелки или кнопки для навигации по галерее.',
      locationBlocks: {
        beach: {
          title: 'Пляжный волейбол — адрес и карта',
          addressLabel: 'Адрес',
          address: 'Beachvolleyball TSV Zizishausen, Auf d. Insel 1, 72622 Nürtingen',
          mapLabel: 'Карта',
          mapEmbed: 'https://www.google.com/maps?q=Auf+d.+Insel+1,+72622+Nürtingen&output=embed',
          mapLink: 'https://www.google.com/maps?q=Auf+d.+Insel+1,+72622+Nürtingen',
          cta: 'Открыть маршрут в Google Maps',
        },
        hall: {
          title: 'Зал — адрес и карта',
          addressLabel: 'Адрес',
          address: 'Bettwiesenhalle, Schulstraße 43, 72669 Unterensingen',
          mapLabel: 'Карта',
          mapEmbed: 'https://www.google.com/maps?q=Schulstraße+43,+72669+Unterensingen&output=embed',
          mapLink: 'https://www.google.com/maps?q=Schulstraße+43,+72669+Unterensingen',
          cta: 'Открыть маршрут в Google Maps',
        },
      },
    },
    it: {
      filters: {
        all: 'Tutti',
        spieltage: 'Spieltage',
        events: 'Eventi',
        beach: 'Beach',
        training: 'Allenamenti',
        action: 'Azione',
        other: 'Altro',
      },
      seasonLabel: 'Stagione',
      eventLabel: 'Evento',
      photosLabel: 'Foto',
      loading: 'Caricamento galleria…',
      errorPrefix: 'Errore nel caricamento della galleria:',
      empty: 'Non ci sono ancora immagini in galleria.',
      close: 'Chiudi',
      download: 'Scarica',
      zoomIn: 'Ingrandisci',
      zoomOut: 'Riduci',
      previous: 'Precedente',
      next: 'Successivo',
      share: 'Condividi',
      like: 'Mi piace',
      unlike: 'Rimuovi mi piace',
      favorite: 'Preferito',
      unfavorite: 'Rimuovi dai preferiti',
      featured: 'In evidenza',
      bestOf: 'Top',
      photoCounter: 'Foto',
      untitledPhoto: 'Foto',
      showMap: 'Mostra mappa',
      hideMap: 'Nascondi mappa',
      navigationHelp:
        'Usa le frecce della tastiera o i pulsanti per navigare nella galleria.',
      locationBlocks: {
        beach: {
          title: 'Beach volley — indirizzo e mappa',
          addressLabel: 'Indirizzo',
          address: 'Beachvolleyball TSV Zizishausen, Auf d. Insel 1, 72622 Nürtingen',
          mapLabel: 'Mappa',
          mapEmbed: 'https://www.google.com/maps?q=Auf+d.+Insel+1,+72622+Nürtingen&output=embed',
          mapLink: 'https://www.google.com/maps?q=Auf+d.+Insel+1,+72622+Nürtingen',
          cta: 'Apri in Google Maps',
        },
        hall: {
          title: 'Palestra — indirizzo e mappa',
          addressLabel: 'Indirizzo',
          address: 'Bettwiesenhalle, Schulstraße 43, 72669 Unterensingen',
          mapLabel: 'Mappa',
          mapEmbed: 'https://www.google.com/maps?q=Schulstraße+43,+72669+Unterensingen&output=embed',
          mapLink: 'https://www.google.com/maps?q=Schulstraße+43,+72669+Unterensingen',
          cta: 'Apri in Google Maps',
        },
      },
    },
  };

  const t = content[language];

  const categoryLabels = useMemo(
    () => ({
      spieltage: t.filters.spieltage,
      events: t.filters.events,
      beach: t.filters.beach,
      training: t.filters.training,
      action: t.filters.action,
      other: t.filters.other,
    }),
    [t.filters],
  );

  const dateLocale = useMemo(() => {
    if (language === 'ru') return 'ru-RU';
    if (language === 'it') return 'it-IT';
    if (language === 'en') return 'en-GB';
    return 'de-DE';
  }, [language]);

  const seoTitle = language === 'de'
    ? 'Volleyball & Beachvolleyball Galerie – SKV Unterensingen'
    : language === 'ru'
    ? 'Галерея — SKV Unterensingen Volleyball'
    : language === 'it'
    ? 'Galleria – SKV Unterensingen Volleyball'
    : 'Gallery – SKV Unterensingen Volleyball';

  const seoDescription = language === 'de'
    ? 'Fotos von Volleyball, Hallenvolleyball und Beachvolleyball bei SKV Unterensingen in Unterensingen.'
    : language === 'ru'
    ? 'Фотографии матчей, событий, пляжа и тренировок SKV Unterensingen Volleyball.'
    : language === 'it'
    ? 'Foto di partite, eventi, beach e allenamenti di SKV Unterensingen Volleyball.'
    : 'Photos from match days, events, beach and training at SKV Unterensingen Volleyball.';

  const filteredAlbums = useMemo(
    () => (filter === 'all' ? albums : albums.filter((album) => album.category === filter)),
    [filter, albums],
  );

  const categoryCounts = useMemo(() => {
    const result: Record<string, number> = { all: albums.length };
    albums.forEach((album) => {
      result[album.category] = (result[album.category] ?? 0) + 1;
    });
    return result;
  }, [albums]);

  useEffect(() => {
    if (!activeImages[currentIndex]) {
      setCurrentIndex(0);
    }
  }, [activeImages, currentIndex]);

  const handleAlbumOpen = (albumId: string) => {
    const album = albums.find((item) => item.id === albumId);
    if (!album) return;
    navigate(`/gallery/${album.slug}`);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
  };

  const showPrevious = () => {
    const total = activeImages.length;
    if (!total) return;
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const showNext = () => {
    const total = activeImages.length;
    if (!total) return;
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));
  };

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

  const locationBlock = useMemo(() => {
    const category = isDialogOpen && selectedAlbumCategory ? selectedAlbumCategory : filter;
    if (category === 'beach') return t.locationBlocks?.beach;
    if (category === 'training') return t.locationBlocks?.hall;
    return null;
  }, [filter, isDialogOpen, selectedAlbumCategory, t.locationBlocks]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-950 via-primary-900/95 to-neutral-900 pt-20 pb-16 text-white">
      <Seo
        title={seoTitle}
        description={seoDescription}
        imagePath="/images/SKV_Volleyball.png"
        keywords={
          language === 'de'
            ? [
                'Volleyball Unterensingen Bilder',
                'SKV Unterensingen Volleyball Fotos',
                'Beachvolleyball Unterensingen Bilder',
                'Hallenvolleyball Unterensingen Fotos',
              ]
            : undefined
        }
      />
      <div className="container mx-auto px-4 lg:px-8">
        <GalleryFilters filters={t.filters} activeFilter={filter} onFilterChange={setFilter} counts={categoryCounts} />

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
            categoryLabels={categoryLabels}
            dateLocale={dateLocale}
            seasonLabel={t.seasonLabel}
            eventLabel={t.eventLabel}
            photosLabel={t.photosLabel}
            onAlbumOpen={handleAlbumOpen}
          />
        )}

        {locationBlock && (
          <div className="relative mt-10 rounded-[28px] border border-white/8 bg-white/[0.04] p-6 shadow-[0_16px_50px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            {isPageLocationCollapsed ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsPageLocationCollapsed(false)}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition"
                >
                  {locationBlock.mapLabel || t.showMap}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold text-white">{locationBlock.title}</h2>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-white/60">{locationBlock.addressLabel}</p>
                        <p className="text-body font-semibold text-white">{locationBlock.address}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPageLocationCollapsed(true);
                        setIsPageMapOpen(false);
                      }}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={locationBlock.mapLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-accent-300 hover:text-accent-100 font-semibold transition-colors"
                    >
                      {locationBlock.cta} →
                    </a>
                    <button
                      type="button"
                      onClick={() => setIsPageMapOpen((prev) => !prev)}
                      className="ml-auto inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
                    >
                      {isPageMapOpen ? t.hideMap : (locationBlock.mapLabel || t.showMap)}
                    </button>
                  </div>
                </div>

                {isPageMapOpen && (
                  <div className="w-full h-72 bg-neutral-900 rounded-xl overflow-hidden shadow-lg border border-white/10">
                    <iframe
                      src={locationBlock.mapEmbed}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={locationBlock.title}
                    ></iframe>
                  </div>
                )}
              </div>
            )}
          </div>
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
        locationBlock={locationBlock}
        labels={{
          close: t.close,
          download: t.download,
          zoomIn: t.zoomIn,
          zoomOut: t.zoomOut,
          previous: t.previous,
          next: t.next,
          share: t.share,
          like: t.like,
          unlike: t.unlike,
          favorite: t.favorite,
          unfavorite: t.unfavorite,
          featured: t.featured,
          bestOf: t.bestOf,
          photoCounter: t.photoCounter,
          untitled: t.untitledPhoto,
          showMap: t.showMap,
          hideMap: t.hideMap,
        }}
      />
    </div>
  );
};

export default GalleryPage;
