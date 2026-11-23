import type { HistoryMessage, RequestBody } from './types.ts';

export function parseRequest(value: unknown): RequestBody | null {
  if (!value || typeof value !== 'object' || !('question' in value) || typeof value.question !== 'string') return null;
  const question = value.question.trim();
  if (!question || question.length > 2000) return null;
  const history: HistoryMessage[] = [];
  if ('history' in value) {
    if (!Array.isArray(value.history)) return null;
    for (const h of value.history.slice(-7)) {
      if (!h || !['user', 'assistant'].includes(h.role) || typeof h.content !== 'string') return null;
      if (h.content.trim()) history.push({ role: h.role, content: h.content.trim().slice(0, 2000) });
    }
    // Older widget bundles included the current question as the final history turn.
    if (history.at(-1)?.role === 'user' && history.at(-1)?.content === question) history.pop();
    while (history.length && history[0].role !== 'user') history.shift();
  }
  const language = 'language' in value && typeof value.language === 'string' ? value.language : 'de';
  const sessionId = 'sessionId' in value && typeof value.sessionId === 'string' &&
    /^[0-9a-f-]{36}$/i.test(value.sessionId) ? value.sessionId : crypto.randomUUID();
  return { question, language, history: history.slice(-6), sessionId };
}
