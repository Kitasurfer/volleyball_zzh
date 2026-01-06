/**
 * Search bar component for searching through chat messages
 */
import React from 'react';
import { Search, X } from 'lucide-react';
import type { Translation } from '../../types';

interface ChatSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClear: () => void;
  resultsCount: number;
  t: Translation['chatbot'];
}

export const ChatSearchBar: React.FC<ChatSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  onClear,
  resultsCount,
  t,
}) => {
  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-9 pr-8 py-2 text-sm bg-neutral-100 border-none rounded-lg focus:ring-2 focus:ring-primary-500 transition-all placeholder-neutral-400"
        />
        {searchQuery && (
          <button
            onClick={onClear}
            className="absolute right-2 p-1 hover:bg-neutral-200 rounded-full transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
        )}
      </div>
      {searchQuery && (
        <div className="mt-1 text-xs text-neutral-500">
          {resultsCount > 0
            ? `${resultsCount} ${t.searchResults.toLowerCase()}`
            : t.searchNoResults}
        </div>
      )}
    </div>
  );
};
