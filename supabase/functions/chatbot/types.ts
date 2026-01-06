// Types
export interface Citation {
  id: string | number;
  score: number;
  title?: string;
  url?: string;
  snippet?: string;
  headings?: string[];
  media?: Array<{
    id: string;
    url: string;
    type: string;
    title?: string;
    description?: string;
    classification?: string;
  }>;
  source_file?: string;
  download_url?: string;
  language?: string;
  origin?: unknown;
}

export interface KnowledgePayload {
  title?: string;
  url?: string;
  snippet?: string;
  headings?: string[];
  media?: Citation['media'];
  source_file?: string;
  download_url?: string;
  language?: string;
  origin?: unknown;
  content_id?: string;
}

export interface HistoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface RequestBody {
  question: string;
  language?: string;
  sessionId?: string;
  history?: HistoryMessage[];
}
