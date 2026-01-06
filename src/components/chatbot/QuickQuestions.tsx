/**
 * Quick questions component - contextual suggestions with emojis
 */
import React from 'react';
import { Book, Trophy, Info, Calendar, Users, HelpCircle } from 'lucide-react';
import type { Language, Translation } from '../../types';

interface QuickQuestion {
  icon: React.ReactNode;
  emoji: string;
  text: Record<Language, string>;
  category: 'rules' | 'results' | 'info' | 'schedule' | 'team' | 'general';
}

interface QuickQuestionsProps {
  onQuestionClick: (question: string) => void;
  language: Language;
  t: Translation['chatbot'];
  variant?: 'initial' | 'contextual';
  context?: string;
}

const INITIAL_QUESTIONS: QuickQuestion[] = [
  {
    icon: <Book className="w-4 h-4" />,
    emoji: '📖',
    text: {
      de: 'Volleyballregeln',
      en: 'Volleyball Rules',
      ru: 'Правила волейбола',
      it: 'Regole della pallavolo',
    },
    category: 'rules',
  },
  {
    icon: <Trophy className="w-4 h-4" />,
    emoji: '🏆',
    text: {
      de: 'Spielergebnisse',
      en: 'Game Results',
      ru: 'Результаты игр',
      it: 'Risultati delle partite',
    },
    category: 'results',
  },
  {
    icon: <Info className="w-4 h-4" />,
    emoji: '👋',
    text: {
      de: 'Schiedsrichterzeichen',
      en: 'Referee Gestures',
      ru: 'Жесты судей',
      it: 'Gesti degli arbitri',
    },
    category: 'info',
  },
];

const CONTEXTUAL_QUESTIONS: Record<string, QuickQuestion[]> = {
  rules: [
    {
      icon: <HelpCircle className="w-4 h-4" />,
      emoji: '🔄',
      text: {
        de: 'Wie viele Auswechslungen sind erlaubt?',
        en: 'How many substitutions are allowed?',
        ru: 'Сколько замен разрешено?',
        it: 'Quante sostituzioni sono consentite?',
      },
      category: 'rules',
    },
    {
      icon: <HelpCircle className="w-4 h-4" />,
      emoji: '✋',
      text: {
        de: 'Was ist ein Doppelberührungsfehler?',
        en: 'What is a double touch fault?',
        ru: 'Что такое двойное касание?',
        it: 'Cos\'è un doppio tocco?',
      },
      category: 'rules',
    },
  ],
  results: [
    {
      icon: <Calendar className="w-4 h-4" />,
      emoji: '📅',
      text: {
        de: 'Wann ist das nächste Spiel?',
        en: 'When is the next game?',
        ru: 'Когда следующая игра?',
        it: 'Quando è la prossima partita?',
      },
      category: 'schedule',
    },
    {
      icon: <Trophy className="w-4 h-4" />,
      emoji: '📊',
      text: {
        de: 'Aktuelle Tabellenposition?',
        en: 'Current league position?',
        ru: 'Текущая позиция в таблице?',
        it: 'Posizione attuale in classifica?',
      },
      category: 'results',
    },
  ],
  team: [
    {
      icon: <Users className="w-4 h-4" />,
      emoji: '⏰',
      text: {
        de: 'Trainingszeiten',
        en: 'Training schedule',
        ru: 'Расписание тренировок',
        it: 'Orari di allenamento',
      },
      category: 'team',
    },
  ],
};

export const QuickQuestions: React.FC<QuickQuestionsProps> = ({
  onQuestionClick,
  language,
  t,
  variant = 'initial',
  context,
}) => {
  const questions = variant === 'initial' 
    ? INITIAL_QUESTIONS 
    : (context && CONTEXTUAL_QUESTIONS[context]) || INITIAL_QUESTIONS;

  return (
    <div className="space-y-2">
      {variant === 'contextual' && (
        <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
          {t.suggestedQuestions}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => onQuestionClick(q.text[language] || q.text.en)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-full text-xs font-medium hover:bg-primary-100 transition-all hover:scale-105 border border-primary-100 whitespace-nowrap group"
          >
            <span className="text-base group-hover:scale-110 transition-transform">{q.emoji}</span>
            <span>{q.text[language] || q.text.en}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
