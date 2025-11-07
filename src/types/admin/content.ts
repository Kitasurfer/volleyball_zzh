export type ContentStatus = 'draft' | 'review' | 'published';

export interface ContentItemSummary {
  id: string;
  title: string;
  language: string;
  status: ContentStatus;
  updatedAt: string;
  pendingJobs: number;
}

export interface ContentFilters {
  search: string;
  status: ContentStatus | 'all';
  language: string | 'all';
}

export interface ContentMediaLink {
  mediaId: string;
  role: string;
  position: number;
  title?: string | null;
  mediaType?: string;
  storagePath?: string;
  language?: string | null;
}

export interface ContentItemDetail {
  id: string;
  title: string;
  slug: string;
  language: string;
  status: ContentStatus;
  summary: string | null;
  bodyMarkdown: string | null;
  bodyHtml: string | null;
  type: string;
  tags: string[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  media: ContentMediaLink[];
}

export interface ContentEditorInput {
  title: string;
  slug: string;
  language: string;
  status: ContentStatus;
  summary: string | null;
  bodyMarkdown: string | null;
  bodyHtml: string | null;
  type: string;
  tags: string[];
  publishedAt: string | null;
  mediaLinks: Array<{
    mediaId: string;
    role: string;
    position: number;
  }>;
}
