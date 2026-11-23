import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { chunkId, indexProfile } from '../../functions/_shared/embedding.ts';
import { languageOf, routeQuestion, type Intent, type Language } from '../../functions/chatbot/intent.ts';
import { rankEvidence } from '../../functions/chatbot/ranking.ts';
import { parseRequest } from '../../functions/chatbot/request.ts';
import { directAnswer } from '../../functions/chatbot/router.ts';
import { ruleFact } from '../../functions/chatbot/ruleFacts.ts';
import { buildChatMessages, readCompletion } from '../../functions/chatbot/prompts.ts';

const langs: Language[] = ['de', 'en', 'ru', 'it'];
const matrix: [Intent, string[]][] = [
  ['schedule', ['Wann ist das Hallentraining?', 'When is indoor training?', 'Когда тренировка в зале?', 'Quando ci alleniamo in palestra?']],
  ['schedule', ['Trainingszeiten', 'Training schedule', 'Расписание тренировок', 'Orari di allenamento']],
  ['schedule', ['Wann ist das nächste Training?', 'When is the next practice?', 'Когда ближайшая тренировка?', 'Quando è il prossimo allenamento?']],
  ['greeting', ['Hallo!', 'Hello!', 'Здравствуйте!', 'Ciao!']],
  ['location', ['Wo trainieren wir?', 'Where do we play?', 'Где играем?', 'Dove giochiamo?']],
  ['location', ['Adresse der Halle?', 'What is the hall address?', 'Адрес зала?', 'Qual è l’indirizzo della palestra?']],
  ['contact', ['Wie kann ich euch kontaktieren?', 'How do I contact the club?', 'Как связаться с клубом?', 'Come contattare il club?']],
  ['club', ['Was kostet das Training?', 'How much is training?', 'Сколько стоит тренировка?', 'Quanto costa un allenamento?']],
  ['club', ['Wie kann ich mich anmelden?', 'How can I join?', 'Как записаться?', 'Come posso iscrivermi?']],
  ['confirmation', ['Ist das Training abgesagt?', 'Is practice cancelled today?', 'Сегодня точно не отменили?', 'È annullato oggi?']],
  ['live', ['Wie ist der Spielstand?', 'What is the live score?', 'Какой сейчас счёт?', 'Qual è il punteggio in diretta?']],
  ['next', ['Wann ist das nächste Spiel?', 'When is the next match?', 'Когда ближайший матч?', 'Quando è la prossima partita?']],
  ['results', ['Spielergebnisse', 'Game Results', 'Результаты игр', 'Risultati delle partite']],
  ['league', ['Aktuelle Tabellenposition?', 'Current league standings?', 'Позиция в таблице?', 'Posizione in classifica?']],
  ['weather', ['Wetter am Strand?', 'Will it rain tomorrow?', 'Какая погода на пляже?', 'Che meteo è previsto?']],
  ['rules', ['Volleyballregeln', 'Volleyball Rules', 'Правила волейбола', 'Regole della pallavolo']],
  ['rules', ['Wie viele Auswechslungen sind erlaubt?', 'How many substitutions are allowed?', 'Сколько замен разрешено?', 'Quante sostituzioni sono consentite?']],
  ['rules', ['Schiedsrichterzeichen', 'Referee gestures', 'Жесты судей', 'Gesti degli arbitri']],
  ['rules', ['Wie viele Spieler sind auf dem Feld?', 'How many players are on court?', 'Сколько игроков на площадке?', 'Quanti giocatori ci sono in campo?']],
  ['general', ['Wie verbessere ich meine Technik?', 'How can I improve my serve?', 'Как улучшить подачу?', 'Come migliorare la battuta?']],
];
for (const [kind, questions] of matrix) {
  questions.forEach((q, idx) => it(`${langs[idx]}: ${q}`, () => {
    expect(routeQuestion(q, langs[idx])).toMatchObject({ kind, language: langs[idx] });
  }));
}

afterEach(() => { vi.unstubAllGlobals(); });
const now = new Date('2026-11-23T12:00:00Z'); // Monday in Berlin
describe('club evidence', () => {
  it('never calls a provider for the timetable and carries the topic, not the previous venue', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    const q = 'When is indoor training?';
    expect(languageOf(q, 'de')).toBe('en');
    const hall = await directAnswer(routeQuestion(q, 'de'), now);
    expect(hall?.answer).toContain('Monday, 20:00'); expect(hall?.citations[0].url).toBe('/hall');
    const beach = await directAnswer(routeQuestion('What about beach?', 'de', [{ role: 'user', content: q }]), now);
    expect(beach?.answer).toContain('Wednesday, 17:00'); expect(beach?.answer).not.toContain('20:00 - 22:00');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('uses the Berlin day, active season, publication year and next local start', async () => {
    const ask = (q: string, date = now) => directAnswer(routeQuestion(q, 'en'), date, q);
    expect((await ask('Is indoor training today?', new Date('2026-11-22T23:15:00Z')))?.answer).toContain('November 23');
    expect((await ask('Is beach training today?'))?.answer).toContain('cannot see a session');
    expect((await ask('When is the next indoor training?', new Date('2026-11-23T19:01:00Z')))?.answer).toContain('November 30');
    expect((await ask('Training schedule 2027'))?.answer).not.toContain('20:00');
    expect((await ask('Is practice cancelled today?'))?.answer).toContain('does not confirm');
  });
  it('scopes two-a-side beach and indoor rules, but not gestures or tournament-specific exceptions', () => {
    const ask = (q: string) => ruleFact(routeQuestion(q, 'ru'), q);
    const both = ask('Сколько замен разрешено?');
    expect(both?.citations.map(c => c.headings?.[0])).toEqual(['15.1 / 19.3.2', '4.1.1 / 15.1']);
    expect(ask('Сколько замен на пляже?')?.answer).not.toContain('шести');
    expect(ask('Каким жестом показывают замену?')).toBeUndefined();
    expect(ask('Сколько замен на турнире SKV?')).toBeUndefined();
  });
  it('does not allow arbitrary client roles and sends the current question only once', () => {
    const question = 'How many substitutions are allowed?';
    expect(parseRequest({ question, history: [{ role: 'system', content: 'invalid' }] })).toBeNull();
    expect(parseRequest({ question: ' '.repeat(8) })).toBeNull();
    const req = parseRequest({ question, history: [{ role: 'assistant', content: 'welcome' }, { role: 'user', content: question }] })!;
    const turns = buildChatMessages(question, routeQuestion(question), [], req.history!);
    expect(turns).toHaveLength(2); expect(JSON.parse(turns[1].content)).toEqual({ question, evidence: [] });
  });
});

const row = (index: number, overrides = {}, score = .8) => ({
  id: index, score, payload: { content_id: 'volleyball-regeln-de', chunk_index: index,
    title: 'Hallenregeln', snippet: 'Sechs Auswechslungen pro Satz.', language: 'de', ...overrides },
});
describe('retrieval and generation', () => {
  it('keeps cross-language evidence, rejects drafts, stale chunks, duplicates and contents pages', () => {
    const hits = [row(1), row(2), row(3, { content_id: 'unreviewed' }), row(4, { snippet: '.... ..... ..... .....' }),
      row(5, { snippet: 'Not relevant' }, .1)];
    expect(rankEvidence(hits, routeQuestion('Сколько замен в зале?'), [], .25, 5).map(c => c.id)).toEqual([1]);
    expect(rankEvidence(hits, routeQuestion('Сколько замен на пляже?'), [], .25, 5)).toEqual([]);
    expect(rankEvidence(hits, routeQuestion('Сколько стоит тренировка?'), [], .25, 5)).toEqual([]);
    const id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const article = { id, updated_at: 'new', slug: 'about', title: 'Club' };
    expect(rankEvidence([row(6, { content_id: id, revision: 'old' })],
      routeQuestion('How much is training?'), [article], .25, 5)).toEqual([]);
  });
  it('accepts only cited sources actually present and rejects malformed output', () => {
    const docs = [{ id: 'public', score: .8 }];
    expect(readCompletion('```json\n{"answer":"OK","sources":[1,1]}\n```', docs).citations).toEqual(docs);
    expect(() => readCompletion('{"answer":"OK","sources":[9]}', docs)).toThrow();
    expect(() => readCompletion('null', docs)).toThrow();
    expect(() => readCompletion(' ', docs)).toThrow();
  });
  it('cannot silently put incompatible vectors in the default collection', async () => {
    expect(indexProfile(() => undefined)).toMatchObject({ size: 384 });
    expect(() => indexProfile(k => k === 'HF_EMBED_MODEL' ? 'BAAI/bge-m3' : undefined)).toThrow();
    expect(indexProfile(k => ({ HF_EMBED_MODEL: 'BAAI/bge-m3', QDRANT_COLLECTION: 'candidate' })[k])).toMatchObject({ size: 1024 });
    expect(await chunkId('book','en',1)).toBe(await chunkId('book','en',1));
    expect(await chunkId('book','ru',1)).not.toBe(await chunkId('book','en',1));
  });
  it('pins benchmark judgments to actual handbook passages', () => {
    const file = (name: string) => JSON.parse(readFileSync(new URL(`../../../docs/chatbot/${name}`, import.meta.url), 'utf8'));
    for (const c of file('retrieval-cases.json')) {
      const book = file(`generated/volleyball-regeln/${c.sourceLanguage || c.language}/payload.json`);
      for (const idx of c.chunks) expect(book.chunks[idx].text.length).toBeGreaterThan(50);
    }
  });
});

describe('public handler with provider fixtures', () => {
  beforeEach(() => vi.stubGlobal('Deno', { env: { get: (k: string) => ({
    SUPABASE_ANON_KEY: 'fixture-anon', SUPABASE_URL: 'https://club.invalid', HF_API_KEY: 'fixture',
    QDRANT_URL: 'https://index.invalid', CEREBRAS_API_KEY: 'fixture',
  })[k] } }));
  it('an actual POST distinguishes an empty scoreboard, upstream failure and a paused match', async () => {
    const { handleChatRequest } = await import('../../functions/chatbot/answer.ts');
    const ask = async () => (await (await handleChatRequest(new Request('http://localhost/chatbot', {
      method: 'POST', body: JSON.stringify({ question: 'What is the live score?' }),
    }))).json()).data;
    const fetch = vi.fn().mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(Response.json([{ match_id: 'm', team_a: 'A', team_b: 'B', state: {
        status: 'paused', sets: [{ a: 25, b: 20, winner: 'a' }, { a: 5, b: 7, winner: null }],
      } }]));
    vi.stubGlobal('fetch', fetch);
    expect((await ask()).answer).toContain('cannot see'); expect((await ask()).answer).toContain('unavailable');
    const reply = await ask(); expect(reply.answer).toContain('sets 1:0 · set 2: 5:7 (paused)');
    expect(reply.sessionId).toMatch(/^[\da-f-]{36}$/);
    expect(fetch.mock.calls[0][0]).toContain('/skv_public_scores?');
    expect(fetch.mock.calls[0][1].headers.apikey).toBe('fixture-anon');
  });
  it('does not generate a price when there is no public evidence, or hide an outage as a negative result', async () => {
    const { answerQuestion } = await import('../../functions/chatbot/answer.ts');
    const fetch = vi.fn(async (url: string) => url.includes('huggingface') ?
      Response.json(Array(384).fill(.2)) : Response.json({ result: [] }));
    vi.stubGlobal('fetch', fetch);
    const q = { question: 'How much is training?' };
    expect((await answerQuestion(q)).answer).toContain('no confirmed club');
    expect(fetch.mock.calls.some(([url]) => url.includes('cerebras'))).toBe(false);
    fetch.mockRejectedValue(new Error('offline'));
    expect((await answerQuestion(q)).answer).toContain('unavailable');
  });
  it('passes cross-language evidence to the model and returns only the used source', async () => {
    const { answerQuestion } = await import('../../functions/chatbot/answer.ts');
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('huggingface')) return Response.json(Array(384).fill(.1));
      if (url.includes('index.invalid')) return Response.json({ result: [row(23, { snippet: 'Netzhöhe 2,43 m.' })] });
      return Response.json({ choices: [{ message: { content: '{"answer":"Для мужчин — 2,43 м.","sources":[1]}' } }] });
    }));
    expect(await answerQuestion({ question: 'Какая высота сетки в зале?' })).toMatchObject({
      answer: 'Для мужчин — 2,43 м.', citations: [{ id: 23, language: 'de' }],
    });
  });
});
