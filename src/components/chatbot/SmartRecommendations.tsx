/**
 * Smart Recommendations based on chat history and context
 */
import React, { useMemo } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';
import type { Language } from '../../types';
import type { ChatMessage } from '../../types/chatbot';

interface SmartRecommendationsProps {
  messages: ChatMessage[];
  language: Language;
  onQuestionClick: (question: string) => void;
}

interface Recommendation {
  text: string;
  emoji: string;
  category: string;
  relevance: number;
}

const translations = {
  de: {
    title: 'Empfehlungen für Sie',
    basedOn: 'Basierend auf Ihrem Gespräch',
  },
  en: {
    title: 'Recommendations for You',
    basedOn: 'Based on your conversation',
  },
  ru: {
    title: 'Рекомендации для вас',
    basedOn: 'На основе вашего разговора',
  },
  it: {
    title: 'Raccomandazioni per te',
    basedOn: 'In base alla tua conversazione',
  },
};

// Contextual recommendations based on keywords
const getContextualRecommendations = (messages: ChatMessage[], language: Language): Recommendation[] => {
  const allText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase())
    .join(' ');

  const recommendations: Recommendation[] = [];

  // Beach volleyball context
  if (allText.includes('пляж') || allText.includes('beach') || allText.includes('strand') || allText.includes('sabbia')) {
    const beachRecs = {
      de: [
        { text: 'Welche Ausrüstung brauche ich für Beach Volleyball?', emoji: '🏐', category: 'beach' },
        { text: 'Gibt es Beach Volleyball Turniere?', emoji: '🏆', category: 'beach' },
        { text: 'Wie unterscheidet sich Beach von Hallen-Volleyball?', emoji: '🤔', category: 'beach' },
      ],
      en: [
        { text: 'What equipment do I need for beach volleyball?', emoji: '🏐', category: 'beach' },
        { text: 'Are there beach volleyball tournaments?', emoji: '🏆', category: 'beach' },
        { text: 'How is beach different from indoor volleyball?', emoji: '🤔', category: 'beach' },
      ],
      ru: [
        { text: 'Какое оборудование нужно для пляжного волейбола?', emoji: '🏐', category: 'beach' },
        { text: 'Есть ли турниры по пляжному волейболу?', emoji: '🏆', category: 'beach' },
        { text: 'Чем пляжный волейбол отличается от классического?', emoji: '🤔', category: 'beach' },
      ],
      it: [
        { text: 'Quale attrezzatura serve per il beach volley?', emoji: '🏐', category: 'beach' },
        { text: 'Ci sono tornei di beach volley?', emoji: '🏆', category: 'beach' },
        { text: 'Come differisce il beach dal volley indoor?', emoji: '🤔', category: 'beach' },
      ],
    };
    recommendations.push(...beachRecs[language].map(r => ({ ...r, relevance: 0.9 })));
  }

  // Indoor/Hall volleyball context
  if (allText.includes('зал') || allText.includes('halle') || allText.includes('indoor') || allText.includes('классич')) {
    const indoorRecs = {
      de: [
        { text: 'Welche Positionen gibt es im Hallenvolleyball?', emoji: '👥', category: 'indoor' },
        { text: 'Wie funktioniert die Rotation?', emoji: '🔄', category: 'indoor' },
        { text: 'Was ist ein Libero?', emoji: '🛡️', category: 'indoor' },
      ],
      en: [
        { text: 'What positions are there in indoor volleyball?', emoji: '👥', category: 'indoor' },
        { text: 'How does rotation work?', emoji: '🔄', category: 'indoor' },
        { text: 'What is a Libero?', emoji: '🛡️', category: 'indoor' },
      ],
      ru: [
        { text: 'Какие позиции есть в классическом волейболе?', emoji: '👥', category: 'indoor' },
        { text: 'Как работает ротация?', emoji: '🔄', category: 'indoor' },
        { text: 'Что такое либеро?', emoji: '🛡️', category: 'indoor' },
      ],
      it: [
        { text: 'Quali posizioni ci sono nella pallavolo indoor?', emoji: '👥', category: 'indoor' },
        { text: 'Come funziona la rotazione?', emoji: '🔄', category: 'indoor' },
        { text: 'Cos\'è un Libero?', emoji: '🛡️', category: 'indoor' },
      ],
    };
    recommendations.push(...indoorRecs[language].map(r => ({ ...r, relevance: 0.9 })));
  }

  // Rules context
  if (allText.includes('правил') || allText.includes('regel') || allText.includes('rule') || allText.includes('regol')) {
    const rulesRecs = {
      de: [
        { text: 'Wie werden Punkte gezählt?', emoji: '🔢', category: 'rules' },
        { text: 'Was sind häufige Fehler?', emoji: '⚠️', category: 'rules' },
        { text: 'Schiedsrichterzeichen erklärt', emoji: '👋', category: 'rules' },
      ],
      en: [
        { text: 'How are points scored?', emoji: '🔢', category: 'rules' },
        { text: 'What are common faults?', emoji: '⚠️', category: 'rules' },
        { text: 'Referee signals explained', emoji: '👋', category: 'rules' },
      ],
      ru: [
        { text: 'Как считаются очки?', emoji: '🔢', category: 'rules' },
        { text: 'Какие бывают ошибки?', emoji: '⚠️', category: 'rules' },
        { text: 'Жесты судей объяснение', emoji: '👋', category: 'rules' },
      ],
      it: [
        { text: 'Come si segnano i punti?', emoji: '🔢', category: 'rules' },
        { text: 'Quali sono gli errori comuni?', emoji: '⚠️', category: 'rules' },
        { text: 'Segnali arbitrali spiegati', emoji: '👋', category: 'rules' },
      ],
    };
    recommendations.push(...rulesRecs[language].map(r => ({ ...r, relevance: 0.85 })));
  }

  // Weather context
  if (allText.includes('погод') || allText.includes('weather') || allText.includes('wetter') || allText.includes('meteo')) {
    const weatherRecs = {
      de: [
        { text: 'Beste Zeit für Beach Volleyball?', emoji: '⏰', category: 'weather' },
        { text: 'Spielt man bei Regen?', emoji: '🌧️', category: 'weather' },
      ],
      en: [
        { text: 'Best time for beach volleyball?', emoji: '⏰', category: 'weather' },
        { text: 'Do we play in the rain?', emoji: '🌧️', category: 'weather' },
      ],
      ru: [
        { text: 'Лучшее время для пляжного волейбола?', emoji: '⏰', category: 'weather' },
        { text: 'Играют ли в дождь?', emoji: '🌧️', category: 'weather' },
      ],
      it: [
        { text: 'Miglior momento per il beach volley?', emoji: '⏰', category: 'weather' },
        { text: 'Si gioca sotto la pioggia?', emoji: '🌧️', category: 'weather' },
      ],
    };
    recommendations.push(...weatherRecs[language].map(r => ({ ...r, relevance: 0.8 })));
  }

  // Training context
  if (allText.includes('тренир') || allText.includes('training') || allText.includes('allenamento')) {
    const trainingRecs = {
      de: [
        { text: 'Wie kann ich meine Technik verbessern?', emoji: '💪', category: 'training' },
        { text: 'Gibt es Anfängertraining?', emoji: '🎓', category: 'training' },
        { text: 'Trainingsvideos verfügbar?', emoji: '🎥', category: 'training' },
      ],
      en: [
        { text: 'How can I improve my technique?', emoji: '💪', category: 'training' },
        { text: 'Is there beginner training?', emoji: '🎓', category: 'training' },
        { text: 'Training videos available?', emoji: '🎥', category: 'training' },
      ],
      ru: [
        { text: 'Как улучшить технику?', emoji: '💪', category: 'training' },
        { text: 'Есть тренировки для новичков?', emoji: '🎓', category: 'training' },
        { text: 'Доступны видео тренировок?', emoji: '🎥', category: 'training' },
      ],
      it: [
        { text: 'Come migliorare la tecnica?', emoji: '💪', category: 'training' },
        { text: 'C\'è allenamento per principianti?', emoji: '🎓', category: 'training' },
        { text: 'Video di allenamento disponibili?', emoji: '🎥', category: 'training' },
      ],
    };
    recommendations.push(...trainingRecs[language].map(r => ({ ...r, relevance: 0.85 })));
  }

  // Default recommendations if no context
  if (recommendations.length === 0) {
    const defaultRecs = {
      de: [
        { text: 'Wo finden die Trainings statt?', emoji: '📍', category: 'general' },
        { text: 'Wann ist das nächste Spiel?', emoji: '📅', category: 'general' },
        { text: 'Wie kann ich dem Verein beitreten?', emoji: '👋', category: 'general' },
      ],
      en: [
        { text: 'Where do trainings take place?', emoji: '📍', category: 'general' },
        { text: 'When is the next game?', emoji: '📅', category: 'general' },
        { text: 'How can I join the club?', emoji: '👋', category: 'general' },
      ],
      ru: [
        { text: 'Где проходят тренировки?', emoji: '📍', category: 'general' },
        { text: 'Когда следующая игра?', emoji: '📅', category: 'general' },
        { text: 'Как вступить в клуб?', emoji: '👋', category: 'general' },
      ],
      it: [
        { text: 'Dove si svolgono gli allenamenti?', emoji: '📍', category: 'general' },
        { text: 'Quando è la prossima partita?', emoji: '📅', category: 'general' },
        { text: 'Come posso unirmi al club?', emoji: '👋', category: 'general' },
      ],
    };
    recommendations.push(...defaultRecs[language].map(r => ({ ...r, relevance: 0.5 })));
  }

  // Sort by relevance and return top 3
  return recommendations
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3);
};

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  messages,
  language,
  onQuestionClick,
}) => {
  const t = translations[language];

  const recommendations = useMemo(() => {
    return getContextualRecommendations(messages, language);
  }, [messages, language]);

  if (recommendations.length === 0) return null;

  return (
    <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-purple-600" />
        <h4 className="text-sm font-semibold text-purple-900">{t.title}</h4>
      </div>
      <p className="text-xs text-purple-600 mb-3 flex items-center gap-1">
        <TrendingUp className="w-3 h-3" />
        {t.basedOn}
      </p>
      <div className="space-y-2">
        {recommendations.map((rec, i) => (
          <button
            key={i}
            onClick={() => onQuestionClick(rec.text)}
            className="w-full flex items-center gap-3 p-3 bg-white rounded-lg border border-purple-100 hover:border-purple-300 hover:shadow-md transition-all text-left group"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">
              {rec.emoji}
            </span>
            <span className="flex-1 text-sm font-medium text-primary-900 group-hover:text-purple-700 transition-colors">
              {rec.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
