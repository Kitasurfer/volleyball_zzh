#!/usr/bin/env node
/**
 * Download a volleyball rules document by URL, convert it to markdown via Docling,
 * split it into chunks, and store preview + payload files locally so they can be
 * reviewed before uploading to Qdrant.
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import process from 'node:process';

const DEFAULT_DOCLING_URL = process.env.DOCLING_SERVICE_URL ?? 'https://volleyball-docling.onrender.com';
const OUTPUT_ROOT = 'docs/chatbot/generated';

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { _: [] };

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.replace(/^--/, '').split('=');
      parsed[key] = value ?? true;
    } else {
      parsed._.push(arg);
    }
  }

  parsed.file = parsed.file ?? parsed.input ?? null;
  parsed.url = parsed.url ?? parsed._[0];
  parsed.title = parsed.title ?? parsed._[1];
  parsed.language = parsed.language ?? parsed.lang ?? 'de';
  parsed.slug = parsed.slug ?? parsed.id;
  parsed.docling = parsed.docling ?? DEFAULT_DOCLING_URL;

  if ((!parsed.url && !parsed.file) || !parsed.title) {
    console.error('Usage: node scripts/prepare-rule-chunks.mjs (--url=<file_url> | --file=<path>) --title="Title" [--language=de] [--slug=volleyball-rules]');
    process.exit(1);
  }

  return parsed;
}

function slugify(value) {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || `rule-${Date.now()}`;
}

function chunkSnippet(text) {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 260);
}

function splitMarkdownIntoChunks(markdown, maxChunkSize = 1500) {
  const chunks = [];
  const lines = markdown.split('\n');

  let currentChunk = '';
  let currentHeadings = [];
  const headingStack = [];

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
      currentChunk += `${line}\n`;

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
}

async function downloadFile(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download source file (${response.status} ${response.statusText})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
  const filename = basename(new URL(url).pathname || 'source-file');
  return { data: Buffer.from(arrayBuffer), contentType, filename };
}

async function loadLocalFile(filePath) {
  const buffer = await readFile(filePath);
  const extension = extname(filePath).toLowerCase();
  const mimeMap = {
    '.pdf': 'application/pdf',
    '.md': 'text/markdown',
    '.txt': 'text/plain',
    '.markdown': 'text/markdown',
  };
  const contentType = mimeMap[extension] ?? 'application/octet-stream';
  const filename = basename(filePath);
  return { data: buffer, contentType, filename };
}

async function processWithDocling(doclingUrl, fileBlob, filename) {
  const form = new FormData();
  form.append('file', fileBlob, filename);

  const response = await fetch(`${doclingUrl.replace(/\/$/, '')}/process`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Docling error (${response.status}): ${message.slice(0, 400)}`);
  }

  const json = await response.json();
  if (!json.markdown || json.markdown.length < 100) {
    throw new Error('Docling returned empty markdown.');
  }

  return json;
}

async function main() {
  const args = parseArgs();
  const slug = args.slug ?? slugify(args.title);
  const language = args.language;
  const contentId = args.contentId ?? `${slug}-${language}`;

  let sourceInfo;
  if (args.file) {
    console.log(`Reading local file: ${args.file}`);
    sourceInfo = await loadLocalFile(args.file);
  } else {
    console.log(`Downloading source: ${args.url}`);
    sourceInfo = await downloadFile(args.url);
  }

  const isPdf = (sourceInfo.contentType || '').includes('pdf') || sourceInfo.filename.toLowerCase().endsWith('.pdf');

  let markdown;
  let doclingMetadata = {};

  if (isPdf) {
    console.log('Sending file to Docling...');
    const blob = new Blob([sourceInfo.data], { type: sourceInfo.contentType || 'application/pdf' });
    const doclingResult = await processWithDocling(args.docling, blob, sourceInfo.filename);
    markdown = doclingResult.markdown;
    doclingMetadata = doclingResult.metadata || {};
    console.log(`Docling returned ${markdown.length} characters of markdown.`);
  } else {
    console.log('Using plain text/markdown input (Docling skipped).');
    markdown = sourceInfo.data.toString('utf8');
    doclingMetadata = { source: sourceInfo.filename, strategy: 'manual' };
  }

  console.log('Splitting into chunks...');
  const chunks = splitMarkdownIntoChunks(markdown);
  if (!chunks.length) {
    throw new Error('Chunking produced zero chunks.');
  }
  console.log(`Created ${chunks.length} chunks (avg ${(markdown.length / chunks.length).toFixed(0)} chars).`);

  const outputDir = args.out
    ? args.out
    : join(OUTPUT_ROOT, slug, language);
  const chunksDir = join(outputDir, 'chunks');
  await mkdir(chunksDir, { recursive: true });

  await writeFile(join(outputDir, 'source.md'), markdown, 'utf8');

  const chunkPayload = chunks.map((chunk, index) => ({
    chunk_index: index,
    headings: chunk.headings,
    text: chunk.text,
    snippet: chunkSnippet(chunk.text),
  }));

  await writeFile(
    join(outputDir, 'chunks.json'),
    JSON.stringify({
      title: args.title,
      language,
      content_id: contentId,
      source_url: args.url,
      chunk_count: chunkPayload.length,
      docling_metadata: doclingMetadata,
      chunks: chunkPayload,
    }, null, 2),
    'utf8'
  );

  // Write human-readable chunk previews.
  for (const chunk of chunkPayload) {
    const fileName = `chunk-${String(chunk.chunk_index + 1).padStart(3, '0')}.md`;
    const headingLine = chunk.headings?.length ? `# ${chunk.headings.join(' > ')}` : `# Chunk ${chunk.chunk_index + 1}`;
    const content = `${headingLine}\n\n${chunk.text}\n`;
    await writeFile(join(chunksDir, fileName), content, 'utf8');
  }

  const payloadFile = join(outputDir, 'payload.json');
  await writeFile(
    payloadFile,
    JSON.stringify({
      content_id: contentId,
      title: args.title,
      language,
      source_url: args.url,
      chunks: chunkPayload.map(({ chunk_index, text, headings }) => ({ chunk_index, text, headings })),
      metadata: doclingMetadata,
    }, null, 2),
    'utf8'
  );

  console.log('Files written to', outputDir);
  console.log('- source.md          (Docling markdown)');
  console.log('- chunks.json        (chunk metadata + snippets)');
  console.log('- payload.json       (ready for POST /ingest-content/upload-chunks)');
  console.log('- chunks/*.md        (per-chunk previews)');
  console.log('\nNext step: review the generated markdown/chunks, then run:');
  console.log(`curl -X POST "$${'SUPABASE_INGEST_URL' ?? 'https://kxwmkvtxkaczuonnnxlj.supabase.co/functions/v1/ingest-content/upload-chunks'}" \\\n  -H "Authorization: Bearer <SERVICE_KEY>" \\\n  -H "Content-Type: application/json" \\\n  -d @${payloadFile}`);
}

main().catch((error) => {
  console.error('\nFailed to prepare rule chunks:', error.message);
  process.exit(1);
});
