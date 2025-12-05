import { generateOpenAIEmbedding } from './clients.ts';
import type { QdrantSearchResult } from './clients.ts';
import {
  getOpenAIConfig,
  getQdrantClient,
  getCollectionName,
  searchLimit,
} from './config.ts';
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

// Generate embedding using OpenAI (same as ingest-content)
const fetchEmbedding = async (text: string): Promise<number[]> => {
  const config = getOpenAIConfig();
  console.log('Generating OpenAI embedding...');
  const embedding = await generateOpenAIEmbedding(config, text);
  console.log('Embedding dimension:', embedding.length);
  return embedding;
};

// Search Qdrant knowledge base - searches WITHOUT language filter to find all relevant docs
const searchKnowledgeBase = async (
  vector: number[],
  _language?: string // Language param kept for API compatibility but not used for filtering
): Promise<QdrantSearchResult[]> => {
  const qdrant = getQdrantClient();
  const collection = getCollectionName();

  // Search without language filter - semantic search finds relevant content regardless of language
  console.log(`Searching Qdrant collection "${collection}" (no language filter)`);
  console.log(`Vector length: ${vector.length}, searchLimit: ${searchLimit}`);

  try {
    const response = await qdrant.search(collection, {
      vector,
      limit: searchLimit * 2, // Get more results since we're not filtering
      with_payload: true,
    });

    console.log('Qdrant response:', JSON.stringify(response).substring(0, 500));

    const results = response?.result ?? [];

    console.log(`Found ${results.length} results`);
    if (results.length > 0) {
      console.log('Top 3:', results.slice(0, 3).map((r: QdrantSearchResult) => {
        const payload = (r.payload || {}) as KnowledgePayload;
        return {
          score: r.score.toFixed(3),
          lang: payload.language,
          title: payload.title?.substring(0, 40),
        };
      }));
    }

    return results;
  } catch (error) {
    console.error('Qdrant search error:', error);
    return [];
  }
};

export { mapQdrantResultToCitation, fetchEmbedding, searchKnowledgeBase };
