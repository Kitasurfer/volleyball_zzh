import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import type { ChatMessage } from '../types/chatbot';
import type { ChatbotHistoryItem } from '../lib/chatbot-client';
import { LinkifiedText } from './LinkifiedText';
import { invokeChatbot } from '../lib/chatbot-client';

const Chatbot: React.FC = () => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessages: Record<string, string> = {
        de: 'Hallo! Ich bin der SKV Unterensingen Volleyball-Assistent. Wie kann ich Ihnen helfen?',
        en: 'Hello! I am the SKV Unterensingen Volleyball assistant. How can I help you?',
        ru: 'Здравствуйте! Я ассистент команды SKV Unterensingen Volleyball. Чем могу помочь?',
      };
      const greeting: ChatMessage = {
        id: Date.now().toString(),
        text: welcomeMessages[language] || welcomeMessages.de,
        sender: 'bot',
      };
      setMessages([greeting]);
    }
    // Фокус на инпут только при открытии чата, но не при кликах в области сообщений
    if (isOpen && messages.length === 1) {
      setTimeout(() => {
        if (inputRef.current && !inputRef.current.disabled) {
          inputRef.current.focus();
        }
      }, 200);
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

    const messagesForHistory = [...messages, userMessage];
    const history: ChatbotHistoryItem[] = messagesForHistory.slice(-6).map((message) => ({
      role: message.sender === 'user' ? 'user' : 'assistant',
      content: message.text,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await invokeChatbot({
        question: input,
        language,
        sessionId,
        history,
      });

      if (error) throw error;

      let answerText = data?.answer || 'Sorry, I could not process your request.';
      
      // Если цитат нет, убираем упоминания источников из текста
      if (!data?.citations || data.citations.length === 0) {
        // Убираем различные варианты упоминаний источников
        answerText = answerText
          .replace(/Источники:?\s*$/gi, '')
          .replace(/Sources:?\s*$/gi, '')
          .replace(/Quellen:?\s*$/gi, '')
          .replace(/\n\s*Источники:?\s*$/gi, '')
          .replace(/\n\s*Sources:?\s*$/gi, '')
          .replace(/\n\s*Quellen:?\s*$/gi, '')
          .trim();
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: answerText,
        sender: 'bot',
      };

      if (data?.sessionId) {
        setSessionId(data.sessionId);
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
        },
      ]);
    } finally {
      setIsLoading(false);
      // Не фокусируемся автоматически на инпуте после отправки
      // Пользователь сам кликнет на инпут когда будет готов
      setTimeout(() => {
        if (inputRef.current && !inputRef.current.disabled) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChatClick = (e: React.MouseEvent) => {
    // Полностью отключаем автоматический фокус при клике в области чата
    // Пользователь должен сам решать когда фокусироваться на инпуте
    return;
  };

  return (
    <>
      {/* Chatbot Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[100] bg-primary-500 text-white p-4 rounded-full shadow-lg hover:bg-primary-600 transition-all duration-300 hover:scale-110"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[100] w-96 max-w-[calc(100vw-3rem)] bg-white rounded-xl shadow-lg flex flex-col overflow-hidden">
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
          <div 
            className="flex-1 p-4 space-y-4 overflow-y-auto max-h-96 bg-neutral-50"
            onClick={handleChatClick}
          >
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
                  <LinkifiedText
                    text={message.text}
                    className="text-sm leading-relaxed whitespace-pre-line"
                  />
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
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t.chatbot.inputPlaceholder || 'Type your message...'}
                className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-primary-500 text-white p-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
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
