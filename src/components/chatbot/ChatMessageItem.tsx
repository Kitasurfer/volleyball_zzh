import React, { useRef } from 'react';
import { Check, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';

import type { Translation } from '../../types';
import type { ChatMessage } from '../../types/chatbot';
import { ChatText, safeChatHref } from '@/components/chatbot/ChatText';
import type { FeedbackType } from '../../hooks/chatbot/useMessageFeedback';

interface ChatMessageItemProps {
  message: ChatMessage;
  t: Translation['chatbot'];
  onCopy?: (visibleText: string) => void;
  copied?: boolean;
  feedback?: FeedbackType;
  onFeedback?: (type: 'like' | 'dislike') => void;
  isFeedbackSubmitting?: boolean;
  searchHighlight?: string;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  t,
  onCopy,
  copied = false,
  feedback,
  onFeedback,
  isFeedbackSubmitting = false,
  searchHighlight,
}) => {
  const isUser = message.sender === 'user';

  const bodyRef = useRef<HTMLDivElement>(null);
  const sources = new Map<string, string | undefined>();
  for (const citation of message.citations ?? []) {
    const title = [citation.title, citation.headings?.at(-1)].filter(Boolean).join(' · ');
    if (title) sources.set(title, safeChatHref(citation.url));
  }

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary-100 flex-shrink-0 flex items-center justify-center mb-1 shadow-sm border border-primary-200 overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
             <span className="text-[10px] font-bold text-white tracking-tighter">SKV</span>
          </div>
        </div>
      )}
      
      <div
        className={`min-w-0 max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
          isUser 
            ? 'bg-primary-500 text-white rounded-br-none' 
            : 'bg-white text-neutral-900 border border-neutral-100 rounded-bl-none'
        }`}
      >
        {!isUser && onCopy && (
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onCopy(bodyRef.current?.innerText ?? message.text);
              }}
              className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-[10px] font-bold text-neutral-400 hover:text-primary-500 hover:bg-primary-50/50 transition-all uppercase tracking-wider"
              aria-label={t.copy}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{t.copy}</span>
            </button>
          </div>
        )}

        <div ref={bodyRef}><ChatText text={message.text} plain={isUser} search={searchHighlight} /></div>
        {!isUser && sources.size > 0 && <details className="mt-3 border-t pt-2 text-xs">
          <summary className="cursor-pointer font-semibold">{t.sources} ({sources.size})</summary>
          <ul className="space-y-1 break-words pt-1">{[...sources].map(([title, href]) =>
            <li key={title}>{href ? <a className="text-primary-700 underline" href={href}
              target="_blank" rel="noopener noreferrer">{title}</a> : title}</li>)}</ul>
        </details>}

        {/* Feedback buttons for bot messages */}
        {!isUser && onFeedback && (
          <div className="flex items-center gap-1 mt-3 pt-2 border-t border-neutral-100">
            <button
              onClick={() => onFeedback('like')}
              disabled={isFeedbackSubmitting || feedback !== null}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all ${
                feedback === 'like'
                  ? 'bg-green-100 text-green-600'
                  : feedback === null
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
              disabled={isFeedbackSubmitting || feedback !== null}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all ${
                feedback === 'dislike'
                  ? 'bg-red-100 text-red-600'
                  : feedback === null
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
        )}
      </div>
    </div>
  );
};
