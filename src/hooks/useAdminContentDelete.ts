import { useState } from 'react';
import type { ContentItemSummary } from '../types/admin/content';
import { supabase } from '../lib/supabase';

interface UseAdminContentDeleteOptions {
  onDeleted?: () => void;
}

interface UseAdminContentDeleteResult {
  deletingId: string | null;
  deleteError: string | null;
  deleteSuccess: string | null;
  handleDelete: (item: ContentItemSummary) => Promise<void>;
}

const DOCUMENTS_BUCKET = 'documents';

export const useAdminContentDelete = (
  options: UseAdminContentDeleteOptions = {},
): UseAdminContentDeleteResult => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const handleDelete = async (item: ContentItemSummary) => {
    if (deletingId) return;
    setDeleteError(null);
    setDeleteSuccess(null);
    setDeletingId(item.id);

    try {
      const { data, error: rpcError } = await supabase.rpc('admin_delete_content', {
        content_id_param: item.id,
      });

      if (rpcError) {
        setDeleteError(rpcError.message);
        setDeletingId(null);
        return;
      }

      const paths = ((data as { storage_paths?: string[] } | null)?.storage_paths) ?? [];

      if (paths.length > 0) {
        const cleaned = paths.map((path) =>
          path.startsWith(`${DOCUMENTS_BUCKET}/`) ? path.slice(DOCUMENTS_BUCKET.length + 1) : path,
        );

        const { error: removeError } = await supabase.storage.from(DOCUMENTS_BUCKET).remove(cleaned);

        if (removeError) {
          setDeleteError(removeError.message);
          setDeletingId(null);
          return;
        }
      }

      setDeleteSuccess('deleted');
      setDeletingId(null);

      if (options.onDeleted) {
        options.onDeleted();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setDeleteError(message);
      setDeletingId(null);
    }
  };

  return { deletingId, deleteError, deleteSuccess, handleDelete };
};
