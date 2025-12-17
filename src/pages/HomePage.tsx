import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, MapPin, Trophy, Calendar, Clock, Home, Sun } from 'lucide-react';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui';
import { Seo } from '../components/Seo';
import { useLanguage } from '../lib/LanguageContext';
import { useStandings } from '../hooks/useStandings';
import { HomeResultsSection } from '../components/home/HomeResultsSection';
import { hallSchedule2026, beachSchedule2026 } from '../data/schedule';

const HomePage: React.FC = () => {
  const { language } = useLanguage();
  const { data, isLoading: isLoadingResults, error: resultsError } = useStandings();

  const CLUB_FOUNDING_YEAR = 1898;
  const now = new Date();
  const currentYear = now.getFullYear();
  const clubAgeThisYear = currentYear - CLUB_FOUNDING_YEAR;

  const content = {
    de: {
      hero: {
        title: 'SKV Unterensingen Volleyball',
        subtitle: 'Wir sind SKV Unterensingen – Wir stoppen offensive Angriffe',
        description: 'Professionelles Volleyballtraining in Unterensingen, Deutschland',
        cta: 'Jetzt mitmachen',
        badge: 'VOLLEYBALL FÜR ALLE LEVEL',
        aboutLinkLabel: 'Mehr über uns',
      },
      metrics: [
        { icon: MapPin, label: 'Standort', value: 'Unterensingen' },
        { icon: Calendar, label: 'Gegründet', value: `${CLUB_FOUNDING_YEAR}` },
        { icon: Calendar, label: 'In diesem Jahr werden wir', value: `${clubAgeThisYear} Jahre alt` },
        { icon: Users, label: 'Altersgruppe', value: '12-80 Jahre' },
        { icon: Trophy, label: 'Spezialisierung', value: 'Volleyball' },
      ],
      about: {
        title: 'Über SKV Unterensingen Volleyball',
        text: 'Wir entwickeln Volleyball-Talente durch innovative Trainingsmethoden, während wir eine inklusive Gemeinschaft aufbauen, in der jeder Spieler sein volles Potenzial erreichen kann.',
        philosophy: 'Unsere Philosophie: "Trainiere wie du spielst" - basierend auf FIVB-Methoden.',
      },
      sections: [
        {
          title: 'Halle',
          description: 'Bettwiesenhalle Unterensingen mit moderner Ausstattung',
          link: '/hall',
        },
        {
          title: 'Beach Volleyball',
          description: 'Outdoor-Programme auf Sand',
          link: '/beach',
        },
        {
          title: 'Training',
          description: 'Professionelle Trainingsmethoden und Videos',
          link: '/training',
        },
      ],
      sectionsCtaLabel: 'Mehr erfahren',
      results: {
        title: 'Aktuelle Tabelle',
        updatedPrefix: 'Stand:',
        loading: 'Lade aktuelle Ergebnisse...',
        error: 'Die Ergebnisse konnten derzeit nicht geladen werden.',
        noData: 'Aktuell liegen keine Ergebnisse vor.',
        teamHighlightTitle: 'Unsere Platzierung',
        table: {
          position: 'Platz',
          team: 'Mannschaft',
          matches: 'Spiele',
          wins: 'Siege',
          sets: 'Sätze',
          points: 'Punkte',
        },
      },
      cta: {
        title: 'Bereit mitzumachen?',
        subtitle:
          'Kontaktieren Sie uns heute und werden Sie Teil der SKV Unterensingen Familie!',
        primary: 'Kontakt aufnehmen',
        secondary: 'Trainingsangebot',
      },
      schedule: {
        title: 'Trainingszeiten 2026',
        hallTitle: 'Hallentraining',
        beachTitle: 'Beachvolleyball',
        viewDetails: 'Details',
      },
    },
    en: {
      hero: {
        title: 'SKV Unterensingen Volleyball',
        subtitle: 'We are SKV Unterensingen – We stop offensive attacks',
        description: 'Professional volleyball training in Unterensingen, Germany',
        cta: 'Join Now',
        badge: 'VOLLEYBALL FOR EVERYONE',
        aboutLinkLabel: 'Learn about us',
      },
      metrics: [
        { icon: MapPin, label: 'Location', value: 'Unterensingen' },
        { icon: Calendar, label: 'Founded', value: `${CLUB_FOUNDING_YEAR}` },
        { icon: Calendar, label: 'This year we turn', value: `${clubAgeThisYear} years` },
        { icon: Users, label: 'Age Group', value: '12-80 years' },
        { icon: Trophy, label: 'Specialization', value: 'Volleyball' },
      ],
      about: {
        title: 'About SKV Unterensingen Volleyball',
        text: 'We develop volleyball talents through innovative training methods while building an inclusive community where every player can reach their full potential.',
        philosophy: 'Our philosophy: "Train like you play" - based on FIVB methods.',
      },
      sections: [
        {
          title: 'Hall',
          description: 'Bettwiesenhalle Unterensingen with modern equipment',
          link: '/hall',
        },
        {
          title: 'Beach Volleyball',
          description: 'Outdoor programs on sand',
          link: '/beach',
        },
        {
          title: 'Training',
          description: 'Professional training methods and videos',
          link: '/training',
        },
      ],
      sectionsCtaLabel: 'Learn more',
      results: {
        title: 'League Standings',
        updatedPrefix: 'Updated:',
        loading: 'Loading the latest results...',
        error: 'We could not load the latest results right now.',
        noData: 'No standings data is available at the moment.',
        teamHighlightTitle: 'Our Position',
        table: {
          position: 'Pos',
          team: 'Team',
          matches: 'Matches',
          wins: 'Wins',
          sets: 'Sets',
          points: 'Points',
        },
      },
      cta: {
        title: 'Ready to join?',
        subtitle:
          'Contact us today and become part of the SKV Unterensingen family!',
        primary: 'Get in touch',
        secondary: 'Training options',
      },
      schedule: {
        title: 'Training Schedule 2026',
        hallTitle: 'Indoor Training',
        beachTitle: 'Beach Volleyball',
        viewDetails: 'Details',
      },
    },
    ru: {
      hero: {
        title: 'SKV Unterensingen Volleyball',
        subtitle: 'Мы SKV Unterensingen – мы останавливаем атаки',
        description: 'Профессиональные тренировки по волейболу в Унтерензингене, Германия',
        cta: 'Присоединиться',
        badge: 'ВОЛЕЙБОЛ ДЛЯ КАЖДОГО',
        aboutLinkLabel: 'Узнать о нас',
      },
      metrics: [
        { icon: MapPin, label: 'Расположение', value: 'Унтерензинген' },
        { icon: Calendar, label: 'Основана', value: `${CLUB_FOUNDING_YEAR}` },
        { icon: Calendar, label: 'В этом году нам', value: `${clubAgeThisYear} лет` },
        { icon: Users, label: 'Возраст', value: '12-80 лет' },
        { icon: Trophy, label: 'Специализация', value: 'Волейбол' },
      ],
      about: {
        title: 'О команде SKV Unterensingen Volleyball',
        text: 'Мы развиваем таланты волейбола через инновационные методы тренировок, создавая инклюзивное сообщество, где каждый игрок может раскрыть свой потенциал.',
        philosophy: 'Наша философия: "Тренируйся как играешь" - на основе методов FIVB.',
      },
      sections: [
        {
          title: 'Зал',
          description: 'Зал Bettwiesenhalle в Унтерензингене с современным оборудованием',
          link: '/hall',
        },
        {
          title: 'Пляжный волейбол',
          description: 'Программы на открытом воздухе',
          link: '/beach',
        },
        {
          title: 'Тренировки',
          description: 'Профессиональные методики и видео',
          link: '/training',
        },
      ],
      sectionsCtaLabel: 'Узнать больше',
      results: {
        title: 'Текущая таблица',
        updatedPrefix: 'Обновлено:',
        loading: 'Загружаем актуальные результаты...',
        error: 'Не удалось загрузить результаты в данный момент.',
        noData: 'Данные таблицы пока недоступны.',
        teamHighlightTitle: 'Наша позиция',
        table: {
          position: 'Место',
          team: 'Команда',
          matches: 'Игры',
          wins: 'Победы',
          sets: 'Сеты',
          points: 'Очки',
        },
      },
      cta: {
        title: 'Готовы присоединиться?',
        subtitle:
          'Свяжитесь с нами сегодня и станьте частью семьи SKV Unterensingen!',
        primary: 'Связаться',
        secondary: 'Тренировочные программы',
      },
      schedule: {
        title: 'Расписание тренировок 2026',
        hallTitle: 'Зал',
        beachTitle: 'Пляжный волейбол',
        viewDetails: 'Подробнее',
      },
    },
    it: {
      hero: {
        title: 'SKV Unterensingen Volleyball',
        subtitle: 'Siamo SKV Unterensingen – fermiamo gli attacchi offensivi',
        description: 'Allenamenti di pallavolo professionali a Unterensingen, Germania',
        cta: 'Unisciti a noi',
        badge: 'PALLAVOLO PER TUTTI I LIVELLI',
        aboutLinkLabel: 'Scopri di più su di noi',
      },
      metrics: [
        { icon: MapPin, label: 'Luogo', value: 'Unterensingen' },
        { icon: Calendar, label: 'Fondato', value: `${CLUB_FOUNDING_YEAR}` },
        { icon: Calendar, label: 'Quest’anno compiamo', value: `${clubAgeThisYear} anni` },
        { icon: Users, label: 'Fascia di età', value: '12-80 anni' },
        { icon: Trophy, label: 'Specializzazione', value: 'Pallavolo' },
      ],
      about: {
        title: 'Su SKV Unterensingen Volleyball',
        text: 'Sviluppiamo talenti della pallavolo con metodi di allenamento innovativi, creando una comunità inclusiva in cui ogni giocatore può raggiungere il proprio pieno potenziale.',
        philosophy: 'La nostra filosofia: "Allenati come giochi" - basata sui metodi FIVB.',
      },
      sections: [
        {
          title: 'Palestra',
          description: 'Bettwiesenhalle Unterensingen con attrezzature moderne',
          link: '/hall',
        },
        {
          title: 'Beach Volleyball',
          description: 'Programmi all’aperto sulla sabbia',
          link: '/beach',
        },
        {
          title: 'Allenamenti',
          description: 'Metodi di allenamento professionali e video',
          link: '/training',
        },
      ],
      sectionsCtaLabel: 'Scopri di più',
      results: {
        title: 'Classifica attuale',
        updatedPrefix: 'Aggiornato:',
        loading: 'Caricamento degli ultimi risultati...',
        error: 'Al momento non è stato possibile caricare gli ultimi risultati.',
        noData: 'Al momento non ci sono dati di classifica.',
        teamHighlightTitle: 'La nostra posizione',
        table: {
          position: 'Pos',
          team: 'Squadra',
          matches: 'Partite',
          wins: 'Vittorie',
          sets: 'Set',
          points: 'Punti',
        },
      },
      cta: {
        title: 'Pronto a unirti a noi?',
        subtitle:
          'Contattaci oggi e diventa parte della famiglia SKV Unterensingen!',
        primary: 'Contattaci',
        secondary: 'Offerta di allenamenti',
      },
      schedule: {
        title: 'Orari degli allenamenti 2026',
        hallTitle: 'Allenamenti in palestra',
        beachTitle: 'Beachvolley',
        viewDetails: 'Dettagli',
      },
    },
  };

  const t = content[language];

  const seoTitle = t.hero.title;
  const seoDescription = t.hero.description;

  // Transform schedule data for current language
  const hallItems = hallSchedule2026.map((item) => ({
    day: item.day[language],
    time: item.time,
    location: item.location?.[language],
  }));

  const beachItems = beachSchedule2026.map((item) => ({
    day: item.day[language],
    time: item.time,
    location: item.location?.[language],
  }));

  const formattedUpdatedAt = useMemo(() => {
    if (!data?.lastUpdated) return null;
    try {
      const locale =
        language === 'de'
          ? 'de-DE'
          : language === 'ru'
          ? 'ru-RU'
          : language === 'it'
          ? 'it-IT'
          : 'en-GB';
      return new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(data.lastUpdated));
    } catch (error) {
      console.error('Failed to format date', error);
      return new Date(data.lastUpdated).toLocaleString();
    }
  }, [data?.lastUpdated, language]);

  return (
    <div className="min-h-screen">
      <Seo
        title={seoTitle}
        description={seoDescription}
        imagePath="/images/volleyball_team_group_photo_dramatic_lighting.jpg"
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary-950">
        <div className="absolute inset-0">
          <img
            src="/images/volleyball_team_group_photo_dramatic_lighting.jpg"
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover object-center opacity-40"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950/85 via-primary-900/75 to-primary-800/80" />
        <div className="relative mx-auto flex min-h-[620px] max-w-6xl flex-col items-center justify-center gap-10 px-6 py-24 text-center sm:gap-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
            {t.hero.badge}
          </div>
          <div className="space-y-6">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t.hero.title}
            </h1>
            <p className="text-lg text-neutral-100/90 sm:text-xl lg:text-2xl">{t.hero.subtitle}</p>
            <p className="mx-auto max-w-3xl text-base text-neutral-100/80 sm:text-lg">{t.hero.description}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" variant="accent" className="group px-8 text-base font-semibold shadow-lg shadow-accent-500/40">
              <Link to="/contact">
                <span>{t.hero.cta}</span>
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="border border-white/20 bg-white/10 px-6 text-white hover:bg-white/20">
              <Link to="/about">{t.hero.aboutLinkLabel}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="bg-neutral-50 py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
            {t.metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <Card key={index} className="border-none bg-white/90 shadow-lg shadow-primary-900/5">
                  <CardHeader className="flex items-center justify-center">
                    <span className="rounded-full bg-primary-100/70 p-4 text-primary-700 shadow-inner">
                      <Icon className="h-8 w-8" />
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-2 text-center">
                    <CardTitle className="text-base sm:text-lg lg:text-xl xl:text-3xl font-semibold text-primary-900 leading-snug">
                      {metric.value}
                    </CardTitle>
                    <CardDescription className="text-sm text-neutral-600">{metric.label}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-neutral-50">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-h2 font-bold text-primary-900 mb-6">{t.about.title}</h2>
            <p className="text-body-lg text-neutral-700 mb-6">{t.about.text}</p>
            <p className="text-body text-neutral-700 italic">{t.about.philosophy}</p>
          </div>
        </div>
      </section>

      {/* Sections Grid */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {t.sections.map((section, index) => (
              <Card key={index} className="group border-none bg-gradient-to-br from-white to-neutral-50 shadow-lg shadow-primary-900/5">
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold text-primary-900 transition-colors group-hover:text-primary-600">
                    {section.title}
                  </CardTitle>
                  <CardDescription className="text-base text-neutral-600">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="ghost" className="group/cta gap-2 px-0 text-primary-600 hover:text-primary-700">
                    <Link to={section.link}>
                      {t.sectionsCtaLabel}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/cta:translate-x-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Training Schedule Section */}
      <section className="bg-neutral-50 py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <Calendar className="w-6 h-6 text-primary-600" />
              <h2 className="text-3xl font-bold text-primary-900">{t.schedule.title}</h2>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Hall Schedule */}
              <div className="bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-neutral-100 bg-gradient-to-r from-primary-50 to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md">
                        <Home className="w-4 h-4" />
                      </div>
                      <h3 className="font-semibold text-primary-900">{t.schedule.hallTitle}</h3>
                    </div>
                    <Link to="/hall" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                      {t.schedule.viewDetails} →
                    </Link>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {hallItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="relative flex items-center gap-3 p-3 rounded-lg bg-primary-50 border border-primary-100"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg bg-gradient-to-b from-primary-400 to-primary-600" />
                      <div className="flex-1 pl-1">
                        <p className="font-medium text-primary-900 text-sm">{item.day}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-primary-400" />
                            {item.time}
                          </span>
                          {item.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-primary-400" />
                              {item.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Beach Schedule */}
              <div className="bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
                        <Sun className="w-4 h-4" />
                      </div>
                      <h3 className="font-semibold text-primary-900">{t.schedule.beachTitle}</h3>
                    </div>
                    <Link to="/beach" className="text-xs text-amber-600 hover:text-amber-700 font-medium">
                      {t.schedule.viewDetails} →
                    </Link>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {beachItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="relative flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg bg-gradient-to-b from-amber-400 to-orange-500" />
                      <div className="flex-1 pl-1">
                        <p className="font-medium text-primary-900 text-sm">{item.day}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-500" />
                            {item.time}
                          </span>
                          {item.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-500" />
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
          </div>
        </div>
      </section>

      {/* Results Section */}
      <HomeResultsSection
        t={t.results}
        data={data}
        isLoading={isLoadingResults}
        error={resultsError}
        formattedUpdatedAt={formattedUpdatedAt}
      />

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-700 to-primary-900 py-20 text-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="relative container mx-auto px-6">
          <h2 className="text-4xl font-bold sm:text-5xl">{t.cta.title}</h2>
          <p className="mt-6 text-lg sm:text-xl">{t.cta.subtitle}</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" variant="accent" className="px-8 text-base font-semibold shadow-lg shadow-accent-500/40">
              <Link to="/contact">
                {t.cta.primary}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="border border-white/30 bg-white/10 px-6 text-white hover:bg-white/20">
              <Link to="/training">{t.cta.secondary}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
