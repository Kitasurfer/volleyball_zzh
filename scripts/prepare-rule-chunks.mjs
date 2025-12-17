#!/usr/bin/env node
/**
 * Download a volleyball rules document by URL, convert it to markdown via Docling,
 * split it into chunks, and store preview + payload files locally so they can be
 * reviewed before uploading to Qdrant.
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
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

async function runProcess(command, args) {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`Command failed (${code}): ${stderr.slice(0, 400)}`));
    });
  });
}

async function extractPdfTextWithPython(pdfBuffer) {
  const tempPath = join(tmpdir(), `pdf-${Date.now()}-${Math.random().toString(16).slice(2)}.pdf`);
  await writeFile(tempPath, pdfBuffer);

  try {
    const python = [
      'import json',
      'import sys',
      '',
      'path = sys.argv[1]',
      'pages = 0',
      'text = ""',
      '',
      'try:',
      '    import PyPDF2',
      '    with open(path, "rb") as f:',
      '        reader = PyPDF2.PdfReader(f)',
      '        pages = len(reader.pages)',
      'except Exception:',
      '    pages = 0',
      '',
      'try:',
      '    from pdfminer.high_level import extract_text',
      '    text = extract_text(path) or ""',
      'except Exception:',
      '    try:',
      '        import PyPDF2',
      '        with open(path, "rb") as f:',
      '            reader = PyPDF2.PdfReader(f)',
      '            parts = []',
      '            for page in reader.pages:',
      '                parts.append(page.extract_text() or "")',
      '            text = "\\n".join(parts)',
      '    except Exception:',
      '        text = ""',
      '',
      'sys.stdout.write(json.dumps({"text": text, "pages": pages}))',
      '',
    ].join('\n');

    const { stdout } = await runProcess('python3', ['-c', python, tempPath]);
    const parsed = JSON.parse(stdout);
    return {
      text: parsed.text ?? '',
      pages: Number.isFinite(parsed.pages) ? parsed.pages : 0,
    };
  } finally {
    await rm(tempPath, { force: true });
  }
}

async function cleanChunkPreviews(chunksDir) {
  try {
    const existing = await readdir(chunksDir);
    const previewFiles = existing.filter((file) => /^chunk-\d+\.md$/i.test(file));
    await Promise.all(previewFiles.map((file) => rm(join(chunksDir, file), { force: true })));
  } catch {
    // ignore
  }
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
    try {
      const doclingResult = await processWithDocling(args.docling, blob, sourceInfo.filename);
      markdown = doclingResult.markdown;
      doclingMetadata = doclingResult.metadata || {};
      console.log(`Docling returned ${markdown.length} characters of markdown.`);
    } catch (error) {
      console.warn(`Docling failed: ${error?.message ?? String(error)}`);
      console.log('Falling back to local PDF text extraction (python3)...');
      const extracted = await extractPdfTextWithPython(sourceInfo.data);
      const text = (extracted.text || '').trim();
      if (!text || text.length < 100) {
        throw new Error('PDF extraction fallback returned empty text.');
      }
      markdown = `# ${args.title}\n\n${text}\n`;
      doclingMetadata = {
        pages: extracted.pages || 0,
        figures: 0,
        tables: 0,
      };
      console.log(`Fallback returned ${markdown.length} characters of text.`);
    }
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
  await cleanChunkPreviews(chunksDir);

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
      source_url: args.url ?? null,
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
      source_file: args.file ?? args.url ?? null,
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
