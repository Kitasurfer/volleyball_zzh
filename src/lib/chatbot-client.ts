/**
 * Chatbot client - wraps the Supabase Edge Function call.
 */

import { supabase } from './supabase';
import type { ChatbotResponse } from '../types/chatbot';

export interface ChatbotHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatbotRequest {
  question: string;
  language?: string;
  sessionId?: string;
  history?: ChatbotHistoryItem[];
}

export async function invokeChatbot(
  request: ChatbotRequest,
): Promise<{ data?: ChatbotResponse; error?: Error }> {
  try {
    const { data, error } = await supabase.functions.invoke<{ data?: ChatbotResponse }>('chatbot', {
      body: request,
    });

    if (error) {
      throw error;
    }

    return { data: data?.data };
  } catch (error) {
    console.error('Chatbot invocation error:', error);
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }
}
