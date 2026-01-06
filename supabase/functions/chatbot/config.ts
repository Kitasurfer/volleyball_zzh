import { createQdrantClient } from './clients.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Environment helpers
const ensureEnv = (key: string, required = true): string | undefined => {
  const value = Deno.env.get(key);
  if (required && (!value || value.trim() === '')) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? undefined;
};

// Configuration
const getQdrantClient = () =>
  createQdrantClient({
    url: ensureEnv('QDRANT_URL')!,
    apiKey: ensureEnv('QDRANT_API_KEY', false),
  });

const getOpenAIConfig = () => ({
  apiKey: ensureEnv('OPENAI_API_KEY')!,
  model: ensureEnv('OPENAI_EMBED_MODEL', false) ?? 'text-embedding-3-small',
});

const getCerebrasConfig = () => ({
  apiKey: ensureEnv('CEREBRAS_API_KEY')!,
  baseUrl: 'https://api.cerebras.ai/v1',
  model: ensureEnv('CEREBRAS_CHAT_MODEL', false) ?? 'qwen-3-235b-a22b-thinking-2507',
});

const getCollectionName = () => ensureEnv('QDRANT_COLLECTION', false) ?? 'content_vectors';
const searchLimit = 20; // Increased search limit
const maxCitations = 5; 
const maxOutputTokens = Number(ensureEnv('CHAT_MAX_OUTPUT_TOKENS', false) ?? '1200');
const minRelevanceScore = Number(ensureEnv('CHAT_MIN_SCORE', false) ?? '0.25'); // Balanced threshold to filter low-relevance docs

export {
  corsHeaders,
  ensureEnv,
  getQdrantClient,
  getOpenAIConfig,
  getCerebrasConfig,
  getCollectionName,
  searchLimit,
  maxCitations,
  maxOutputTokens,
  minRelevanceScore,
};
