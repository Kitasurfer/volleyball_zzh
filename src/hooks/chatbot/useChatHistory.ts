/**
 * Hook for managing chat history with localStorage persistence
 */
import { useState, useCallback, useEffect } from 'react';
import type { ChatMessage } from '../../types/chatbot';

const STORAGE_KEY = 'skv_chat_history';
const MAX_CONVERSATIONS = 10;

export interface ChatConversation {
  id: string;
  messages: ChatMessage[];
  language: string;
  createdAt: string;
  updatedAt: string;
  title: string;
}

interface UseChatHistoryReturn {
  conversations: ChatConversation[];
  currentConversationId: string | null;
  saveConversation: (messages: ChatMessage[], language: string) => string;
  loadConversation: (id: string) => ChatMessage[] | null;
  deleteConversation: (id: string) => void;
  clearAllHistory: () => void;
  setCurrentConversationId: (id: string | null) => void;
}

function generateConversationTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find((m) => m.sender === 'user');
  if (firstUserMessage) {
    const text = firstUserMessage.text;
    return text.length > 40 ? text.substring(0, 40) + '...' : text;
  }
  return new Date().toLocaleDateString();
}

function loadFromStorage(): ChatConversation[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function saveToStorage(conversations: ChatConversation[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    console.warn('Failed to save chat history to localStorage');
  }
}

export function useChatHistory(): UseChatHistoryReturn {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  useEffect(() => {
    setConversations(loadFromStorage());
  }, []);

  const saveConversation = useCallback((messages: ChatMessage[], language: string): string => {
    const userMessages = messages.filter((m) => m.sender === 'user');
    if (userMessages.length === 0) {
      return currentConversationId || '';
    }

    const now = new Date().toISOString();
    
    setConversations((prev) => {
      let updated: ChatConversation[];
      
      if (currentConversationId) {
        const existingIndex = prev.findIndex((c) => c.id === currentConversationId);
        if (existingIndex >= 0) {
          updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            messages,
            updatedAt: now,
            title: generateConversationTitle(messages),
          };
        } else {
          const newConversation: ChatConversation = {
            id: currentConversationId,
            messages,
            language,
            createdAt: now,
            updatedAt: now,
            title: generateConversationTitle(messages),
          };
          updated = [newConversation, ...prev].slice(0, MAX_CONVERSATIONS);
        }
      } else {
        const newId = `conv_${Date.now()}`;
        const newConversation: ChatConversation = {
          id: newId,
          messages,
          language,
          createdAt: now,
          updatedAt: now,
          title: generateConversationTitle(messages),
        };
        updated = [newConversation, ...prev].slice(0, MAX_CONVERSATIONS);
        setCurrentConversationId(newId);
      }
      
      saveToStorage(updated);
      return updated;
    });

    return currentConversationId || `conv_${Date.now()}`;
  }, [currentConversationId]);

  const loadConversation = useCallback((id: string): ChatMessage[] | null => {
    const conversation = conversations.find((c) => c.id === id);
    if (conversation) {
      setCurrentConversationId(id);
      return conversation.messages;
    }
    return null;
  }, [conversations]);

  const deleteConversation = useCallback((id: string): void => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveToStorage(updated);
      return updated;
    });
    
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  }, [currentConversationId]);

  const clearAllHistory = useCallback((): void => {
    setConversations([]);
    setCurrentConversationId(null);
    saveToStorage([]);
  }, []);

  return {
    conversations,
    currentConversationId,
    saveConversation,
    loadConversation,
    deleteConversation,
    clearAllHistory,
    setCurrentConversationId,
  };
}
