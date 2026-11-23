import { generateCerebrasChat } from './clients.ts';
import { corsHeaders, getCerebrasConfig, maxOutputTokens } from './config.ts';
import { routeQuestion } from './intent.ts';
import { messages } from './messages.ts';
import { buildChatMessages, readCompletion } from './prompts.ts';
import { retrieve } from './rag.ts';
import { parseRequest } from './request.ts';
import { directAnswer } from './router.ts';
import { ruleFact } from './ruleFacts.ts';
import type { Answer, Citation, RequestBody } from './types.ts';

export async function answerQuestion(body: RequestBody): Promise<Answer> {
  const route = routeQuestion(body.question, body.language, body.history);
  const m = messages[route.language];
  const direct = ruleFact(route, body.question) ?? await directAnswer(route, undefined, body.question);
  if (direct) return direct;
  const unknown = route.kind === 'club'
    ? { answer: m.unknown, citations: [{ id: 'contact', title: m.contact, url: '/contact', score: 1 }] }
    : { answer: m.rules, citations: [] };
  let citations: Citation[] = [];
  try { citations = await retrieve(route); }
  catch {
    console.warn('chat_search_unavailable', route.language, route.kind);
    if (route.kind !== 'general') return { ...unknown, answer: m.unavailable };
  }
  const grounded = route.kind === 'rules' || route.kind === 'club';
  if (grounded && !citations.length) return unknown;
  const raw = await generateCerebrasChat(getCerebrasConfig(),
    buildChatMessages(body.question, route, citations, body.history ?? []),
    { temperature: 0.15, maxOutputTokens });
  const answer = readCompletion(raw, citations);
  return grounded && !answer.citations.length ? unknown : answer;
}

export async function handleChatRequest(req: Request) {
  const json = (data: unknown, status: number) => Response.json(data, { status, headers: corsHeaders });
  const body = parseRequest(await req.json().catch(() => null));
  if (!body) return json({ error: { code: 'INVALID_REQUEST' } }, 400);
  const start = Date.now(), messageId = crypto.randomUUID();
  const result = await answerQuestion(body);
  const route = routeQuestion(body.question, body.language, body.history);
  console.info('chat_answer', { messageId, language: route.language, kind: route.kind,
    sources: result.citations.length, elapsedMs: Date.now() - start });
  return json({ data: { answer: result.answer, sessionId: body.sessionId, messageId,
    citations: result.citations.map(({ id, title, url, headings }) => ({ id, title, url, headings })) } }, 200);
}
