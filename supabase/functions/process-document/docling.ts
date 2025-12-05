import { getDoclingUrl } from './config.ts';
import type { DoclingChunk, DoclingResponse } from './types.ts';

const processWithDocling = async (
  fileContent: Uint8Array,
  filename: string,
  language: string,
): Promise<DoclingResponse> => {
  const doclingUrl = getDoclingUrl();

  const formData = new FormData();
  formData.append('file', new Blob([fileContent], { type: 'application/pdf' }), filename);

  const url = new URL('/process', doclingUrl);
  url.searchParams.set('max_tokens', '512');
  url.searchParams.set('language', language);

  console.log(`Sending to Docling: ${url.toString()}`);

  const response = await fetch(url.toString(), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Docling service error: ${response.status} - ${text}`);
  }

  return await response.json();
};

const splitMarkdownIntoChunks = (markdown: string, maxChunkSize = 1500): DoclingChunk[] => {
  const chunks: DoclingChunk[] = [];
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

const fallbackChunking = (text: string, chunkSize = 1000, overlap = 200): DoclingChunk[] => {
  const chunks: DoclingChunk[] = [];
  const normalized = text.trim();

  if (!normalized) return chunks;

  let start = 0;
  const length = normalized.length;

  while (start < length) {
    const end = Math.min(length, start + chunkSize);
    const slice = normalized.slice(start, end).trim();

    if (slice.length > 0) {
      chunks.push({
        text: slice,
        headings: [],
      });
    }

    if (end === length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
};

export { processWithDocling, splitMarkdownIntoChunks, fallbackChunking };
