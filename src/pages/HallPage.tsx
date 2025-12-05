import React from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { LightboxImage } from '../components/LightboxImage';

const HallPage: React.FC = () => {
  const { language } = useLanguage();

  const content = {
    de: {
      title: 'Bettwiesenhalle Unterensingen',
      description: 'Unser Trainingsort in Unterensingen - moderne Ausstattung für professionelles Training',
      sections: [
        { title: 'Ausstattung', text: 'Professionelle Volleyballfelder mit modernster Technik' },
        { title: 'Adresse', text: 'Bettwiesenhalle, Schulstraße 43, 72669 Unterensingen' },
        { title: 'Einrichtungen', text: 'Umkleideräume, Duschen, Trainingsgeräte' },
      ],
    },
    en: {
      title: 'Bettwiesenhalle Unterensingen',
      description: 'Our training venue in Unterensingen - modern equipment for professional training',
      sections: [
        { title: 'Equipment', text: 'Professional volleyball courts with state-of-the-art technology' },
        { title: 'Address', text: 'Bettwiesenhalle, Schulstraße 43, 72669 Unterensingen' },
        { title: 'Facilities', text: 'Locker rooms, showers, training equipment' },
      ],
    },
    ru: {
      title: 'Зал Bettwiesenhalle Unterensingen',
      description: 'Наш тренировочный зал в Унтерензингене — современное оборудование для профессиональных тренировок',
      sections: [
        { title: 'Оборудование', text: 'Профессиональные волейбольные площадки с современными технологиями' },
        { title: 'Адрес', text: 'Bettwiesenhalle, Schulstraße 43, 72669 Unterensingen' },
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
          <LightboxImage
            src="https://kxwmkvtxkaczuonnnxlj.supabase.co/storage/v1/object/public/media-public/uploads/1764952002336-scdz0s.jpg"
            alt="Hall 1"
            className="w-full h-80 object-cover rounded-lg shadow-md"
          />
          <LightboxImage
            src="https://kxwmkvtxkaczuonnnxlj.supabase.co/storage/v1/object/public/media-public/uploads/1764952002880-masbfm.jpg"
            alt="Hall 2"
            className="w-full h-80 object-cover rounded-lg shadow-md"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {t.sections.map((section, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg shadow-sm text-center">
              <h3 className="text-h3 font-semibold text-primary-900 mb-3">{section.title}</h3>
              <p className="text-body text-neutral-700">{section.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 max-w-5xl mx-auto">
          <LightboxImage
            src="https://kxwmkvtxkaczuonnnxlj.supabase.co/storage/v1/object/public/media-public/uploads/1764952004018-6b78lz.jpg"
            alt="Hall 3"
            wrapperClassName="w-full"
            className="w-full max-h-[500px] object-cover rounded-lg shadow-md"
          />
        </div>
      </div>
    </div>
  );
};

export default HallPage;
