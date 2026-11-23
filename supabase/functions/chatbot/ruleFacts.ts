import type { Route, Venue } from './intent.ts';
import type { Answer } from './types.ts';

const editions = {
  hall: 'https://www.fivb.com/volleyball/the-game/official-volleyball-rules/',
  beach: 'https://www.fivb.com/wp-content/uploads/2025/02/FIVB-BeachVolleyball_Rules2025_2028-EN-v01.pdf',
};
const names = {
  ru: { hall: 'В зале', beach: 'На пляже' }, de: { hall: 'Halle', beach: 'Beach' },
  en: { hall: 'Indoor', beach: 'Beach' }, it: { hall: 'In palestra', beach: 'Sulla sabbia' },
};
const regularSubs = {
  ru: ['До шести обычных замен на команду за партию. Замещения либеро в это число не входят.',
    'В официальном формате 2×2 замен игроков нет.'],
  de: ['Höchstens sechs reguläre Wechsel pro Team und Satz. Libero-Austauschaktionen zählen nicht dazu.',
    'Im offiziellen 2-gegen-2 gibt es keine Spielerwechsel.'],
  en: ['Up to six regular substitutions per team per set. Libero replacements do not count towards this limit.',
    'There are no player substitutions in official two-a-side beach volleyball.'],
  it: ['Fino a sei sostituzioni regolari per squadra per set. I rimpiazzi del libero non contano in questo limite.',
    'Nel formato ufficiale due contro due non sono previste sostituzioni.'],
};

/** Narrow, edition-specific answers; questions about exceptions or gestures go through retrieval. */
export function ruleFact(route: Route, question: string): Answer | undefined {
  if (route.kind !== 'rules' || /клуб|турнир|tournament|turnier|torneo|verein|skv|gest|жест|signal|zeichen|либеро|libero|injur|травм|verletz|infortun|fipav|jugend|junior|youth|детск|u\d{2}/iu.test(route.search)) return;
  const numeric = /сколько|размер|каков|how (many|big|large)|what (?:is|are) the (size|dimensions)|wie (viele?|groß)|maße|dimension|quant[ei]|grande/iu.test(route.search);
  if (!numeric || /почему|покаж|порядок|warum|ablauf|procedure|perché|why|всего за матч|per match|per game|pro spiel|per partita/iu.test(question)) return;
  const subs = /замен|auswechsl|substitut|sostituz/iu.test(route.search);
  const court = /площадк|court|spielfeld|campo/iu.test(route.search) &&
    /размер|size|dimension|large|big|groß|maße|grande/iu.test(route.search);
  if (!subs && !court) return;
  if (court && /свободн|зон|zone|free|frei|libera|линия|line|linie|linea|net|netz|сетк/iu.test(question)) return;
  const kinds: Venue[] = route.venue ? [route.venue] : ['hall', 'beach'];
  const citations = kinds.map(key => ({
    id: `fivb-2025-2028-${key}`, score: 1, title: `FIVB 2025–2028 · ${names[route.language][key]}`,
    headings: [court ? '1.1' : key === 'hall' ? '15.1 / 19.3.2' : '4.1.1 / 15.1'], url: editions[key],
  }));
  const answer = kinds.map(key => `**${names[route.language][key]} (FIVB):** ${court ?
    (key === 'hall' ? '18 × 9 m' : '16 × 8 m') : regularSubs[route.language][key === 'hall' ? 0 : 1]}`).join('\n\n');
  return { answer, citations };
}
