/**
 * Hook for searching through chat messages
 */
import { useState, useCallback, useMemo } from 'react';
import type { ChatMessage } from '../../types/chatbot';

interface SearchResult {
  message: ChatMessage;
  matchIndex: number;
  highlightedText: string;
}

interface UseChatSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  isSearching: boolean;
  clearSearch: () => void;
  highlightMatches: (text: string) => string;
}

export function useChatSearch(messages: ChatMessage[]): UseChatSearchReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery.trim()) {
      return [];
    }

    setIsSearching(true);
    const query = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    messages.forEach((message, index) => {
      const text = message.text.toLowerCase();
      const matchIndex = text.indexOf(query);
      
      if (matchIndex !== -1) {
        results.push({
          message,
          matchIndex: index,
          highlightedText: highlightText(message.text, searchQuery),
        });
      }
    });

    setIsSearching(false);
    return results;
  }, [messages, searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const highlightMatches = useCallback((text: string): string => {
    if (!searchQuery.trim()) return text;
    return highlightText(text, searchQuery);
  }, [searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    clearSearch,
    highlightMatches,
  };
}

function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>');
}

function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
