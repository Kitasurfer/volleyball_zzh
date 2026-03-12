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
        { icon: Trophy, label: 'Abteilung', value: 'Volleyball' },
      ],
      about: {
        title: 'Über SKV Unterensingen Volleyball',
        text: 'Wir sind im Volleyball breit aufgestellt und mit Leidenschaft dabei. Für uns stehen die Freude am Spiel, Teamgeist und eine starke Gemeinschaft im Mittelpunkt. Ob ambitioniert oder einfach aus Spaß – bei uns ist jeder willkommen, der Volleyball liebt.',
        philosophy: 'Unsere Philosophie: "Trainiere wie du spielst".',
      },
      sections: [
        {
          title: 'Halle',
          description: 'Bettwiesenhalle Unterensingen mit moderner Ausstattung',
          link: '/hall',
        },
        {
          title: 'Beach Volleyball',
          description:
            'In Kooperation mit dem TSV Zizishausen. Unsere Teams nutzen die Beachvolleyball-Anlagen des TSV im Rahmen einer partnerschaftlichen Zusammenarbeit.',
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
        badge: 'SKV Unterensingen Volleyball',
        highlights: [
          { label: 'Club', value: 'Volleyball & Beachvolleyball in Unterensingen' },
          { label: 'Training', value: 'Hallen- und Beachtraining für verschiedene Leistungsstufen' },
          { label: 'Kontakt', value: 'Schneller Weg zu Einstieg, Fragen und allen wichtigen Infos' },
        ],
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
        { icon: Trophy, label: 'Department', value: 'Volleyball' },
      ],
      about: {
        title: 'About SKV Unterensingen Volleyball',
        text: 'We are widely active in volleyball and bring full passion to everything we do. The joy of the game, team spirit, and a strong community are at the heart of our club. Whether you pursue ambitious goals or simply play for fun, everyone who loves volleyball is welcome.',
        philosophy: 'Our philosophy: "Train like you play".',
      },
      sections: [
        {
          title: 'Hall',
          description: 'Bettwiesenhalle Unterensingen with modern equipment',
          link: '/hall',
        },
        {
          title: 'Beach Volleyball',
          description:
            'In cooperation with TSV Zizishausen. Our teams use the TSV beach volleyball facilities as part of this partnership.',
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
        badge: 'SKV Unterensingen Volleyball',
        highlights: [
          { label: 'Club', value: 'Volleyball & beach volleyball in Unterensingen' },
          { label: 'Training', value: 'Hall and beach sessions for multiple levels' },
          { label: 'Contact', value: 'Fast path to join, ask, and get all key details' },
        ],
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
        { icon: Trophy, label: 'Отделение', value: 'Волейбол' },
      ],
      about: {
        title: 'О команде SKV Unterensingen Volleyball',
        text: 'Мы широко развиваем волейбол и делаем это с полной отдачей. Радость игры, командный дух и сильное сообщество — в центре нашего клуба. Будь то амбициозные цели или игра ради удовольствия, каждый, кто любит волейбол, у нас желанный гость.',
        philosophy: 'Наша философия: "Тренируйся как играешь".',
      },
      sections: [
        {
          title: 'Зал',
          description: 'Зал Bettwiesenhalle в Унтерензингене с современным оборудованием',
          link: '/hall',
        },
        {
          title: 'Пляжный волейбол',
          description:
            'В сотрудничестве с TSV Zizishausen. Наши команды используют пляжные площадки TSV в рамках партнёрского сотрудничества.',
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
        badge: 'SKV Unterensingen Volleyball',
        highlights: [
          { label: 'Клуб', value: 'Волейбол и пляжный волейбол в Унтерензингене' },
          { label: 'Тренировки', value: 'Зал и пляж для разных уровней подготовки' },
          { label: 'Контакт', value: 'Быстрый путь к участию, вопросам и всей важной информации' },
        ],
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
        { icon: Trophy, label: 'Reparto', value: 'Pallavolo' },
      ],
      about: {
        title: 'Su SKV Unterensingen Volleyball',
        text: 'Siamo ampiamente attivi nella pallavolo e la viviamo con grande passione. La gioia del gioco, lo spirito di squadra e una comunità forte sono al centro del nostro club. Che tu abbia obiettivi ambiziosi o giochi solo per divertimento, chiunque ami la pallavolo è il benvenuto.',
        philosophy: 'La nostra filosofia: "Allenati come giochi".',
      },
      sections: [
        {
          title: 'Palestra',
          description: 'Bettwiesenhalle Unterensingen con attrezzature moderne',
          link: '/hall',
        },
        {
          title: 'Beach Volleyball',
          description:
            'In collaborazione con il TSV Zizishausen. Le nostre squadre utilizzano gli impianti di beach volley del TSV nell’ambito di questa partnership.',
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
        badge: 'SKV Unterensingen Volleyball',
        highlights: [
          { label: 'Club', value: 'Pallavolo e beach volley a Unterensingen' },
          { label: 'Allenamento', value: 'Sessioni indoor e beach per diversi livelli' },
          { label: 'Contatto', value: 'Accesso rapido per unirti, chiedere e ottenere tutti i dettagli' },
        ],
      },
      schedule: {
        title: 'Orari degli allenamenti 2026',
        hallTitle: 'Allenamenti in palestra',
        beachTitle: 'Beachvolley',
        viewDetails: 'Dettagli',
      },
    },
  };

  const t = (content[language as keyof typeof content] ?? content.de);
  const metricTones = [
    {
      shell: 'from-sky-50 via-white to-sky-100/70',
      glow: 'bg-sky-200/50',
      icon: 'from-sky-500 to-cyan-500 text-white',
      border: 'group-hover:border-sky-200/90',
    },
    {
      shell: 'from-violet-50 via-white to-fuchsia-100/70',
      glow: 'bg-fuchsia-200/45',
      icon: 'from-violet-500 to-fuchsia-500 text-white',
      border: 'group-hover:border-fuchsia-200/90',
    },
    {
      shell: 'from-amber-50 via-white to-orange-100/80',
      glow: 'bg-amber-200/50',
      icon: 'from-amber-400 to-orange-500 text-white',
      border: 'group-hover:border-amber-200/90',
    },
    {
      shell: 'from-emerald-50 via-white to-teal-100/70',
      glow: 'bg-emerald-200/50',
      icon: 'from-emerald-500 to-teal-500 text-white',
      border: 'group-hover:border-emerald-200/90',
    },
    {
      shell: 'from-primary-50 via-white to-sky-100/70',
      glow: 'bg-primary-200/50',
      icon: 'from-primary-500 to-primary-700 text-white',
      border: 'group-hover:border-primary-200/90',
    },
  ];
  const sectionTones = [
    {
      surface: 'from-slate-950 via-primary-950 to-primary-900',
      glow: 'bg-sky-400/30',
      line: 'from-sky-300/80 via-sky-100/10 to-transparent',
      iconWrap: 'border-sky-300/25 bg-sky-300/10 text-sky-100',
      cta: 'text-sky-200 group-hover:text-white',
      icon: Home,
    },
    {
      surface: 'from-[#0e1620] via-[#10202d] to-[#1e293b]',
      glow: 'bg-amber-300/25',
      line: 'from-amber-200/80 via-amber-100/10 to-transparent',
      iconWrap: 'border-amber-200/25 bg-amber-300/10 text-amber-100',
      cta: 'text-amber-200 group-hover:text-white',
      icon: Sun,
    },
    {
      surface: 'from-[#08111f] via-[#102040] to-[#1b2d57]',
      glow: 'bg-violet-300/25',
      line: 'from-violet-200/80 via-violet-100/10 to-transparent',
      iconWrap: 'border-violet-200/25 bg-violet-300/10 text-violet-100',
      cta: 'text-violet-200 group-hover:text-white',
      icon: Users,
    },
  ];
  const scheduleTones = {
    hall: {
      shell: 'from-white via-white to-primary-50/90',
      glow: 'bg-sky-300/25',
      header: 'from-primary-50 via-white to-sky-50',
      ring: 'group-hover:border-primary-200/90',
      icon: 'from-primary-500 to-primary-700',
      item: 'bg-primary-50/85 border-primary-100/90 group-hover:border-primary-200',
      line: 'from-primary-400 to-primary-600',
      meta: 'text-primary-400',
      link: 'text-primary-600 group-hover:text-primary-700',
    },
    beach: {
      shell: 'from-white via-white to-amber-50/90',
      glow: 'bg-amber-300/25',
      header: 'from-amber-50 via-orange-50 to-white',
      ring: 'group-hover:border-amber-200/90',
      icon: 'from-amber-400 to-orange-500',
      item: 'bg-amber-50/85 border-amber-100/90 group-hover:border-amber-200',
      line: 'from-amber-400 to-orange-500',
      meta: 'text-amber-500',
      link: 'text-amber-600 group-hover:text-amber-700',
    },
  };

  const seoTitle =
    language === 'de'
      ? 'SKV Unterensingen Volleyball | Volleyball Unterensingen | Beachvolleyball Unterensingen'
      : t.hero.title;
  const seoDescription =
    language === 'de'
      ? 'SKV Unterensingen Volleyball in Unterensingen: Hallenvolleyball, Beachvolleyball und aktuelle Trainingszeiten für Volleyball und Beachvolleyball.'
      : t.hero.description;
  const seoKeywords =
    language === 'de'
      ? [
          'SKV Unterensingen Volleyball',
          'Volleyball Unterensingen',
          'Volleyball Verein Unterensingen',
          'Volleyball Training Unterensingen',
          'Trainingszeiten Volleyball Unterensingen',
          'Beachvolleyball Unterensingen',
          'Beachvolleyball Training Unterensingen',
          'Trainingszeiten Beachvolleyball Unterensingen',
        ]
      : undefined;
  const seoJsonLd =
    language === 'de'
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'SportsActivityLocation',
            name: 'SKV Unterensingen Volleyball',
            sport: ['Volleyball', 'Beach Volleyball'],
            address: {
              '@type': 'PostalAddress',
              streetAddress: 'Schulstraße 43',
              postalCode: '72669',
              addressLocality: 'Unterensingen',
              addressCountry: 'DE',
            },
          },
          {
            '@context': 'https://schema.org',
            '@type': 'SportsEvent',
            name: 'Volleyball Training SKV Unterensingen',
            sport: 'Volleyball',
            location: {
              '@type': 'Place',
              name: 'Bettwiesenhalle Unterensingen',
              address: 'Schulstraße 43, 72669 Unterensingen, Germany',
            },
          },
        ]
      : undefined;

  // Transform schedule data for current language
  const hallItems = hallSchedule2026.map((item) => ({
    day: item.day[language as keyof typeof item.day] ?? item.day.de,
    time: item.time,
    location: item.location?.[language as keyof typeof item.location],
  }));

  const beachItems = beachSchedule2026.map((item) => ({
    day: item.day[language as keyof typeof item.day] ?? item.day.de,
    time: item.time,
    location: item.location?.[language as keyof typeof item.location],
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
        imagePath="https://kxwmkvtxkaczuonnnxlj.supabase.co/storage/v1/object/public/media-public/uploads/1771522090149-yh71uj.jpg"
        keywords={seoKeywords}
        jsonLd={seoJsonLd}
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary-950">
        <div className="absolute inset-0">
          <img
            src="https://kxwmkvtxkaczuonnnxlj.supabase.co/storage/v1/object/public/media-public/uploads/1771522090149-yh71uj.jpg"
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
          <div className="space-y-6 rounded-2xl bg-white/10 px-6 py-5 shadow-lg shadow-primary-900/30 backdrop-blur">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
              {t.hero.title}
            </h1>
            <p className="text-lg text-neutral-50 sm:text-xl lg:text-2xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
              {t.hero.subtitle}
            </p>
            <p className="mx-auto max-w-3xl text-base text-neutral-50 sm:text-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
              {t.hero.description}
            </p>
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
              const tone = metricTones[index % metricTones.length];
              return (
                <Card
                  key={index}
                  className={`group relative overflow-hidden border border-white/70 bg-gradient-to-br ${tone.shell} shadow-[0_18px_45px_rgba(15,23,42,0.06)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_28px_70px_rgba(15,23,42,0.12)] ${tone.border}`}
                >
                  <div className={`absolute -right-10 top-0 h-28 w-28 rounded-full blur-3xl transition duration-500 group-hover:scale-125 ${tone.glow}`} />
                  <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-70" />
                  <CardHeader className="relative flex items-center justify-center">
                    <span className={`rounded-full bg-gradient-to-br p-4 shadow-lg transition duration-500 group-hover:-translate-y-1 group-hover:scale-105 ${tone.icon}`}>
                      <Icon className="h-8 w-8" />
                    </span>
                  </CardHeader>
                  <CardContent className="relative space-y-2 text-center">
                    <CardTitle className="text-base sm:text-lg lg:text-xl xl:text-3xl font-semibold text-primary-900 leading-snug">
                      {metric.value}
                    </CardTitle>
                    <CardDescription className="text-sm text-neutral-600 transition-colors duration-300 group-hover:text-neutral-700">{metric.label}</CardDescription>
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
            {t.sections.map((section, index) => {
              const tone = sectionTones[index % sectionTones.length];
              const SectionIcon = tone.icon;

              return (
                <Card
                  key={index}
                  className="group relative overflow-hidden border border-primary-100/80 bg-white p-0 shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition-all duration-500 hover:-translate-y-3 hover:border-primary-200/90 hover:shadow-[0_34px_90px_rgba(15,23,42,0.16)]"
                >
                  <div className={`absolute -right-14 top-8 h-32 w-32 rounded-full blur-3xl transition duration-500 group-hover:scale-125 ${tone.glow}`} />
                  <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary-200/80 to-transparent" />
                  <div className={`relative mx-6 mt-6 overflow-hidden rounded-[1.6rem] border border-white/10 bg-gradient-to-br ${tone.surface} p-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]`}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_42%)] opacity-80" />
                    <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${tone.line}`} />
                    <div className="relative flex items-start justify-between gap-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.34em] text-white/55">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className={`rounded-full border p-3 transition duration-500 group-hover:-translate-y-1 group-hover:scale-105 ${tone.iconWrap}`}>
                        <SectionIcon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="relative mt-16">
                      <div className="text-sm uppercase tracking-[0.28em] text-white/42">{t.sectionsCtaLabel}</div>
                      <div className="mt-2 text-2xl font-semibold tracking-tight text-white">{section.title}</div>
                      <div className="mt-2 h-px w-16 bg-gradient-to-r from-white/60 to-transparent transition duration-500 group-hover:w-24" />
                    </div>
                  </div>
                  <CardHeader className="relative pb-4">
                    <CardTitle className="text-2xl font-semibold text-primary-900 transition-transform duration-500 group-hover:translate-y-1">
                      {section.title}
                    </CardTitle>
                    <CardDescription className="text-base leading-7 text-neutral-600 transition-colors duration-300 group-hover:text-neutral-700">
                      {section.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative pt-0">
                    <Button asChild variant="ghost" className={`group/cta gap-2 px-0 transition-colors hover:bg-transparent ${tone.cta}`}>
                      <Link to={section.link}>
                        {t.sectionsCtaLabel}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1.5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
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
              <div className={`group relative overflow-hidden rounded-[2rem] border border-neutral-100 bg-gradient-to-br ${scheduleTones.hall.shell} shadow-[0_22px_70px_rgba(15,23,42,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_34px_90px_rgba(15,23,42,0.14)] ${scheduleTones.hall.ring}`}>
                <div className={`absolute -right-10 top-8 h-32 w-32 rounded-full blur-3xl transition duration-500 group-hover:scale-125 ${scheduleTones.hall.glow}`} />
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent" />
                <div className={`relative px-5 py-4 border-b border-neutral-100 bg-gradient-to-r ${scheduleTones.hall.header}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${scheduleTones.hall.icon} text-white shadow-lg transition duration-500 group-hover:-translate-y-1 group-hover:scale-105`}>
                        <Home className="w-4 h-4" />
                      </div>
                      <h3 className="font-semibold text-primary-900">{t.schedule.hallTitle}</h3>
                    </div>
                    <Link to="/hall" className={`group/link inline-flex items-center gap-1 text-xs font-medium transition-colors ${scheduleTones.hall.link}`}>
                      {t.schedule.viewDetails}
                      <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </div>
                <div className="relative p-4 space-y-2">
                  {hallItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`relative flex items-center gap-3 rounded-xl border p-3 transition-all duration-300 ${scheduleTones.hall.item}`}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg bg-gradient-to-b ${scheduleTones.hall.line}`} />
                      <div className="flex-1 pl-1">
                        <p className="font-medium text-primary-900 text-sm">{item.day}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-600">
                          <span className="flex items-center gap-1">
                            <Clock className={`w-3 h-3 ${scheduleTones.hall.meta}`} />
                            {item.time}
                          </span>
                          {item.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className={`w-3 h-3 ${scheduleTones.hall.meta}`} />
                              {item.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`group relative overflow-hidden rounded-[2rem] border border-neutral-100 bg-gradient-to-br ${scheduleTones.beach.shell} shadow-[0_22px_70px_rgba(15,23,42,0.08)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_34px_90px_rgba(15,23,42,0.14)] ${scheduleTones.beach.ring}`}>
                <div className={`absolute -right-10 top-8 h-32 w-32 rounded-full blur-3xl transition duration-500 group-hover:scale-125 ${scheduleTones.beach.glow}`} />
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
                <div className={`relative px-5 py-4 border-b border-amber-100 bg-gradient-to-r ${scheduleTones.beach.header}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${scheduleTones.beach.icon} text-white shadow-lg transition duration-500 group-hover:-translate-y-1 group-hover:scale-105`}>
                        <Sun className="w-4 h-4" />
                      </div>
                      <h3 className="font-semibold text-primary-900">{t.schedule.beachTitle}</h3>
                    </div>
                    <Link to="/beach" className={`group/link inline-flex items-center gap-1 text-xs font-medium transition-colors ${scheduleTones.beach.link}`}>
                      {t.schedule.viewDetails}
                      <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </div>
                <div className="relative p-4 space-y-2">
                  {beachItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`relative flex items-center gap-3 rounded-xl border p-3 transition-all duration-300 ${scheduleTones.beach.item}`}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg bg-gradient-to-b ${scheduleTones.beach.line}`} />
                      <div className="flex-1 pl-1">
                        <p className="font-medium text-primary-900 text-sm">{item.day}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-neutral-600">
                          <span className="flex items-center gap-1">
                            <Clock className={`w-3 h-3 ${scheduleTones.beach.meta}`} />
                            {item.time}
                          </span>
                          {item.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className={`w-3 h-3 ${scheduleTones.beach.meta}`} />
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
      <section className="relative overflow-hidden bg-[#050816] py-24 text-white sm:py-28">
        {/* Radial glows — no dark linear overlay so they're visible */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-5%,_rgba(103,232,249,0.22),_transparent),radial-gradient(circle_at_88%_15%,_rgba(217,70,239,0.20),_transparent_30%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:5rem_5rem]" />
        <div className="relative container mx-auto px-6">
          <div className="mx-auto max-w-5xl">
            <div className="group relative overflow-hidden rounded-[2rem] border border-white/[0.12] bg-white/[0.05] p-8 shadow-[0_40px_120px_-48px_rgba(14,165,233,0.6)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-white/[0.18] hover:shadow-[0_48px_140px_-48px_rgba(14,165,233,0.75)] sm:p-10 lg:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.14),_transparent_36%),linear-gradient(135deg,rgba(14,165,233,0.14),transparent_40%,rgba(217,70,239,0.16))]" />
              <div className="absolute -right-16 top-8 h-40 w-40 rounded-full bg-cyan-400/30 blur-3xl transition duration-700 group-hover:scale-125" />
              <div className="absolute -left-12 bottom-4 h-36 w-36 rounded-full bg-fuchsia-500/22 blur-3xl transition duration-700 group-hover:scale-125" />
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />

              <div className="relative text-center">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/[0.14] bg-white/[0.07] px-4 py-2 text-xs uppercase tracking-[0.32em] text-white/65 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
                  {t.cta.badge}
                </div>

                <h2 className="mx-auto mt-8 max-w-3xl text-balance text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                  {t.cta.title}
                </h2>
                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/70 sm:text-xl">
                  {t.cta.subtitle}
                </p>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  <Button
                    asChild
                    size="lg"
                    variant="accent"
                    className="group/cta px-8 text-base font-semibold shadow-[0_24px_70px_-24px_rgba(56,189,248,0.75)] transition duration-300 hover:-translate-y-0.5"
                  >
                    <Link to="/contact">
                      {t.cta.primary}
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover/cta:translate-x-1.5" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    className="group/ghost border border-white/20 bg-white/[0.09] px-6 text-white backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.15]"
                  >
                    <Link to="/training">
                      {t.cta.secondary}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover/ghost:translate-x-1" />
                    </Link>
                  </Button>
                </div>

                <div className="mt-10 grid gap-3 text-left sm:grid-cols-3">
                  {t.cta.highlights.map((item, index) => (
                    <div
                      key={`${item.label}-${index}`}
                      className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.07] px-4 py-4 backdrop-blur-sm transition duration-300 hover:border-white/[0.20] hover:bg-white/[0.11]"
                    >
                      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                      <div className="text-[11px] uppercase tracking-[0.24em] text-white/55">{item.label}</div>
                      <div className="mt-2 text-sm text-white/85">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
