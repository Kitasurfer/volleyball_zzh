export interface HFEmbeddingConfig {
  apiKey: string; model: string; baseUrl?: string;
}
const defaultModel = 'BAAI/bge-small-en-v1.5';

export function indexProfile(env: (key: string) => string | undefined) {
  const model = env('HF_EMBED_MODEL') || defaultModel;
  const collection = env('QDRANT_COLLECTION') || 'content_vectors';
  const known = model === defaultModel ? 384 : model === 'BAAI/bge-m3' ? 1024 : undefined;
  const size = Number(env('HF_EMBED_DIM') || known);
  if (!Number.isSafeInteger(size) || size <= 0 || (known && known !== size)) throw new Error('invalid_embedding_dimension');
  if (model !== defaultModel && collection === 'content_vectors') throw new Error('new_model_requires_separate_collection');
  return { model, collection, size };
}

export async function generateHFEmbedding(config: HFEmbeddingConfig, text: string): Promise<number[]> {
  const base = (config.baseUrl || 'https://router.huggingface.co').replace(/\/$/, '');
  // Hosted inference can cold-start slowly; allow one retry within a 20s budget.
  let res: Response | undefined;
  for (let attempt = 0; attempt < 2 && (!res || !res.ok); attempt++) {
    try {
      res = await fetch(`${base}/hf-inference/models/${config.model}`, {
        method: 'POST', headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: text }), signal: AbortSignal.timeout(20000),
      });
    } catch { if (attempt === 1) throw new Error('embedding_unavailable'); }
  }
  if (!res!.ok) throw new Error(`embedding_unavailable_${res!.status}`);
  const data = await res.json();
  const vector = Array.isArray(data) && data.length === 1 && Array.isArray(data[0]) ? data[0] : data;
  const { size } = indexProfile(key => Deno.env.get(key));
  if (!Array.isArray(vector) || vector.length !== size || !vector.every(Number.isFinite)) throw new Error('invalid_embedding');
  return vector;
}

/** A chunk keeps the same UUID when the same document and language are indexed again. */
export async function chunkId(document: string, language: string, index: number) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify([document, language, index])));
  const bytes = new Uint8Array(digest, 0, 16);
  bytes[6] = (bytes[6] & 15) | 128;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
