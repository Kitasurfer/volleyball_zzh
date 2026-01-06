/**
 * Hook for managing message feedback (like/dislike)
 */
import { useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export type FeedbackType = 'like' | 'dislike' | null;

interface MessageFeedback {
  [messageId: string]: FeedbackType;
}

interface UseMessageFeedbackReturn {
  feedback: MessageFeedback;
  submitFeedback: (messageId: string, sessionId: string, type: FeedbackType) => Promise<void>;
  getFeedback: (messageId: string) => FeedbackType;
  isSubmitting: boolean;
  showThankYou: boolean;
  dismissThankYou: () => void;
}

export function useMessageFeedback(): UseMessageFeedbackReturn {
  const [feedback, setFeedback] = useState<MessageFeedback>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const submitFeedback = useCallback(async (
    messageId: string,
    sessionId: string,
    type: FeedbackType
  ): Promise<void> => {
    if (!type) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('chat_message_feedback')
        .insert({
          message_id: messageId,
          session_id: sessionId,
          feedback_type: type,
        });

      if (error) {
        console.error('Failed to submit feedback:', error);
        return;
      }

      setFeedback((prev) => ({
        ...prev,
        [messageId]: type,
      }));

      setShowThankYou(true);
      setTimeout(() => setShowThankYou(false), 3000);
    } catch (err) {
      console.error('Feedback submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const getFeedback = useCallback((messageId: string): FeedbackType => {
    return feedback[messageId] || null;
  }, [feedback]);

  const dismissThankYou = useCallback(() => {
    setShowThankYou(false);
  }, []);

  return {
    feedback,
    submitFeedback,
    getFeedback,
    isSubmitting,
    showThankYou,
    dismissThankYou,
  };
}
