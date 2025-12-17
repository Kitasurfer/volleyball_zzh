import React from 'react';
import { Check, Copy } from 'lucide-react';

import type { Translation } from '../../types';
import type { ChatMessage } from '../../types/chatbot';
import { LinkifiedText } from '../LinkifiedText';

interface ChatMessageItemProps {
  message: ChatMessage;
  t: Translation['chatbot'];
  onCopy?: () => void;
  copied?: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  t,
  onCopy,
  copied = false,
}) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-4 py-2 rounded-lg ${
          isUser ? 'bg-primary-500 text-white' : 'bg-white text-neutral-900 shadow-sm'
        }`}
      >
        {!isUser && onCopy && (
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onCopy();
              }}
              className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              aria-label={t.copy}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{t.copy}</span>
            </button>
          </div>
        )}

        <LinkifiedText text={message.text} className="text-sm leading-relaxed whitespace-pre-line" />
      </div>
    </div>
  );
};
