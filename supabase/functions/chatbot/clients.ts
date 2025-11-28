// API clients for OpenAI, Cerebras, and Qdrant

// OpenAI Embedding
export interface OpenAIConfig {
  apiKey: string;
  model: string;
}

export const generateOpenAIEmbedding = async (
  config: OpenAIConfig,
  text: string
): Promise<number[]> => {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI embedding failed (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
};

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
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cerebras chat failed (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
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
    headers: {
      ...buildQdrantHeaders(config),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Qdrant request failed (${response.status}): ${text}`);
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
