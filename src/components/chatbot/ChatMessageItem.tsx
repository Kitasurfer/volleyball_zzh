import React from 'react';
import { Check, Copy, ExternalLink, Image as ImageIcon, Video, ThumbsUp, ThumbsDown } from 'lucide-react';

import type { Translation } from '../../types';
import type { ChatMessage, Citation } from '../../types/chatbot';
import { LinkifiedText } from '../LinkifiedText';
import type { FeedbackType } from '../../hooks/chatbot/useMessageFeedback';

interface ChatMessageItemProps {
  message: ChatMessage;
  t: Translation['chatbot'];
  onCopy?: () => void;
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

  const highlightText = (text: string): string => {
    if (!searchHighlight?.trim()) return text;
    const regex = new RegExp(`(${searchHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>');
  };

  const renderCitations = (citations: Citation[]) => {
    if (!citations || citations.length === 0) return null;

    return (
      <div className="mt-4 space-y-4 border-t border-neutral-100 pt-3">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
          {t.sources || 'Sources'}
        </p>
        <div className="grid grid-cols-1 gap-3">
          {citations.map((citation, idx) => (
            <div key={idx} className="bg-neutral-50 rounded-xl p-3 text-xs border border-neutral-100 hover:border-primary-100 transition-colors">
              {citation.title && (
                <div className="font-semibold text-neutral-800 mb-1.5 flex items-center justify-between">
                  <span>{citation.title}</span>
                  {citation.url && (
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-600 transition-colors p-1 hover:bg-white rounded-md"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
              
              {citation.media && citation.media.length > 0 && (
                <div className="mt-2 space-y-2">
                  {citation.media.map((m) => (
                    <div key={m.id} className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
                      {m.type === 'image' ? (
                        <div className="relative group">
                          <img
                            src={m.url}
                            alt={m.title || m.description || ''}
                            className="w-full min-h-[100px] h-auto object-contain max-h-64 bg-neutral-50 block"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            onLoad={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.opacity = '1';
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                            style={{ opacity: 0.5, transition: 'opacity 0.3s' }}
                          />
                          <div className="hidden items-center justify-center p-4 bg-neutral-100 text-neutral-500">
                            <ImageIcon className="w-8 h-8 mr-2" />
                            <span className="text-sm">{m.title || 'Изображение недоступно'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          {m.url.includes('youtube.com') || m.url.includes('youtu.be') ? (
                            <div className="aspect-video w-full">
                              <iframe
                                src={m.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                className="w-full h-full"
                                allowFullScreen
                                title={m.title || 'Video preview'}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 p-3 bg-neutral-50 group hover:bg-white transition-colors">
                              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                                <Video className="w-4 h-4" />
                              </div>
                              <span className="truncate text-[10px] font-medium text-neutral-700">{m.title || 'Video content'}</span>
                              <a
                                href={m.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-auto text-primary-500 hover:text-primary-600 font-bold text-[10px] bg-white px-2 py-1 rounded border border-neutral-200 shadow-sm transition-all active:scale-95"
                              >
                                Watch
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      {(m.title || m.description) && (
                        <div className="p-2.5 border-t border-neutral-100 bg-white/50">
                          {m.title && <p className="font-bold text-[10px] text-neutral-800">{m.title}</p>}
                          {m.description && <p className="text-neutral-500 text-[10px] leading-relaxed mt-0.5">{m.description}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {citation.snippet && (
                <p className="text-neutral-600 leading-relaxed mt-2.5 italic line-clamp-4 border-l-2 border-primary-200 pl-2">
                  "{citation.snippet}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

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
        className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
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
                onCopy();
              }}
              className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-[10px] font-bold text-neutral-400 hover:text-primary-500 hover:bg-primary-50/50 transition-all uppercase tracking-wider"
              aria-label={t.copy}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : t.copy}</span>
            </button>
          </div>
        )}

        {searchHighlight ? (
          <div 
            className={`text-sm leading-relaxed whitespace-pre-line ${isUser ? 'text-white' : 'text-neutral-800'}`}
            dangerouslySetInnerHTML={{ __html: highlightText(message.text) }}
          />
        ) : (
          <LinkifiedText 
            text={message.text} 
            className={`text-sm leading-relaxed whitespace-pre-line ${isUser ? 'text-white' : 'text-neutral-800'}`} 
          />
        )}

        {/* Citations block hidden - links should be included in the answer text itself */}
        {/* {!isUser && message.citations && renderCitations(message.citations)} */}

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
