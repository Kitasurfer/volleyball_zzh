/**
 * Hook for managing chat search history with filters
 */
import { useState, useEffect, useCallback } from 'react';

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  category: 'rules' | 'schedule' | 'location' | 'weather' | 'general';
  language: string;
  resultsCount: number;
}

interface UseSearchHistoryReturn {
  searchHistory: SearchHistoryItem[];
  addToHistory: (query: string, category: SearchHistoryItem['category'], language: string, resultsCount: number) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  getFilteredHistory: (filter?: {
    category?: SearchHistoryItem['category'];
    language?: string;
    dateRange?: { from: number; to: number };
  }) => SearchHistoryItem[];
  getPopularSearches: (limit?: number) => SearchHistoryItem[];
  getRecentSearches: (limit?: number) => SearchHistoryItem[];
}

const STORAGE_KEY = 'chatbot_search_history';
const MAX_HISTORY_ITEMS = 100;

export const useSearchHistory = (): UseSearchHistoryReturn => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSearchHistory(parsed);
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // Save to localStorage when history changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searchHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }, [searchHistory]);

  const addToHistory = useCallback((
    query: string,
    category: SearchHistoryItem['category'],
    language: string,
    resultsCount: number
  ) => {
    const newItem: SearchHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      query: query.trim(),
      timestamp: Date.now(),
      category,
      language,
      resultsCount,
    };

    setSearchHistory(prev => {
      // Remove duplicates (same query)
      const filtered = prev.filter(item => 
        item.query.toLowerCase() !== query.toLowerCase().trim()
      );
      
      // Add new item at the beginning
      const updated = [newItem, ...filtered];
      
      // Keep only MAX_HISTORY_ITEMS
      return updated.slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  const removeFromHistory = useCallback((id: string) => {
    setSearchHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getFilteredHistory = useCallback((filter?: {
    category?: SearchHistoryItem['category'];
    language?: string;
    dateRange?: { from: number; to: number };
  }) => {
    if (!filter) return searchHistory;

    return searchHistory.filter(item => {
      if (filter.category && item.category !== filter.category) return false;
      if (filter.language && item.language !== filter.language) return false;
      if (filter.dateRange) {
        if (item.timestamp < filter.dateRange.from || item.timestamp > filter.dateRange.to) {
          return false;
        }
      }
      return true;
    });
  }, [searchHistory]);

  const getPopularSearches = useCallback((limit: number = 5) => {
    // Count occurrences by query (case-insensitive)
    const queryCount = new Map<string, { item: SearchHistoryItem; count: number }>();
    
    searchHistory.forEach(item => {
      const key = item.query.toLowerCase();
      const existing = queryCount.get(key);
      
      if (existing) {
        existing.count++;
      } else {
        queryCount.set(key, { item, count: 1 });
      }
    });

    // Sort by count and return top items
    return Array.from(queryCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(({ item }) => item);
  }, [searchHistory]);

  const getRecentSearches = useCallback((limit: number = 5) => {
    return searchHistory.slice(0, limit);
  }, [searchHistory]);

  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getFilteredHistory,
    getPopularSearches,
    getRecentSearches,
  };
};
