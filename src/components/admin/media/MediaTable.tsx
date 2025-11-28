import type { MediaAssetSummary } from '../../../types/admin/media';

interface MediaAlbum {
  id: string;
  slug: string;
  category: string;
}

interface Props {
  items: MediaAssetSummary[];
  onDelete: (media: MediaAssetSummary) => void;
  deletingId?: string | null;
  albums?: MediaAlbum[];
}

const MediaTable = ({ items, onDelete, deletingId, albums }: Props) => (
  <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
    <table className="min-w-full divide-y divide-neutral-200">
      <thead className="bg-neutral-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Title
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Album / i18n
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Type
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Language
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Path
          </th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Created
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
              <div className="font-medium text-neutral-900">{item.title ?? 'Untitled asset'}</div>
              {item.description && <div className="text-xs text-neutral-500">{item.description}</div>}
            </td>
            <td className="px-4 py-3 text-xs text-neutral-500">
              <div>
                {item.albumId && albums
                  ? (() => {
                      const album = albums.find((a) => a.id === item.albumId);
                      if (!album) return item.albumId;
                      return `${album.slug} (${album.category})`;
                    })()
                  : '—'}
              </div>
              <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ${
                    item.hasAltText
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                      : 'bg-neutral-50 text-neutral-400 ring-1 ring-neutral-200'
                  }`}
                >
                  ALT
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ${
                    item.hasTitleI18n
                      ? 'bg-sky-50 text-sky-700 ring-1 ring-sky-200'
                      : 'bg-neutral-50 text-neutral-400 ring-1 ring-neutral-200'
                  }`}
                >
                  i18n
                </span>
              </div>
            </td>
            <td className="px-4 py-3 text-sm capitalize text-neutral-500">{item.mediaType}</td>
            <td className="px-4 py-3 text-sm uppercase text-neutral-500">{item.language ?? '—'}</td>
            <td className="px-4 py-3 text-xs font-mono text-neutral-500">{item.storagePath}</td>
            <td className="px-4 py-3 text-sm text-neutral-500">
              {new Date(item.createdAt).toLocaleDateString()}
            </td>
            <td className="px-4 py-3 text-right text-sm">
              <div className="flex items-center justify-end gap-2">
                <a
                  href={item.signedUrl ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                    item.signedUrl
                      ? 'border-neutral-300 text-neutral-600 hover:bg-neutral-100'
                      : 'cursor-not-allowed border-neutral-200 text-neutral-300'
                  }`}
                  onClick={(event) => {
                    if (!item.signedUrl) event.preventDefault();
                  }}
                >
                  Preview
                </a>
                <button
                  type="button"
                  onClick={() => onDelete(item)}
                  disabled={deletingId === item.id}
                  className="inline-flex items-center rounded-lg border border-rose-400 px-3 py-1 text-xs font-semibold text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400"
                >
                  {deletingId === item.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </td>
          </tr>
        ))}
        {items.length === 0 && (
          <tr>
            <td className="px-4 py-6 text-center text-sm text-neutral-500" colSpan={7}>
              <span className="block font-medium text-neutral-600">No media assets found</span>
              <span className="mt-1 block text-xs text-neutral-400">
                Upload new files or adjust filters to see media items.
              </span>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default MediaTable;
