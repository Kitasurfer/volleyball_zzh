import React from 'react';
import { Clock, MapPin, Sun, Waves } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { LightboxImage } from '../components/LightboxImage';
import { Seo } from '../components/Seo';
import { beachSchedule2026 } from '../data/schedule';
import { WeatherWidget } from '../components/beach/WeatherWidget';

const BEACH_FACILITY_MAP_URL = 'https://www.google.com/maps?q=Auf+d.+Insel+1,+72622+Nürtingen&output=embed';

const BeachPage: React.FC = () => {
  const { language } = useLanguage();

  const content = {
    de: {
      title: 'Beach Volleyball',
      description: 'Outdoor-Training auf Sand',
      text: 'Beachvolleyball – Sonne, Sand und Action. Schnelle Ballwechsel, Bewegung im Sand und echtes Teamplay. Wir spielen 2x2 und 3x3 – Mixed-Teams sind herzlich willkommen. Im Mittelpunkt stehen Dynamik und Spaß am Spiel.',
      scheduleTitle: 'Trainingszeiten 2026',
      scheduleSubtitle: 'Beachvolleyball (April - September)',
      rentalNote:
        'Unsere Beachvolleyballfelder können gemietet werden. Bei Fragen oder Reservierungen kontaktieren Sie bitte Heinrich Treubert unter +49 179 9785541.',
      features: [
        { icon: Sun, title: 'Outdoor', text: 'Training unter freiem Himmel' },
        { icon: Waves, title: 'Sandplätze', text: 'Professionelle Beachanlage mit 3 Feldern' },
      ],
      facility: {
        title: 'Beachvolleyball-Anlage',
        operatedBy: 'Die Beachvolleyball-Anlagen werden vom TSV Zizishausen betrieben.',
        usage: 'Unsere Teams nutzen die Plätze im Rahmen einer partnerschaftlichen Kooperation.',
        addressLabel: 'Adresse',
        address: 'Beachvolleyball TSV Zizishausen, Auf d. Insel 1, 72622 Nürtingen',
        mapLabel: 'Karte',
        linkIntro: 'Weitere Informationen zur Anlage finden Sie hier:',
        linkText: 'Zur TSV-Zizishausen-Seite',
      },
    },
    en: {
      title: 'Beach Volleyball',
      description: 'Outdoor training on sand',
      text:
        'Beach volleyball means sun, sand, and action. Fast rallies, movement in the sand, and real teamwork. We play 2x2 and 3x3, and mixed teams are warmly welcome. The focus is on dynamism and the joy of the game.',
      scheduleTitle: 'Training Schedule 2026',
      scheduleSubtitle: 'Beach Volleyball (April - September)',
      rentalNote:
        'Our beach volleyball courts can be rented. For questions or reservations, please contact Heinrich Treubert at +49 179 9785541.',
      features: [
        { icon: Sun, title: 'Outdoor', text: 'Training in the open air' },
        { icon: Waves, title: 'Sand Courts', text: 'Professional beach facility with 3 courts' },
      ],
      facility: {
        title: 'Beach Volleyball Facility',
        operatedBy: 'The beach volleyball courts are operated by TSV Zizishausen.',
        usage: 'Our teams use the courts as part of a collaborative partnership.',
        addressLabel: 'Address',
        address: 'Beachvolleyball TSV Zizishausen, Auf d. Insel 1, 72622 Nürtingen',
        mapLabel: 'Map',
        linkIntro: 'Find more information about the facility here:',
        linkText: 'Visit the TSV Zizishausen page',
      },
    },
    ru: {
      title: 'Пляжный волейбол',
      description: 'Тренировки на песке',
      text:
        'Пляжный волейбол — это солнце, песок и драйв. Быстрые розыгрыши, движение по песку и настоящее командное взаимодействие. Играем 2х2 и 3х3, смешанные команды всегда приветствуются. В центре внимания — динамика и удовольствие от игры.',
      scheduleTitle: 'Расписание тренировок 2026',
      scheduleSubtitle: 'Пляжный волейбол (апрель - сентябрь)',
      rentalNote:
        'Наши площадки для пляжного волейбола можно арендовать. По вопросам или бронированию свяжитесь с Генрихом Тройбертом по телефону +49 179 9785541.',
      features: [
        { icon: Sun, title: 'На открытом воздухе', text: 'Тренировки под открытым небом' },
        { icon: Waves, title: 'Песчаные площадки', text: 'Профессиональная пляжная площадка с 3 площадками' },
      ],
      facility: {
        title: 'Пляжный комплекс',
        operatedBy: 'Площадки пляжного волейбола управляются TSV Zizishausen.',
        usage: 'Наши команды используют эти площадки в рамках партнёрского сотрудничества.',
        addressLabel: 'Адрес',
        address: 'Beachvolleyball TSV Zizishausen, Auf d. Insel 1, 72622 Nürtingen',
        mapLabel: 'Карта',
        linkIntro: 'Подробнее о площадке:',
        linkText: 'Сайт TSV Zizishausen',
      },
    },
    it: {
      title: 'Beach Volleyball',
      description: 'Allenamenti all’aperto sulla sabbia',
      text:
        'Beach volley: sole, sabbia e azione. Scambi veloci, movimento sulla sabbia e vero gioco di squadra. Giochiamo 2x2 e 3x3, le squadre miste sono sempre benvenute. Al centro ci sono dinamica ed entusiasmo per il gioco.',
      scheduleTitle: 'Orari allenamenti 2026',
      scheduleSubtitle: 'Beach volley (aprile - settembre)',
      rentalNote:
        'I nostri campi da beach volley possono essere affittati. Per domande o prenotazioni contatta Heinrich Treubert al numero +49 179 9785541.',
      features: [
        { icon: Sun, title: 'All’aperto', text: 'Allenamenti all’aria aperta' },
        {
          icon: Waves,
          title: 'Campi in sabbia',
          text: 'Impianto beach professionale con 3 campi',
        },
      ],
      facility: {
        title: 'Impianto di beach volley',
        operatedBy: 'I campi da beach volley sono gestiti dal TSV Zizishausen.',
        usage: 'Le nostre squadre utilizzano i campi nell’ambito di una collaborazione partner.',
        addressLabel: 'Indirizzo',
        address: 'Beachvolleyball TSV Zizishausen, Auf d. Insel 1, 72622 Nürtingen',
        mapLabel: 'Mappa',
        linkIntro: "Ulteriori informazioni sull'impianto:",
        linkText: 'Vai al sito TSV Zizishausen',
      },
    },
  };

  const t = content[language];

  const seoTitle =
    language === 'de'
      ? 'Beachvolleyball Unterensingen | Beachvolleyball Training | SKV Unterensingen'
      : t.title;
  const seoDescription =
    language === 'de'
      ? 'Beachvolleyball rund um Unterensingen mit SKV Unterensingen: Beachvolleyball Training, Trainingszeiten Beachvolleyball und Sandplätze.'
      : t.description;
  const seoKeywords =
    language === 'de'
      ? [
          'Beachvolleyball Unterensingen',
          'Beach Volleyball Unterensingen',
          'Beachvolleyball Training Unterensingen',
          'Trainingszeiten Beachvolleyball Unterensingen',
          'SKV Unterensingen Beachvolleyball',
        ]
      : undefined;
  const seoJsonLd =
    language === 'de'
      ? {
          '@context': 'https://schema.org',
          '@type': 'SportsActivityLocation',
          name: 'Beachvolleyball SKV Unterensingen',
          sport: 'Beach Volleyball',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Auf d. Insel 1',
            postalCode: '72622',
            addressLocality: 'Nürtingen',
            addressCountry: 'DE',
          },
        }
      : undefined;

  // Transform schedule data for current language
  const scheduleItems = beachSchedule2026.map((item) => ({
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

        {/* Facility Info */}
        <div className="mt-16 max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-8 space-y-4">
            <h2 className="text-2xl font-semibold text-primary-900">{t.facility.title}</h2>
            <p className="text-neutral-700">{t.facility.operatedBy}</p>
            <p className="text-neutral-700">{t.facility.usage}</p>
            <div>
              <p className="text-sm uppercase tracking-wide text-neutral-500">{t.facility.addressLabel}</p>
              <p className="text-body text-neutral-900 font-medium">{t.facility.address}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-wide text-neutral-500">{t.facility.mapLabel}</p>
              <p className="text-neutral-900 font-medium">Auf d. Insel 1, 72622 Nürtingen (TSV Zizishausen)</p>
            </div>
            <div className="pt-2">
              <p className="text-neutral-700">{t.facility.linkIntro}</p>
              <a
                href="https://www.tsv-zizishausen.de/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 mt-2 text-primary-600 font-semibold hover:text-primary-700 transition-colors"
              >
                {t.facility.linkText} →
              </a>
            </div>
          </div>
          <div className="w-full h-80 bg-neutral-100 rounded-2xl overflow-hidden shadow-lg border border-amber-100">
            <iframe
              src={BEACH_FACILITY_MAP_URL}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Beach volleyball map"
            ></iframe>
          </div>
        </div>

        {/* Weather Widget */}
        <div className="max-w-2xl mx-auto mt-12">
          <WeatherWidget />
        </div>

        <div className="max-w-3xl mx-auto mt-8 px-6 text-center">
          <p className="text-neutral-800 font-medium">{t.rentalNote}</p>
        </div>
      </div>
    </div>
  );
};

export default BeachPage;
