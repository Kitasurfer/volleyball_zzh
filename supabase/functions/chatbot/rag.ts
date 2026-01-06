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

// Search Qdrant knowledge base - WITH language filter to return only docs in requested language
const searchKnowledgeBase = async (
  vector: number[],
  language?: string
): Promise<QdrantSearchResult[]> => {
  const qdrant = getQdrantClient();
  const collection = getCollectionName();

  console.log(`Searching Qdrant collection "${collection}" with language filter: ${language || 'none'}`);
  console.log(`Vector length: ${vector.length}, searchLimit: ${searchLimit}`);

  try {
    const searchParams: any = {
      vector,
      limit: searchLimit,
      with_payload: true,
    };

    // Add language filter if specified
    if (language) {
      searchParams.filter = {
        must: [
          {
            key: 'language',
            match: { value: language }
          }
        ]
      };
    }

    const response = await qdrant.search(collection, searchParams);

    console.log('Qdrant response status:', response ? 'success' : 'failed');
    
    const results = response?.result ?? [];

    console.log(`Found ${results.length} results from Qdrant`);
    if (results.length > 0) {
      results.forEach((r: QdrantSearchResult, i: number) => {
        const payload = (r.payload || {}) as KnowledgePayload;
        console.log(`Result ${i + 1}: score=${r.score.toFixed(4)}, title="${payload.title}", lang=${payload.language}, content_id=${payload.content_id}`);
      });
    } else {
      console.log('No results found in Qdrant for this vector.');
    }

    return results;
  } catch (error) {
    console.error('Qdrant search error:', error);
    return [];
  }
};

export { mapQdrantResultToCitation, fetchEmbedding, searchKnowledgeBase };
