import { getSupabase } from './config.ts';
import type { DoclingChunk } from './types.ts';

const createContentItem = async (
  title: string,
  slug: string,
  language: string,
  type: string,
  tags: string[],
  storagePath: string,
  chunks: DoclingChunk[],
): Promise<string> => {
  const supabase = getSupabase();

  const bodyMarkdown = chunks
    .map((chunk) => {
      const headingPrefix = chunk.headings.length > 0
        ? `## ${chunk.headings.join(' > ')}\n\n`
        : '';
      return headingPrefix + chunk.text;
    })
    .join('\n\n---\n\n');

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

export { createContentItem };
