import { generateOpenAIEmbedding } from './clients.ts';
import {
  getSupabase,
  getBatchSize,
  getOpenAIConfig,
} from './config.ts';
import type { VectorJob, ContentItem, MediaLink } from './types.ts';
import { buildChunks } from './chunks.ts';
import { toMediaPayload, chunkSnippet, upsertQdrant, generatePointId } from './qdrant.ts';

const generateEmbedding = async (text: string): Promise<number[]> => {
  const openaiKey = Deno.env.get('OPENAI_API_KEY');
  console.log('OpenAI key present:', !!openaiKey);
  
  if (!openaiKey) {
    throw new Error('OPENAI_API_KEY not set in environment');
  }
  
  console.log('Using OpenAI for embeddings');
  const embedding = await generateOpenAIEmbedding(getOpenAIConfig(), text);
  console.log('OpenAI embedding successful, dimension:', embedding.length);
  return embedding;
};

const fetchPendingJobs = async (): Promise<VectorJob[]> => {
  const { data, error } = await getSupabase()
    .from('vector_jobs')
    .select('id, content_id, status, payload')
    .eq('status', 'pending')
    .limit(getBatchSize());

  if (error) {
    throw error;
  }

  return (data ?? []).map((job) => ({
    ...job,
    language: null,
  }));
};

const markJob = async (id: string, values: Record<string, unknown>) => {
  const { error } = await getSupabase()
    .from('vector_jobs')
    .update(values)
    .eq('id', id);

  if (error) {
    throw error;
  }
};

const fetchContent = async (contentId: string): Promise<ContentItem | null> => {
  const { data, error } = await getSupabase()
    .from('content_items')
    .select('id, title, summary, body_markdown, body_html, slug, language, type, metadata')
    .eq('id', contentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ContentItem | null;
};

const fetchMediaLinks = async (contentId: string): Promise<MediaLink[]> => {
  const { data, error } = await getSupabase()
    .from('content_media_links')
    .select(
      `media_id, role, position, media_assets(title, description, storage_path, media_type, metadata)`
    )
    .eq('content_id', contentId)
    .order('position');

  if (error) {
    throw error;
  }

  const rows = data ?? [];
  return rows.map((item: any) => ({
    media_id: item.media_id,
    role: item.role,
    position: item.position,
    title: item.media_assets?.title ?? null,
    description: item.media_assets?.description ?? null,
    storage_path: item.media_assets?.storage_path ?? '',
    media_type: item.media_assets?.media_type ?? 'image',
    metadata: item.media_assets?.metadata ?? null,
  }));
};

const processJob = async (job: VectorJob) => {
  await markJob(job.id, {
    status: 'processing',
    started_at: new Date().toISOString(),
  });

  try {
    const content = await fetchContent(job.content_id);

    if (!content) {
      throw new Error(`Content ${job.content_id} not found`);
    }

    const media = await fetchMediaLinks(content.id);
    const chunks = await buildChunks(content, media);
    const language = job.language ?? content.language ?? 'de';

    console.log(`Processing content ${content.id}: ${chunks.length} chunks`);

    const vectors = await Promise.all(chunks.map((chunk) => generateEmbedding(chunk.text)));

    const points = vectors.map((vector, index) => {
      const chunk = chunks[index];

      const payload: Record<string, unknown> = {
        content_id: content.id,
        chunk_index: index,
        language,
        title: content.title,
        url: `/${content.slug}`,
        snippet: chunkSnippet(chunk.text),
        media: toMediaPayload(media, chunk),
        type: content.type,
        source_file: (content.metadata as any)?.source_file,
      };

      if (chunk.headings && chunk.headings.length > 0) {
        (payload as any).headings = chunk.headings;
      }

      if (typeof chunk.origin !== 'undefined') {
        (payload as any).origin = chunk.origin;
      }

      return {
        id: generatePointId(),
        vector,
        payload,
      };
    });

    console.log(`Upserting ${points.length} points to Qdrant`);
    await upsertQdrant(points);

    await markJob(job.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      error: null,
    });

    console.log(`Job ${job.id} completed successfully`);
  } catch (error) {
    console.error('Failed to process job', job.id, error);
    await markJob(job.id, {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
      completed_at: new Date().toISOString(),
    });
  }
};

export {
  generateEmbedding,
  fetchPendingJobs,
  markJob,
  fetchContent,
  fetchMediaLinks,
  processJob,
};
