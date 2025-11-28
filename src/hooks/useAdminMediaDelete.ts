import { useState } from 'react';
import type { MediaAssetSummary } from '../types/admin/media';
import { supabase } from '../lib/supabase';

const MEDIA_BUCKET = 'media-public';

interface UseAdminMediaDeleteOptions {
  onDeleted?: () => void;
}

interface UseAdminMediaDeleteResult {
  deletingId: string | null;
  deleteError: string | null;
  deleteSuccess: string | null;
  handleDelete: (media: MediaAssetSummary) => Promise<void>;
}

export const useAdminMediaDelete = (
  options: UseAdminMediaDeleteOptions = {},
): UseAdminMediaDeleteResult => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const handleDelete = async (media: MediaAssetSummary) => {
    if (deletingId) return;
    setDeleteError(null);
    setDeleteSuccess(null);
    setDeletingId(media.id);

    const bucketPrefix = `${MEDIA_BUCKET}/`;
    const pathInBucket = media.storagePath.startsWith(bucketPrefix)
      ? media.storagePath.slice(bucketPrefix.length)
      : media.storagePath;

    const { error: removeError } = await supabase.storage.from(MEDIA_BUCKET).remove([pathInBucket]);

    if (removeError) {
      setDeleteError(removeError.message);
      setDeletingId(null);
      return;
    }

    const { error: deleteRowError } = await supabase.from('media_assets').delete().eq('id', media.id);

    if (deleteRowError) {
      setDeleteError(deleteRowError.message);
      setDeletingId(null);
      return;
    }

    setDeleteSuccess('Media asset deleted.');
    setDeletingId(null);

    if (options.onDeleted) {
      options.onDeleted();
    }
  };

  return { deletingId, deleteError, deleteSuccess, handleDelete };
};
