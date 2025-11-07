import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';

import { Button, Card, CardContent, Dialog, DialogClose, DialogContent } from '../components/ui';
import { useLanguage } from '../lib/LanguageContext';

type GalleryImage = {
  src: string;
  category: string;
  title: string;
};

const GALLERY_IMAGES: GalleryImage[] = [
  {
    src: '/images/volleyball_team_group_photo_dramatic_lighting.jpg',
    category: 'team',
    title: 'Team Spirit in Spotlight',
  },
  {
    src: '/images/blue_devils_volleyball_team_group_photo_uniform_blockbuster.jpg',
    category: 'team',
    title: 'Match Day Energy',
  },
  {
    src: '/images/volleyball_team_group_celebration_uniforms_gallery.jpg',
    category: 'team',
    title: 'Victory Celebration',
  },
  {
    src: '/images/dynamic_volleyball_player_spike_action_shot.jpg',
    category: 'action',
    title: 'Powerful Spike',
  },
  {
    src: '/images/dynamic_volleyball_block_action_players_net.jpg',
    category: 'action',
    title: 'Block at the Net',
  },
  {
    src: '/images/volleyball_player_dynamic_block_spike_action_shot.jpg',
    category: 'action',
    title: 'Dynamic Defense',
  },
  {
    src: '/images/summer_beach_volleyball_game_on_sand.jpg',
    category: 'beach',
    title: 'Summer Sand Match',
  },
  {
    src: '/images/female_beach_volleyball_player_diving_sand_action_shot_summer_game.jpg',
    category: 'beach',
    title: 'All-Out Dive',
  },
  {
    src: '/images/dynamic_woman_beach_volleyball_dive_sand_summer_training.jpg',
    category: 'beach',
    title: 'Beach Training Focus',
  },
  {
    src: '/images/volleyball_team_gym_warmup_stretching_session.jpg',
    category: 'training',
    title: 'Focused Warm-up',
  },
  {
    src: '/images/intense_volleyball_team_plyometric_training_gym.jpg',
    category: 'training',
    title: 'Plyometric Session',
  },
  {
    src: '/images/athletes_gym_resistance_band_warmup_training.jpg',
    category: 'training',
    title: 'Strength & Conditioning',
  },
];

const GalleryPage: React.FC = () => {
  const { language } = useLanguage();
  const [filter, setFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const images: GalleryImage[] = [
    {
      src: '/images/volleyball_team_group_photo_dramatic_lighting.jpg',
      category: 'team',
      title: 'Team Spirit in Spotlight',
    },
    {
      src: '/images/blue_devils_volleyball_team_group_photo_uniform_blockbuster.jpg',
      category: 'team',
      title: 'Match Day Energy',
    },
    {
      src: '/images/volleyball_team_group_celebration_uniforms_gallery.jpg',
      category: 'team',
      title: 'Victory Celebration',
    },
    {
      src: '/images/dynamic_volleyball_player_spike_action_shot.jpg',
      category: 'action',
      title: 'Powerful Spike',
    },
    {
      src: '/images/dynamic_volleyball_block_action_players_net.jpg',
      category: 'action',
      title: 'Block at the Net',
    },
    {
      src: '/images/volleyball_player_dynamic_block_spike_action_shot.jpg',
      category: 'action',
      title: 'Dynamic Defense',
    },
    {
      src: '/images/summer_beach_volleyball_game_on_sand.jpg',
      category: 'beach',
      title: 'Summer Sand Match',
    },
    {
      src: '/images/female_beach_volleyball_player_diving_sand_action_shot_summer_game.jpg',
      category: 'beach',
      title: 'All-Out Dive',
    },
    {
      src: '/images/dynamic_woman_beach_volleyball_dive_sand_summer_training.jpg',
      category: 'beach',
      title: 'Beach Training Focus',
    },
    {
      src: '/images/volleyball_team_gym_warmup_stretching_session.jpg',
      category: 'training',
      title: 'Focused Warm-up',
    },
    {
      src: '/images/intense_volleyball_team_plyometric_training_gym.jpg',
      category: 'training',
      title: 'Plyometric Session',
    },
    {
      src: '/images/athletes_gym_resistance_band_warmup_training.jpg',
      category: 'training',
      title: 'Strength & Conditioning',
    },
  ];

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-950 via-primary-900/95 to-neutral-900 pt-28 pb-24 text-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">{t.title}</h1>
          <p className="mt-4 text-base text-white/70 lg:text-lg">
            {language === 'de'
              ? 'Erleben Sie die Highlights unserer Volleyball-Community – von emotionalen Team-Momenten bis zu intensiven Trainingseinheiten.'
              : language === 'en'
              ? 'Experience the highlights of our volleyball community—from emotional team moments to intense training sessions.'
              : 'Погрузитесь в атмосферу нашей волейбольной команды — от эмоциональных командных моментов до интенсивных тренировок.'}
          </p>
        </div>

        {/* Filters */}
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {Object.entries(t.filters).map(([key, label]) => (
            <Button
              key={key}
              variant={filter === key ? 'accent' : 'ghost'}
              className={`rounded-full border border-white/10 px-5 py-2 text-sm font-semibold transition-all ${
                filter === key
                  ? 'shadow-lg shadow-accent-500/30'
                  : 'text-white/70 hover:text-white'
              }`}
              onClick={() => setFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredImages.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => handleImageOpen(index)}
              className="group relative block w-full text-left focus:outline-none"
            >
              <Card className="overflow-hidden border-white/5 bg-white/5 backdrop-blur">
                <div className="relative h-64 w-full overflow-hidden">
                  <img
                    src={image.src}
                    alt={image.title}
                    className="h-full w-full transform object-cover transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="text-base font-semibold">{image.title}</span>
                    <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-white/70">
                      <Maximize2 className="h-4 w-4" />
                      {language === 'de'
                        ? 'Vollbild'
                        : language === 'en'
                        ? 'Fullscreen'
                        : 'На весь экран'}
                    </span>
                  </div>
                </div>
                <CardContent className="flex items-center justify-between bg-black/20 py-4 text-white">
                  <span className="text-sm uppercase tracking-wider text-white/60">
                    {t.filters[image.category as keyof typeof t.filters]}
                  </span>
                  <span className="text-sm font-medium text-white">{image.title}</span>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="flex h-full w-full items-center justify-center bg-black/95 p-0">
          <div className="relative flex h-full w-full max-h-screen max-w-screen items-center justify-center overflow-hidden">
            <div className="absolute right-6 top-6 z-40 flex items-center gap-3 text-sm text-white/70">
              <span>
                {currentIndex + 1}/{filteredImages.length}
              </span>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60">
                  <X className="h-5 w-5" />
                </Button>
              </DialogClose>
            </div>
            {filteredImages[currentIndex] && (
              <figure className="relative flex h-full w-full items-center justify-center">
                <img
                  src={filteredImages[currentIndex].src}
                  alt={filteredImages[currentIndex].title}
                  className="h-full w-full max-h-screen max-w-screen object-contain"
                />
                <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8 text-center text-white">
                  <h3 className="text-2xl font-semibold">{filteredImages[currentIndex].title}</h3>
                  <p className="mt-3 text-sm text-white/70">
                    {language === 'de'
                      ? 'Nutzen Sie die Pfeiltasten oder Buttons, um durch die Galerie zu navigieren.'
                      : language === 'en'
                      ? 'Use the arrow keys or buttons to navigate the gallery.'
                      : 'Используйте стрелки или кнопки для навигации по галерее.'}
                  </p>
                </figcaption>
              </figure>
            )}

            {filteredImages.length > 1 && (
              <>
                <div className="absolute left-4 top-1/2 z-30 -translate-y-1/2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={showPrevious}
                    className="h-12 w-12 rounded-full border border-white/30 bg-black/40 text-white hover:bg-black/70"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                </div>
                <div className="absolute right-4 top-1/2 z-30 -translate-y-1/2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={showNext}
                    className="h-12 w-12 rounded-full border border-white/30 bg-black/40 text-white hover:bg-black/70"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryPage;
