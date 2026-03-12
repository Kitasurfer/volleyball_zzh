import React from 'react';
import { Calendar, Clock, MapPin, Home, Users, Dumbbell } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { LightboxImage } from '../components/LightboxImage';
import { Seo } from '../components/Seo';
import { hallSchedule2026 } from '../data/schedule';

const HallPage: React.FC = () => {
  const { language } = useLanguage();

  const content = {
    de: {
      title: 'Bettwiesenhalle Unterensingen',
      description: 'Unser Trainingsort in Unterensingen - moderne Ausstattung für professionelles Training',
      mapTitle: 'Anfahrt & Karte',
      addressLabel: 'Adresse',
      address: 'Bettwiesenhalle, Schulstraße 43, 72669 Unterensingen',
      mapCta: 'Route in Google Maps öffnen',
      sections: [
        { title: 'Ausstattung', text: 'Professionelle Volleyballfelder mit modernster Technik', icon: Dumbbell },
        { title: 'Adresse', text: 'Bettwiesenhalle, Schulstraße 43, 72669 Unterensingen', icon: MapPin },
        { title: 'Einrichtungen', text: 'Umkleideräume, Duschen, Trainingsgeräte', icon: Users },
      ],
      scheduleTitle: 'Trainingszeiten 2026',
      scheduleSubtitle: 'Hallenvolleyball (Oktober - April)',
    },
    en: {
      title: 'Bettwiesenhalle Unterensingen',
      description: 'Our training venue in Unterensingen - modern equipment for professional training',
      mapTitle: 'Directions & Map',
      addressLabel: 'Address',
      address: 'Bettwiesenhalle, Schulstraße 43, 72669 Unterensingen',
      mapCta: 'Open in Google Maps',
      sections: [
        { title: 'Equipment', text: 'Professional volleyball courts with state-of-the-art technology', icon: Dumbbell },
        { title: 'Address', text: 'Bettwiesenhalle, Schulstraße 43, 72669 Unterensingen', icon: MapPin },
        { title: 'Facilities', text: 'Locker rooms, showers, training equipment', icon: Users },
      ],
      scheduleTitle: 'Training Schedule 2026',
      scheduleSubtitle: 'Indoor Volleyball (October - April)',
    },
    ru: {
      title: 'Зал Bettwiesenhalle Unterensingen',
      description: 'Наш тренировочный зал в Унтерензингене — современное оборудование для профессиональных тренировок',
      mapTitle: 'Адрес и карта',
      addressLabel: 'Адрес',
      address: 'Bettwiesenhalle, Schulstraße 43, 72669 Unterensingen',
      mapCta: 'Открыть маршрут в Google Maps',
      sections: [
        { title: 'Оборудование', text: 'Профессиональные волейбольные площадки с современными технологиями', icon: Dumbbell },
        { title: 'Адрес', text: 'Bettwiesenhalle, Schulstraße 43, 72669 Unterensingen', icon: MapPin },
        { title: 'Удобства', text: 'Раздевалки, душевые, тренажеры', icon: Users },
      ],
      scheduleTitle: 'Расписание тренировок 2026',
      scheduleSubtitle: 'Волейбол в зале (октябрь - апрель)',
    },
    it: {
      title: 'Bettwiesenhalle Unterensingen',
      description:
        'La nostra palestra a Unterensingen – attrezzatura moderna per allenamenti professionali',
      mapTitle: 'Indirizzo e mappa',
      addressLabel: 'Indirizzo',
      address: 'Bettwiesenhalle, Schulstraße 43, 72669 Unterensingen',
      mapCta: 'Apri in Google Maps',
      sections: [
        {
          title: 'Attrezzatura',
          text: 'Campi da pallavolo professionali con tecnologia moderna',
          icon: Dumbbell,
        },
        {
          title: 'Indirizzo',
          text: 'Bettwiesenhalle, Schulstraße 43, 72669 Unterensingen',
          icon: MapPin,
        },
        {
          title: 'Servizi',
          text: 'Spogliatoi, docce, attrezzi per l’allenamento',
          icon: Users,
        },
      ],
      scheduleTitle: 'Orari allenamenti 2026',
      scheduleSubtitle: 'Pallavolo indoor (ottobre - aprile)',
    },
  };

  const t = content[language];

  const seoTitle =
    language === 'de'
      ? 'Hallenvolleyball Unterensingen | Volleyball Training | SKV Unterensingen'
      : t.title;
  const seoDescription =
    language === 'de'
      ? 'Hallenvolleyball beim SKV Unterensingen in der Bettwiesenhalle: Volleyball Training, Trainingszeiten Volleyball Unterensingen und Spielbetrieb.'
      : t.description;
  const seoKeywords =
    language === 'de'
      ? [
          'Hallenvolleyball Unterensingen',
          'Volleyball Unterensingen',
          'Volleyball Training Unterensingen',
          'Trainingszeiten Volleyball Unterensingen',
          'SKV Unterensingen Volleyball',
        ]
      : undefined;
  const seoJsonLd =
    language === 'de'
      ? {
          '@context': 'https://schema.org',
          '@type': 'SportsActivityLocation',
          name: 'Bettwiesenhalle Unterensingen',
          sport: 'Volleyball',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Schulstraße 43',
            postalCode: '72669',
            addressLocality: 'Unterensingen',
            addressCountry: 'DE',
          },
        }
      : undefined;

  // Transform schedule data for current language
  const scheduleItems = hallSchedule2026.map((item) => ({
    day: item.day[language],
    time: item.time,
    location: item.location?.[language],
  }));

  return (
    <div className="min-h-screen pt-32 pb-20">
      <Seo title={seoTitle} description={seoDescription} keywords={seoKeywords} jsonLd={seoJsonLd} />
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
          {t.sections.map((section, idx) => {
            const Icon = section.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl shadow-lg border border-neutral-100 text-center hover:shadow-xl transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary-600 mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-h3 font-semibold text-primary-900 mb-3">{section.title}</h3>
                <p className="text-body text-neutral-700">{section.text}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 max-w-5xl mx-auto">
          <LightboxImage
            src="https://kxwmkvtxkaczuonnnxlj.supabase.co/storage/v1/object/public/media-public/uploads/1764952004018-6b78lz.jpg"
            alt="Hall 3"
            wrapperClassName="w-full"
            className="w-full max-h-[500px] object-cover rounded-lg shadow-md"
          />
        </div>

        {/* Schedule Section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-neutral-100 bg-gradient-to-r from-primary-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25">
                  <Home className="w-5 h-5" />
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
                  className="relative flex items-center gap-4 p-4 rounded-xl bg-primary-50 border border-primary-100 hover:border-primary-200 transition-colors"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-primary-400 to-primary-600" />
                  <div className="flex-1 pl-2">
                    <p className="font-semibold text-primary-900">{item.day}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-neutral-600">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary-400" />
                        {item.time}
                      </span>
                      {item.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-primary-400" />
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

        {/* Map Section */}
        <div className="mt-16">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg border border-neutral-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-100 bg-gradient-to-r from-primary-50 to-white">
              <h2 className="text-xl font-semibold text-primary-900">{t.mapTitle}</h2>
              <p className="text-sm text-neutral-600">{t.addressLabel}: {t.address}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5">
              <div className="p-6 space-y-3 lg:col-span-2">
                <p className="text-body text-neutral-800 font-semibold">{t.address}</p>
                <a
                  href="https://www.google.com/maps?q=Schulstraße+43,+72669+Unterensingen"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                >
                  {t.mapCta} →
                </a>
              </div>
              <div className="lg:col-span-3 h-80 w-full border-l border-neutral-100">
                <iframe
                  src="https://www.google.com/maps?q=Schulstraße+43,+72669+Unterensingen&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Hall location map"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HallPage;
