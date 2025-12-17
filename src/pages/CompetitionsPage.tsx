import React, { useMemo } from 'react';
import { CalendarDays, MapPin, Trophy, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';
import type { Language } from '../types';
import { useStandings } from '../hooks/useStandings';
import { Alert, Spinner } from '../components/ui';
import { normalizeTeamName, isOurTeamName } from '../lib/teamNaming';
import { Seo } from '../components/Seo';

const formatDate = (isoDate: string | null, language: Language) => {
  if (!isoDate) return null;
  try {
    const locale =
      language === 'de'
        ? 'de-DE'
        : language === 'ru'
        ? 'ru-RU'
        : language === 'it'
        ? 'it-IT'
        : 'en-GB';
    const formatter = new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    return formatter.format(new Date(isoDate));
  } catch (error) {
    console.error('Failed to format match date', error);
    return new Date(isoDate).toLocaleString();
  }
};

const content = {
  de: {
    hero: {
      title: 'Wettbewerbe & Ergebnisse',
      subtitle: 'Alle Ligaresultate und Spieltermine von SKV Unterensingen',
      cta: 'Zum Kontakt',
    },
    standings: {
      title: 'Aktuelle Tabelle',
      position: 'Platz',
      team: 'Team',
      matches: 'Spiele',
      wins: 'Siege',
      sets: 'Sätze',
      points: 'Punkte',
      updated: 'Stand:',
      noData: 'Aktuell liegen keine Daten vor.',
      loading: 'Tabellen werden geladen…',
    },
    schedule: {
      titleUpcoming: 'Bevorstehende Spiele',
      titlePlayed: 'Vergangene Spiele',
      titleAllMatches: 'Spielplan & Ergebnisse',
      allMatchesSubtitle: 'Alle Spiele der Saison - gespielte und bevorstehende Begegnungen',
      opponent: 'Gegner',
      location: 'Ort',
      result: 'Ergebnis',
      date: 'Datum',
      team1: 'Team 1',
      team2: 'Team 2',
      matchNumber: 'Nr.',
      noUpcoming: 'Keine bevorstehenden Spiele geplant.',
      noPlayed: 'Noch keine Ergebnisse verfügbar.',
      noMatches: 'Keine Spiele verfügbar.',
    },
    teamCard: {
      title: 'Team-Highlights',
      matches: 'Spiele',
      wins: 'Siege',
      sets: 'Sätze',
      points: 'Punkte',
    },
  },
  en: {
    hero: {
      title: 'Competitions & Results',
      subtitle: 'All league standings and fixtures for SKV Unterensingen',
      cta: 'Contact Us',
    },
    standings: {
      title: 'League Standings',
      position: 'Pos',
      team: 'Team',
      matches: 'Matches',
      wins: 'Wins',
      sets: 'Sets',
      points: 'Points',
      updated: 'Updated:',
      noData: 'No standings data available right now.',
      loading: 'Loading standings…',
    },
    schedule: {
      titleUpcoming: 'Upcoming Matches',
      titlePlayed: 'Recent Results',
      titleAllMatches: 'Schedule & Results',
      allMatchesSubtitle: 'All season matches - played and upcoming fixtures',
      opponent: 'Opponent',
      location: 'Venue',
      result: 'Result',
      date: 'Date',
      team1: 'Team 1',
      team2: 'Team 2',
      matchNumber: '#',
      noUpcoming: 'No upcoming matches scheduled.',
      noPlayed: 'No results recorded yet.',
      noMatches: 'No matches available.',
    },
    teamCard: {
      title: 'Team Highlights',
      matches: 'Matches',
      wins: 'Wins',
      sets: 'Sets',
      points: 'Points',
    },
  },
  it: {
    hero: {
      title: 'Competizioni e risultati',
      subtitle: 'Tutte le classifiche e il calendario di SKV Unterensingen',
      cta: 'Contattaci',
    },
    standings: {
      title: 'Classifica attuale',
      position: 'Pos',
      team: 'Squadra',
      matches: 'Partite',
      wins: 'Vittorie',
      sets: 'Set',
      points: 'Punti',
      updated: 'Aggiornato:',
      noData: 'Al momento non ci sono dati di classifica.',
      loading: 'Caricamento classifica…',
    },
    schedule: {
      titleUpcoming: 'Partite in programma',
      titlePlayed: 'Risultati recenti',
      titleAllMatches: 'Calendario e risultati',
      allMatchesSubtitle: 'Tutte le partite della stagione - giocate e future',
      opponent: 'Avversario',
      location: 'Luogo',
      result: 'Risultato',
      date: 'Data',
      team1: 'Squadra 1',
      team2: 'Squadra 2',
      matchNumber: 'N.',
      noUpcoming: 'Nessuna partita in programma.',
      noPlayed: 'Non ci sono ancora risultati.',
      noMatches: 'Nessuna partita disponibile.',
    },
    teamCard: {
      title: 'Highlights della squadra',
      matches: 'Partite',
      wins: 'Vittorie',
      sets: 'Set',
      points: 'Punti',
    },
  },
  ru: {
    hero: {
      title: 'Соревнования и результаты',
      subtitle: 'Вся турнирная таблица и календарь SKV Unterensingen',
      cta: 'Связаться с нами',
    },
    standings: {
      title: 'Текущая таблица',
      position: 'Место',
      team: 'Команда',
      matches: 'Игры',
      wins: 'Победы',
      sets: 'Сеты',
      points: 'Очки',
      updated: 'Обновлено:',
      noData: 'Данные таблицы пока недоступны.',
      loading: 'Загружаем таблицу…',
    },
    schedule: {
      titleUpcoming: 'Ближайшие матчи',
      titlePlayed: 'Прошедшие игры',
      titleAllMatches: 'Расписание и результаты',
      allMatchesSubtitle: 'Все матчи сезона - сыгранные и предстоящие',
      opponent: 'Соперник',
      location: 'Площадка',
      result: 'Результат',
      date: 'Дата',
      team1: 'Команда 1',
      team2: 'Команда 2',
      matchNumber: '№',
      noUpcoming: 'Ближайшие матчи пока не запланированы.',
      noPlayed: 'Результатов пока нет.',
      noMatches: 'Матчей нет.',
    },
    teamCard: {
      title: 'Статистика команды',
      matches: 'Игры',
      wins: 'Победы',
      sets: 'Сеты',
      points: 'Очки',
    },
  },
};

const CompetitionsPage: React.FC = () => {
  const { language } = useLanguage();
  const { data, isLoading, error } = useStandings();
  const t = content[language];

  const seoTitle = t.hero.title;
  const seoDescription = t.hero.subtitle;

  const formattedUpdatedAt = useMemo(() => {
    if (!data?.lastUpdated) return null;
    return formatDate(data.lastUpdated, language);
  }, [data?.lastUpdated, language]);

  const schedule = useMemo(() => data?.schedule ?? [], [data?.schedule]);

  const { upcomingMatches, playedMatches } = useMemo(() => {
    const now = new Date();
    const upcoming = [] as typeof schedule;
    const played = [] as typeof schedule;

    for (const match of schedule) {
      if (match.result) {
        played.push(match);
        continue;
      }
      if (!match.isoDate) {
        upcoming.push(match);
        continue;
      }
      const matchDate = new Date(match.isoDate);
      if (Number.isNaN(matchDate.getTime())) {
        upcoming.push(match);
      } else if (matchDate >= now) {
        upcoming.push(match);
      } else {
        played.push(match);
      }
    }

    const sortByDate = (list: typeof schedule, asc = true) =>
      [...list].sort((a, b) => {
        if (!a.isoDate) return 1;
        if (!b.isoDate) return -1;
        return asc
          ? new Date(a.isoDate).getTime() - new Date(b.isoDate).getTime()
          : new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime();
      });

    return {
      upcomingMatches: sortByDate(upcoming, true),
      playedMatches: sortByDate(played, false),
    };
  }, [schedule]);

  return (
    <div className="min-h-screen pt-24 pb-20 bg-neutral-50">
      <Seo title={seoTitle} description={seoDescription} imagePath="/images/SKV_Volleyball.png" />
      <section className="bg-gradient-to-br from-[#1f4588] via-[#25509a] to-[#1f4588] text-white py-20">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-accent-200 uppercase tracking-widest text-xs font-semibold">
              <Trophy className="w-4 h-4" /> SKV Unterensingen Volleyball
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold mt-4 mb-4">{t.hero.title}</h1>
            <p className="text-lg text-white/80 mb-8">{t.hero.subtitle}</p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-accent-500 text-neutral-900 px-6 py-3 rounded-md font-semibold hover:bg-accent-400 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <span>{t.hero.cta}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 lg:px-12 -mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-xl border border-white/40 overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-primary-900">{t.standings.title}</h2>
                  <p className="text-sm text-neutral-500 flex items-center gap-2 mt-1">
                    <CalendarDays className="w-4 h-4" />
                    {formattedUpdatedAt ? (
                      <span>
                        {t.standings.updated} {formattedUpdatedAt}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="p-6 flex justify-center">
                    <Spinner text={t.standings.loading} />
                  </div>
                ) : error ? (
                  <div className="p-6">
                    <Alert type="error" title="Error">
                      {error.message}
                    </Alert>
                  </div>
                ) : !data?.standings?.length ? (
                  <div className="p-6 text-sm text-neutral-600">{t.standings.noData}</div>
                ) : (
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-neutral-50 text-neutral-500 uppercase text-xs tracking-wide">
                      <tr>
                        <th className="px-4 py-3">{t.standings.position}</th>
                        <th className="px-4 py-3">{t.standings.team}</th>
                        <th className="px-4 py-3 text-center">{t.standings.matches}</th>
                        <th className="px-4 py-3 text-center">{t.standings.wins}</th>
                        <th className="px-4 py-3 text-center">{t.standings.sets}</th>
                        <th className="px-4 py-3 text-center">{t.standings.points}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 text-neutral-800">
                      {data.standings.map((standing) => {
                        const isTeamRow = isOurTeamName(standing.name);
                        return (
                          <tr
                            key={`${standing.position}-${standing.name}`}
                            className={isTeamRow ? 'bg-accent-50 font-semibold text-primary-900' : ''}
                          >
                            <td className="px-4 py-3">{standing.position}</td>
                            <td className="px-4 py-3">{normalizeTeamName(standing.name)}</td>
                            <td className="px-4 py-3 text-center">{standing.matches}</td>
                            <td className="px-4 py-3 text-center">{standing.wins}</td>
                            <td className="px-4 py-3 text-center">{standing.sets}</td>
                            <td className="px-4 py-3 text-center">{standing.points}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-white/40 p-6">
              <div className="flex items-center gap-3 mb-4">
                <CalendarDays className="w-5 h-5 text-primary-500" />
                <h3 className="text-xl font-semibold text-primary-900">{t.schedule.titleUpcoming}</h3>
              </div>
              {upcomingMatches.length === 0 ? (
                <p className="text-sm text-neutral-600">{t.schedule.noUpcoming}</p>
              ) : (
                <div className="space-y-3">
                  {upcomingMatches.map((match) => (
                    <div key={match.id} className="border border-neutral-100 rounded-lg p-4 hover:border-primary-200 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-neutral-500 text-xs uppercase tracking-wide font-medium">
                          {formatDate(match.isoDate, language) ?? match.date}
                        </p>
                        {match.matchNumber && (
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-semibold">
                            #{match.matchNumber}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-primary-900 text-sm leading-snug">
                        {match.isHome ? (
                          <>
                            <span className="text-accent-600">{normalizeTeamName(match.homeTeam)}</span>
                            <span className="text-neutral-400 mx-1">vs</span>
                            <span>{match.opponent}</span>
                          </>
                        ) : (
                          <>
                            <span>{match.opponent}</span>
                            <span className="text-neutral-400 mx-1">vs</span>
                            <span className="text-accent-600">{normalizeTeamName(match.awayTeam)}</span>
                          </>
                        )}
                      </p>
                      {match.location && (
                        <div className="flex items-center gap-2 text-neutral-600 mt-2 text-xs">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="line-clamp-1">{match.location}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6 lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-white/40 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-primary-500" />
                <h3 className="text-xl font-semibold text-primary-900">{t.teamCard.title}</h3>
              </div>
              {data?.team ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-neutral-500 uppercase tracking-wide">{t.standings.position}</p>
                    <p className="text-4xl font-bold text-primary-900">{data.team.position}</p>
                    <p className="text-sm text-neutral-600 mt-1">{normalizeTeamName(data.team.name)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-neutral-500">{t.teamCard.matches}</p>
                      <p className="text-xl font-semibold">{data.team.matches}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">{t.teamCard.wins}</p>
                      <p className="text-xl font-semibold">{data.team.wins}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">{t.teamCard.sets}</p>
                      <p className="text-xl font-semibold">{data.team.sets}</p>
                    </div>
                    <div>
                      <p className="text-neutral-500">{t.teamCard.points}</p>
                      <p className="text-xl font-semibold">{data.team.points}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-600">{t.standings.noData}</p>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section className="container mx-auto px-6 lg:px-12 mt-16">
        <div className="bg-white rounded-2xl shadow-xl border border-white/40 overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-primary-500" />
              <h3 className="text-2xl font-semibold text-primary-900">{t.schedule.titleAllMatches}</h3>
            </div>
            <p className="text-sm text-neutral-500 mt-1">
              {t.schedule.allMatchesSubtitle}
            </p>
          </div>
          {schedule.length === 0 ? (
            <div className="p-6">
              <p className="text-sm text-neutral-600">{t.schedule.noMatches}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-neutral-500 uppercase text-xs tracking-wide border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">{t.schedule.date}</th>
                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">{t.schedule.matchNumber}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t.schedule.team1}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t.schedule.team2}</th>
                    <th className="px-4 py-3 text-left font-semibold">{t.schedule.result}</th>
                    <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">{t.schedule.location}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {schedule.map((match) => {
                    const isOurTeamHome = match.isHome;
                    const hasResult = Boolean(match.result);
                    return (
                      <tr
                        key={match.id}
                        className={`hover:bg-neutral-50 transition-colors ${hasResult ? 'bg-white' : 'bg-blue-50/30'}`}
                      >
                        <td className="px-4 py-3 text-neutral-600 whitespace-nowrap text-xs">
                          {formatDate(match.isoDate, language) ?? match.date}
                        </td>
                        <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                          {match.matchNumber ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              isOurTeamHome ? 'font-semibold text-primary-900' : 'text-neutral-700'
                            }
                          >
                            {normalizeTeamName(match.homeTeam)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              !isOurTeamHome ? 'font-semibold text-primary-900' : 'text-neutral-700'
                            }
                          >
                            {normalizeTeamName(match.awayTeam)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {match.result ? (
                            <span className="font-semibold text-primary-700">{match.result}</span>
                          ) : (
                            <span className="text-neutral-400 text-xs italic">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 text-xs hidden lg:table-cell">
                          <div className="max-w-xs truncate" title={match.location ?? ''}>
                            {match.location ?? '—'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CompetitionsPage;
