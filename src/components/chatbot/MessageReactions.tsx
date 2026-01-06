/**
 * Message reactions component (like/dislike buttons)
 */
import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import type { Translation } from '../../types';
import type { FeedbackType } from '../../hooks/chatbot';

interface MessageReactionsProps {
  messageId: string;
  currentFeedback: FeedbackType;
  onFeedback: (type: FeedbackType) => void;
  isSubmitting: boolean;
  t: Translation['chatbot'];
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  currentFeedback,
  onFeedback,
  isSubmitting,
  t,
}) => {
  return (
    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-neutral-100">
      <button
        onClick={() => onFeedback('like')}
        disabled={isSubmitting || currentFeedback !== null}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all ${
          currentFeedback === 'like'
            ? 'bg-green-100 text-green-600'
            : currentFeedback === null
            ? 'hover:bg-green-50 text-neutral-400 hover:text-green-500'
            : 'text-neutral-300 cursor-not-allowed'
        }`}
        title={t.helpful}
        aria-label={t.helpful}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{t.helpful}</span>
      </button>
      <button
        onClick={() => onFeedback('dislike')}
        disabled={isSubmitting || currentFeedback !== null}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all ${
          currentFeedback === 'dislike'
            ? 'bg-red-100 text-red-600'
            : currentFeedback === null
            ? 'hover:bg-red-50 text-neutral-400 hover:text-red-500'
            : 'text-neutral-300 cursor-not-allowed'
        }`}
        title={t.notHelpful}
        aria-label={t.notHelpful}
      >
        <ThumbsDown className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{t.notHelpful}</span>
      </button>
    </div>
  );
};
