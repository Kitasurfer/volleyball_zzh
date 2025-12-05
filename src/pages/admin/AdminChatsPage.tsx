import { useState } from 'react';
import ChatSessionsFilters from '../../components/admin/chat/ChatSessionsFilters';
import ChatSessionsTable from '../../components/admin/chat/ChatSessionsTable';
import ChatMessagesPanel from '../../components/admin/chat/ChatMessagesPanel';
import { useAdminChatSessions } from '../../hooks/useAdminChatSessions';
import { useAdminChatMessages } from '../../hooks/useAdminChatMessages';
import type { ChatSessionFilters, ChatSessionSummary } from '../../types/admin/chat';
import { useLanguage } from '../../lib/LanguageContext';
import { AdminAlert } from '../../components/admin/common/AdminAlert';

const AdminChatsPage = () => {
  const { t } = useLanguage();
  const admin = t.admin.chats;
  const [filters, setFilters] = useState<ChatSessionFilters>({ search: '', language: 'all' });
  const [selectedSession, setSelectedSession] = useState<ChatSessionSummary | null>(null);

  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    refresh: refreshSessions,
  } = useAdminChatSessions(filters);

  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    refresh: refreshMessages,
  } = useAdminChatMessages(selectedSession?.id ?? null);

  const handleSelectSession = (session: ChatSessionSummary) => {
    setSelectedSession(session);
  };

  const handleRefreshAll = () => {
    refreshSessions();
    if (selectedSession) {
      refreshMessages();
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">{admin.pageTitle}</h2>
          <p className="mt-1 text-sm text-neutral-500">{admin.pageSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={handleRefreshAll}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
        >
          {admin.refresh}
        </button>
      </header>

      <ChatSessionsFilters
        onChange={(nextFilters) => {
          setFilters(nextFilters);
          setSelectedSession(null);
        }}
      />

      {sessionsError && (
        <AdminAlert variant="error" size="sm">
          {sessionsError}
        </AdminAlert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {sessionsLoading ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-neutral-200 bg-white text-sm text-neutral-500">
              {admin.loadingSessions}
            </div>
          ) : (
            <ChatSessionsTable
              sessions={sessions}
              selectedId={selectedSession?.id}
              onSelect={handleSelectSession}
            />
          )}
        </div>

        <ChatMessagesPanel
          session={selectedSession}
          messages={messages}
          loading={messagesLoading}
          error={messagesError}
          onRefresh={refreshMessages}
        />
      </div>
    </div>
  );
};

export default AdminChatsPage;
