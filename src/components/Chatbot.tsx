/**
 * Enhanced Chatbot component with voice input, history, search, reactions, and more
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import type { ChatMessage } from '../types/chatbot';
import type { ChatbotHistoryItem } from '../lib/chatbot-client';
import { invokeChatbot } from '../lib/chatbot-client';
import { ChatMessageItem } from './chatbot/ChatMessageItem';
import { VoiceInputButton } from './chatbot/VoiceInputButton';
import { ChatHistoryPanel } from './chatbot/ChatHistoryPanel';
import { ChatSearchBar } from './chatbot/ChatSearchBar';
import { QuickQuestions } from './chatbot/QuickQuestions';
import { ChatErrorMessage } from './chatbot/ChatErrorMessage';
import { FeedbackToast } from './chatbot/FeedbackToast';
import { ChatHeader } from './chatbot/ChatHeader';
import { useVoiceInput } from '../hooks/chatbot/useVoiceInput';
import { useChatHistory } from '../hooks/chatbot/useChatHistory';
import { useChatSearch } from '../hooks/chatbot/useChatSearch';
import { useMessageFeedback } from '../hooks/chatbot/useMessageFeedback';
import { useRateLimiter } from '../hooks/chatbot/useRateLimiter';
import { useChatAnalytics } from '../hooks/chatbot/useChatAnalytics';

const Chatbot: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  
  // Core state
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  // UI state
  const [showHistory, setShowHistory] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [lastError, setLastError] = useState<'error' | 'rate_limit' | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { trackEvent, setSessionId: setAnalyticsSessionId } = useChatAnalytics(language);
  const {
    conversations,
    currentConversationId,
    saveConversation,
    loadConversation,
    deleteConversation,
    clearAllHistory,
    setCurrentConversationId,
  } = useChatHistory();
  const { searchQuery, setSearchQuery, searchResults, clearSearch } = useChatSearch(messages);
  const { submitFeedback, getFeedback, isSubmitting: isFeedbackSubmitting, showThankYou, dismissThankYou } = useMessageFeedback();
  const { canMakeRequest, recordRequest, isRateLimited, shouldRetry, incrementRetry, resetRetry, getRetryDelay } = useRateLimiter();
  
  const handleVoiceResult = useCallback((transcript: string) => {
    setInput(transcript);
    trackEvent('voice_input_used', { transcript_length: transcript.length });
  }, [trackEvent]);

  const { isListening, isSupported: isVoiceSupported, startListening, stopListening } = useVoiceInput({
    language,
    onResult: handleVoiceResult,
  });

  // Welcome message effect
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessages: Record<string, string> = {
        de: 'Hallo! Ich bin der SKV Unterensingen Volleyball-Assistent. Wie kann ich Ihnen helfen?',
        en: 'Hello! I am the SKV Unterensingen Volleyball assistant. How can I help you?',
        ru: 'Здравствуйте! Я ассистент команды SKV Unterensingen Volleyball. Чем могу помочь?',
        it: 'Ciao! Sono l\'assistente di SKV Unterensingen Volleyball. Come posso aiutarti?',
      };
      const greeting: ChatMessage = {
        id: Date.now().toString(),
        text: welcomeMessages[language] || welcomeMessages.de,
        sender: 'bot',
      };
      setMessages([greeting]);
      trackEvent('session_start');
    }
  }, [isOpen, language, messages.length, trackEvent]);

  // Focus input effect
  useEffect(() => {
    if (isOpen && messages.length === 1) {
      setTimeout(() => {
        if (inputRef.current && !inputRef.current.disabled) {
          inputRef.current.focus();
        }
      }, 200);
    }
  }, [isOpen, messages.length]);

  // Scroll to bottom effect
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save conversation effect
  useEffect(() => {
    if (messages.length > 1) {
      saveConversation(messages, language);
    }
  }, [messages, language, saveConversation]);

  // Update analytics session ID
  useEffect(() => {
    if (sessionId) {
      setAnalyticsSessionId(sessionId);
    }
  }, [sessionId, setAnalyticsSessionId]);

  const handleCopyMessage = async (message: ChatMessage) => {
    if (message.sender !== 'bot') return;
    if (!navigator?.clipboard) return;

    try {
      await navigator.clipboard.writeText(message.text);
      setCopiedMessageId(message.id);
      window.setTimeout(() => {
        setCopiedMessageId((current) => (current === message.id ? null : current));
      }, 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleSend = async (textToSend?: string, isRetryAttempt = false) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || isLoading) return;

    // Rate limiting check
    if (!canMakeRequest()) {
      setLastError('rate_limit');
      trackEvent('error_occurred', { type: 'rate_limit' });
      return;
    }

    // Clear previous errors
    setLastError(null);
    setLastFailedMessage(null);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
    };

    const messagesForHistory = [...messages, userMessage];
    const history: ChatbotHistoryItem[] = messagesForHistory.slice(-6).map((message) => ({
      role: message.sender === 'user' ? 'user' : 'assistant',
      content: message.text,
    }));

    if (!isRetryAttempt) {
      setMessages((prev) => [...prev, userMessage]);
      trackEvent('message_sent', { message_length: messageText.length });
    }
    
    setInput('');
    setIsLoading(true);
    recordRequest();

    try {
      const { data, error } = await invokeChatbot({
        question: messageText,
        language,
        sessionId,
        history,
      });

      if (error) throw error;

      let answerText = data?.answer || 'Sorry, I could not process your request.';
      
      if (!data?.citations || data.citations.length === 0) {
        answerText = answerText
          .replace(/Источники:?\s*$/gi, '')
          .replace(/Sources:?\s*$/gi, '')
          .replace(/Quellen:?\s*$/gi, '')
          .replace(/Fonti:?\s*$/gi, '')
          .trim();
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: answerText,
        sender: 'bot',
        citations: data?.citations,
      };

      if (data?.sessionId) {
        setSessionId(data.sessionId);
      }

      setMessages((prev) => [...prev, botMessage]);
      trackEvent('message_received', { has_citations: !!data?.citations?.length });
      resetRetry();
    } catch (error) {
      console.error('Chatbot error:', error);
      
      // Retry logic
      if (shouldRetry()) {
        const delay = getRetryDelay();
        incrementRetry();
        setIsRetrying(true);
        
        setTimeout(() => {
          setIsRetrying(false);
          handleSend(messageText, true);
        }, delay);
        return;
      }

      setLastError('error');
      setLastFailedMessage(messageText);
      trackEvent('error_occurred', { type: 'api_error', message: String(error) });
      
      const errorMessages: Record<string, string> = {
        de: 'Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es später erneut.',
        en: 'Sorry, there was an error. Please try again later.',
        ru: 'Извините, произошла ошибка. Пожалуйста, попробуйте позже.',
        it: 'Spiacente, si è verificato un errore. Per favore riprova più tardi.',
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
      setIsRetrying(false);
      setTimeout(() => {
        if (inputRef.current && !inputRef.current.disabled) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const handleRetry = () => {
    if (lastFailedMessage) {
      resetRetry();
      handleSend(lastFailedMessage, true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLoadConversation = (id: string) => {
    const loadedMessages = loadConversation(id);
    if (loadedMessages) {
      setMessages(loadedMessages);
      setShowHistory(false);
      trackEvent('history_viewed');
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setSessionId(undefined);
  };

  const handleLanguageChange = (newLanguage: typeof language) => {
    setLanguage(newLanguage);
    trackEvent('language_changed', { from: language, to: newLanguage });
  };

  const handleQuickQuestion = (question: string) => {
    handleSend(question);
    trackEvent('quick_question_clicked', { question });
  };

  const handleFeedback = async (messageId: string, type: 'like' | 'dislike') => {
    if (sessionId) {
      await submitFeedback(messageId, sessionId, type);
      trackEvent('feedback_given', { type, message_id: messageId });
    }
  };

  return (
    <>
      {/* Chatbot Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[100] bg-primary-500 text-white p-4 rounded-full shadow-2xl hover:bg-primary-600 transition-all duration-300 hover:scale-110 active:scale-95 group"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary-500" />
          </span>
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div 
          className={`fixed z-[100] transition-all duration-500 ease-in-out bg-white shadow-2xl flex flex-col overflow-hidden
            ${isFullScreen 
              ? 'inset-4 md:inset-10 rounded-2xl' 
              : 'bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-6rem)] rounded-2xl'
            }`}
        >
          {/* Header */}
          <ChatHeader
            isFullScreen={isFullScreen}
            onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
            onClose={() => setIsOpen(false)}
            onToggleHistory={() => {
              setShowHistory(!showHistory);
              setShowSearch(false);
            }}
            onToggleSearch={() => {
              setShowSearch(!showSearch);
              setShowHistory(false);
            }}
            language={language}
            onLanguageChange={handleLanguageChange}
            t={t.chatbot}
          />

          {/* Search Bar */}
          {showSearch && (
            <div className="px-4 py-2 bg-white border-b border-neutral-100">
              <ChatSearchBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onClear={clearSearch}
                resultsCount={searchResults.length}
                t={t.chatbot}
              />
            </div>
          )}

          {/* History Panel */}
          {showHistory && (
            <ChatHistoryPanel
              conversations={conversations}
              currentConversationId={currentConversationId}
              onLoadConversation={handleLoadConversation}
              onDeleteConversation={deleteConversation}
              onClearAll={clearAllHistory}
              onClose={() => setShowHistory(false)}
              t={t.chatbot}
            />
          )}

          {/* Messages */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-neutral-50 scrollbar-hide relative">
            {messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                t={t.chatbot}
                onCopy={message.sender === 'bot' ? () => handleCopyMessage(message) : undefined}
                copied={copiedMessageId === message.id}
                feedback={getFeedback(message.id)}
                onFeedback={message.sender === 'bot' ? (type) => handleFeedback(message.id, type) : undefined}
                isFeedbackSubmitting={isFeedbackSubmitting}
                searchHighlight={searchQuery}
              />
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="bg-white px-5 py-3 rounded-2xl shadow-sm rounded-tl-none border border-neutral-100">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Retrying indicator */}
            {isRetrying && (
              <div className="text-center text-xs text-neutral-400">
                {t.chatbot.retrying}
              </div>
            )}

            {/* Error message */}
            {lastError && !isLoading && (
              <ChatErrorMessage
                type={lastError}
                onRetry={lastError === 'error' ? handleRetry : undefined}
                isRetrying={isRetrying}
                t={t.chatbot}
              />
            )}

            <div ref={messagesEndRef} />

            {/* Feedback toast */}
            <FeedbackToast
              show={showThankYou}
              onDismiss={dismissThankYou}
              t={t.chatbot}
            />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && !isLoading && (
            <div className="px-4 py-3 bg-white border-t border-neutral-100 overflow-x-auto">
              <QuickQuestions
                onQuestionClick={handleQuickQuestion}
                language={language}
                t={t.chatbot}
                variant="initial"
              />
            </div>
          )}

          {/* Input */}
          <div className="p-4 bg-white border-t border-neutral-100">
            <div className="relative flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t.chatbot.inputPlaceholder || 'Ask me anything...'}
                  className="w-full pl-4 pr-12 py-3 bg-neutral-100 border-none rounded-xl focus:ring-2 focus:ring-primary-500 transition-all text-sm text-neutral-800 placeholder-neutral-400"
                  disabled={isLoading || isRateLimited}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <VoiceInputButton
                    isListening={isListening}
                    isSupported={isVoiceSupported}
                    onStart={startListening}
                    onStop={stopListening}
                    t={t.chatbot}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading || isRateLimited}
                className="bg-primary-500 text-white p-3 rounded-xl hover:bg-primary-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[10px] text-neutral-400 text-center mt-2 font-medium">
              Powered by Cerebras AI • Knowledge from SKV & FIVB
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
