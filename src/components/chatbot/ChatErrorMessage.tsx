/**
 * Error message component with retry functionality
 */
import React from 'react';
import { AlertCircle, RefreshCw, Clock } from 'lucide-react';
import type { Translation } from '../../types';

interface ChatErrorMessageProps {
  type: 'error' | 'rate_limit';
  onRetry?: () => void;
  isRetrying?: boolean;
  t: Translation['chatbot'];
}

export const ChatErrorMessage: React.FC<ChatErrorMessageProps> = ({
  type,
  onRetry,
  isRetrying = false,
  t,
}) => {
  const isRateLimit = type === 'rate_limit';

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl ${
      isRateLimit ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'
    }`}>
      <div className={`p-1.5 rounded-full ${
        isRateLimit ? 'bg-amber-100' : 'bg-red-100'
      }`}>
        {isRateLimit ? (
          <Clock className="w-4 h-4 text-amber-600" />
        ) : (
          <AlertCircle className="w-4 h-4 text-red-600" />
        )}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${
          isRateLimit ? 'text-amber-800' : 'text-red-800'
        }`}>
          {isRateLimit ? t.errorRateLimit : t.errorRetry}
        </p>
        {onRetry && !isRateLimit && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? t.retrying : t.errorRetry.split('.')[0]}
          </button>
        )}
      </div>
    </div>
  );
};
