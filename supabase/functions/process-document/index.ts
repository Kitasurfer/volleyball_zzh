/**
 * Process Document Edge Function
 * 
 * Receives uploaded documents, sends PDFs to Docling service for parsing,
 * creates content_item entry, and enqueues vectorization job.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface DoclingChunk {
  text: string;
  headings: string[];
}

interface DoclingResponse {
  markdown: string;
  metadata: {
    pages: number;
    figures: number;
    tables: number;
  };
  images: string[];
  error?: string;
}

interface RequestBody {
  storage_path: string;
  language: string;
  type: string;
  title: string;
  tags?: string[];
}

const getSupabase = () => {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  return createClient(url, key);
};

const getDoclingUrl = () => Deno.env.get('DOCLING_SERVICE_URL') || 'http://localhost:8000';

const generateSlug = (title: string, timestamp: number): string => {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
  return `${base}-${timestamp}`;
};

/**
 * Download file from Supabase Storage
 */
const downloadFile = async (storagePath: string): Promise<Uint8Array> => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase.storage
    .from('documents')
    .download(storagePath);
  
  if (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }
  
  return new Uint8Array(await data.arrayBuffer());
};

/**
 * Send PDF to Docling service for processing
 */
const processWithDocling = async (
  fileContent: Uint8Array,
  filename: string,
  language: string
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

/**
 * Split markdown into semantic chunks by headings
 */
const splitMarkdownIntoChunks = (markdown: string, maxChunkSize = 1500): DoclingChunk[] => {
  const chunks: DoclingChunk[] = [];
  const lines = markdown.split('\n');
  
  let currentChunk = '';
  let currentHeadings: string[] = [];
  const headingStack: string[] = [];
  
  for (const line of lines) {
    // Check if line is a heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headingMatch) {
      // Save current chunk if it has content
      if (currentChunk.trim().length > 50) {
        chunks.push({
          text: currentChunk.trim(),
          headings: [...currentHeadings],
        });
      }
      
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();
      
      // Update heading stack
      while (headingStack.length >= level) {
        headingStack.pop();
      }
      headingStack.push(headingText);
      
      currentHeadings = [...headingStack];
      currentChunk = '';
    } else {
      currentChunk += line + '\n';
      
      // If chunk is too large, split it
      if (currentChunk.length > maxChunkSize) {
        chunks.push({
          text: currentChunk.trim(),
          headings: [...currentHeadings],
        });
        currentChunk = '';
      }
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.trim().length > 50) {
    chunks.push({
      text: currentChunk.trim(),
      headings: [...currentHeadings],
    });
  }
  
  return chunks;
};

/**
 * Fallback chunking for non-PDF files or when Docling fails
 */
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

/**
 * Create content_item in database
 */
const createContentItem = async (
  title: string,
  slug: string,
  language: string,
  type: string,
  tags: string[],
  storagePath: string,
  chunks: DoclingChunk[]
): Promise<string> => {
  const supabase = getSupabase();
  
  // Build body from chunks
  const bodyMarkdown = chunks.map(chunk => {
    const headingPrefix = chunk.headings.length > 0 
      ? `## ${chunk.headings.join(' > ')}\n\n`
      : '';
    return headingPrefix + chunk.text;
  }).join('\n\n---\n\n');
  
  const { data, error } = await supabase
    .from('content_items')
    .insert({
      title,
      slug,
      language,
      type,
      tags,
      body_markdown: bodyMarkdown,
      summary: chunks[0]?.text.slice(0, 300) || null,
      metadata: {
        source_file: storagePath,
        docling_chunks: chunks,
        processed_at: new Date().toISOString(),
      },
    })
    .select('id')
    .single();
  
  if (error) {
    throw new Error(`Failed to create content_item: ${error.message}`);
  }
  
  return data.id;
};

/**
 * Enqueue vectorization job
 */
const enqueueVectorJob = async (contentId: string): Promise<void> => {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from('vector_jobs')
    .insert({
      content_id: contentId,
      status: 'pending',
    });
  
  if (error) {
    throw new Error(`Failed to enqueue vector job: ${error.message}`);
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }
  
  try {
    const body: RequestBody = await req.json();
    
    console.log('=== Process Document ===');
    console.log('Storage path:', body.storage_path);
    console.log('Language:', body.language);
    console.log('Type:', body.type);
    console.log('Title:', body.title);
    
    if (!body.storage_path || !body.title) {
      return new Response(
        JSON.stringify({ error: 'storage_path and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const timestamp = Date.now();
    const slug = generateSlug(body.title, timestamp);
    const language = body.language || 'de';
    const type = body.type || 'article';
    const tags = body.tags || [];
    
    // Download file from storage
    console.log('Downloading file from storage...');
    const fileContent = await downloadFile(body.storage_path);
    console.log(`Downloaded ${fileContent.length} bytes`);
    
    // Determine if it's a PDF
    const isPdf = body.storage_path.toLowerCase().endsWith('.pdf');
    let chunks: DoclingChunk[] = [];
    
    if (isPdf) {
      // Process with Docling
      console.log('Processing PDF with Docling...');
      try {
        const doclingResult = await processWithDocling(
          fileContent,
          body.title,
          language
        );
        
        console.log('Docling response keys:', Object.keys(doclingResult));
        console.log('Docling markdown length:', doclingResult.markdown?.length || 0);
        
        if (doclingResult.markdown && doclingResult.markdown.length > 0) {
          // Split markdown into semantic chunks
          chunks = splitMarkdownIntoChunks(doclingResult.markdown);
          console.log(`Docling returned markdown (${doclingResult.markdown.length} chars), split into ${chunks.length} chunks`);
          console.log(`Document has ${doclingResult.metadata?.pages || 'unknown'} pages`);
          
          // Log first chunk for debugging
          if (chunks.length > 0) {
            console.log('First chunk headings:', chunks[0].headings);
            console.log('First chunk text (first 200 chars):', chunks[0].text.slice(0, 200));
          }
        } else if (doclingResult.error) {
          console.error('Docling returned error:', doclingResult.error);
          chunks = [{
            text: `PDF document: ${body.title}. Docling error: ${doclingResult.error}`,
            headings: [body.title],
          }];
        } else {
          console.warn('Docling returned empty markdown, using fallback');
          console.log('Full Docling response:', JSON.stringify(doclingResult).slice(0, 500));
          chunks = [{
            text: `PDF document: ${body.title}. Could not extract content.`,
            headings: [body.title],
          }];
        }
      } catch (doclingError) {
        console.error('Docling processing failed:', doclingError);
        // Fallback for PDF
        console.warn('Using fallback for PDF (limited quality)');
        chunks = [{
          text: `PDF document: ${body.title}. Docling service unavailable.`,
          headings: [body.title],
        }];
      }
    } else {
      // Non-PDF: decode as text and chunk
      console.log('Processing as text file...');
      const textDecoder = new TextDecoder('utf-8');
      const text = textDecoder.decode(fileContent);
      chunks = fallbackChunking(text);
      console.log(`Created ${chunks.length} chunks from text`);
    }
    
    if (chunks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No content could be extracted from the document' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create content item
    console.log('Creating content_item...');
    const contentId = await createContentItem(
      body.title,
      slug,
      language,
      type,
      tags,
      body.storage_path,
      chunks
    );
    console.log(`Created content_item: ${contentId}`);
    
    // Enqueue vectorization
    console.log('Enqueuing vector job...');
    await enqueueVectorJob(contentId);
    console.log('Vector job enqueued');
    
    console.log('=== Processing Complete ===');
    
    return new Response(
      JSON.stringify({
        success: true,
        content_id: contentId,
        slug,
        chunks_count: chunks.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Process document error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
