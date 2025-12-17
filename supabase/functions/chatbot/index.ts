// Chatbot Edge Function - uses OpenAI for embeddings, Cerebras for chat
import { generateCerebrasChat } from './clients.ts';
import type { QdrantSearchResult } from './clients.ts';
import { fetchEmbedding, searchKnowledgeBase, mapQdrantResultToCitation } from './rag.ts';
import { enrichWithSubstitutionCitations } from './substitutions.ts';
import { buildSystemPrompt, buildChatMessages } from './prompts.ts';
import { isGreetingOrSmallTalk, cleanAnswer } from './utils.ts';
import {
  corsHeaders,
  ensureEnv,
  getQdrantClient,
  getCollectionName,
  getCerebrasConfig,
  maxCitations,
  maxOutputTokens,
  minRelevanceScore,
} from './config.ts';
import type { Citation, RequestBody, KnowledgePayload } from './types.ts';


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
      
      // Get collection info
      const infoResponse = await fetch(`${ensureEnv('QDRANT_URL')}/collections/${collection}`, {
        headers: ensureEnv('QDRANT_API_KEY', false) ? { 'api-key': ensureEnv('QDRANT_API_KEY', false)! } : {},
      });
      const info = await infoResponse.json();
      
      // Sample some points
      const scrollResponse = await fetch(`${ensureEnv('QDRANT_URL')}/collections/${collection}/points/scroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(ensureEnv('QDRANT_API_KEY', false) ? { 'api-key': ensureEnv('QDRANT_API_KEY', false)! } : {}),
        },
        body: JSON.stringify({ limit: 5, with_payload: true }),
      });
      const scroll = await scrollResponse.json();
      
      return new Response(JSON.stringify({ collection, info, sample: scroll }, null, 2), {
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
      
      console.log('=== Debug Flow ===');
      console.log('Question:', question);
      console.log('Language:', language);
      
      // Step 1: Generate embedding
      const embedding = await fetchEmbedding(question);
      console.log('Embedding length:', embedding.length);
      
      // Step 2: Search knowledge base
      const results = await searchKnowledgeBase(embedding, language);
      console.log('Search results:', results.length);
      
      // Step 3: Filter by score
      const relevant = results
        .filter((item) => item.score >= minRelevanceScore)
        .slice(0, maxCitations);
      console.log('Relevant results:', relevant.length);
      
      return new Response(JSON.stringify({
        question,
        language,
        embedding_length: embedding.length,
        raw_results: results.length,
        relevant_results: relevant.length,
        minRelevanceScore,
        maxCitations,
        top_results: results.slice(0, 5).map(r => {
          const payload = (r.payload || {}) as KnowledgePayload;
          return {
            id: r.id,
            score: r.score,
            title: payload.title,
            language: payload.language,
          };
        }),
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
    const body: RequestBody = await req.json();
    const language = body.language ?? 'de';

    console.log('=== Chatbot Request ===');
    console.log('Question:', body.question);
    console.log('Language:', language);

    if (!body.question || body.question.trim() === '') {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_REQUEST', message: 'Question is required' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle greetings without RAG
    if (isGreetingOrSmallTalk(body.question) && (!body.history || body.history.length === 0)) {
      const greetingResponses: Record<string, string> = {
        ru: 'Привет! Я помощник клуба SKV Unterensingen Volleyball. Чем могу помочь? Спросите меня о правилах волейбола, расписании тренировок или информации о клубе.',
        de: 'Hallo! Ich bin der Assistent von SKV Unterensingen Volleyball. Wie kann ich Ihnen helfen? Fragen Sie mich nach Volleyballregeln, Trainingszeiten oder Vereinsinformationen.',
        en: 'Hello! I am the SKV Unterensingen Volleyball assistant. How can I help you? Ask me about volleyball rules, training schedules, or club information.',
        it: 'Ciao! Sono l’assistente del club SKV Unterensingen Volleyball. Come posso aiutarti? Chiedimi delle regole della pallavolo, degli orari di allenamento o informazioni sul club.',
      };

      return new Response(
        JSON.stringify({
          data: {
            answer: greetingResponses[language] || greetingResponses.de,
            citations: [],
            sessionId: body.sessionId,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate embedding and search knowledge base
    let citations: Citation[] = [];
    
    try {
      const embedding = await fetchEmbedding(body.question);
      const results = await searchKnowledgeBase(embedding, language);

      console.log('Raw results from Qdrant:', results.length);
      
      // Filter by relevance score and limit to maxContextDocs
      const relevant = results
        .filter((item) => item.score >= minRelevanceScore)
        .slice(0, maxCitations);
      console.log(`Relevant results (score >= ${minRelevanceScore}, max ${maxCitations}):`, relevant.length);

      citations = relevant.map((item) => mapQdrantResultToCitation(item));

      console.log('Citations prepared:', citations.length);
      if (citations.length > 0) {
        console.log('First citation:', JSON.stringify(citations[0], null, 2));
      }
    } catch (searchError) {
      console.error('Knowledge search failed:', searchError);
      citations = [];
    }

    citations = await enrichWithSubstitutionCitations(body.question, language, citations);

    // Fallback: если по текущему короткому вопросу ничего не нашли, попробовать поискать по предыдущему вопросу пользователя
    if (citations.length === 0 && body.history && body.history.length > 0) {
      try {
        const previousUserMessages = body.history
          .filter((msg) => msg.role === 'user')
          .map((msg) => msg.content?.trim())
          .filter((content) => !!content && content !== body.question);

        const lastUserQuestion = previousUserMessages[previousUserMessages.length - 1];

        if (lastUserQuestion) {
          const combinedQuestion = `${lastUserQuestion}\n\n${body.question}`;
          console.log('No citations for current question, retrying search with history context');

          const fallbackEmbedding = await fetchEmbedding(combinedQuestion);
          const fallbackResults = await searchKnowledgeBase(fallbackEmbedding, language);

          const fallbackRelevant = fallbackResults
            .filter((item) => item.score >= minRelevanceScore)
            .slice(0, maxCitations);

          if (fallbackRelevant.length > 0) {
            citations = fallbackRelevant.map((item) => mapQdrantResultToCitation(item) as Citation);

            citations = await enrichWithSubstitutionCitations(combinedQuestion, language, citations);
          }
        }
      } catch (fallbackError) {
        console.error('Fallback knowledge search failed:', fallbackError);
      }
    }

    // If no relevant documents found после всех попыток
    if (citations.length === 0) {
      const noDocsResponses: Record<string, string> = {
        ru: 'К сожалению, в моей базе знаний нет документов с ответом на этот вопрос. Попробуйте переформулировать вопрос или спросите о правилах волейбола, расписании тренировок или информации о клубе.',
        de: 'Leider gibt es in meiner Wissensdatenbank keine Dokumente mit einer Antwort auf diese Frage. Versuchen Sie, die Frage umzuformulieren, oder fragen Sie nach Volleyballregeln, Trainingszeiten oder Vereinsinformationen.',
        en: 'Unfortunately, there are no documents in my knowledge base with an answer to this question. Try rephrasing your question, or ask about volleyball rules, training schedules, or club information.',
        it: 'Purtroppo nella mia base di conoscenza non ci sono documenti con una risposta a questa domanda. Prova a riformulare la domanda oppure chiedimi delle regole della pallavolo, degli orari di allenamento o informazioni sul club.',
      };

      return new Response(
        JSON.stringify({
          data: {
            answer: noDocsResponses[language] || noDocsResponses.de,
            citations: [],
            sessionId: body.sessionId,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate answer using Cerebras
    const messages = buildChatMessages(body.question, language, citations, body.history);
    console.log('Calling Cerebras for chat completion...');

    const cerebrasConfig = getCerebrasConfig();
    const rawAnswer = await generateCerebrasChat(cerebrasConfig, messages, {
      temperature: 0.3,
      maxOutputTokens,
    });

    console.log('Cerebras response length:', rawAnswer?.length || 0);

    if (!rawAnswer) {
      throw new Error('Cerebras returned an empty response');
    }

    const answer = cleanAnswer(rawAnswer, citations);
    console.log('Final answer length:', answer.length);
    
    // Don't show citations if the answer indicates no info was found
    const noInfoPhrases = [
      'отсутствует в предоставленных',
      'nicht enthalten',
      'not contained',
      'не указано',
      'nicht angegeben',
      'not specified',
    ];
    const hasNoInfo = noInfoPhrases.some(phrase => answer.toLowerCase().includes(phrase.toLowerCase()));
    const finalCitations: Citation[] = hasNoInfo ? [] : citations;
    
    console.log('=== End Request ===');

    return new Response(
      JSON.stringify({
        data: {
          answer,
          citations: finalCitations,
          sessionId: body.sessionId,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Chatbot error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'CHATBOT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
