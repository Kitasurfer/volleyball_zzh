import type { ChatSessionSummary } from '../../../types/admin/chat';

interface Props {
  sessions: ChatSessionSummary[];
  selectedId?: string | null;
  onSelect: (session: ChatSessionSummary) => void;
}

const languageLabel = (language: string | null) => language?.toUpperCase() ?? '—';

const ChatSessionsTable = ({ sessions, selectedId, onSelect }: Props) => (
  <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
    <table className="min-w-full divide-y divide-neutral-200">
      <thead className="bg-neutral-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            User hash
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Language
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Messages
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Last activity
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-100">
        {sessions.map((session) => {
          const isSelected = selectedId === session.id;
          return (
            <tr
              key={session.id}
              className={`cursor-pointer transition hover:bg-neutral-50 ${
                isSelected ? 'bg-primary-50' : ''
              }`}
              onClick={() => onSelect(session)}
            >
              <td className="px-4 py-3">
                <div className="font-medium text-neutral-900">
                  {session.userHash.slice(0, 12)}
                  {session.userHash.length > 12 ? '…' : ''}
                </div>
                <div className="text-xs text-neutral-400">{session.id.slice(0, 8)}</div>
              </td>
              <td className="px-4 py-3 text-sm uppercase text-neutral-500">
                {languageLabel(session.language)}
              </td>
              <td className="px-4 py-3 text-sm text-neutral-500">{session.messageCount}</td>
              <td className="px-4 py-3 text-sm text-neutral-500">
                {new Date(session.lastActivity).toLocaleString()}
              </td>
            </tr>
          );
        })}
        {sessions.length === 0 && (
          <tr>
            <td className="px-4 py-6 text-center text-sm text-neutral-500" colSpan={4}>
              No chat sessions yet. Encourage users to start a conversation with the assistant.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default ChatSessionsTable;
