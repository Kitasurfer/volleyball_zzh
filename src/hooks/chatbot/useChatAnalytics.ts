/**
 * Hook for tracking chat analytics events
 */
import { useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import type { Language } from '../../types';

type AnalyticsEventType =
  | 'session_start'
  | 'session_end'
  | 'message_sent'
  | 'message_received'
  | 'voice_input_used'
  | 'quick_question_clicked'
  | 'language_changed'
  | 'search_used'
  | 'history_viewed'
  | 'feedback_given'
  | 'error_occurred';

interface AnalyticsEventData {
  [key: string]: unknown;
}

interface UseChatAnalyticsReturn {
  trackEvent: (
    eventType: AnalyticsEventType,
    eventData?: AnalyticsEventData
  ) => Promise<void>;
  setSessionId: (id: string) => void;
  setUserHash: (hash: string) => void;
}

export function useChatAnalytics(language: Language): UseChatAnalyticsReturn {
  const sessionIdRef = useRef<string | null>(null);
  const userHashRef = useRef<string>('');

  const setSessionId = useCallback((id: string) => {
    sessionIdRef.current = id;
  }, []);

  const setUserHash = useCallback((hash: string) => {
    userHashRef.current = hash;
  }, []);

  const trackEvent = useCallback(async (
    eventType: AnalyticsEventType,
    eventData: AnalyticsEventData = {}
  ): Promise<void> => {
    if (!supabase) return;
    userHashRef.current ||= crypto.randomUUID();
    try {
      const { error } = await supabase
        .from('chat_analytics')
        .insert({
          session_id: sessionIdRef.current,
          event_type: eventType,
          event_data: eventData,
          language,
          user_hash: userHashRef.current,
        });

      if (error) {
        console.warn('Analytics tracking failed:', error.message);
      }
    } catch (err) {
      console.warn('Analytics error:', err);
    }
  }, [language]);

  return {
    trackEvent,
    setSessionId,
    setUserHash,
  };
}
