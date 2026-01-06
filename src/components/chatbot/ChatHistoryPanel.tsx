/**
 * Chat history panel component - shows saved conversations
 */
import React from 'react';
import { History, Trash2, MessageSquare, X } from 'lucide-react';
import type { Translation } from '../../types';
import type { ChatConversation } from '../../hooks/chatbot';

interface ChatHistoryPanelProps {
  conversations: ChatConversation[];
  currentConversationId: string | null;
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
  t: Translation['chatbot'];
}

export const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
  conversations,
  currentConversationId,
  onLoadConversation,
  onDeleteConversation,
  onClearAll,
  onClose,
  t,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="absolute inset-0 bg-white z-10 flex flex-col rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 bg-neutral-50">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary-500" />
          <span className="font-semibold text-neutral-800">{t.history}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-neutral-200 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-400">
            <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">{t.historyEmpty}</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                currentConversationId === conv.id
                  ? 'border-primary-300 bg-primary-50'
                  : 'border-neutral-100 hover:border-primary-200 hover:bg-neutral-50'
              }`}
              onClick={() => onLoadConversation(conv.id)}
            >
              <div className="pr-8">
                <p className="font-medium text-sm text-neutral-800 truncate">
                  {conv.title}
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  {formatDate(conv.updatedAt)} · {conv.messages.length} messages
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(conv.id);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all"
                aria-label="Delete conversation"
              >
                <Trash2 className="w-4 h-4 text-red-400 hover:text-red-500" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer with clear all */}
      {conversations.length > 0 && (
        <div className="p-3 border-t border-neutral-100">
          <button
            onClick={() => {
              if (window.confirm(t.historyClearConfirm)) {
                onClearAll();
              }
            }}
            className="w-full py-2 px-4 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {t.historyClear}
          </button>
        </div>
      )}
    </div>
  );
};
