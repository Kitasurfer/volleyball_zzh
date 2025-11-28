import React from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { useTrainingVideos } from '../hooks/useTrainingVideos';
import { TrainingHero } from '../components/training/TrainingHero';
import { TrainingPhilosophy } from '../components/training/TrainingPhilosophy';
import { TrainingVideosSection } from '../components/training/TrainingVideosSection';

const TrainingPage: React.FC = () => {
  const { language } = useLanguage();
  const { videos, loading, error } = useTrainingVideos();

  const content = {
    de: {
      title: 'Training & Videos',
      description: 'Professionelle Trainingsmethoden basierend auf FIVB-Standards',
      philosophy: 'Trainingsphilosophie',
      philosophyText:
        'Unser Trainingsansatz basiert auf international anerkannten Methoden, die von der FIVB entwickelt wurden. Wir folgen dem Prinzip "trainiere wie du spielst" - unsere Übungen spiegeln echte Spielsituationen wider.',
      principles: [
        'Technische Grundlagen perfektionieren',
        'Strategisches Denken entwickeln',
        'Mentale Stärke aufbauen',
        'Physische Exzellenz erreichen',
      ],
      videosTitle: 'Trainingsvideos',
      videosIntro: 'Sehen Sie Beispielübungen und Trainingssequenzen aus unserer Halle.',
      videosLoading: 'Trainingsvideos werden geladen…',
      videosEmpty: 'Noch keine Trainingsvideos verfügbar.',
      videosError: 'Fehler beim Laden der Trainingsvideos:',
    },
    en: {
      title: 'Training & Videos',
      description: 'Professional training methods based on FIVB standards',
      philosophy: 'Training Philosophy',
      philosophyText:
        'Our training approach is based on internationally recognized methods developed by the FIVB. We follow the principle "train like you play" - our exercises mirror real game situations.',
      principles: [
        'Perfect technical fundamentals',
        'Develop strategic thinking',
        'Build mental strength',
        'Achieve physical excellence',
      ],
      videosTitle: 'Training videos',
      videosIntro: 'Watch example drills and training sequences from our gym.',
      videosLoading: 'Loading training videos…',
      videosEmpty: 'No training videos available yet.',
      videosError: 'Failed to load training videos:',
    },
    ru: {
      title: 'Тренировки и видео',
      description: 'Профессиональные методики на основе стандартов FIVB',
      philosophy: 'Тренировочная философия',
      philosophyText:
        'Наш тренировочный подход основан на международно признанных методах, разработанных FIVB. Мы следуем принципу "тренируйся как играешь" - наши упражнения отражают реальные игровые ситуации.',
      principles: [
        'Оттачивание технических основ',
        'Развитие стратегического мышления',
        'Построение ментальной силы',
        'Достижение физического совершенства',
      ],
      videosTitle: 'Тренировочные видео',
      videosIntro: 'Посмотрите примеры упражнений и тренировочных серий из нашего зала.',
      videosLoading: 'Загружаем тренировочные видео…',
      videosEmpty: 'Тренировочных видео пока нет.',
      videosError: 'Ошибка при загрузке тренировочных видео:',
    },
  };

  const t = content[language];

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 lg:px-12">
        <TrainingHero title={t.title} description={t.description} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <img
            src="/images/volleyball_team_gym_warmup_stretching_session.jpg"
            alt="Training 1"
            className="w-full h-80 object-cover rounded-lg shadow-md"
          />
          <img
            src="/images/intense_volleyball_team_plyometric_training_gym.jpg"
            alt="Training 2"
            className="w-full h-80 object-cover rounded-lg shadow-md"
          />
        </div>

        <TrainingPhilosophy
          title={t.philosophy}
          text={t.philosophyText}
          principles={t.principles}
        />

        <TrainingVideosSection
          title={t.videosTitle}
          intro={t.videosIntro}
          loadingLabel={t.videosLoading}
          emptyLabel={t.videosEmpty}
          errorPrefix={t.videosError}
          videos={videos}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};

export default TrainingPage;
