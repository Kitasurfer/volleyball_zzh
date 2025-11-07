import type { AdminChatMessage, ChatSessionSummary } from '../../../types/admin/chat';

interface Props {
  session: ChatSessionSummary | null;
  messages: AdminChatMessage[];
  loading: boolean;
  error?: string;
  onRefresh: () => void;
}

const roleStyles: Record<string, string> = {
  system: 'border-neutral-300 bg-neutral-50 text-neutral-600',
  user: 'border-primary-200 bg-primary-50 text-neutral-900',
  assistant: 'border-emerald-200 bg-emerald-50 text-neutral-900',
  tool: 'border-amber-200 bg-amber-50 text-neutral-900',
};

const ChatMessagesPanel = ({ session, messages, loading, error, onRefresh }: Props) => {
  if (!session) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white">
        <p className="text-sm text-neutral-500">Select a chat session to inspect the conversation.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">Session details</h3>
          <p className="mt-1 text-xs text-neutral-500">
            User hash: <span className="font-mono text-neutral-700">{session.userHash}</span>
          </p>
          <p className="text-xs text-neutral-500">
            Messages: {session.messageCount} · Language: {session.language?.toUpperCase() ?? '—'}
          </p>
          <p className="text-xs text-neutral-400">
            Created {new Date(session.createdAt).toLocaleString()} · Last activity {new Date(session.lastActivity).toLocaleString()}
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
        >
          Refresh messages
        </button>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-4">
        {loading ? (
          <div className="flex min-h-[200px] items-center justify-center text-sm text-neutral-500">Loading conversation…</div>
        ) : messages.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center text-sm text-neutral-500">No messages recorded for this session.</div>
        ) : (
          <ul className="space-y-4">
            {messages.map((message) => (
              <li key={message.id} className={`rounded-lg border px-4 py-3 text-sm ${roleStyles[message.role] ?? roleStyles.user}`}>
                <div className="flex items-center justify-between gap-3 text-xs text-neutral-500">
                  <span className="font-semibold uppercase tracking-wide text-neutral-600">{message.role}</span>
                  <span>{new Date(message.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-neutral-900">{message.content}</p>
                {message.citations && Array.isArray(message.citations) && message.citations.length > 0 && (
                  <div className="mt-3 rounded-md bg-neutral-100 p-3 text-xs text-neutral-600">
                    <p className="font-semibold text-neutral-700">Citations</p>
                    <pre className="mt-1 whitespace-pre-wrap break-words text-neutral-600">
                      {JSON.stringify(message.citations, null, 2)}
                    </pre>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatMessagesPanel;
