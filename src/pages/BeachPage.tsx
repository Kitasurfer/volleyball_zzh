import React from 'react';
import { Clock, MapPin, Sun, Waves } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { LightboxImage } from '../components/LightboxImage';
import { Seo } from '../components/Seo';
import { beachSchedule2026 } from '../data/schedule';
import { WeatherWidget } from '../components/beach/WeatherWidget';

const BeachPage: React.FC = () => {
  const { language } = useLanguage();

  const content = {
    de: {
      title: 'Beach Volleyball',
      description: 'Outdoor-Training auf Sand',
      text: 'Beachvolleyball fördert Beweglichkeit, Ausdauer und taktisches Denken im Sand. Unsere Beachanlage bietet optimale Bedingungen für Training und Spaß.',
      scheduleTitle: 'Trainingszeiten 2026',
      scheduleSubtitle: 'Beachvolleyball (April - September)',
      features: [
        { icon: Sun, title: 'Outdoor', text: 'Training unter freiem Himmel' },
        { icon: Waves, title: 'Sandplätze', text: 'Professionelle Beachanlage mit 3 Feldern' },
      ],
    },
    en: {
      title: 'Beach Volleyball',
      description: 'Outdoor training on sand',
      text: 'Beach volleyball develops agility, endurance, and tactical thinking on the sand. Our beach facility offers optimal conditions for training and fun.',
      scheduleTitle: 'Training Schedule 2026',
      scheduleSubtitle: 'Beach Volleyball (April - September)',
      features: [
        { icon: Sun, title: 'Outdoor', text: 'Training in the open air' },
        { icon: Waves, title: 'Sand Courts', text: 'Professional beach facility with 3 courts' },
      ],
    },
    ru: {
      title: 'Пляжный волейбол',
      description: 'Тренировки на песке',
      text: 'Пляжный волейбол развивает ловкость, выносливость и тактическое мышление на песке. Наша площадка предлагает оптимальные условия для тренировок и отдыха.',
      scheduleTitle: 'Расписание тренировок 2026',
      scheduleSubtitle: 'Пляжный волейбол (апрель - сентябрь)',
      features: [
        { icon: Sun, title: 'На открытом воздухе', text: 'Тренировки под открытым небом' },
        { icon: Waves, title: 'Песчаные площадки', text: 'Профессиональная пляжная площадка с 3 площадками' },
      ],
    },
    it: {
      title: 'Beach Volleyball',
      description: 'Allenamenti all’aperto sulla sabbia',
      text:
        'Il beach volley sviluppa agilità, resistenza e pensiero tattico sulla sabbia. Il nostro impianto beach offre condizioni ottimali per allenamento e divertimento.',
      scheduleTitle: 'Orari allenamenti 2026',
      scheduleSubtitle: 'Beach volley (aprile - settembre)',
      features: [
        { icon: Sun, title: 'All’aperto', text: 'Allenamenti all’aria aperta' },
        {
          icon: Waves,
          title: 'Campi in sabbia',
          text: 'Impianto beach professionale con 3 campi',
        },
      ],
    },
  };

  const t = content[language];

  const seoTitle = t.title;
  const seoDescription = t.description;

  // Transform schedule data for current language
  const scheduleItems = beachSchedule2026.map((item) => ({
    day: item.day[language],
    time: item.time,
    location: item.location?.[language],
  }));

  return (
    <div className="min-h-screen pt-32 pb-20">
      <Seo title={seoTitle} description={seoDescription} />
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

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
          {t.features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl shadow-lg border border-amber-100 text-center hover:shadow-xl transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white mb-4 shadow-lg shadow-amber-500/25">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-primary-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-600">{feature.text}</p>
              </div>
            );
          })}
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
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

        {/* Schedule Section */}
        <div className="max-w-2xl mx-auto mt-12">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/25">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-primary-900">{t.scheduleTitle}</h2>
                  <p className="text-sm text-neutral-500">{t.scheduleSubtitle}</p>
                </div>
              </div>
            </div>

            {/* Schedule Items */}
            <div className="p-6 space-y-3">
              {scheduleItems.map((item, idx) => (
                <div
                  key={idx}
                  className="relative flex items-center gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100 hover:border-amber-200 transition-colors"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-amber-400 to-orange-500" />
                  <div className="flex-1 pl-2">
                    <p className="font-semibold text-primary-900">{item.day}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-neutral-600">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-500" />
                        {item.time}
                      </span>
                      {item.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-amber-500" />
                          {item.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weather Widget */}
        <div className="max-w-2xl mx-auto mt-12">
          <WeatherWidget />
        </div>
      </div>
    </div>
  );
};

export default BeachPage;
