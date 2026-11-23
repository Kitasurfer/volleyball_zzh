import type { QdrantSearchResult } from './clients.ts';
import type { Route } from './intent.ts';
import type { Citation, KnowledgePayload } from './types.ts';

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const handbook = /^volleyball-regeln-(de|ru|en|it)$/;
const handbookUrl = 'https://www.fivb.com/volleyball/the-game/official-volleyball-rules/';
const stop = new Set('the and how what where wie was der die das und many much сколько какие как для and della delle quanti quante volleyball волейбол pallavolo'.split(' '));
const stems = (text: string) => new Set((text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
  .filter(w => w.length > 2 && !stop.has(w)).map(w => w.slice(0, 5)));

export interface Article { id: string; title: string; slug: string; updated_at: string; body_markdown?: string; summary?: string }
export function articleIds(results: QdrantSearchResult[]) {
  return [...new Set(results.map(r => r.payload?.content_id).filter((id): id is string =>
    typeof id === 'string' && uuid.test(id)))];
}

/** Only approved handbooks, reviewed uploads or currently published CMS revisions may reach the model. */
export function rankEvidence(results: QdrantSearchResult[], route: Route, articles: Article[],
  floor: number, limit: number): Citation[] {
  const catalog = new Map(articles.map(a => [a.id, a]));
  const query = stems(route.search);
  const ranked: { key: string; text: string; score: number; citation: Citation }[] = [];
  for (const hit of results) {
    const p = (hit.payload ?? {}) as KnowledgePayload;
    if (typeof p.snippet !== 'string' || !p.snippet.trim() || !Number.isFinite(hit.score) || hit.score < floor) continue;
    const id = p.content_id ?? '';
    const book = handbook.test(id);
    const article = catalog.get(id);
    const uploaded = p.source_kind === 'reviewed' && !uuid.test(id);
    if (!book && !article && !uploaded) continue;
    if (article && (p.revision ? p.revision !== article.updated_at :
      ![article.body_markdown, article.summary].some(text => text?.includes(p.snippet!.slice(0, 120))))) continue;
    if (route.kind === 'club' && !article) continue;
    if (route.venue === 'beach' && book) continue; // This edition covers indoor volleyball only.
    if ((p.snippet.match(/\.{5,}/g) ?? []).length >= 3) continue;
    const title = article?.title || p.title;
    if (!title) continue;
    const headings = Array.isArray(p.headings) ? p.headings.filter(h => typeof h === 'string').slice(-3) : [];
    const text = p.snippet.trim().slice(0, 1800);
    const tokens = stems(`${title} ${headings.join(' ')} ${text}`);
    const overlap = [...query].filter(t => tokens.has(t)).length / Math.max(query.size, 1);
    const score = hit.score + 0.08 * overlap + (p.language === route.language ? 0.012 : 0);
    const url = book ? handbookUrl : /^https?:\/\//i.test(p.url ?? '') ? p.url :
      /^\/(?:hall|beach|training|contact|about|competitions)\/?$/.test(p.url ?? '') ? p.url : undefined;
    ranked.push({ key: `${id}:${p.chunk_index ?? text}`, text, score,
      citation: { id: hit.id, score: hit.score, title, url, headings, snippet: text, language: p.language,
        origin: { content_id: id, chunk_index: p.chunk_index } } });
  }
  const seen = new Set<string>(), out: Citation[] = [];
  for (const row of ranked.sort((a, b) => b.score - a.score)) {
    if (seen.has(row.key) || seen.has(row.text)) continue;
    seen.add(row.key); seen.add(row.text); out.push(row.citation);
    if (out.length >= limit) break;
  }
  return out;
}
