/**
 * Chatbot client - uses local server when available
 */

const CHATBOT_URL = 'http://localhost:54321/functions/v1/chatbot';

export interface ChatbotRequest {
  question: string;
  language?: string;
  sessionId?: string;
}

export interface ChatbotResponse {
  answer: string;
  citations: Array<{
    id: string | number;
    score: number;
    title?: string;
    url?: string;
    snippet?: string;
    [key: string]: unknown;
  }>;
  sessionId?: string;
}

export async function invokeChatbot(request: ChatbotRequest): Promise<{ data?: ChatbotResponse; error?: Error }> {
  try {
    const response = await fetch(CHATBOT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return { data: result.data };
  } catch (error) {
    console.error('Chatbot invocation error:', error);
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}
