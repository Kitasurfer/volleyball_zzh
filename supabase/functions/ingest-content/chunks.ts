import type { ContentItem, MediaLink, Chunk, DoclingResponse } from './types.ts';
import { getDoclingUrl } from './config.ts';

const stripHtml = (value: string | null): string => {
  if (!value) return '';
  return value.replace(/<[^>]+>/g, ' ');
};

const buildEnrichedText = (content: ContentItem, media: MediaLink[]): string => {
  const parts: string[] = [];

  if (content.title) {
    parts.push(`# ${content.title}`);
  }

  if (content.summary) {
    parts.push(content.summary);
  }

  const body = stripHtml(content.body_html) || content.body_markdown || '';
  if (body) {
    parts.push(body);
  }

  if (media.length > 0) {
    const imageBlocks = media.map((item, index) => {
      const title = item.title || `Image ${index + 1}`;
      const classification = (item.metadata as any)?.classification;
      const description = item.description || '';

      let header = `[Image: ${title}`;
      if (classification) {
        header += ` (${classification})`;
      }
      header += ']';

      return [header, description]
        .filter((value) => value && value.trim().length > 0)
        .join('\n');
    });

    parts.push(imageBlocks.join('\n\n'));
  }

  return parts.join('\n\n');
};

const splitIntoChunks = (text: string, chunkSize = 1000, overlap = 200): string[] => {
  const chunks: string[] = [];
  const normalized = text.trim();

  if (!normalized) return chunks;

  let start = 0;
  const length = normalized.length;

  while (start < length) {
    const end = Math.min(length, start + chunkSize);
    const slice = normalized.slice(start, end).trim();

    if (slice.length > 0) {
      chunks.push(slice);
    }

    if (end === length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
};

const splitMarkdownIntoChunks = (markdown: string, maxChunkSize = 1500): Chunk[] => {
  const chunks: Chunk[] = [];
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

const fetchDoclingChunks = async (sourceFile: string): Promise<Chunk[] | null> => {
  // Temporarily disabled due to timeout issues with large PDFs
  // TODO: Re-enable when Docling service is faster or use background processing
  console.log('Docling integration temporarily disabled, using fallback chunking');
  return null;
  
  const doclingUrl = getDoclingUrl();
  if (!doclingUrl) {
    console.log('DOCLING_SERVICE_URL not set, skipping Docling');
    return null;
  }
  
  // Only process PDFs
  if (!sourceFile.toLowerCase().endsWith('.pdf')) {
    return null;
  }
  
  try {
    // Download file from storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const fileUrl = `${supabaseUrl}/storage/v1/object/public/documents/${sourceFile}`;
    
    console.log(`Downloading PDF from: ${fileUrl}`);
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      console.error(`Failed to download PDF: ${fileResponse.status}`);
      return null;
    }
    
    const fileBlob = await fileResponse.blob();
    console.log(`Downloaded ${fileBlob.size} bytes`);
    
    // Send to Docling
    const formData = new FormData();
    formData.append('file', fileBlob, 'document.pdf');
    
    const doclingUrlFull = `${doclingUrl}/process`;
    console.log(`Sending to Docling: ${doclingUrlFull}`);
    const doclingResponse = await fetch(doclingUrlFull, {
      method: 'POST',
      body: formData,
    });
    
    if (!doclingResponse.ok) {
      console.error(`Docling error: ${doclingResponse.status}`);
      return null;
    }
    
    const result: DoclingResponse = await doclingResponse.json();
    
    if (result.error) {
      console.error(`Docling returned error: ${result.error}`);
      return null;
    }
    
    if (!result.markdown || result.markdown.length < 100) {
      console.warn('Docling returned empty markdown');
      return null;
    }
    
    console.log(`Docling returned ${result.markdown.length} chars, ${result.metadata?.pages || 0} pages`);
    
    const chunks = splitMarkdownIntoChunks(result.markdown);
    console.log(`Split into ${chunks.length} chunks`);
    
    return chunks;
  } catch (error) {
    console.error('Docling processing failed:', error);
    return null;
  }
};

const buildChunks = async (content: ContentItem, media: MediaLink[]): Promise<Chunk[]> => {
  const meta = content.metadata as any;
  
  const doclingChunks = meta?.docling_chunks;
  if (Array.isArray(doclingChunks) && doclingChunks.length > 0) {
    const builtFromDocling = doclingChunks
      .map((chunk: any) => {
        const rawText = (chunk?.text ?? '').toString().trim();
        if (!rawText) return null;

        return {
          text: rawText,
          headings: Array.isArray(chunk?.headings) ? chunk.headings : undefined,
          origin: chunk?.origin,
          docItemsRefs: Array.isArray(chunk?.doc_items_refs) ? chunk.doc_items_refs : undefined,
        } as Chunk;
      })
      .filter((value): value is Chunk => value !== null);

    if (builtFromDocling.length > 0) {
      console.log(`Using ${builtFromDocling.length} pre-computed docling chunks`);
      return builtFromDocling;
    }
  }
  
  const sourceFile = meta?.source_file;
  if (sourceFile) {
    const doclingResult = await fetchDoclingChunks(sourceFile);
    if (doclingResult && doclingResult.length > 0) {
      return doclingResult;
    }
  }

  const enrichedText = buildEnrichedText(content, media);
  const fallbackTexts = splitIntoChunks(enrichedText);

  return fallbackTexts.map((text) => ({ text }));
};

export { buildChunks };
