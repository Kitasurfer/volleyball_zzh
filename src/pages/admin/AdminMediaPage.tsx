import { useState } from 'react';
import MediaFilters from '../../components/admin/media/MediaFilters';
import MediaTable from '../../components/admin/media/MediaTable';
import type { MediaFilters as FilterState } from '../../types/admin/media';
import { useAdminMediaAssets } from '../../hooks/useAdminMediaAssets';
import { useAdminMediaAlbums } from '../../hooks/useAdminMediaAlbums';
import { useAdminMediaDelete } from '../../hooks/useAdminMediaDelete';
import AdminMediaUploadForm from '../../components/admin/media/AdminMediaUploadForm';
import { useLanguage } from '../../lib/LanguageContext';
import { AdminAlert } from '../../components/admin/common/AdminAlert';

const AdminMediaPage = () => {
  const { t } = useLanguage();
  const admin = t.admin.media;
  const [filters, setFilters] = useState<FilterState>({ search: '', language: 'all', mediaType: 'all' });
  const { items, loading, error, refresh } = useAdminMediaAssets(filters);
  const { albums } = useAdminMediaAlbums();
  const { deletingId, deleteError, deleteSuccess, handleDelete } = useAdminMediaDelete({ onDeleted: refresh });

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-neutral-900">{admin.pageTitle}</h2>
        <p className="mt-1 text-sm text-neutral-500">{admin.pageSubtitle}</p>
      </header>

      <AdminMediaUploadForm albums={albums} onUploaded={refresh} />

      <MediaFilters onChange={setFilters} />

      {(deleteError || deleteSuccess) && (
        <AdminAlert variant={deleteError ? 'error' : 'success'} size="sm">
          {deleteError ? `${admin.deleteErrorPrefix} ${deleteError}` : admin.deleteSuccess}
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
        <MediaTable items={items} albums={albums} onDelete={handleDelete} deletingId={deletingId} />
      )}
    </div>
  );
};

export default AdminMediaPage;
