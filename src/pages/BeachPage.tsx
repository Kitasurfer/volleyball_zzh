import React from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { LightboxImage } from '../components/LightboxImage';

const BeachPage: React.FC = () => {
  const { language } = useLanguage();

  const content = {
    de: {
      title: 'Beach Volleyball',
      description: '',
      text: 'Beachvolleyball fördert Beweglichkeit, Ausdauer und taktisches Denken im Sand.',
      scheduleTitle: 'Trainingszeiten',
      scheduleItems: ['Montag 17:00 - 20:00', 'Mittwoch 17:00 - 20:00'],
    },
    en: {
      title: 'Beach Volleyball',
      description: '',
      text: 'Beach volleyball develops agility, endurance, and tactical thinking on the sand.',
      scheduleTitle: 'Training schedule',
      scheduleItems: ['Monday 17:00 - 20:00', 'Wednesday 17:00 - 20:00'],
    },
    ru: {
      title: 'Пляжный волейбол',
      description: '',
      text: 'Пляжный волейбол развивает ловкость, выносливость и тактическое мышление на песке.',
      scheduleTitle: 'Расписание тренировок',
      scheduleItems: ['Понедельник 17:00 - 20:00', 'Среда 17:00 - 20:00'],
    },
  };

  const t = content[language];

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-12">
          <h1 className="text-h1 font-bold text-primary-900 mb-4">{t.title}</h1>
          {t.description && (
            <p className="text-body-lg text-neutral-700">{t.description}</p>
          )}
          <div className="w-24 h-1 bg-accent-500 mx-auto mt-6"></div>
        </div>

        <div className="max-w-4xl mx-auto mb-12">
          <p className="text-body text-neutral-700 text-center leading-relaxed">{t.text}</p>
        </div>

        {t.scheduleItems && t.scheduleItems.length > 0 && (
          <div className="max-w-3xl mx-auto mb-12">
            <h2 className="text-h3 font-semibold text-primary-900 mb-4 text-center">{t.scheduleTitle}</h2>
            <ul className="space-y-2 text-center">
              {t.scheduleItems.map((item, idx) => (
                <li key={idx} className="text-body text-neutral-700">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <LightboxImage
            src="https://kxwmkvtxkaczuonnnxlj.supabase.co/storage/v1/object/public/media-public/uploads/1764964848801-ayzzpy.jpg"
            alt="Beach 1"
            wrapperClassName="w-full"
            className="w-full rounded-lg shadow-md"
          />
          <LightboxImage
            src="https://kxwmkvtxkaczuonnnxlj.supabase.co/storage/v1/object/public/media-public/uploads/1764964850171-in0dwz.jpg"
            alt="Beach 2"
            wrapperClassName="w-full"
            className="w-full rounded-lg shadow-md"
          />
        </div>
      </div>
    </div>
  );
};

export default BeachPage;
