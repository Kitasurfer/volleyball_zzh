import React from 'react';
import { useLanguage } from '../lib/LanguageContext';

const HallPage: React.FC = () => {
  const { language } = useLanguage();

  const content = {
    de: {
      title: 'Inselhalle Zizishausen',
      description: 'Unser Zuhause - moderne Ausstattung für professionelles Training',
      sections: [
        { title: 'Ausstattung', text: 'Professionelle Volleyballfelder mit modernster Technik' },
        { title: 'Adresse', text: 'Inselhalle, 74915 Waibstadt-Zizishausen' },
        { title: 'Einrichtungen', text: 'Umkleideräume, Duschen, Trainingsgeräte' },
      ],
    },
    en: {
      title: 'Inselhalle Zizishausen',
      description: 'Our home - modern equipment for professional training',
      sections: [
        { title: 'Equipment', text: 'Professional volleyball courts with state-of-the-art technology' },
        { title: 'Address', text: 'Inselhalle, 74915 Waibstadt-Zizishausen' },
        { title: 'Facilities', text: 'Locker rooms, showers, training equipment' },
      ],
    },
    ru: {
      title: 'Зал Inselhalle Zizishausen',
      description: 'Наш дом - современное оборудование для профессиональных тренировок',
      sections: [
        { title: 'Оборудование', text: 'Профессиональные волейбольные площадки с современными технологиями' },
        { title: 'Адрес', text: 'Inselhalle, 74915 Waibstadt-Zizishausen' },
        { title: 'Удобства', text: 'Раздевалки, душевые, тренажеры' },
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
          <img src="/images/modern_indoor_volleyball_court_arena_equipment_university_of_washington.jpg" alt="Hall 1" className="w-full h-80 object-cover rounded-lg shadow-md" />
          <img src="/images/modern_indoor_volleyball_court_gym_equipment.jpg" alt="Hall 2" className="w-full h-80 object-cover rounded-lg shadow-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {t.sections.map((section, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg shadow-sm text-center">
              <h3 className="text-h3 font-semibold text-primary-900 mb-3">{section.title}</h3>
              <p className="text-body text-neutral-700">{section.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HallPage;
