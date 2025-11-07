import React from 'react';
import { useLanguage } from '../lib/LanguageContext';

const BeachPage: React.FC = () => {
  const { language } = useLanguage();

  const content = {
    de: {
      title: 'Beach Volleyball',
      description: 'Outdoor-Training auf Sand seit 2025',
      text: 'Seit 2025 bieten wir auch Beach-Volleyball-Programme an. Beach-Volleyball trainiert Agilität, Ausdauer und taktisches Denken auf Sand.',
    },
    en: {
      title: 'Beach Volleyball',
      description: 'Outdoor training on sand since 2025',
      text: 'Since 2025, we also offer beach volleyball programs. Beach volleyball trains agility, endurance, and tactical thinking on sand.',
    },
    ru: {
      title: 'Пляжный волейбол',
      description: 'Тренировки на открытом воздухе с 2025 года',
      text: 'С 2025 года мы также предлагаем программы пляжного волейбола. Пляжный волейбол развивает ловкость, выносливость и тактическое мышление на песке.',
    },
  };

  const t = content[language];

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <h1 className="text-h1 font-bold text-primary-900 mb-4">{t.title}</h1>
          <p className="text-body-lg text-neutral-700">{t.description}</p>
          <div className="w-24 h-1 bg-accent-500 mx-auto mt-6"></div>
        </div>

        <div className="max-w-4xl mx-auto mb-12">
          <p className="text-body text-neutral-700 text-center leading-relaxed">{t.text}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <img src="/images/summer_beach_volleyball_game_on_sand.jpg" alt="Beach 1" className="w-full h-64 object-cover rounded-lg shadow-md" />
          <img src="/images/female_beach_volleyball_player_diving_sand_action_shot_summer_game.jpg" alt="Beach 2" className="w-full h-64 object-cover rounded-lg shadow-md" />
          <img src="/images/dynamic_woman_beach_volleyball_dive_sand_summer_training.jpg" alt="Beach 3" className="w-full h-64 object-cover rounded-lg shadow-md" />
        </div>
      </div>
    </div>
  );
};

export default BeachPage;
