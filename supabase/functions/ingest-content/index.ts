import { getQdrantClient, getCollectionName, getIndexProfile } from './config.ts';
import { chunkId } from '../_shared/embedding.ts';
import {
  generateEmbedding as generateEmbeddingFromJobs,
  fetchPendingJobs as fetchPendingJobsFromJobs,
  processJob as processJobFromJobs,
} from './jobs.ts';
import {
  chunkSnippet as chunkSnippetFromQdrant,
  upsertQdrant as upsertQdrantFromQdrant,
} from './qdrant.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const requireAdmin = async (req: Request): Promise<Response | null> => {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Server misconfigured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token && token === serviceRoleKey) {
    return null;
  }

  const userResponse = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: authHeader,
    },
  });

  if (!userResponse.ok) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const user = await userResponse.json();
  const role = user?.app_metadata?.role ?? null;

  if (role !== 'admin') {
    return new Response(
      JSON.stringify({ error: 'Forbidden' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  return null;
};

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  const authError = await requireAdmin(req);
  if (authError) {
    return authError;
  }

  const url = new URL(req.url);
  
  // Create index: POST /ingest-content/create-index
  if (url.pathname.endsWith('/create-index') && req.method === 'POST') {
    try {
      const body = await req.json();
      const { field_name, field_type } = body;
      
      const collection = getCollectionName();
      
      const indexResponse = await fetch(`${Deno.env.get('QDRANT_URL')}/collections/${collection}/index`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'api-key': Deno.env.get('QDRANT_API_KEY') || '',
        },
        body: JSON.stringify({
          field_name: field_name || 'content_id',
          field_schema: field_type || 'keyword',
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
      
      const collection = getCollectionName();
      
      // Use filter to delete by content_id
      const deleteResponse = await fetch(`${Deno.env.get('QDRANT_URL')}/collections/${collection}/points/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': Deno.env.get('QDRANT_API_KEY') || '',
        },
        body: JSON.stringify({
          filter: {
            must: [{ key: 'content_id', match: { value: content_id } }],
          },
        }),
      });
      
      const result = await deleteResponse.json();
      console.log('Delete result:', result);
      
      return new Response(JSON.stringify({ 
        success: true, 
        content_id,
        result,
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

  // Create collection endpoint: POST /ingest-content/create-collection
  if (url.pathname.endsWith('/create-collection') && req.method === 'POST') {
    try {
      const qdrant = getQdrantClient();
      const collection = getCollectionName();
      const vectorSize = getIndexProfile().size;
      
      console.log(`Creating collection: ${collection} with vector size ${vectorSize}`);
      
      const existingSize = await qdrant.collectionSize(collection);
      if (existingSize !== null) {
        if (existingSize !== vectorSize) throw new Error('incompatible_collection_size');
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Collection already exists',
          collection,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
      
      await qdrant.createCollection(collection, vectorSize);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Collection created',
        collection,
        vectorSize,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (error) {
      console.error('Create collection error:', error);
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
      const { content_id, title, language, chunks, source_file, source_url, revision } = body;
      
      if (!content_id || !chunks || !Array.isArray(chunks)) {
        return new Response(JSON.stringify({ error: 'content_id and chunks array required' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
      if (!/^volleyball-regeln-(de|en|ru|it)$/.test(content_id) &&
        (body.reviewed_for_public_chat !== true || typeof revision !== 'string' || !revision.trim())) {
        return Response.json({ error: 'Public review and a revision are required for custom uploads' },
          { status: 400, headers: corsHeaders });
      }
      
      console.log(`Direct upload: ${chunks.length} chunks for content_id ${content_id}`);
      
      // Ensure collection exists
      const qdrant = getQdrantClient();
      const collection = getCollectionName();
      const existingSize = await qdrant.collectionSize(collection);
      const vectorSize = getIndexProfile().size;
      if (existingSize !== null && existingSize !== vectorSize) throw new Error('incompatible_collection_size');
      if (existingSize === null) {
        console.log(`Collection ${collection} does not exist, creating...`);
        await qdrant.createCollection(collection, vectorSize);
        console.log(`Collection ${collection} created`);
      }
      
      // Generate embeddings and upsert to Qdrant
      const validChunks = chunks.filter(c => typeof c?.text === 'string' && c.text.trim().length > 50);
      console.log(`Valid chunks: ${validChunks.length}`);
      
      const points = [];
      for (let i = 0; i < validChunks.length; i += 4) {
        points.push(...await Promise.all(validChunks.slice(i, i + 4).map(async (chunk, offset) => {
        const index = Number.isSafeInteger(chunk.chunk_index) ? chunk.chunk_index : i + offset;
        return {
          id: await chunkId(content_id, language || 'de', index),
          vector: await generateEmbeddingFromJobs(chunk.text),
          payload: {
            content_id,
            chunk_index: index,
            language: language || 'de',
            title: title || 'Uploaded Document',
            snippet: chunkSnippetFromQdrant(chunk.text),
            headings: chunk.headings,
            media: chunk.media || [],
            source_file,
            source_kind: 'reviewed',
            revision: revision || '2025-2028',
            url: source_url,
            type: 'rules',
          },
        };
        })));
      }
      
      console.log(`Upserting ${points.length} points to Qdrant`);
      await upsertQdrantFromQdrant(points);
      
      return new Response(JSON.stringify({ 
        success: true, 
        uploaded: points.length,
        content_id,
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
    const jobs = await fetchPendingJobsFromJobs();
    console.log(`Found ${jobs.length} pending jobs`);

    if (!jobs.length) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    console.log('Processing jobs:', jobs.map((j) => j.id));

    for (const job of jobs) {
      await processJobFromJobs(job);
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
