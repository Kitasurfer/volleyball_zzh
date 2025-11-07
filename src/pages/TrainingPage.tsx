import React from 'react';
import { useLanguage } from '../lib/LanguageContext';

const TrainingPage: React.FC = () => {
  const { language } = useLanguage();

  const content = {
    de: {
      title: 'Training & Videos',
      description: 'Professionelle Trainingsmethoden basierend auf FIVB-Standards',
      philosophy: 'Trainingsphilosophie',
      philosophyText: 'Unser Trainingsansatz basiert auf international anerkannten Methoden, die von der FIVB entwickelt wurden. Wir folgen dem Prinzip "trainiere wie du spielst" - unsere Übungen spiegeln echte Spielsituationen wider.',
      principles: [
        'Technische Grundlagen perfektionieren',
        'Strategisches Denken entwickeln',
        'Mentale Stärke aufbauen',
        'Physische Exzellenz erreichen',
      ],
    },
    en: {
      title: 'Training & Videos',
      description: 'Professional training methods based on FIVB standards',
      philosophy: 'Training Philosophy',
      philosophyText: 'Our training approach is based on internationally recognized methods developed by the FIVB. We follow the principle "train like you play" - our exercises mirror real game situations.',
      principles: [
        'Perfect technical fundamentals',
        'Develop strategic thinking',
        'Build mental strength',
        'Achieve physical excellence',
      ],
    },
    ru: {
      title: 'Тренировки и видео',
      description: 'Профессиональные методики на основе стандартов FIVB',
      philosophy: 'Тренировочная философия',
      philosophyText: 'Наш тренировочный подход основан на международно признанных методах, разработанных FIVB. Мы следуем принципу "тренируйся как играешь" - наши упражнения отражают реальные игровые ситуации.',
      principles: [
        'Оттачивание технических основ',
        'Развитие стратегического мышления',
        'Построение ментальной силы',
        'Достижение физического совершенства',
      ],
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <img src="/images/volleyball_team_gym_warmup_stretching_session.jpg" alt="Training 1" className="w-full h-80 object-cover rounded-lg shadow-md" />
          <img src="/images/intense_volleyball_team_plyometric_training_gym.jpg" alt="Training 2" className="w-full h-80 object-cover rounded-lg shadow-md" />
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
            <h2 className="text-h3 font-semibold text-primary-900 mb-4">{t.philosophy}</h2>
            <p className="text-body text-neutral-700 leading-relaxed mb-6">{t.philosophyText}</p>
            <ul className="space-y-3">
              {t.principles.map((principle, idx) => (
                <li key={idx} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-accent-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-body text-neutral-700">{principle}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingPage;
