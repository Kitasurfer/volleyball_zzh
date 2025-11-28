import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { MediaAlbum } from '../types/admin/media';

interface UseAdminMediaAlbumsResult {
  albums: MediaAlbum[];
  loading: boolean;
  error: string | null;
}

export const useAdminMediaAlbums = (): UseAdminMediaAlbumsResult => {
  const [albums, setAlbums] = useState<MediaAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAlbums = async () => {
      setLoading(true);
      setError(null);

      const { data, error: albumsError } = await supabase
        .from('gallery_albums')
        .select('id, slug, category')
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (albumsError) {
        console.error('Failed to load gallery albums', albumsError.message);
        setAlbums([]);
        setError(albumsError.message);
        setLoading(false);
        return;
      }

      setAlbums((data as MediaAlbum[]) ?? []);
      setLoading(false);
    };

    loadAlbums();

    return () => {
      cancelled = true;
    };
  }, []);

  return { albums, loading, error };
};
