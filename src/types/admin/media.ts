export type MediaTypeFilter = 'image' | 'video' | 'document' | 'audio' | 'other';

import type { Language } from '../../types';

export type LanguageCode = Language;

export type LocalizedTextMap = Partial<Record<LanguageCode, string>>;

export interface MediaAlbum {
  id: string;
  slug: string;
  category: string;
}

export interface MediaAssetSummary {
  id: string;
  title: string | null;
  description: string | null;
  language: string | null;
  mediaType: string;
  storagePath: string;
  createdAt: string;
  signedUrl?: string;
  albumId?: string | null;
  hasAltText?: boolean;
  hasTitleI18n?: boolean;
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
  albumId?: string | null;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  metadata?: Record<string, unknown> | null;
  altText?: LocalizedTextMap | null;
  titleI18n?: LocalizedTextMap | null;
  versions?: Record<string, unknown> | null;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
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
