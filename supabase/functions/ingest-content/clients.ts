export { generateHFEmbedding, type HFEmbeddingConfig } from '../_shared/embedding.ts';

export interface QdrantConfig {
  url: string;
  apiKey?: string;
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
  ) => Promise<{ result: Array<{ id: string | number; score: number; payload?: Record<string, unknown> }> }>;

  upsert: (
    collection: string,
    body: { points: Array<{ id: string; vector: number[]; payload: Record<string, unknown> }> }
  ) => Promise<unknown>;

  delete: (
    collection: string,
    body: { points: Array<string | number> }
  ) => Promise<unknown>;

  createCollection: (
    collection: string,
    vectorSize: number
  ) => Promise<unknown>;

  collectionSize: (collection: string) => Promise<number | null>;
}

export const createQdrantClient = (config: QdrantConfig): QdrantClient => {
  return {
    search: (collection, body) =>
      qdrantRequest(config, `/collections/${collection}/points/search`, {
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

    createCollection: (collection, vectorSize) =>
      qdrantRequest(config, `/collections/${collection}`, {
        method: 'PUT',
        body: JSON.stringify({
          vectors: {
            size: vectorSize,
            distance: 'Cosine',
          },
        }),
      }),

    collectionSize: async (collection) => {
      const url = `${config.url.replace(/\/$/, '')}/collections/${collection}`;
      const response = await fetch(url, { headers: buildQdrantHeaders(config) });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`collection_check_failed_${response.status}`);
      const size = (await response.json()).result?.config?.params?.vectors?.size;
      if (!Number.isSafeInteger(size)) throw new Error('unsupported_collection_schema');
      return size;
    },
  };
};
