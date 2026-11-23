import { generateHFEmbedding } from './clients.ts';
import type { QdrantSearchResult } from './clients.ts';
import {
  getHFEmbeddingConfig,
  getQdrantClient,
  getCollectionName,
  searchLimit,
  maxCitations, minRelevanceScore,
} from './config.ts';
import type { Route } from './intent.ts';
import { publicRows } from './publicData.ts';
import { articleIds, rankEvidence, type Article } from './ranking.ts';
import type { Citation, KnowledgePayload } from './types.ts';

const mapQdrantResultToCitation = (item: QdrantSearchResult): Citation => {
  const payload = (item.payload || {}) as KnowledgePayload;
  return {
    id: item.id,
    score: item.score,
    title: payload.title,
    url: payload.url,
    snippet: payload.snippet,
    headings: payload.headings,
    media: payload.media,
    source_file: payload.source_file,
    language: payload.language,
    origin: payload.origin,
  };
};

// Generate embedding using Hugging Face (same as ingest-content)
const fetchEmbedding = async (text: string): Promise<number[]> => {
  const config = getHFEmbeddingConfig();
  const embedding = await generateHFEmbedding(config, text);
  return embedding;
};

// Search Qdrant knowledge base - WITH language filter to return only docs in requested language
const searchKnowledgeBase = async (
  vector: number[],
  language?: string
): Promise<QdrantSearchResult[]> => {
  const qdrant = getQdrantClient();
  const collection = getCollectionName();

  if (!vector || vector.length === 0) {
    return [];
  }

  const response = await qdrant.search(collection, {
    vector, limit: searchLimit, with_payload: true,
    filter: language ? { must: [{ key: 'language', match: { value: language } }] } : undefined,
  });
  return response.result;
};

export async function retrieve(route: Route) {
  const vector = await fetchEmbedding(route.search);
  const searches = await Promise.allSettled([searchKnowledgeBase(vector, route.language), searchKnowledgeBase(vector)]);
  if (searches.every(s => s.status === 'rejected')) throw new Error('index_unavailable');
  const hits = searches.flatMap(s => s.status === 'fulfilled' ? s.value : []);
  const ids = articleIds(hits);
  const articles = ids.length ? await publicRows<Article>('content_items', new URLSearchParams({
    select: 'id,title,slug,updated_at,body_markdown,summary', id: `in.(${ids.join(',')})`,
    status: 'eq.published',
    published_at: `lte.${new Date().toISOString()}`,
  })) : [];
  return rankEvidence(hits, route, articles, minRelevanceScore, maxCitations);
}

export { mapQdrantResultToCitation, fetchEmbedding, searchKnowledgeBase };
