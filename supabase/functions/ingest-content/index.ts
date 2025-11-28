import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { generateOpenAIEmbedding, createQdrantClient } from './clients.ts';

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
const getCollectionName = () => Deno.env.get('QDRANT_COLLECTION') ?? 'content_vectors';

const getQdrantClient = () =>
  createQdrantClient({
    url: Deno.env.get('QDRANT_URL') || '',
    apiKey: Deno.env.get('QDRANT_API_KEY'),
  });

const getOpenAIConfig = () => ({
  apiKey: Deno.env.get('OPENAI_API_KEY') || '',
  model: Deno.env.get('OPENAI_EMBED_MODEL') ?? 'text-embedding-3-small',
});

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

interface VectorJob {
  id: string;
  content_id: string;
  status: string;
  payload: Record<string, unknown> | null;
  language: string | null;
}

const fetchPendingJobs = async (): Promise<VectorJob[]> => {
  const { data, error } = await getSupabase()
    .from('vector_jobs')
    .select('id, content_id, status, payload')
    .eq('status', 'pending')
    .limit(getBatchSize());

  if (error) {
    throw error;
  }

  return data.map((job) => ({
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

interface ContentItem {
  id: string;
  title: string;
  summary: string | null;
  body_markdown: string | null;
  body_html: string | null;
  slug: string;
  language: string;
  type: string;
  metadata: Record<string, unknown> | null;
}

const fetchContent = async (contentId: string): Promise<ContentItem | null> => {
  const { data, error } = await getSupabase()
    .from('content_items')
    .select('id, title, summary, body_markdown, body_html, slug, language, type, metadata')
    .eq('id', contentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

interface MediaLink {
  media_id: string;
  role: string;
  position: number;
  title: string | null;
  description: string | null;
  storage_path: string;
  media_type: string;
  metadata: Record<string, unknown> | null;
}

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

const stripHtml = (value: string | null): string => {
  if (!value) return '';
  return value.replace(/<[^>]+>/g, ' ');
};

const buildEnrichedText = (content: ContentItem, media: MediaLink[]): string => {
  const parts: string[] = [];

  if (content.title) {
    parts.push(`# ${content.title}`);
  }

  if (content.summary) {
    parts.push(content.summary);
  }

  const body = stripHtml(content.body_html) || content.body_markdown || '';
  if (body) {
    parts.push(body);
  }

  if (media.length > 0) {
    const imageBlocks = media.map((item, index) => {
      const title = item.title || `Image ${index + 1}`;
      const classification = (item.metadata as any)?.classification;
      const description = item.description || '';

      let header = `[Image: ${title}`;
      if (classification) {
        header += ` (${classification})`;
      }
      header += ']';

      return [header, description]
        .filter((value) => value && value.trim().length > 0)
        .join('\n');
    });

    parts.push(imageBlocks.join('\n\n'));
  }

  return parts.join('\n\n');
};

interface Chunk {
  text: string;
  headings?: string[];
  origin?: unknown;
  docItemsRefs?: string[];
}

const splitIntoChunks = (text: string, chunkSize = 1000, overlap = 200): string[] => {
  const chunks: string[] = [];
  const normalized = text.trim();

  if (!normalized) return chunks;

  let start = 0;
  const length = normalized.length;

  while (start < length) {
    const end = Math.min(length, start + chunkSize);
    const slice = normalized.slice(start, end).trim();

    if (slice.length > 0) {
      chunks.push(slice);
    }

    if (end === length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
};

const getDoclingUrl = () => Deno.env.get('DOCLING_SERVICE_URL') || '';

interface DoclingResponse {
  markdown: string;
  metadata: { pages: number; figures: number; tables: number };
  images: string[];
  error?: string;
}

const splitMarkdownIntoChunks = (markdown: string, maxChunkSize = 1500): Chunk[] => {
  const chunks: Chunk[] = [];
  const lines = markdown.split('\n');
  
  let currentChunk = '';
  let currentHeadings: string[] = [];
  const headingStack: string[] = [];
  
  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headingMatch) {
      if (currentChunk.trim().length > 50) {
        chunks.push({
          text: currentChunk.trim(),
          headings: [...currentHeadings],
        });
      }
      
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      
      while (headingStack.length >= level) {
        headingStack.pop();
      }
      headingStack.push(headingText);
      
      currentHeadings = [...headingStack];
      currentChunk = '';
    } else {
      currentChunk += line + '\n';
      
      if (currentChunk.length > maxChunkSize) {
        chunks.push({
          text: currentChunk.trim(),
          headings: [...currentHeadings],
        });
        currentChunk = '';
      }
    }
  }
  
  if (currentChunk.trim().length > 50) {
    chunks.push({
      text: currentChunk.trim(),
      headings: [...currentHeadings],
    });
  }
  
  return chunks;
};

const fetchDoclingChunks = async (sourceFile: string): Promise<Chunk[] | null> => {
  // Temporarily disabled due to timeout issues with large PDFs
  // TODO: Re-enable when Docling service is faster or use background processing
  console.log('Docling integration temporarily disabled, using fallback chunking');
  return null;
  
  const doclingUrl = getDoclingUrl();
  if (!doclingUrl) {
    console.log('DOCLING_SERVICE_URL not set, skipping Docling');
    return null;
  }
  
  // Only process PDFs
  if (!sourceFile.toLowerCase().endsWith('.pdf')) {
    return null;
  }
  
  try {
    // Download file from storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const fileUrl = `${supabaseUrl}/storage/v1/object/public/documents/${sourceFile}`;
    
    console.log(`Downloading PDF from: ${fileUrl}`);
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      console.error(`Failed to download PDF: ${fileResponse.status}`);
      return null;
    }
    
    const fileBlob = await fileResponse.blob();
    console.log(`Downloaded ${fileBlob.size} bytes`);
    
    // Send to Docling
    const formData = new FormData();
    formData.append('file', fileBlob, 'document.pdf');
    
    console.log(`Sending to Docling: ${doclingUrl}/process`);
    const doclingResponse = await fetch(`${doclingUrl}/process`, {
      method: 'POST',
      body: formData,
    });
    
    if (!doclingResponse.ok) {
      console.error(`Docling error: ${doclingResponse.status}`);
      return null;
    }
    
    const result: DoclingResponse = await doclingResponse.json();
    
    if (result.error) {
      console.error(`Docling returned error: ${result.error}`);
      return null;
    }
    
    if (!result.markdown || result.markdown.length < 100) {
      console.warn('Docling returned empty markdown');
      return null;
    }
    
    console.log(`Docling returned ${result.markdown.length} chars, ${result.metadata?.pages || 0} pages`);
    
    // Split markdown into chunks
    const chunks = splitMarkdownIntoChunks(result.markdown);
    console.log(`Split into ${chunks.length} chunks`);
    
    return chunks;
  } catch (error) {
    console.error('Docling processing failed:', error);
    return null;
  }
};

const buildChunks = async (content: ContentItem, media: MediaLink[]): Promise<Chunk[]> => {
  const meta = content.metadata as any;
  
  // First, check if we have pre-computed docling chunks
  const doclingChunks = meta?.docling_chunks;
  if (Array.isArray(doclingChunks) && doclingChunks.length > 0) {
    const builtFromDocling = doclingChunks
      .map((chunk: any) => {
        const rawText = (chunk?.text ?? '').toString().trim();
        if (!rawText) return null;

        return {
          text: rawText,
          headings: Array.isArray(chunk?.headings) ? chunk.headings : undefined,
          origin: chunk?.origin,
          docItemsRefs: Array.isArray(chunk?.doc_items_refs) ? chunk.doc_items_refs : undefined,
        };
      })
      .filter((value): value is Chunk => value !== null);

    if (builtFromDocling.length > 0) {
      console.log(`Using ${builtFromDocling.length} pre-computed docling chunks`);
      return builtFromDocling;
    }
  }
  
  // Second, try to fetch from Docling service if we have a PDF source file
  const sourceFile = meta?.source_file;
  if (sourceFile) {
    const doclingResult = await fetchDoclingChunks(sourceFile);
    if (doclingResult && doclingResult.length > 0) {
      return doclingResult;
    }
  }

  // Fallback to simple text chunking
  const enrichedText = buildEnrichedText(content, media);
  const fallbackTexts = splitIntoChunks(enrichedText);

  return fallbackTexts.map((text) => ({ text }));
};

const extractPicturePositionsFromRefs = (refs?: string[]): number[] => {
  if (!refs || refs.length === 0) return [];

  const positions = refs
    .filter((ref) => ref.startsWith('#/pictures/'))
    .map((ref) => {
      const parts = ref.split('/');
      const idxStr = parts[2];
      const idx = Number(idxStr);
      if (!Number.isFinite(idx)) return null;
      return idx + 1;
    })
    .filter((value): value is number => value !== null);

  return Array.from(new Set(positions));
};

const chunkSnippet = (text: string, limit = 1500): string =>
  text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;

interface MediaPayload {
  id: string;
  url: string;
  type: string;
  title?: string;
  description?: string;
  classification?: string;
}

const toMediaPayload = (links: MediaLink[], chunk?: Chunk): MediaPayload[] => {
  const positionsFromRefs = extractPicturePositionsFromRefs(chunk?.docItemsRefs);

  const filteredLinks =
    positionsFromRefs.length > 0
      ? links.filter((item) => {
          const metaPos = (item.metadata as any)?.docling_position ?? item.position;
          return positionsFromRefs.includes(metaPos);
        })
      : links;

  return filteredLinks.map((item) => ({
    id: item.media_id,
    url: `${getPublicStorageBase()}${item.storage_path}`,
    type: item.media_type,
    title: item.title ?? undefined,
    description: item.description ?? undefined,
    classification: (item.metadata as any)?.classification ?? undefined,
  }));
};

// Generate a proper UUID for Qdrant points
const generatePointId = (): string => {
  return crypto.randomUUID();
};

const upsertQdrant = async (points: Array<{ id: string; vector: number[]; payload: Record<string, unknown> }>) => {
  await getQdrantClient().upsert(getCollectionName(), { points });
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
        payload.headings = chunk.headings;
      }

      if (typeof chunk.origin !== 'undefined') {
        payload.origin = chunk.origin;
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

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  
  // Create index: POST /ingest-content/create-index
  if (url.pathname.endsWith('/create-index') && req.method === 'POST') {
    try {
      const body = await req.json();
      const { field_name, field_type } = body;
      
      const collection = Deno.env.get('QDRANT_COLLECTION') || 'content_vectors';
      
      const indexResponse = await fetch(`${Deno.env.get('QDRANT_URL')}/collections/${collection}/index`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'api-key': Deno.env.get('QDRANT_API_KEY') || '',
        },
        body: JSON.stringify({
          field_name: field_name || 'content_id',
          field_schema: field_type || 'keyword'
        }),
      });
      
      const result = await indexResponse.json();
      return new Response(JSON.stringify({ success: true, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  }

  // Delete points by content_id: POST /ingest-content/delete-by-content
  if (url.pathname.endsWith('/delete-by-content') && req.method === 'POST') {
    try {
      const body = await req.json();
      const { content_id } = body;
      
      if (!content_id) {
        return new Response(JSON.stringify({ error: 'content_id required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
      
      console.log(`Deleting points for content_id: ${content_id}`);
      
      const collection = Deno.env.get('QDRANT_COLLECTION') || 'content_vectors';
      
      // Use filter to delete by content_id
      const deleteResponse = await fetch(`${Deno.env.get('QDRANT_URL')}/collections/${collection}/points/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': Deno.env.get('QDRANT_API_KEY') || '',
        },
        body: JSON.stringify({
          filter: {
            must: [{ key: 'content_id', match: { value: content_id } }]
          }
        }),
      });
      
      const result = await deleteResponse.json();
      console.log('Delete result:', result);
      
      return new Response(JSON.stringify({ 
        success: true, 
        content_id,
        result 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (error) {
      console.error('Delete error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  }

  // Direct chunk upload endpoint: POST /ingest-content/upload-chunks
  if (url.pathname.endsWith('/upload-chunks') && req.method === 'POST') {
    try {
      const body = await req.json();
      const { content_id, title, language, chunks, source_file } = body;
      
      if (!content_id || !chunks || !Array.isArray(chunks)) {
        return new Response(JSON.stringify({ error: 'content_id and chunks array required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
      
      console.log(`Direct upload: ${chunks.length} chunks for content_id ${content_id}`);
      
      // Generate embeddings and upsert to Qdrant
      const validChunks = chunks.filter((c: any) => c.text && c.text.trim().length > 50);
      console.log(`Valid chunks: ${validChunks.length}`);
      
      const vectors = await Promise.all(validChunks.map((chunk: any) => generateEmbedding(chunk.text)));
      
      const points = vectors.map((vector, index) => {
        const chunk = validChunks[index];
        return {
          id: generatePointId(),
          vector,
          payload: {
            content_id,
            chunk_index: index,
            language: language || 'de',
            title: title || 'Uploaded Document',
            snippet: chunkSnippet(chunk.text),
            headings: chunk.headings,
            source_file,
            type: 'rules',
          },
        };
      });
      
      console.log(`Upserting ${points.length} points to Qdrant`);
      await upsertQdrant(points);
      
      return new Response(JSON.stringify({ 
        success: true, 
        uploaded: points.length,
        content_id 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (error) {
      console.error('Upload chunks error:', error);
      return new Response(JSON.stringify({ error: String(error) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }
  }

  try {
    console.log('Fetching pending jobs...');
    const jobs = await fetchPendingJobs();
    console.log(`Found ${jobs.length} pending jobs`);

    if (!jobs.length) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log('Processing jobs:', jobs.map((j) => j.id));

    for (const job of jobs) {
      await processJob(job);
    }

    return new Response(JSON.stringify({ processed: jobs.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Fatal error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
