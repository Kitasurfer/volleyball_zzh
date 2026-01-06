import type { Citation } from './types.ts';
import { maxCitations, minRelevanceScore } from './config.ts';
import { fetchEmbedding, searchKnowledgeBase, mapQdrantResultToCitation } from './rag.ts';

const hasSubstitutionKeyword = (text: string): boolean => {
  const q = text.toLowerCase();
  const keywords = [
    'замен', 'замена', 'замены',
    'auswechslung', 'auswechslungen',
    'substitution', 'substitutions',
    'sostituzione', 'sostituzioni',
    'жест', 'жесты', 'сигнал',
    'schiedsrichterzeichen', 'handzeichen',
    'referee signals', 'referee gestures',
  ];
  return keywords.some((kw) => q.includes(kw));
};

const buildSubstitutionQuery = (language: string): string => {
  if (language === 'ru') {
    return 'Официальные жесты и сигналы судей в волейболе (аут, мяч в поле, удаление, заслон).';
  }
  if (language === 'en') {
    return 'Official referee signals and gestures in volleyball (out, ball in, expulsion, screening).';
  }
  return 'Offizielle Schiedsrichterzeichen im Volleyball (Aus, Ball in, Hinausstellung, Sichtblock).';
};

const enrichWithSubstitutionCitations = async (
  question: string,
  language: string,
  citations: Citation[],
): Promise<Citation[]> => {
  if (!hasSubstitutionKeyword(question)) return citations;

  try {
    const query = buildSubstitutionQuery(language);
    const embedding = await fetchEmbedding(query);
    const results = await searchKnowledgeBase(embedding, language);

    const extra = results
      .filter((item) => item.score >= minRelevanceScore)
      .map((item) => mapQdrantResultToCitation(item) as Citation);

    if (extra.length === 0) return citations;

    const mergedById = new Map<string | number, Citation>();
    for (const c of citations) {
      mergedById.set(c.id, c);
    }
    for (const c of extra) {
      if (!mergedById.has(c.id)) {
        mergedById.set(c.id, c);
      }
    }

    return Array.from(mergedById.values()).slice(0, maxCitations);
  } catch (error) {
    console.error('Substitution enrichment failed:', error);
    return citations;
  }
};

export { enrichWithSubstitutionCitations };
