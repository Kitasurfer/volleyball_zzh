/**
 * Hook for searching through chat messages
 */
import { useState, useCallback, useMemo } from 'react';
import type { ChatMessage } from '../../types/chatbot';

export function useChatSearch(messages: ChatMessage[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return query ? messages.filter(message => message.text.toLowerCase().includes(query)) : [];
  }, [messages, searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return { searchQuery, setSearchQuery, searchResults, clearSearch };
}
