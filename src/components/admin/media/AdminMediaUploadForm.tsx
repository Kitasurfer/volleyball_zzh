import React from 'react';
import type { MediaAlbum } from '../../../types/admin/media';
import { useAdminMediaUpload } from '../../../hooks/useAdminMediaUpload';
import { useLanguage } from '../../../lib/LanguageContext';

interface AdminMediaUploadFormProps {
  albums: MediaAlbum[];
  onUploaded?: () => void;
}

const AdminMediaUploadForm: React.FC<AdminMediaUploadFormProps> = ({ albums, onUploaded }) => {
  const { t } = useLanguage();
  const {
    files,
    setFiles,
    sourceType,
    setSourceType,
    url,
    setUrl,
    title,
    setTitle,
    description,
    setDescription,
    language: mediaLanguage,
    setLanguage: setMediaLanguage,
    albumId,
    setAlbumId,
    uploading,
    uploadError,
    uploadSuccess,
    handleUpload,
  } = useAdminMediaUpload({ onUploaded });

  const disableSubmit = uploading || (sourceType === 'file' && files.length === 0);
  const ui = t.admin.media.upload;

  return (
    <form
      onSubmit={handleUpload}
      className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm space-y-4"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.sourceLabel}</label>
          <select
            value={sourceType}
            onChange={(event) => setSourceType(event.target.value as 'file' | 'url')}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="file">{ui.sourceFile}</option>
            <option value="url">{ui.sourceUrl}</option>
          </select>
          {sourceType === 'file' ? (
            <input
              type="file"
              multiple
              accept="image/*,video/*,audio/*,application/pdf"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              className="mt-2 w-full text-sm text-neutral-600"
            />
          ) : (
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.youtube.com/..."
              className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
            />
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.languageLabel}</label>
          <select
            value={mediaLanguage}
            onChange={(event) => setMediaLanguage(event.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="all">{ui.languageAll}</option>
            <option value="de">DE</option>
            <option value="en">EN</option>
            <option value="ru">RU</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.albumLabel}</label>
          <select
            value={albumId}
            onChange={(event) => setAlbumId(event.target.value as 'none' | string)}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="none">{ui.albumNone}</option>
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                {album.slug} ({album.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.titleLabel}</label>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={ui.titlePlaceholder}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.descriptionLabel}</label>
          <input
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={ui.descriptionPlaceholder}
            className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="text-xs text-neutral-500">{ui.infoText}</div>
        <button
          type="submit"
          disabled={disableSubmit}
          className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {uploading ? ui.submitUploading : ui.submitDefault}
        </button>
      </div>

      {uploadError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
          {uploadError}
        </div>
      )}
      {uploadSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-600">
          {ui.successMessage}
        </div>
      )}
    </form>
  );
};

export default AdminMediaUploadForm;
