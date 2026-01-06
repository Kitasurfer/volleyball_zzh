/**
 * Toast notification for feedback submission
 */
import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import type { Translation } from '../../types';

interface FeedbackToastProps {
  show: boolean;
  onDismiss: () => void;
  t: Translation['chatbot'];
}

export const FeedbackToast: React.FC<FeedbackToastProps> = ({
  show,
  onDismiss,
  t,
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  if (!show) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full shadow-lg">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">{t.thanksFeedback}</span>
        <button
          onClick={onDismiss}
          className="p-0.5 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
