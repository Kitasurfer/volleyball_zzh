import type { AlbumRow } from '../../../hooks/useAdminAlbums';
import { useLanguage } from '../../../lib/LanguageContext';

interface AdminAlbumsListProps {
  albums: AlbumRow[];
  loading: boolean;
  selectedId: string | 'new';
  onSelect: (albumId: string | 'new') => void;
}

const AdminAlbumsList = ({ albums, loading, selectedId, onSelect }: AdminAlbumsListProps) => {
  const { t } = useLanguage();
  const ui = t.admin.albums;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{ui.listTitle}</h3>
      <div className="max-h-[380px] overflow-y-auto rounded-lg border border-neutral-200 bg-white">
        {loading ? (
          <div className="p-3 text-xs text-neutral-500">{ui.listLoading}</div>
        ) : albums.length === 0 ? (
          <div className="p-3 text-xs text-neutral-500">{ui.listEmpty}</div>
        ) : (
          <ul className="divide-y divide-neutral-100 text-sm">
            {albums.map((album) => (
              <li key={album.id}>
                <button
                  type="button"
                  onClick={() => onSelect(album.id)}
                  className={`flex w-full flex-col items-start px-3 py-2 text-left hover:bg-neutral-50 ${
                    selectedId === album.id ? 'bg-primary-50' : ''
                  }`}
                >
                  <span className="font-medium text-neutral-900">{album.slug}</span>
                  <span className="text-xs text-neutral-500">
                    {album.category} • {album.season || ui.listNoSeason}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminAlbumsList;
