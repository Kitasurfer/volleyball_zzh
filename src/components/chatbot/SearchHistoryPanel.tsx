/**
 * Search History Panel with filters and recommendations
 */
import React, { useState, useMemo } from 'react';
import { X, Search, Filter, TrendingUp, Clock, Trash2, Calendar } from 'lucide-react';
import type { Language } from '../../types';
import type { SearchHistoryItem } from '../../hooks/chatbot/useSearchHistory';

interface SearchHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  searchHistory: SearchHistoryItem[];
  onSearchClick: (query: string) => void;
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
  getPopularSearches: (limit?: number) => SearchHistoryItem[];
  getRecentSearches: (limit?: number) => SearchHistoryItem[];
  getFilteredHistory: (filter?: {
    category?: SearchHistoryItem['category'];
    language?: string;
    dateRange?: { from: number; to: number };
  }) => SearchHistoryItem[];
  language: Language;
}

const translations = {
  de: {
    title: 'Suchverlauf',
    recent: 'Kürzlich',
    popular: 'Beliebt',
    all: 'Alle',
    filters: 'Filter',
    category: 'Kategorie',
    timeRange: 'Zeitraum',
    clearAll: 'Alles löschen',
    noHistory: 'Kein Suchverlauf',
    categories: {
      all: 'Alle',
      rules: 'Regeln',
      schedule: 'Zeitplan',
      location: 'Standort',
      weather: 'Wetter',
      general: 'Allgemein',
    },
    timeRanges: {
      today: 'Heute',
      week: 'Diese Woche',
      month: 'Dieser Monat',
      all: 'Alle Zeit',
    },
    resultsCount: 'Ergebnisse',
  },
  en: {
    title: 'Search History',
    recent: 'Recent',
    popular: 'Popular',
    all: 'All',
    filters: 'Filters',
    category: 'Category',
    timeRange: 'Time Range',
    clearAll: 'Clear All',
    noHistory: 'No search history',
    categories: {
      all: 'All',
      rules: 'Rules',
      schedule: 'Schedule',
      location: 'Location',
      weather: 'Weather',
      general: 'General',
    },
    timeRanges: {
      today: 'Today',
      week: 'This Week',
      month: 'This Month',
      all: 'All Time',
    },
    resultsCount: 'results',
  },
  ru: {
    title: 'История поиска',
    recent: 'Недавние',
    popular: 'Популярные',
    all: 'Все',
    filters: 'Фильтры',
    category: 'Категория',
    timeRange: 'Период',
    clearAll: 'Очистить всё',
    noHistory: 'Нет истории поиска',
    categories: {
      all: 'Все',
      rules: 'Правила',
      schedule: 'Расписание',
      location: 'Местоположение',
      weather: 'Погода',
      general: 'Общее',
    },
    timeRanges: {
      today: 'Сегодня',
      week: 'Эта неделя',
      month: 'Этот месяц',
      all: 'Всё время',
    },
    resultsCount: 'результатов',
  },
  it: {
    title: 'Cronologia ricerche',
    recent: 'Recenti',
    popular: 'Popolari',
    all: 'Tutti',
    filters: 'Filtri',
    category: 'Categoria',
    timeRange: 'Periodo',
    clearAll: 'Cancella tutto',
    noHistory: 'Nessuna cronologia',
    categories: {
      all: 'Tutti',
      rules: 'Regole',
      schedule: 'Orari',
      location: 'Posizione',
      weather: 'Meteo',
      general: 'Generale',
    },
    timeRanges: {
      today: 'Oggi',
      week: 'Questa settimana',
      month: 'Questo mese',
      all: 'Tutto il tempo',
    },
    resultsCount: 'risultati',
  },
};

const getCategoryEmoji = (category: SearchHistoryItem['category']): string => {
  const emojiMap = {
    rules: '📖',
    schedule: '📅',
    location: '📍',
    weather: '🌤️',
    general: '💬',
  };
  return emojiMap[category] || '🔍';
};

export const SearchHistoryPanel: React.FC<SearchHistoryPanelProps> = ({
  isOpen,
  onClose,
  searchHistory,
  onSearchClick,
  onClearHistory,
  onRemoveItem,
  getPopularSearches,
  getRecentSearches,
  getFilteredHistory,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'recent' | 'popular' | 'all'>('recent');
  const [selectedCategory, setSelectedCategory] = useState<SearchHistoryItem['category'] | 'all'>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const t = translations[language];

  const getTimeRangeFilter = (range: typeof selectedTimeRange) => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    switch (range) {
      case 'today':
        return { from: now - day, to: now };
      case 'week':
        return { from: now - 7 * day, to: now };
      case 'month':
        return { from: now - 30 * day, to: now };
      default:
        return undefined;
    }
  };

  const displayedItems = useMemo(() => {
    if (activeTab === 'recent') {
      return getRecentSearches(10);
    }
    if (activeTab === 'popular') {
      return getPopularSearches(10);
    }
    
    // All with filters
    const filter: Parameters<typeof getFilteredHistory>[0] = {};
    if (selectedCategory !== 'all') {
      filter.category = selectedCategory;
    }
    const dateRange = getTimeRangeFilter(selectedTimeRange);
    if (dateRange) {
      filter.dateRange = dateRange;
    }
    
    return getFilteredHistory(filter);
  }, [activeTab, selectedCategory, selectedTimeRange, searchHistory, getRecentSearches, getPopularSearches, getFilteredHistory]);

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return language === 'de' ? 'Gerade eben' : language === 'ru' ? 'Только что' : language === 'it' ? 'Proprio ora' : 'Just now';
    if (diffMins < 60) return `${diffMins}${language === 'de' ? ' Min' : language === 'ru' ? ' мин' : language === 'it' ? ' min' : ' min'}`;
    if (diffHours < 24) return `${diffHours}${language === 'de' ? ' Std' : language === 'ru' ? ' ч' : language === 'it' ? ' ore' : ' hrs'}`;
    if (diffDays < 7) return `${diffDays}${language === 'de' ? ' T' : language === 'ru' ? ' д' : language === 'it' ? ' g' : ' d'}`;
    
    return date.toLocaleDateString(language);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-white z-10 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-primary-900">{t.title}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-neutral-600" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-2 border-b border-neutral-200 bg-neutral-50">
        {(['recent', 'popular', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-primary-600 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {tab === 'recent' && <Clock className="w-4 h-4 inline mr-1" />}
            {tab === 'popular' && <TrendingUp className="w-4 h-4 inline mr-1" />}
            {tab === 'all' && <Filter className="w-4 h-4 inline mr-1" />}
            {t[tab]}
          </button>
        ))}
      </div>

      {/* Filters (only for 'all' tab) */}
      {activeTab === 'all' && (
        <div className="p-3 border-b border-neutral-200 bg-neutral-50 space-y-2">
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1 block">
              {t.category}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {Object.entries(t.categories).map(([key, label]) => (
                <option key={key} value={key}>
                  {getCategoryEmoji(key as any)} {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-600 mb-1 block">
              {t.timeRange}
            </label>
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value as any)}
              className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {Object.entries(t.timeRanges).map(([key, label]) => (
                <option key={key} value={key}>
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* History Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {displayedItems.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t.noHistory}</p>
          </div>
        ) : (
          displayedItems.map((item) => (
            <div
              key={item.id}
              className="group flex items-start gap-3 p-3 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer"
              onClick={() => onSearchClick(item.query)}
            >
              <div className="text-2xl mt-0.5">{getCategoryEmoji(item.category)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-primary-900 truncate">{item.query}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                  <span>{formatTimestamp(item.timestamp)}</span>
                  <span>•</span>
                  <span>{item.resultsCount} {t.resultsCount}</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveItem(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {searchHistory.length > 0 && (
        <div className="p-3 border-t border-neutral-200 bg-neutral-50">
          <button
            onClick={onClearHistory}
            className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t.clearAll}
          </button>
        </div>
      )}
    </div>
  );
};
