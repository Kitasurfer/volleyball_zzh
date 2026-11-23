import type { QdrantSearchResult } from './clients.ts';
import { fetchEmbedding, retrieve } from './rag.ts';
import { routeQuestion } from './intent.ts';
import { handleChatRequest } from './answer.ts';
import {
  corsHeaders,
  ensureEnv,
  getQdrantClient,
  getCollectionName,
  maxCitations,
  minRelevanceScore,
} from './config.ts';
import type { KnowledgePayload } from './types.ts';


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


// Main handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Debug endpoint to check Qdrant data
  const url = new URL(req.url);

  const isDebugEndpoint =
    url.pathname.endsWith('/debug') ||
    url.pathname.endsWith('/debug-flow') ||
    url.pathname.endsWith('/debug-search');

  if (isDebugEndpoint) {
    const authError = await requireAdmin(req);
    if (authError) {
      return authError;
    }
  }

  if (url.pathname.endsWith('/debug') && req.method === 'GET') {
    try {
      const collection = getCollectionName();
      const qdrantUrl = ensureEnv('QDRANT_URL');
      const qdrantKey = ensureEnv('QDRANT_API_KEY', false);
      
      // Get collection info
      const infoResponse = await fetch(`${qdrantUrl}/collections/${collection}`, {
        headers: qdrantKey ? { 'api-key': qdrantKey } : {},
      });
      const infoText = await infoResponse.text();
      let info = null;
      try { info = JSON.parse(infoText); } catch (e) { info = { raw: infoText.substring(0, 200) }; }
      
      // Sample some points
      const scrollResponse = await fetch(`${qdrantUrl}/collections/${collection}/points/scroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(qdrantKey ? { 'api-key': qdrantKey } : {}),
        },
        body: JSON.stringify({ limit: 5, with_payload: true }),
      });
      const scrollText = await scrollResponse.text();
      let scroll = null;
      try { scroll = JSON.parse(scrollText); } catch (e) { scroll = { raw: scrollText.substring(0, 200) }; }
      
      return new Response(JSON.stringify({ 
        collection, 
        qdrantUrl: qdrantUrl?.substring(0, 20) + '...',
        info, 
        sample: scroll 
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
  
  // Debug full flow endpoint
  if (url.pathname.endsWith('/debug-flow') && req.method === 'POST') {
    try {
      const body = await req.json();
      const question = body.question || 'Сколько замен можно сделать в волейболе за сет?';
      const language = body.language || 'ru';
      
      const route = routeQuestion(question, language);
      const relevant = await retrieve(route);
      
      return new Response(JSON.stringify({
        question,
        language,
        route: route.kind,
        relevant_results: relevant.length,
        minRelevanceScore,
        maxCitations,
        top_results: relevant.map(({ id, title, score, language, origin }) =>
          ({ id, title, score, language, origin })),
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error), stack: (error as Error).stack }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Debug search endpoint - searches without language filter (same as main chatbot)
  if (url.pathname.endsWith('/debug-search') && req.method === 'POST') {
    try {
      const body = await req.json();
      const question = body.question || 'Auswechslung Volleyball';
      
      const embedding = await fetchEmbedding(question);
      console.log('Embedding generated, length:', embedding.length);
      
      const qdrant = getQdrantClient();
      const collection = getCollectionName();
      
      // Search WITHOUT language filter - semantic search finds relevant content
      const response = await qdrant.search(collection, {
        vector: embedding,
        limit: 20,
        with_payload: true,
      });
      
      const results = response?.result ?? [];
      
      return new Response(JSON.stringify({
        question,
        embedding_length: embedding.length,
        results_count: results.length,
        minRelevanceScore,
        results: results.map((r: QdrantSearchResult) => {
          const payload = (r.payload || {}) as KnowledgePayload;
          return {
            id: r.id,
            score: r.score,
            title: payload.title,
            snippet: payload.snippet?.substring(0, 300),
            language: payload.language,
          };
        }),
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    return await handleChatRequest(req);
  } catch {
    return new Response(JSON.stringify({ error: { code: 'CHATBOT_ERROR' } }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
