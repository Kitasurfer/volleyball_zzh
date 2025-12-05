// Types
export interface VectorJob {
  id: string;
  content_id: string;
  status: string;
  payload: Record<string, unknown> | null;
  language: string | null;
}

export interface ContentItem {
  id: string;
  title: string;
  summary: string | null;
  body_markdown: string | null;
  body_html: string | null;
  slug: string;
  language: string;
  type: string;
  metadata: Record<string, unknown> | null;
}

export interface MediaLink {
  media_id: string;
  role: string;
  position: number;
  title: string | null;
  description: string | null;
  storage_path: string;
  media_type: string;
  metadata: Record<string, unknown> | null;
}

export interface Chunk {
  text: string;
  headings?: string[];
  origin?: unknown;
  docItemsRefs?: string[];
}

export interface DoclingResponse {
  markdown: string;
  metadata: { pages: number; figures: number; tables: number };
  images: string[];
  error?: string;
}

export interface MediaPayload {
  id: string;
  url: string;
  type: string;
  title?: string;
  description?: string;
  classification?: string;
}
