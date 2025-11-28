#!/usr/bin/env node
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import process from 'node:process';

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

  parsed.chunksDir = parsed.chunksDir ?? parsed.dir ?? parsed._[0] ?? null;
  parsed.language = parsed.language ?? parsed.lang ?? parsed._[1] ?? null;
  parsed.title = parsed.title ?? parsed._[2] ?? null;
  parsed.contentId = parsed.contentId ?? parsed.content_id ?? null;
  parsed.slug = parsed.slug ?? parsed.id ?? parsed.contentId ?? null;
  parsed.sourceUrl = parsed.sourceUrl ?? parsed.source ?? null;
  parsed.outputDir = parsed.outputDir ?? parsed.out ?? null;

  if (!parsed.chunksDir || !parsed.language || !parsed.title || !parsed.contentId) {
    console.error('Usage: node scripts/build-chunk-payloads.mjs --chunksDir=PATH --language=de --title="Title" --contentId=slug-lang [--slug=slug] [--sourceUrl=path/to/source] [--outputDir=PATH]');
    process.exit(1);
  }

  return parsed;
}

const snippet = (text) => text.replace(/\s+/g, ' ').trim().slice(0, 260);

const parseChunkFile = (raw) => {
  const lines = raw.split(/\r?\n/);
  let headingLine = '';
  let bodyLines = [...lines];

  if (lines[0]?.startsWith('#')) {
    headingLine = lines[0].replace(/^#\s*/, '').trim();
    bodyLines = lines.slice(1);
  }

  while (bodyLines.length && bodyLines[0].trim() === '') {
    bodyLines.shift();
  }

  const text = bodyLines.join('\n').trim();
  const headings = headingLine
    ? headingLine.split('>').map((part) => part.trim()).filter(Boolean)
    : [];

  return { headings, text };
};

async function main() {
  const args = parseArgs();
  const outputDir = args.outputDir ?? join('docs/chatbot/generated', args.slug, args.language);
  await mkdir(outputDir, { recursive: true });

  const files = (await readdir(args.chunksDir))
    .filter((file) => /^chunk-\d+\.md$/i.test(file))
    .sort((a, b) => a.localeCompare(b));

  if (!files.length) {
    throw new Error(`No chunk files found in ${args.chunksDir}`);
  }

  const chunks = [];
  for (const file of files) {
    const raw = await readFile(join(args.chunksDir, file), 'utf8');
    const { headings, text } = parseChunkFile(raw);
    if (!text || text.length < 20) {
      continue;
    }
    chunks.push({
      chunk_index: chunks.length,
      headings,
      text,
      filename: basename(file),
    });
  }

  if (!chunks.length) {
    throw new Error('Parsed zero valid chunks');
  }

  const chunkSummary = {
    title: args.title,
    language: args.language,
    content_id: args.contentId,
    source_url: args.sourceUrl ?? null,
    chunk_count: chunks.length,
    docling_metadata: {
      source: 'manual-chunks',
      generated_at: new Date().toISOString(),
    },
    chunks: chunks.map(({ chunk_index, headings, text }) => ({
      chunk_index,
      headings,
      text,
      snippet: snippet(text),
    })),
  };

  await writeFile(join(outputDir, 'chunks.json'), JSON.stringify(chunkSummary, null, 2), 'utf8');

  const payload = {
    content_id: args.contentId,
    title: args.title,
    language: args.language,
    source_file: args.sourceUrl ?? null,
    chunks: chunks.map(({ chunk_index, headings, text }) => ({
      chunk_index,
      headings,
      text,
    })),
    metadata: {
      generated_at: new Date().toISOString(),
      source: 'manual-chunks',
    },
  };

  await writeFile(join(outputDir, 'payload.json'), JSON.stringify(payload, null, 2), 'utf8');

  console.log(`Generated ${chunks.length} chunks for ${args.contentId}`);
  console.log(`chunks.json and payload.json written to ${outputDir}`);
}

main().catch((error) => {
  console.error('Failed to build chunk payloads:', error.message);
  process.exit(1);
});
