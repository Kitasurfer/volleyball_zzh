export interface ChatSessionSummary {
  id: string;
  userHash: string;
  language: string | null;
  createdAt: string;
  lastActivity: string;
  messageCount: number;
  metadata?: Record<string, unknown> | null;
}

export interface ChatSessionFilters {
  search: string;
  language: string | 'all';
}

export type ChatMessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface AdminChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
  citations?: unknown;
  metadata?: Record<string, unknown> | null;
}
