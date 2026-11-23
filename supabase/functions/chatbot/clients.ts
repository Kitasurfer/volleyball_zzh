export { generateHFEmbedding, type HFEmbeddingConfig } from '../_shared/embedding.ts';

// Cerebras Chat
export interface CerebrasConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

export const generateCerebrasChat = async (
  config: CerebrasConfig,
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<string> => {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxOutputTokens ?? 800,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(`completion_unavailable_${response.status}`);
  }

  const data = await response.json();
  const answer = data?.choices?.[0]?.message?.content;
  if (typeof answer !== 'string' || !answer.trim()) throw new Error('empty_completion');
  return answer;
};

// Qdrant Client
export interface QdrantConfig {
  url: string;
  apiKey?: string;
}

export interface QdrantSearchResult {
  id: string | number;
  score: number;
  payload?: Record<string, unknown>;
}

export interface QdrantSearchResponse {
  result: QdrantSearchResult[];
}

const buildQdrantHeaders = (config: QdrantConfig): Record<string, string> => ({
  'Content-Type': 'application/json',
  ...(config.apiKey ? { 'api-key': config.apiKey } : {}),
});

const qdrantRequest = async <T>(
  config: QdrantConfig,
  path: string,
  init: RequestInit
): Promise<T> => {
  const url = `${config.url.replace(/\/$/, '')}${path}`;
  
  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(5000),
    headers: {
      ...buildQdrantHeaders(config),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`index_unavailable_${response.status}`);
  }

  return response.json();
};

export interface QdrantClient {
  search: (
    collection: string,
    body: {
      vector: number[];
      limit: number;
      filter?: unknown;
      with_payload?: boolean;
    }
  ) => Promise<QdrantSearchResponse>;
  
  upsert: (
    collection: string,
    body: { points: Array<{ id: string; vector: number[]; payload: Record<string, unknown> }> }
  ) => Promise<unknown>;
  
  delete: (
    collection: string,
    body: { points: Array<string | number> }
  ) => Promise<unknown>;
}

export const createQdrantClient = (config: QdrantConfig): QdrantClient => {
  return {
    search: (collection, body) =>
      qdrantRequest<QdrantSearchResponse>(config, `/collections/${collection}/points/search`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    upsert: (collection, body) =>
      qdrantRequest(config, `/collections/${collection}/points`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),

    delete: (collection, body) =>
      qdrantRequest(config, `/collections/${collection}/points/delete`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  };
};
