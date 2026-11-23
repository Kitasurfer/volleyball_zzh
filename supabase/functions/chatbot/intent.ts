import type { HistoryMessage } from './types.ts';

export type Language = 'de' | 'en' | 'ru' | 'it';
export type Venue = 'hall' | 'beach';
export type Intent = 'greeting' | 'location' | 'schedule' | 'confirmation' | 'contact' |
  'club' | 'live' | 'next' | 'results' | 'league' | 'weather' | 'rules' | 'general';
export interface Route { kind: Intent; venue?: Venue; search: string; language: Language }

const words = (text: string) => text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
// Only a trailing * matches an inflection/compound. "rain" must never match "training".
const has = (tokens: string[], terms: string) => terms.split(' ').some(term =>
  term.endsWith('*') ? tokens.some(t => t.startsWith(term.slice(0, -1))) : tokens.includes(term));

export function languageOf(question: string, fallback?: string): Language {
  const tokens = words(question);
  const selected = ['de', 'en', 'ru', 'it'].includes(fallback ?? '') ? fallback as Language : 'de';
  if (tokens.some(t => /[а-яё]/u.test(t))) return 'ru';
  const markers = {
    de: 'wie wo wann was wer ist sind im der die das ein ihr wir welche nächste nächsten spielen gibt adresse hallentraining trainingszeiten spielergebnisse schiedsrichterzeichen volleyballregeln hallo danke',
    en: 'when where how what which who is are does many next today our we can the game results rules gestures hello thanks about',
    it: 'quando dove come qual quale quali quanto quanti quante chi è sono della delle gli il la le pallavolo allenamento allenamenti palestra partita partite oggi grazie ciao invece',
  };
  const scores = Object.entries(markers).map(([lang, list]) => ({
    lang: lang as Language, n: tokens.filter(t => list.split(' ').includes(t)).length,
  })).sort((a, b) => b.n - a.n);
  return scores[0].n > scores[1].n ? scores[0].lang : selected;
}

function classify(t: string[]): Intent {
  if (/^(привет|здравствуй(?:те)?|добрый (?:день|вечер)|доброе утро|спасибо|пока|hi|hey|hello|thanks|thank you|good (?:morning|afternoon|evening)|hallo|guten (?:tag|morgen|abend)|danke|ciao|salve|buongiorno|buonasera|grazie)$/.test(t.join(' '))) return 'greeting';
  if (has(t, 'цена цену взнос* стоимост* стоит стоят стоить пробн* записать* запись аренд* gebühr* beitrag* preis* kostet kosten probetraining anmeld* fee fees price cost membership join register trial quota costo costa iscr* prova mieten rental affitto') ||
    (t.join(' ').includes('how much') && has(t, 'training practice membership'))) return 'club';
  if (has(t, 'отмен* состоится точно abgesagt ausfall fällt cancelled canceled cancellation confirmed definitely confermat* annullat* sicuro')) return 'confirmation';
  if (has(t, 'таблиц* standings classifica tabelle* tabellen* vlw')) return 'league';
  if (has(t, 'научиться улучшить техник* упражнен* technique improve drills verbessern übung* technik migliorare tecnica esercizi')) return 'general';
  if (has(t, 'жест* сигнал* gesture* signal* handzeichen schiedsrichterzeichen gesti gesto segnal* замен* auswechsl* wechsel* substitut* sostituz* касани* розыгрыш* touches libero либеро rotation* ротаци* regola regole regel* volleyballregeln rules правил* размер* dimension* netzhöhe высот* очков timeout* auszeit* тайм сетах') ||
    (has(t, 'many quanti quante wie сколько') && has(t, 'points players sets hits player punti giocatori tocchi punkte punkten spieler sätze очк* игрок* сет*')) ||
    (has(t, 'court field campo spielfeld net rete netz') && has(t, 'size big long large groß hoch high alta alto grande'))) return 'rules';
  if (has(t, 'погод* дожд* ветер weather rain rainy forecast wind wetter regen regnet meteo pioggia piove vento')) return 'weather';
  if (has(t, 'контакт* связать* написать почт* телефон* contact* kontakt* email mail telefon* contatt* scrivere')) return 'contact';
  if (has(t, 'результат* выиграл* победил* ergebnis* spielergebnis* gewonnen results result won risultati risultato vinto')) return 'results';
  const match = has(t, 'матч* игр игра игры игру spiel spiele match matches game games partita partite');
  if (match && has(t, 'следующ* ближайш* когда nächst* wann next upcoming when prossim* quando')) return 'next';
  if (has(t, 'счёт счет табло live spielstand* scoreboard score punteggio diretta')) return 'live';
  if (has(t, 'адрес* добраться anfahrt adresse standort address directions indirizzo arrivare') ||
    (has(t, 'где куда wo where dove') && !match && has(t,
      'тренир* зал* пляж* train trainieren training hall halle beach allen* palestra giochiamo play spielen играем')) ||
    (has(t, 'wo where где dove') && has(t, 'играем spielen play giochiamo'))) return 'location';
  if (has(t, 'расписан* тренировка тренировки тренировок тренировку тренировке schedule timetable trainingszeit* hallentraining beachtraining orari allenament* alleniam*') ||
    (has(t, 'training train practice trainieren тренир*') &&
      (t.length <= 3 || has(t, 'when wann когда сколько время time today heute nächste next indoor hall beach')))) return 'schedule';
  if (match && has(t, 'сейчас gerade now ora')) return 'live';
  if (match || has(t, 'клуб* скв skv club verein* trainer coach mitglied*')) return 'club';
  return 'general';
}

function venueOf(t: string[]): Venue | undefined {
  const hall = has(t, 'зал зале зала классич* indoor hall halle hallen* palestra palazzetto');
  const beach = has(t, 'пляж* песке beach beachvolley* strand* sand spiaggia sabbia');
  return hall === beach ? undefined : hall ? 'hall' : 'beach';
}

const venueNames: Record<Language, Record<Venue, string>> = {
  de: { hall: 'Hallenvolleyball', beach: 'Beachvolleyball' },
  en: { hall: 'indoor volleyball', beach: 'beach volleyball' },
  ru: { hall: 'волейбол в зале', beach: 'пляжный волейбол' },
  it: { hall: 'pallavolo indoor', beach: 'beach volley' },
};

export function routeQuestion(question: string, uiLanguage?: string, history: HistoryMessage[] = []): Route {
  const lastUser = history.filter(h => h.role === 'user').at(-1);
  const language = languageOf(question, lastUser && words(question).length <= 5
    ? languageOf(lastUser.content, uiLanguage) : uiLanguage);
  let kind: Intent = 'general', venue: Venue | undefined, previous = '';
  for (const text of [...history.filter(h => h.role === 'user').slice(-6).map(h => h.content), question]) {
    const t = words(text);
    const nextKind = classify(t);
    const explicit = venueOf(t);
    const followup = t.length <= 9 && (has(t.slice(0, 2), 'а и and und auch e invece') ||
      t.join(' ').startsWith('what about ') || (explicit && t.length <= 4) || has(t, 'там there dort lì'));
    if (nextKind === 'general' && followup && previous) {
      venue = explicit ?? venue;
    } else {
      venue = explicit ?? (nextKind === kind || followup ? venue : undefined);
      kind = nextKind;
      previous = text;
    }
  }
  const contextual = previous && previous !== question && languageOf(previous, language) === language
    ? `${previous}\n${question}` : question;
  return { kind, venue, language, search: venue ? `${contextual} (${venueNames[language][venue]})` : contextual };
}
