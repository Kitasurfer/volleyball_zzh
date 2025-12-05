import { useState } from 'react';
import VectorJobsTable from '../../components/admin/vector/VectorJobsTable';
import { useAdminVectorJobs } from '../../hooks/useAdminVectorJobs';
import { supabase } from '../../lib/supabase';
import { AdminAlert } from '../../components/admin/common/AdminAlert';
import { useLanguage } from '../../lib/LanguageContext';

const AdminVectorJobsPage = () => {
  const { t } = useLanguage();
  const admin = t.admin.vectorJobs;
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
          <h2 className="text-xl font-semibold text-neutral-900">{admin.pageTitle}</h2>
          <p className="mt-1 text-sm text-neutral-500">{admin.pageSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
        >
          {admin.refresh}
        </button>
      </header>

      {actionError && (
        <AdminAlert variant="error" size="sm">
          {actionError}
        </AdminAlert>
      )}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-neutral-200 bg-white text-sm text-neutral-500">
          {admin.loading}
        </div>
      ) : error ? (
        <AdminAlert variant="error" size="md">
          {admin.loadErrorPrefix} {error}
        </AdminAlert>
      ) : (
        <VectorJobsTable jobs={jobs} onRetry={handleRetry} retryingJobId={retryingJobId} />
      )}
    </div>
  );
};

export default AdminVectorJobsPage;
