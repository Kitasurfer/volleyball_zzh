import { useState } from 'react';
import VectorJobsTable from '../../components/admin/vector/VectorJobsTable';
import { useAdminVectorJobs } from '../../hooks/useAdminVectorJobs';
import { supabase } from '../../lib/supabase';

const AdminVectorJobsPage = () => {
  const { jobs, loading, error, refresh } = useAdminVectorJobs();
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleRetry = async (jobId: string) => {
    if (retryingJobId) return;
    setActionError(null);
    setRetryingJobId(jobId);

    const { error: rpcError } = await supabase.rpc('admin_retry_vector_job', { job_id: jobId });

    if (rpcError) {
      setActionError(rpcError.message);
    } else {
      refresh();
    }

    setRetryingJobId(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Vector Jobs</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Track ingestion progress, identify bottlenecks, and retry failed jobs.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
        >
          Refresh
        </button>
      </header>

      {actionError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-neutral-200 bg-white text-sm text-neutral-500">
          Loading jobs…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          Failed to load jobs: {error}
        </div>
      ) : (
        <VectorJobsTable jobs={jobs} onRetry={handleRetry} retryingJobId={retryingJobId} />
      )}
    </div>
  );
};

export default AdminVectorJobsPage;
