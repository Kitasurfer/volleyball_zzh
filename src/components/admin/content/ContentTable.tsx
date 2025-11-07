import type { ContentItemSummary } from '../../../types/admin/content';

interface Props {
  items: ContentItemSummary[];
  onEnqueue: (contentId: string) => void;
  onEdit: (contentId: string) => void;
  enqueueingId?: string | null;
}

const statusBadgeClass: Record<string, string> = {
  draft: 'bg-neutral-200 text-neutral-700',
  review: 'bg-amber-100 text-amber-700',
  published: 'bg-emerald-100 text-emerald-700',
};

const ContentTable = ({ items, onEnqueue, onEdit, enqueueingId }: Props) => (
  <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
    <table className="min-w-full divide-y divide-neutral-200">
      <thead className="bg-neutral-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Title
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Language
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Status
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Updated
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Vector jobs
          </th>
          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-100">
        {items.map((item) => (
          <tr key={item.id} className="hover:bg-neutral-50">
            <td className="px-4 py-3">
              <div className="font-medium text-neutral-900">{item.title}</div>
              <div className="text-xs text-neutral-500">#{item.id}</div>
            </td>
            <td className="px-4 py-3 text-sm uppercase text-neutral-500">{item.language}</td>
            <td className="px-4 py-3">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass[item.status]}`}>
                {item.status === 'review' ? 'In Review' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-neutral-500">
              {new Date(item.updatedAt).toLocaleDateString()}
            </td>
            <td className="px-4 py-3 text-sm text-neutral-500">
              {item.pendingJobs > 0 ? `${item.pendingJobs} pending` : 'Up to date'}
            </td>
            <td className="px-4 py-3 text-right">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(item.id)}
                  className="inline-flex items-center rounded-lg border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onEnqueue(item.id)}
                  disabled={enqueueingId === item.id}
                  className="inline-flex items-center rounded-lg border border-primary-500 px-3 py-1 text-xs font-semibold text-primary-600 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400"
                >
                  {enqueueingId === item.id ? 'Enqueuing…' : 'Enqueue job'}
                </button>
              </div>
            </td>
          </tr>
        ))}
        {items.length === 0 && (
          <tr>
            <td className="px-4 py-6 text-center text-sm text-neutral-500" colSpan={6}>
              <span className="block font-medium text-neutral-600">No content found</span>
              <span className="mt-1 block text-xs text-neutral-400">
                Adjust filters or ingest new content to populate the knowledge base.
              </span>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default ContentTable;
