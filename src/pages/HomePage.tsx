import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, MapPin, Trophy, Calendar } from 'lucide-react';

import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Spinner } from '../components/ui';
import { useLanguage } from '../lib/LanguageContext';
import { useStandings } from '../hooks/useStandings';

type Standing = {
  position: number;
  name: string;
  matches: number;
  wins: number;
  sets: string;
  points: number;
};

const HomePage: React.FC = () => {
  const { language } = useLanguage();
  const { data, isLoading: isLoadingResults, error: resultsError } = useStandings();

  const content = {
    de: {
      hero: {
        title: 'SG TSV Zizishausen/SKV Unterensingen Volleyball',
        subtitle: 'Wir sind SG TSV Zizishausen/SKV Unterensingen - Wir stoppen offensive Angriffe',
        description: 'Professionelles Volleyballtraining in Zizishausen, Deutschland',
        cta: 'Jetzt mitmachen',
      },
      metrics: [
        { icon: MapPin, label: 'Standort', value: 'Zizishausen' },
        { icon: Calendar, label: 'Gegründet', value: '2023' },
        { icon: Users, label: 'Altersgruppe', value: '12-65 Jahre' },
        { icon: Trophy, label: 'Spezialisierung', value: 'Volleyball' },
      ],
      about: {
        title: 'Über SG TSV Zizishausen/SKV Unterensingen',
        text: 'Wir entwickeln Volleyball-Talente durch innovative Trainingsmethoden, während wir eine inklusive Gemeinschaft aufbauen, in der jeder Spieler sein volles Potenzial erreichen kann.',
        philosophy: 'Unsere Philosophie: "Trainiere wie du spielst" - basierend auf FIVB-Methoden.',
      },
      sections: [
        {
          title: 'Halle',
          description: 'Inselhalle Zizishausen mit moderner Ausstattung',
          link: '/hall',
        },
        {
          title: 'Beach Volleyball',
          description: 'Outdoor-Programme auf Sand seit 2025',
          link: '/beach',
        },
        {
          title: 'Training',
          description: 'Professionelle Trainingsmethoden und Videos',
          link: '/training',
        },
      ],
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
    },
    en: {
      hero: {
        title: 'SG TSV Zizishausen/SKV Unterensingen Volleyball',
        subtitle: 'We are SG TSV Zizishausen/SKV Unterensingen - We stop offensive attacks',
        description: 'Professional volleyball training in Zizishausen, Germany',
        cta: 'Join Now',
      },
      metrics: [
        { icon: MapPin, label: 'Location', value: 'Zizishausen' },
        { icon: Calendar, label: 'Founded', value: '2023' },
        { icon: Users, label: 'Age Group', value: '12-65 years' },
        { icon: Trophy, label: 'Specialization', value: 'Volleyball' },
      ],
      about: {
        title: 'About SG TSV Zizishausen/SKV Unterensingen',
        text: 'We develop volleyball talents through innovative training methods while building an inclusive community where every player can reach their full potential.',
        philosophy: 'Our philosophy: "Train like you play" - based on FIVB methods.',
      },
      sections: [
        {
          title: 'Hall',
          description: 'Inselhalle Zizishausen with modern equipment',
          link: '/hall',
        },
        {
          title: 'Beach Volleyball',
          description: 'Outdoor programs on sand since 2025',
          link: '/beach',
        },
        {
          title: 'Training',
          description: 'Professional training methods and videos',
          link: '/training',
        },
      ],
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
    },
    ru: {
      hero: {
        title: 'SG TSV Zizishausen/SKV Unterensingen Volleyball',
        subtitle: 'Мы SG TSV Zizishausen/SKV Unterensingen - Мы останавливаем атаки',
        description: 'Профессиональные тренировки по волейболу в Цицинхаузене, Германия',
        cta: 'Присоединиться',
      },
      metrics: [
        { icon: MapPin, label: 'Расположение', value: 'Цицинхаузен' },
        { icon: Calendar, label: 'Основана', value: '2023' },
        { icon: Users, label: 'Возраст', value: '12-65 лет' },
        { icon: Trophy, label: 'Специализация', value: 'Волейбол' },
      ],
      about: {
        title: 'О команде SG TSV Zizishausen/SKV Unterensingen',
        text: 'Мы развиваем таланты волейбола через инновационные методы тренировок, создавая инклюзивное сообщество, где каждый игрок может раскрыть свой потенциал.',
        philosophy: 'Наша философия: "Тренируйся как играешь" - на основе методов FIVB.',
      },
      sections: [
        {
          title: 'Зал',
          description: 'Зал Inselhalle в Илиле Ининхаузен с современным оборудованием',
          link: '/hall',
        },
        {
          title: 'Пляжный волейбол',
          description: 'Программы на открытом воздухе с 2025 года',
          link: '/beach',
        },
        {
          title: 'Тренировки',
          description: 'Профессиональные методики и видео',
          link: '/training',
        },
      ],
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
    },
  };

  const t = content[language];

  const formattedUpdatedAt = useMemo(() => {
    if (!data?.lastUpdated) return null;
    try {
      const locale = language === 'de' ? 'de-DE' : language === 'ru' ? 'ru-RU' : 'en-GB';
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
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary-950">
        <div className="absolute inset-0">
          <img
            src="/images/volleyball_team_group_photo_dramatic_lighting.jpg"
            alt="Hero background"
            className="h-full w-full object-cover object-center opacity-40"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary-950/85 via-primary-900/75 to-primary-800/80" />
        <div className="relative mx-auto flex min-h-[620px] max-w-6xl flex-col items-center justify-center gap-10 px-6 py-24 text-center sm:gap-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
            {language === 'de' ? 'VOLLEYBALL FÜR ALLE LEVEL' : language === 'ru' ? 'ВОЛЕЙБОЛ ДЛЯ КАЖДОГО' : 'VOLLEYBALL FOR EVERYONE'}
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
              <Link to="/about">
                {language === 'de'
                  ? 'Mehr über uns'
                  : language === 'ru'
                  ? 'Узнать о нас'
                  : 'Learn about us'}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="bg-neutral-50 py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
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
                    <CardTitle className="text-3xl font-bold text-primary-900">{metric.value}</CardTitle>
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
                      {language === 'de' ? 'Mehr erfahren' : language === 'en' ? 'Learn more' : 'Узнать больше'}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/cta:translate-x-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 bg-gradient-to-br from-[#1f4588] via-[#25509a] to-[#1f4588] text-white">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="lg:w-2/3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h2 className="text-h2 font-bold">{t.results.title}</h2>
                {formattedUpdatedAt && (
                  <span className="text-sm text-white/70">
                    {t.results.updatedPrefix} {formattedUpdatedAt}
                  </span>
                )}
              </div>

              <div className="rounded-xl bg-white/10 border border-white/10 overflow-hidden backdrop-blur-sm">
                {isLoadingResults ? (
                  <div className="p-6 flex justify-center">
                    <Spinner color="white" text={t.results.loading} />
                  </div>
                ) : resultsError ? (
                  <div className="p-6">
                    <Alert type="error" title="Error">
                      {t.results.error}
                    </Alert>
                  </div>
                ) : !data?.standings || data.standings.length === 0 ? (
                  <div className="p-6 text-sm text-white/80">{t.results.noData}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead>
                        <tr className="text-xs uppercase tracking-wide text-white/70 border-b border-white/10">
                          <th className="px-4 py-3">{t.results.table.position}</th>
                          <th className="px-4 py-3">{t.results.table.team}</th>
                          <th className="px-4 py-3 text-center">{t.results.table.matches}</th>
                          <th className="px-4 py-3 text-center">{t.results.table.wins}</th>
                          <th className="px-4 py-3 text-center">{t.results.table.sets}</th>
                          <th className="px-4 py-3 text-center">{t.results.table.points}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.standings.map((standing) => {
                          const isTeamRow = data.team
                            ? standing.name === data.team.name
                            : standing.name.includes('Zizishausen');
                          return (
                            <tr
                              key={`${standing.position}-${standing.name}`}
                              className={`border-b border-white/10 ${
                                isTeamRow ? 'bg-white/15' : 'hover:bg-white/5 transition-colors'
                              }`}
                            >
                              <td className="px-4 py-3 font-semibold">{standing.position}</td>
                              <td className="px-4 py-3">{standing.name}</td>
                              <td className="px-4 py-3 text-center">{standing.matches}</td>
                              <td className="px-4 py-3 text-center">{standing.wins}</td>
                              <td className="px-4 py-3 text-center">{standing.sets}</td>
                              <td className="px-4 py-3 text-center font-semibold">{standing.points}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:flex-1">
              <div className="rounded-xl bg-white text-primary-900 p-8 shadow-xl">
                <h3 className="text-h3 font-semibold mb-4">{t.results.teamHighlightTitle}</h3>
                {data?.team ? (
                  <>
                    <div className="flex items-baseline gap-3">
                      <span className="text-6xl font-bold">{data.team.position}</span>
                      <span className="text-sm font-semibold uppercase text-primary-500 tracking-wide">
                        {t.results.table.position}
                      </span>
                    </div>
                    <p className="mt-4 text-body font-medium">{data.team.name}</p>
                    <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-500">{t.results.table.matches}</p>
                        <p className="text-h4 font-semibold">{data.team.matches}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">{t.results.table.wins}</p>
                        <p className="text-h4 font-semibold">{data.team.wins}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">{t.results.table.sets}</p>
                        <p className="text-h4 font-semibold">{data.team.sets}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">{t.results.table.points}</p>
                        <p className="text-h4 font-semibold">{data.team.points}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-neutral-600">{t.results.noData}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-700 to-primary-900 py-20 text-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="relative container mx-auto px-6">
          <h2 className="text-4xl font-bold sm:text-5xl">
            {language === 'de' ? 'Bereit mitzumachen?' : language === 'en' ? 'Ready to join?' : 'Готовы присоединиться?'}
          </h2>
          <p className="mt-6 text-lg sm:text-xl">
            {language === 'de'
              ? 'Kontaktieren Sie uns heute und werden Sie Teil der SG TSV Zizishausen/SKV Unterensingen Familie!'
              : language === 'en'
              ? 'Contact us today and become part of the SG TSV Zizishausen/SKV Unterensingen family!'
              : 'Свяжитесь с нами сегодня и станьте частью семьи SG TSV Zizishausen/SKV Unterensingen!'}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" variant="accent" className="px-8 text-base font-semibold shadow-lg shadow-accent-500/40">
              <Link to="/contact">
                {language === 'de' ? 'Kontakt aufnehmen' : language === 'en' ? 'Get in touch' : 'Связаться'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="ghost" className="border border-white/30 bg-white/10 px-6 text-white hover:bg-white/20">
              <Link to="/training">
                {language === 'de' ? 'Trainingsangebot' : language === 'en' ? 'Training options' : 'Тренировочные программы'}
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
