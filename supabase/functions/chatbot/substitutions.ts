import type { Citation } from './types.ts';
import { maxCitations, minRelevanceScore } from './config.ts';
import { fetchEmbedding, searchKnowledgeBase, mapQdrantResultToCitation } from './rag.ts';

const hasSubstitutionKeyword = (text: string): boolean => {
  const q = text.toLowerCase();
  const keywords = [
    'замен', 'замена', 'замены',
    'auswechslung', 'auswechslungen',
    'substitution', 'substitutions',
  ];
  return keywords.some((kw) => q.includes(kw));
};

const buildSubstitutionQuery = (language: string): string => {
  if (language === 'ru') {
    return 'Ограничения на количество обычных замен в классическом волейболе (правило 15.6: не более шести обычных замен за партию).';
  }
  if (language === 'en') {
    return 'Limits on the number of regular substitutions in indoor volleyball (rule 15.6: at most six regular substitutions per set).';
  }
  return 'Begrenzungen für die Anzahl regulärer Auswechslungen im Volleyball (Regel 15.6: höchstens sechs reguläre Auswechslungen pro Satz).';
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
      .map((item) => mapQdrantResultToCitation(item) as Citation)
      .filter((cit) => {
        const s = (cit.snippet || '').toLowerCase();
        return s.includes('шест') || s.includes('sechs') || s.includes('six');
      });

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
