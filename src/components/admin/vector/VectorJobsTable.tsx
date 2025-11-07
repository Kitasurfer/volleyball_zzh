import type { VectorJobSummary } from '../../../types/admin/vector';

interface Props {
  jobs: VectorJobSummary[];
  onRetry: (jobId: string) => void;
  retryingJobId?: string | null;
}

const statusColors: Record<VectorJobSummary['status'], string> = {
  pending: 'bg-neutral-200 text-neutral-700',
  processing: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700',
};

const VectorJobsTable = ({ jobs, onRetry, retryingJobId }: Props) => (
  <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
    <table className="min-w-full divide-y divide-neutral-200">
      <thead className="bg-neutral-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Job ID
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Content
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Language
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Status
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Timing
          </th>
          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-100">
        {jobs.map((job) => (
          <tr key={job.id} className="hover:bg-neutral-50">
            <td className="px-4 py-3 text-xs font-mono text-neutral-500">{job.id.slice(0, 8)}</td>
            <td className="px-4 py-3">
              <div className="font-medium text-neutral-900">{job.title}</div>
              <div className="text-xs text-neutral-500">#{job.contentId}</div>
            </td>
            <td className="px-4 py-3 text-sm uppercase text-neutral-500">{job.language}</td>
            <td className="px-4 py-3">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[job.status]}`}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
              {job.error && <p className="mt-1 text-xs text-rose-500">{job.error}</p>}
            </td>
            <td className="px-4 py-3 text-xs text-neutral-500">
              <div>Start: {job.startedAt ? new Date(job.startedAt).toLocaleTimeString() : '—'}</div>
              <div>Done: {job.completedAt ? new Date(job.completedAt).toLocaleTimeString() : '—'}</div>
            </td>
            <td className="px-4 py-3 text-right text-sm">
              <button
                type="button"
                onClick={() => onRetry(job.id)}
                disabled={
                  job.status === 'processing' ||
                  job.status === 'pending' ||
                  retryingJobId === job.id
                }
                className="inline-flex items-center rounded-lg border border-primary-500 px-3 py-1 text-xs font-semibold text-primary-600 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400"
              >
                {retryingJobId === job.id ? 'Retrying…' : 'Retry job'}
              </button>
            </td>
          </tr>
        ))}
        {jobs.length === 0 && (
          <tr>
            <td className="px-4 py-6 text-center text-sm text-neutral-500" colSpan={6}>
              No jobs in the queue right now.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default VectorJobsTable;
