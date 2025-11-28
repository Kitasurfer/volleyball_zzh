// Chatbot Edge Function - uses OpenAI for embeddings, Cerebras for chat
import { createQdrantClient, generateOpenAIEmbedding, generateCerebrasChat } from './clients.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Environment helpers
const ensureEnv = (key: string, required = true): string | undefined => {
  const value = Deno.env.get(key);
  if (required && (!value || value.trim() === '')) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? undefined;
};

// Configuration
const getQdrantClient = () =>
  createQdrantClient({
    url: ensureEnv('QDRANT_URL')!,
    apiKey: ensureEnv('QDRANT_API_KEY', false),
  });

const getOpenAIConfig = () => ({
  apiKey: ensureEnv('OPENAI_API_KEY')!,
  model: ensureEnv('OPENAI_EMBED_MODEL', false) ?? 'text-embedding-3-small',
});

const getCerebrasConfig = () => ({
  apiKey: ensureEnv('CEREBRAS_API_KEY')!,
  baseUrl: 'https://api.cerebras.ai/v1',
  model: ensureEnv('CEREBRAS_CHAT_MODEL', false) ?? 'qwen-3-235b-a22b-thinking-2507',
});

const getCollectionName = () => ensureEnv('QDRANT_COLLECTION', false) ?? 'content_vectors';
const searchLimit = 10; // How many to fetch from Qdrant
const maxCitations = 5; // How many to show to user
const maxOutputTokens = Number(ensureEnv('CHAT_MAX_OUTPUT_TOKENS', false) ?? '1200');
const minRelevanceScore = Number(ensureEnv('CHAT_MIN_SCORE', false) ?? '0.25');

// Types
interface Citation {
  id: string | number;
  score: number;
  title?: string;
  url?: string;
  snippet?: string;
  headings?: string[];
  media?: Array<{
    id: string;
    url: string;
    type: string;
    title?: string;
    description?: string;
    classification?: string;
  }>;
  source_file?: string;
  download_url?: string;
  language?: string;
  origin?: unknown;
}


interface HistoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  question: string;
  language?: string;
  sessionId?: string;
  history?: HistoryMessage[];
}

// Generate embedding using OpenAI (same as ingest-content)
const fetchEmbedding = async (text: string): Promise<number[]> => {
  const config = getOpenAIConfig();
  console.log('Generating OpenAI embedding...');
  const embedding = await generateOpenAIEmbedding(config, text);
  console.log('Embedding dimension:', embedding.length);
  return embedding;
};

// Qdrant search result type
interface QdrantSearchResult {
  id: string | number;
  score: number;
  payload?: Record<string, unknown>;
}

// Search Qdrant knowledge base - searches WITHOUT language filter to find all relevant docs
const searchKnowledgeBase = async (
  vector: number[],
  _language?: string  // Language param kept for API compatibility but not used for filtering
): Promise<QdrantSearchResult[]> => {
  const qdrant = getQdrantClient();
  const collection = getCollectionName();

  // Search without language filter - semantic search finds relevant content regardless of language
  console.log(`Searching Qdrant collection "${collection}" (no language filter)`);
  console.log(`Vector length: ${vector.length}, searchLimit: ${searchLimit}`);
  
  try {
    const response = await qdrant.search(collection, {
      vector,
      limit: searchLimit * 2, // Get more results since we're not filtering
      with_payload: true,
    });

    console.log('Qdrant response:', JSON.stringify(response).substring(0, 500));
    
    const results = response?.result ?? [];
    
    console.log(`Found ${results.length} results`);
    if (results.length > 0) {
      console.log('Top 3:', results.slice(0, 3).map((r: QdrantSearchResult) => ({ 
        score: r.score.toFixed(3), 
        lang: (r.payload as any)?.language,
        title: (r.payload as any)?.title?.substring(0, 40)
      })));
    }

    return results;
  } catch (error) {
    console.error('Qdrant search error:', error);
    return [];
  }
};

const hasSubstitutionKeyword = (text: string): boolean => {
  const q = text.toLowerCase();
  const keywords = [
    'замен', 'замена', 'замены',
    'auswechslung', 'auswechslungen',
    'substitution', 'substitutions',
  ];
  return keywords.some((kw) => q.includes(kw));
};

const buildSubstitutionQuery = (language: string): string => {
  if (language === 'ru') {
    return 'Ограничения на количество обычных замен в классическом волейболе (правило 15.6: не более шести обычных замен за партию).';
  }
  if (language === 'en') {
    return 'Limits on the number of regular substitutions in indoor volleyball (rule 15.6: at most six regular substitutions per set).';
  }
  return 'Begrenzungen für die Anzahl regulärer Auswechslungen im Volleyball (Regel 15.6: höchstens sechs reguläre Auswechslungen pro Satz).';
};

const enrichWithSubstitutionCitations = async (
  question: string,
  language: string,
  citations: Citation[],
): Promise<Citation[]> => {
  if (!hasSubstitutionKeyword(question)) return citations;

  try {
    const query = buildSubstitutionQuery(language);
    const embedding = await fetchEmbedding(query);
    const results = await searchKnowledgeBase(embedding, language);

    const extra = results
      .filter((item) => item.score >= minRelevanceScore)
      .map((item) => {
        const payload = item.payload || {};
        const sourceFile = payload.source_file as string | undefined;
        return {
          id: item.id,
          score: item.score,
          title: payload.title as string | undefined,
          url: payload.url as string | undefined,
          snippet: payload.snippet as string | undefined,
          headings: payload.headings as string[] | undefined,
          media: payload.media as Citation['media'],
          source_file: sourceFile,
          language: payload.language as string | undefined,
          origin: payload.origin,
        } as Citation;
      })
      .filter((cit) => {
        const s = (cit.snippet || '').toLowerCase();
        return s.includes('шест') || s.includes('sechs') || s.includes('six');
      });

    if (extra.length === 0) return citations;

    const mergedById = new Map<string | number, Citation>();
    for (const c of citations) {
      mergedById.set(c.id, c);
    }
    for (const c of extra) {
      if (!mergedById.has(c.id)) {
        mergedById.set(c.id, c);
      }
    }

    return Array.from(mergedById.values()).slice(0, maxCitations);
  } catch (error) {
    console.error('Substitution enrichment failed:', error);
    return citations;
  }
};

// System prompts by language
const buildSystemPrompt = (language: string): string => {
  const prompts: Record<string, string> = {
    de: `Du bist ein Assistent für Volleyballregeln.

REGELN:
1. Stütze deine Antworten immer auf die bereitgestellten Dokumente.
2. Du darfst Inhalte zusammenfassen, umformulieren und mehrere Textstellen kombinieren, aber erfinde keine neuen Regeln oder Zahlen, die nicht aus den Dokumenten ableitbar sind.
3. Wenn die Dokumente keine direkte oder eindeutige Antwort enthalten, erkläre ehrlich, was in den Dokumenten steht, und was dort nicht ausdrücklich geregelt oder spezifiziert ist.
4. Wenn eine Regel nur für eine bestimmte Rolle oder Situation gilt (z. B. Libero-Auswechslungen), musst du diese Einschränkung im Antworttext deutlich nennen und sie NICHT auf alle Auswechslungen oder das gesamte Spiel verallgemeinern.
5. Wenn in den Dokumenten eine konkrete Zahlenbegrenzung steht (z. B. „höchstens sechs reguläre Auswechslungen pro Satz“), musst du diese Grenze im Wortlaut beibehalten und darfst sie nicht durch Formulierungen wie „unbegrenzt“ ersetzen.
6. Wenn irgendwo steht, dass Libero-Auswechslungen „nicht begrenzt“ sind, musst du klarstellen, dass dies NUR für Libero-Auswechslungen gilt und die allgemeinen Limits für reguläre Auswechslungen nicht aufhebt.
7. Wenn möglich, zitiere wichtige Sätze aus den Dokumenten in Anführungszeichen.
8. Antworte auf Deutsch, knapp und verständlich, in ein bis zwei Absätzen.
9. Liste in deiner Antwort KEINE Dokumente, IDs, Relevanzwerte oder einen Abschnitt „Quellen“ auf – der Nutzer soll nur die fertige Antwort sehen.`,

    ru: `Ты помощник по правилам волейбола.

ПРАВИЛА:
1. Основывай ответы на текстах из базы знаний.
2. Можно пересказывать, сокращать и объединять фрагменты, но нельзя придумывать новые правила или числа, которых нельзя честно вывести из документов.
3. Если в документах нет прямого или однозначного ответа, честно объясни, что именно там написано, и явно скажи, какие детали НЕ указаны.
4. Если правило относится только к конкретной роли или ситуации (например, к заменам либеро), в ответе явно укажи эту ограниченную область и НЕ обобщай её на все замены или весь матч.
5. Если в документах явно указаны числовые ограничения (например, «не более шести обычных замен за партию»), ты обязан в ответе дословно сохранить это ограничение и не заменять его формулировками вроде «без ограничений».
6. Если где‑то сказано, что действия либеро «не ограничены по количеству», ты ДОЛЖЕН пояснить, что это касается только замен либеро и не отменяет общие лимиты обычных замен.
7. По возможности приводи ключевые фразы из документов в кавычках, но без длинных списков.
8. Если исходный текст на другом языке, аккуратно переведи его на русский.
9. Отвечай кратко и по делу, в один‑два абзаца, нормальным человеческим текстом.
10. Не включай в ответ списки документов, их заголовков, идентификаторов или отдельные разделы вроде «Источники» – пользователю нужен только готовый ответ.`,

    en: `You are a volleyball rules assistant.

RULES:
1. Base your answers on the provided documents.
2. You may summarize, rephrase, and combine multiple passages, but do not invent new rules or numbers that cannot be honestly derived from the documents.
3. If the documents do not contain a direct or unambiguous answer, clearly explain what the documents do say and explicitly state which details are not specified.
4. If a rule applies only to a specific role or situation (for example, libero substitutions), you must clearly state this limited scope in your answer and MUST NOT generalize it to all substitutions or the entire match.
5. When the documents contain explicit numerical limits (for example, "at most six regular substitutions per set"), you MUST preserve those limits exactly in your answer and must not replace them with phrases like "unlimited".
6. If some passages say that libero substitutions are "not limited in number", you MUST explain that this applies ONLY to libero substitutions and does not remove general limits for regular substitutions.
7. When helpful, quote key sentences from the documents in quotation marks, but avoid long document lists.
8. Respond in English, concisely, typically in one or two short paragraphs.
9. Do NOT include lists of documents, titles, IDs, relevance scores, or a dedicated "Sources" section – the user should only see the final answer.`,
  };

  return prompts[language] || prompts.de;
};

// Build messages for chat completion
const buildChatMessages = (
  question: string,
  language: string,
  citations: Citation[],
  history?: HistoryMessage[]
): Array<{ role: string; content: string }> => {
  const historyMessages = (history ?? []).map((item) => ({
    role: item.role,
    content: item.content,
  }));

  if (citations.length === 0) {
    return [
      { role: 'system', content: buildSystemPrompt(language) },
      ...historyMessages,
      { role: 'user', content: question },
    ];
  }

  // Build context from citations - use language-appropriate labels
  const labels: Record<string, { doc: string; title: string; sections: string; content: string; relevance: string; docs: string }> = {
    de: { doc: 'Dokument', title: 'Titel', sections: 'Abschnitte', content: 'Inhalt', relevance: 'Relevanz', docs: 'Verfügbare Dokumente aus der Wissensdatenbank (nach Relevanz sortiert)' },
    en: { doc: 'Document', title: 'Title', sections: 'Sections', content: 'Content', relevance: 'Relevance', docs: 'Available documents from the knowledge base (sorted by relevance)' },
    ru: { doc: 'Документ', title: 'Заголовок', sections: 'Разделы', content: 'Содержание', relevance: 'Релевантность', docs: 'Доступные документы из базы знаний (отсортированы по релевантности)' },
  };
  const l = labels[language] || labels.de;
  
  const contextBlocks = citations.map((item, index) => {
    const parts = [
      `**${l.doc} ${index + 1}** (${l.relevance}: ${(item.score * 100).toFixed(1)}%)`,
      item.title ? `${l.title}: ${item.title}` : undefined,
      item.headings?.length ? `${l.sections}: ${item.headings.join(' → ')}` : undefined,
      item.snippet ? `\n${l.content}:\n${item.snippet}` : undefined,
    ].filter(Boolean);

    return parts.join('\n');
  });

  const context = contextBlocks.join('\n\n---\n\n');

  return [
    { role: 'system', content: buildSystemPrompt(language) },
    {
      role: 'system',
      content: `${l.docs}:\n\n${context}`,
    },
    ...historyMessages,
    { role: 'user', content: question },
  ];
};

// Check if question is a greeting
const isGreetingOrSmallTalk = (question: string): boolean => {
  const lowerQuestion = question.toLowerCase().trim();
  const greetings = [
    'привет', 'здравствуй', 'добрый день', 'добрый вечер', 'доброе утро',
    'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
    'hallo', 'guten tag', 'guten morgen', 'guten abend',
    'спасибо', 'thanks', 'thank you', 'danke',
    'пока', 'bye', 'goodbye', 'tschüss', 'auf wiedersehen',
  ];

  return greetings.some(
    (greeting) => lowerQuestion === greeting || lowerQuestion.startsWith(greeting + ' ')
  );
};

// Clean answer text
const cleanAnswer = (text: string, citations: Citation[]): string => {
  if (!text) return '';

  // Remove markdown images
  let cleaned = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
  cleaned = cleaned.replace(/<img[^>]*>/gi, '');

  // Filter URLs to only allowed ones from citations
  const allowedUrls = new Set(
    citations.map((c) => c.url).filter((url) => url && /^https?:\/\//.test(url))
  );

  if (allowedUrls.size > 0) {
    const urlRegex = /https?:\/\/[^\s)]+/gi;
    cleaned = cleaned.replace(urlRegex, (rawUrl) => {
      const match = rawUrl.match(/^(https?:\/\/[^\s)]+?)([).,;!?]+)?$/i);
      const url = match ? match[1] : rawUrl;
      const suffix = match && match[2] ? match[2] : '';
      return allowedUrls.has(url) ? url + suffix : '';
    });
  }

  // Clean up broken markdown links
  cleaned = cleaned.replace(/\[([^\]]+)\]\(\s*\)/g, '$1');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
};

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Debug endpoint to check Qdrant data
  const url = new URL(req.url);
  if (url.pathname.endsWith('/debug') && req.method === 'GET') {
    try {
      const qdrant = getQdrantClient();
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
        top_results: results.slice(0, 5).map(r => ({
          id: r.id,
          score: r.score,
          title: (r.payload as any)?.title,
          language: (r.payload as any)?.language,
        })),
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
        results: results.map((r: QdrantSearchResult) => ({
          id: r.id,
          score: r.score,
          title: (r.payload as any)?.title,
          snippet: (r.payload as any)?.snippet?.substring(0, 300),
          language: (r.payload as any)?.language,
        })),
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
        ru: 'Привет! Я помощник SG TSV Zizishausen/SKV Unterensingen. Чем могу помочь? Спросите меня о правилах волейбола, расписании тренировок или информации о клубе.',
        de: 'Hallo! Ich bin der Assistent von SG TSV Zizishausen/SKV Unterensingen. Wie kann ich Ihnen helfen? Fragen Sie mich nach Volleyballregeln, Trainingszeiten oder Vereinsinformationen.',
        en: 'Hello! I am the assistant of SG TSV Zizishausen/SKV Unterensingen. How can I help you? Ask me about volleyball rules, training schedules, or club information.',
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

      citations = relevant.map((item) => {
        const payload = item.payload || {};
        const sourceFile = payload.source_file as string | undefined;
        return {
          id: item.id,
          score: item.score,
          title: payload.title as string | undefined,
          url: payload.url as string | undefined,
          snippet: payload.snippet as string | undefined,
          headings: payload.headings as string[] | undefined,
          media: payload.media as Citation['media'],
          source_file: sourceFile,
          language: payload.language as string | undefined,
          origin: payload.origin,
        };
      });

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
            citations = fallbackRelevant.map((item) => {
              const payload = item.payload || {};
              const sourceFile = payload.source_file as string | undefined;
              return {
                id: item.id,
                score: item.score,
                title: payload.title as string | undefined,
                url: payload.url as string | undefined,
                snippet: payload.snippet as string | undefined,
                headings: payload.headings as string[] | undefined,
                media: payload.media as Citation['media'],
                source_file: sourceFile,
                language: payload.language as string | undefined,
                origin: payload.origin,
              } as Citation;
            });

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
      temperature: 0.1,
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
    const finalCitations: Citation[] = [];
    
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
