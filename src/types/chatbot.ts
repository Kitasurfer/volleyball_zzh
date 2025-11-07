export interface CitationMedia {
  id: string;
  url: string;
  type: string;
  title?: string;
}

export interface Citation {
  id: string | number;
  title?: string;
  url?: string;
  snippet?: string;
  score?: number;
  media?: CitationMedia[];
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  citations?: Citation[];
}

export interface ChatbotResponse {
  answer: string;
  citations?: Citation[];
  sessionId?: string;
}
