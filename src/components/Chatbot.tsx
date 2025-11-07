import React, { useState, useRef, useEffect, memo } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { supabase } from '../lib/supabase';
import type { ChatMessage, ChatbotResponse, Citation } from '../types/chatbot';
import type { Translation } from '../types';

const styles: Record<string, string> = {
  button:
    'fixed bottom-6 right-6 z-50 bg-primary-500 text-white p-4 rounded-full shadow-lg transition-transform duration-300 hover:scale-110 hover:bg-primary-600',
  window: 'fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-xl shadow-lg flex flex-col overflow-hidden',
  header: 'bg-primary-500 text-white px-6 py-4 flex items-center justify-between',
  headerTitle: 'flex items-center gap-3',
  closeButton: 'text-white hover:text-neutral-200 transition-colors',
  messages: 'flex-1 p-4 space-y-4 overflow-y-auto max-h-96 bg-neutral-50',
  bubbleUser: 'ml-auto bg-primary-500 text-white',
  bubbleBot: 'bg-white text-neutral-900 shadow-sm',
  bubbleBase: 'max-w-[80%] px-4 py-2 rounded-lg',
  messageText: 'text-sm leading-relaxed whitespace-pre-line',
  sources: 'mt-3 border-t border-neutral-200 pt-3',
  sourcesTitle: 'text-xs font-semibold uppercase text-neutral-500 tracking-wide',
  sourcesList: 'mt-2 space-y-2',
  sourceItem: 'text-xs text-neutral-600',
  sourceLink: 'font-medium text-primary-500 hover:text-primary-600',
  sourceFallback: 'mt-2 text-xs text-neutral-500',
  typingWrapper: 'flex justify-start',
  typingBubble: 'bg-white px-4 py-2 rounded-lg shadow-sm',
  typingDots: 'flex gap-2',
  typingDot: 'w-2 h-2 bg-neutral-400 rounded-full animate-bounce',
  inputBar: 'border-t border-neutral-200 p-4 bg-white',
  inputRow: 'flex gap-2',
  inputField:
    'flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50',
  sendButton:
    'bg-primary-500 text-white p-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
};

const CitationList = memo(({ citations, t }: { citations?: Citation[]; t: Translation['chatbot'] }) => {
  if (!citations || citations.length === 0) {
    return <p className={styles.sourceFallback}>{t.noSources}</p>;
  }

  return (
    <ul className={styles.sourcesList}>
      {citations.map((citation, index) => (
        <li key={`citation-${index}`} className={styles.sourceItem}>
          {citation.url ? (
            <a
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.sourceLink}
            >
              {citation.title || citation.url}
            </a>
          ) : (
            <span className="font-medium text-neutral-700">{citation.title || t.noSources}</span>
          )}
          {citation.snippet && <p className="mt-1 text-neutral-500">{citation.snippet}</p>}
        </li>
      ))}
    </ul>
  );
});

CitationList.displayName = 'CitationList';

const MessageBubble = memo(
  ({ message, t }: { message: ChatMessage; t: Translation['chatbot'] }) => (
    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`${styles.bubbleBase} ${
          message.sender === 'user' ? styles.bubbleUser : styles.bubbleBot
        }`}
      >
        <p className={styles.messageText}>{message.text}</p>
        {message.sender === 'bot' && (
          <div className={styles.sources}>
            <p className={styles.sourcesTitle}>{t.sources}</p>
            <CitationList citations={message.citations} t={t} />
          </div>
        )}
      </div>
    </div>
  ),
);

MessageBubble.displayName = 'MessageBubble';

const Chatbot: React.FC = () => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessages: Record<string, string> = {
        de: 'Hallo! Ich bin der SG TSV Zizishausen/SKV Unterensingen-Assistent. Wie kann ich Ihnen helfen?',
        en: 'Hello! I am the SG TSV Zizishausen/SKV Unterensingen assistant. How can I help you?',
        ru: 'Здравствуйте! Я ассистент команды SG TSV Zizishausen/SKV Unterensingen. Чем могу помочь?',
      };
      const greeting: ChatMessage = {
        id: Date.now().toString(),
        text: welcomeMessages[language] || welcomeMessages.de,
        sender: 'bot',
      };
      setMessages([greeting]);
    }
  }, [isOpen, language, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke<{ data?: ChatbotResponse }>('chatbot', {
        body: { question: input, language, sessionId },
      });

      if (error) throw error;

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data?.data?.answer || 'Sorry, I could not process your request.',
        sender: 'bot',
        citations: data?.data?.citations || [],
      };

      if (data?.data?.sessionId) {
        setSessionId(data.data.sessionId);
      }

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessages: Record<string, string> = {
        de: 'Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es später erneut.',
        en: 'Sorry, there was an error. Please try again later.',
        ru: 'Извините, произошла ошибка. Пожалуйста, попробуйте позже.',
      };
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: errorMessages[language] || errorMessages.de,
          sender: 'bot',
          citations: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chatbot Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-primary-500 text-white p-4 rounded-full shadow-lg hover:bg-primary-600 transition-all duration-300 hover:scale-110"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-xl shadow-lg flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-primary-500 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">{t.chatbot.title}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-neutral-200 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-96 bg-neutral-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-neutral-900 shadow-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                  {message.sender === 'bot' && (
                    <div className="mt-3 border-t border-neutral-200 pt-3">
                      <p className="text-xs font-semibold uppercase text-neutral-500 tracking-wide">
                        {t.chatbot.sources}
                      </p>
                      {message.citations && message.citations.length > 0 ? (
                        <ul className="mt-2 space-y-2">
                          {message.citations.map((citation, index) => (
                            <li key={`${message.id}-citation-${index}`} className="text-xs text-neutral-600">
                              {citation.url ? (
                                <a
                                  href={citation.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-primary-500 hover:text-primary-600"
                                >
                                  {citation.title || citation.url}
                                </a>
                              ) : (
                                <span className="font-medium text-neutral-700">
                                  {citation.title || t.chatbot.noSources}
                                </span>
                              )}
                              {citation.snippet && (
                                <p className="mt-1 text-neutral-500">{citation.snippet}</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-neutral-500">{t.chatbot.noSources}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-neutral-200 p-4 bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t.chatbot.placeholder}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-primary-500 text-white p-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={t.chatbot.send}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
