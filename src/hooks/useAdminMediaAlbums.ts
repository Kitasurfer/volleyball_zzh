import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { MediaAlbum, MediaSubalbum } from '../types/admin/media';

interface UseAdminMediaAlbumsResult {
  albums: MediaAlbum[];
  subalbums: MediaSubalbum[];
  loading: boolean;
  error: string | null;
}

export const useAdminMediaAlbums = (): UseAdminMediaAlbumsResult => {
  const [albums, setAlbums] = useState<MediaAlbum[]>([]);
  const [subalbums, setSubalbums] = useState<MediaSubalbum[]>([]);
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
        setSubalbums([]);
        setError(albumsError.message);
        setLoading(false);
        return;
      }

      const nextAlbums = (data as MediaAlbum[]) ?? [];

      const { data: subalbumData, error: subalbumsError } = await supabase
        .from('gallery_subalbums')
        .select('id, album_id, slug')
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (subalbumsError) {
        console.error('Failed to load gallery subalbums', subalbumsError.message);
        setAlbums(nextAlbums);
        setSubalbums([]);
        setError(subalbumsError.message);
        setLoading(false);
        return;
      }

      const nextSubalbums = ((subalbumData as { id: string; album_id: string; slug: string }[] | null) ?? []).map((subalbum) => ({
        id: subalbum.id,
        albumId: subalbum.album_id,
        slug: subalbum.slug,
        title: subalbum.slug,
      }));

      setAlbums(nextAlbums);
      setSubalbums(nextSubalbums);
      setLoading(false);
    };

    loadAlbums();

    return () => {
      cancelled = true;
    };
  }, []);

  return { albums, subalbums, loading, error };
};
