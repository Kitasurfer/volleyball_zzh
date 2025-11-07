export type MediaTypeFilter = 'image' | 'video' | 'document' | 'audio' | 'other';

export interface MediaAssetSummary {
  id: string;
  title: string | null;
  description: string | null;
  language: string | null;
  mediaType: string;
  storagePath: string;
  createdAt: string;
  signedUrl?: string;
}

export interface MediaFilters {
  search: string;
  language: string | 'all';
  mediaType: MediaTypeFilter | 'all';
}

export interface MediaAssetDetail {
  id: string;
  title: string | null;
  description: string | null;
  language: string | null;
  mediaType: string;
  storagePath: string;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaEditorInput {
  title: string | null;
  description: string | null;
  language: string | null;
  mediaType: string;
  metadata?: Record<string, unknown> | null;
}
