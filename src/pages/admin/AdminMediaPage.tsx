import { FormEvent, useState } from 'react';
import MediaFilters from '../../components/admin/media/MediaFilters';
import MediaTable from '../../components/admin/media/MediaTable';
import type { MediaAssetSummary, MediaFilters as FilterState } from '../../types/admin/media';
import { useAdminMediaAssets } from '../../hooks/useAdminMediaAssets';
import { supabase } from '../../lib/supabase';

const MEDIA_BUCKET = 'media-public';

const AdminMediaPage = () => {
  const [filters, setFilters] = useState<FilterState>({ search: '', language: 'all', mediaType: 'all' });
  const { items, loading, error, refresh } = useAdminMediaAssets(filters);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState<'all' | string>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  const inferMediaType = (selectedFile: File): string => {
    if (selectedFile.type.startsWith('image/')) return 'image';
    if (selectedFile.type.startsWith('video/')) return 'video';
    if (selectedFile.type.startsWith('audio/')) return 'audio';
    if (selectedFile.type === 'application/pdf') return 'document';
    return selectedFile.type || 'other';
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setUploadError('Select a file to upload.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const extension = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const path = `uploads/${Date.now()}-${randomSuffix}.${extension}`;

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, file, { upsert: false });

    if (uploadErr) {
      setUploadError(uploadErr.message);
      setUploading(false);
      return;
    }

    const storagePath = `${MEDIA_BUCKET}/${uploadData?.path ?? path}`;

    const { error: insertError } = await supabase.from('media_assets').insert({
      storage_path: storagePath,
      title: title || sanitizedName,
      description: description || null,
      language: language === 'all' ? null : language,
      media_type: inferMediaType(file),
    });

    if (insertError) {
      setUploadError(insertError.message);
      setUploading(false);
      return;
    }

    setUploadSuccess('Media asset uploaded successfully.');
    setFile(null);
    setTitle('');
    setDescription('');
    setLanguage('all');
    refresh();
    setUploading(false);
  };

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
    refresh();
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-neutral-900">Media Library</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Browse uploaded assets, review metadata, and locate files by language or type.
        </p>
      </header>

      <form
        onSubmit={handleUpload}
        className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm space-y-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-500">File</label>
            <input
              type="file"
              accept="image/*,video/*,audio/*,application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm text-neutral-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-500">Language</label>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
            >
              <option value="all">Not specified</option>
              <option value="de">DE</option>
              <option value="en">EN</option>
              <option value="ru">RU</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-500">Title</label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional title"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-500">Description</label>
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional description"
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="text-xs text-neutral-500">
            Accepted: images, videos, audio, PDF. Uploaded files go to `{MEDIA_BUCKET}` bucket.
          </div>
          <button
            type="submit"
            disabled={uploading || !file}
            className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {uploading ? 'Uploading…' : 'Upload media'}
          </button>
        </div>

        {uploadError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
            {uploadError}
          </div>
        )}
        {uploadSuccess && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-600">
            {uploadSuccess}
          </div>
        )}
      </form>

      <MediaFilters onChange={setFilters} />

      {(deleteError || deleteSuccess) && (
        <div
          className={`rounded-lg border p-3 text-xs ${
            deleteError
              ? 'border-rose-200 bg-rose-50 text-rose-600'
              : 'border-emerald-200 bg-emerald-50 text-emerald-600'
          }`}
        >
          {deleteError ?? deleteSuccess}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-neutral-200 bg-white text-sm text-neutral-500">
          Loading media…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          Failed to load media: {error}
        </div>
      ) : (
        <MediaTable items={items} onDelete={handleDelete} deletingId={deletingId} />
      )}
    </div>
  );
};

export default AdminMediaPage;
