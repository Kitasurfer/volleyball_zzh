// Two LOCAL, isolated Edge stacks, each pinned to its own model and collection.
import { readFile } from 'node:fs/promises';
import process from 'node:process';

const cases = JSON.parse(await readFile(new URL('../docs/chatbot/retrieval-cases.json', import.meta.url)));
const args = process.argv.slice(2);
if (args.length !== 2) throw Error('Usage: node scripts/compare-chat-search.mjs BASE_LOCAL_URL CANDIDATE_LOCAL_URL');
const urls = args.map(value => {
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))
    throw Error('Use isolated loopback stacks, not production.');
  return url;
});
if (urls[0].origin === urls[1].origin) throw Error('Specify two different local stacks.');
for (const [i, url] of urls.entries()) {
  const name = i ? 'CANDIDATE' : 'BASE';
  const key = process.env[`CHAT_EVAL_${name}_TOKEN`];
  if (!key) throw Error(`Missing CHAT_EVAL_${name}_TOKEN`);
  const counts = {}, latency = [];
  for (const c of cases) {
    const start = Date.now();
    const res = await fetch(new URL('/functions/v1/chatbot/debug-flow', url), {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(35000),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, apikey: key },
      body: JSON.stringify({ question: c.question, language: c.language }),
    });
    if (!res.ok) throw Error(`${name} debug-flow: HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.top_results)) throw Error('Deploy the instrumented search to both local stacks.');
    const id = `volleyball-regeln-${c.sourceLanguage || c.language}`;
    const hit = data.top_results.slice(0, 5).some(r => r.origin?.content_id === id && c.chunks.includes(r.origin.chunk_index));
    const label = c.sourceLanguage ? `${c.language}->${c.sourceLanguage}` : c.language;
    const bucket = counts[label] ||= { hits: 0, total: 0 };
    bucket.total++; bucket.hits += Number(hit); latency.push(Date.now() - start);
  }
  latency.sort((a, b) => a - b);
  console.log(name, JSON.stringify({ recallAt5: counts, p95Ms: latency[Math.ceil(latency.length * .95) - 1] }));
}
