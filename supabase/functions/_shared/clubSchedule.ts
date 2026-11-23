/**
 * Training schedule data for 2026
 */

export interface ScheduleEntry {
  day: {
    de: string;
    en: string;
    ru: string;
    it: string;
  };
  time: string;
  location?: {
    de: string;
    en: string;
    ru: string;
    it: string;
  };
}

export const publishedYear = 2026;
export const contactEmail = 'volleyball@skvunterensingen.de';
export const venues = {
  hall: { address: 'Bettwiesenhalle, Schulstraße 43, 72669 Unterensingen', from: 10, until: 4 },
  beach: { address: 'Beachvolleyball TSV Zizishausen, Auf d. Insel 1, 72622 Nürtingen', from: 4, until: 9 },
} as const;

export const hallSchedule2026: ScheduleEntry[] = [
  {
    day: { de: 'Montag', en: 'Monday', ru: 'Понедельник', it: 'Lunedì' },
    time: '20:00 - 22:00',
    location: {
      de: 'Bettwiesenhalle',
      en: 'Bettwiesenhalle',
      ru: 'Bettwiesenhalle',
      it: 'Bettwiesenhalle',
    },
  },
];

export const beachSchedule2026: ScheduleEntry[] = [
  {
    day: { de: 'Montag', en: 'Monday', ru: 'Понедельник', it: 'Lunedì' },
    time: '17:00 - 20:00',
    location: {
      de: 'Beachanlage Zizishausen',
      en: 'Beach courts Zizishausen',
      ru: 'Пляжные площадки Zizishausen',
      it: 'Impianto beach Zizishausen',
    },
  },
  {
    day: { de: 'Mittwoch', en: 'Wednesday', ru: 'Среда', it: 'Mercoledì' },
    time: '17:00 - 20:00',
    location: {
      de: 'Beachanlage Zizishausen',
      en: 'Beach courts Zizishausen',
      ru: 'Пляжные площадки Zizishausen',
      it: 'Impianto beach Zizishausen',
    },
  },
];

export const scheduleLabels = {
  de: {
    title: 'Trainingszeiten 2026',
    hallTitle: 'Hallentraining',
    beachTitle: 'Beachvolleyball',
    hallLink: '/hall',
    beachLink: '/beach',
    viewAll: 'Details',
    season: 'Saison',
    note: 'Änderungen vorbehalten. Bei Fragen kontaktieren Sie uns.',
  },
  en: {
    title: 'Training Schedule 2026',
    hallTitle: 'Indoor Training',
    beachTitle: 'Beach Volleyball',
    hallLink: '/hall',
    beachLink: '/beach',
    viewAll: 'Details',
    season: 'Season',
    note: 'Subject to change. Contact us for questions.',
  },
  ru: {
    title: 'Расписание тренировок 2026',
    hallTitle: 'Зал',
    beachTitle: 'Пляжный волейбол',
    hallLink: '/hall',
    beachLink: '/beach',
    viewAll: 'Подробнее',
    season: 'Сезон',
    note: 'Возможны изменения. По вопросам обращайтесь к нам.',
  },
  it: {
    title: 'Orari allenamenti 2026',
    hallTitle: 'Allenamenti in palestra',
    beachTitle: 'Beach volley',
    hallLink: '/hall',
    beachLink: '/beach',
    viewAll: 'Dettagli',
    season: 'Stagione',
    note: 'Soggetto a modifiche. Contattaci per domande.',
  },
};
