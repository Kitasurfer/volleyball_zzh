/**
 * Process Document Edge Function
 * 
 * Receives uploaded documents, sends PDFs to Docling service for parsing,
 * creates content_item entry, and enqueues vectorization job.
 */

import { corsHeaders } from './config.ts';
import type { DoclingChunk, DoclingResponse, RequestBody } from './types.ts';
import { downloadFile as downloadFileFromStorage } from './storage.ts';
import {
  processWithDocling as processWithDoclingImpl,
  splitMarkdownIntoChunks as splitMarkdownIntoChunksImpl,
  fallbackChunking as fallbackChunkingImpl,
} from './docling.ts';
import { createContentItem as createContentItemImpl } from './content.ts';
import { enqueueVectorJob as enqueueVectorJobImpl } from './jobs.ts';

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
  return downloadFileFromStorage(storagePath);
};

/**
 * Send PDF to Docling service for processing
 */
const processWithDocling = async (
  fileContent: Uint8Array,
  filename: string,
  language: string,
): Promise<DoclingResponse> => {
  return processWithDoclingImpl(fileContent, filename, language);
};

/**
 * Split markdown into semantic chunks by headings
 */
const splitMarkdownIntoChunks = (markdown: string, maxChunkSize = 1500): DoclingChunk[] => {
  return splitMarkdownIntoChunksImpl(markdown, maxChunkSize);
};

/**
 * Fallback chunking for non-PDF files or when Docling fails
 */
const fallbackChunking = (text: string, chunkSize = 1000, overlap = 200): DoclingChunk[] => {
  return fallbackChunkingImpl(text, chunkSize, overlap);
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
  chunks: DoclingChunk[],
): Promise<string> => {
  return createContentItemImpl(title, slug, language, type, tags, storagePath, chunks);
};

/**
 * Enqueue vectorization job
 */
const enqueueVectorJob = async (contentId: string): Promise<void> => {
  return enqueueVectorJobImpl(contentId);
};

Deno.serve(async (req: Request): Promise<Response> => {
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
