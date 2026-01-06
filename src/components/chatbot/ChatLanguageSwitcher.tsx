/**
 * Language switcher component for the chatbot
 */
import React, { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import type { Language, Translation } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../types';

interface ChatLanguageSwitcherProps {
  currentLanguage: Language;
  onLanguageChange: (language: Language) => void;
  t: Translation['chatbot'];
}

const LANGUAGE_NAMES: Record<Language, string> = {
  de: 'Deutsch',
  en: 'English',
  ru: 'Русский',
  it: 'Italiano',
};

const LANGUAGE_FLAGS: Record<Language, string> = {
  de: '🇩🇪',
  en: '🇬🇧',
  ru: '🇷🇺',
  it: '🇮🇹',
};

export const ChatLanguageSwitcher: React.FC<ChatLanguageSwitcherProps> = ({
  currentLanguage,
  onLanguageChange,
  t,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1.5"
        title={t.changeLanguage}
        aria-label={t.changeLanguage}
      >
        <Globe className="w-4 h-4" />
        <span className="text-xs font-medium uppercase">{currentLanguage}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-neutral-100 overflow-hidden min-w-[140px]">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  onLanguageChange(lang);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                  currentLanguage === lang
                    ? 'bg-primary-50 text-primary-600'
                    : 'hover:bg-neutral-50 text-neutral-700'
                }`}
              >
                <span>{LANGUAGE_FLAGS[lang]}</span>
                <span className="flex-1">{LANGUAGE_NAMES[lang]}</span>
                {currentLanguage === lang && (
                  <Check className="w-4 h-4 text-primary-500" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
