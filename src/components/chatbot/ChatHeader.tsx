/**
 * Chat header component with controls
 */
import React from 'react';
import { MessageCircle, Maximize2, Minimize2, X, History, Search } from 'lucide-react';
import type { Language, Translation } from '../../types';
import { ChatLanguageSwitcher } from './ChatLanguageSwitcher';

interface ChatHeaderProps {
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  onClose: () => void;
  onToggleHistory: () => void;
  onToggleSearch: () => void;
  showHistoryButton?: boolean;
  showSearchButton?: boolean;
  language: Language;
  onLanguageChange: (language: Language) => void;
  t: Translation['chatbot'];
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  isFullScreen,
  onToggleFullScreen,
  onClose,
  onToggleHistory,
  onToggleSearch,
  showHistoryButton = true,
  showSearchButton = true,
  language,
  onLanguageChange,
  t,
}) => {
  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-base block leading-none">{t.title}</span>
          <span className="text-[9px] text-primary-100 uppercase tracking-widest font-semibold mt-0.5 block">
            Smart Assistant
          </span>
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        <ChatLanguageSwitcher
          currentLanguage={language}
          onLanguageChange={onLanguageChange}
          t={t}
        />
        
        {showSearchButton && (
          <button
            onClick={onToggleSearch}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label={t.search}
            title={t.search}
          >
            <Search className="w-4 h-4" />
          </button>
        )}
        
        {showHistoryButton && (
          <button
            onClick={onToggleHistory}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label={t.history}
            title={t.history}
          >
            <History className="w-4 h-4" />
          </button>
        )}
        
        <button
          onClick={onToggleFullScreen}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors hidden md:block"
          aria-label={isFullScreen ? 'Minimize' : 'Maximize'}
        >
          {isFullScreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
        
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Close chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
