import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createQdrantClient } from './clients.ts';
import { indexProfile } from '../_shared/embedding.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const getSupabase = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  return createClient(supabaseUrl, supabaseServiceRoleKey);
};

const getPublicStorageBase = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/`;
};

const getBatchSize = () => Number(Deno.env.get('INGEST_BATCH_SIZE') ?? '5');
export const getIndexProfile = () => indexProfile(key => Deno.env.get(key));
const getCollectionName = () => getIndexProfile().collection;

const getQdrantClient = () =>
  createQdrantClient({
    url: Deno.env.get('QDRANT_URL') || '',
    apiKey: Deno.env.get('QDRANT_API_KEY') || undefined,
  });

const getHFEmbeddingConfig = () => ({
  apiKey: Deno.env.get('HF_API_KEY') || '',
  model: getIndexProfile().model,
  baseUrl: Deno.env.get('HF_BASE_URL') ?? 'https://router.huggingface.co',
});

const getDoclingUrl = () => Deno.env.get('DOCLING_SERVICE_URL') || '';

export {
  corsHeaders,
  getSupabase,
  getPublicStorageBase,
  getBatchSize,
  getCollectionName,
  getQdrantClient,
  getHFEmbeddingConfig,
  getDoclingUrl,
};
