import { useCallback, useEffect, useMemo, useState } from 'react';
import { hasSupabaseConfig, supabase } from '../lib/supabase';

const FAVORITES_STORAGE_KEY = 'gallery-favorite-images';
const VISITOR_TOKEN_STORAGE_KEY = 'gallery-visitor-token';

const getVisitorToken = (): string => {
  if (typeof window === 'undefined') return 'server';

  try {
    const existing = localStorage.getItem(VISITOR_TOKEN_STORAGE_KEY);
    if (existing) return existing;

    const next = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    localStorage.setItem(VISITOR_TOKEN_STORAGE_KEY, next);
    return next;
  } catch {
    return `visitor-${Date.now()}`;
  }
};

const readFavorites = (): string[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const writeFavorites = (value: string[]) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(value));
  } catch {
    return;
  }
};

interface State {
  likeCounts: Record<string, number>;
  likedImageIds: Set<string>;
  favoriteImageIds: Set<string>;
  loading: boolean;
  error: string | null;
}

export const useGalleryImageEngagement = (imageIds: string[]) => {
  const [state, setState] = useState<State>({
    likeCounts: {},
    likedImageIds: new Set<string>(),
    favoriteImageIds: new Set<string>(readFavorites()),
    loading: false,
    error: null,
  });

  const stableIds = useMemo(() => [...new Set(imageIds)].filter(Boolean), [imageIds]);

  const refresh = useCallback(async () => {
    if (!hasSupabaseConfig || !supabase || stableIds.length === 0) {
      setState((prev) => ({ ...prev, loading: false, error: null }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));
    const visitorToken = getVisitorToken();

    const { data, error } = await supabase
      .from('gallery_image_likes')
      .select('image_id, visitor_token')
      .in('image_id', stableIds);

    if (error) {
      setState((prev) => ({ ...prev, loading: false, error: error.message }));
      return;
    }

    const nextCounts: Record<string, number> = {};
    const nextLiked = new Set<string>();

    (data as { image_id: string; visitor_token: string }[] | null)?.forEach((row) => {
      nextCounts[row.image_id] = (nextCounts[row.image_id] ?? 0) + 1;
      if (row.visitor_token === visitorToken) {
        nextLiked.add(row.image_id);
      }
    });

    setState((prev) => ({
      ...prev,
      likeCounts: nextCounts,
      likedImageIds: nextLiked,
      loading: false,
      error: null,
    }));
  }, [stableIds]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleLike = useCallback(async (imageId: string) => {
    if (!hasSupabaseConfig || !supabase) {
      setState((prev) => ({ ...prev, error: 'Supabase is not configured.' }));
      return;
    }

    const visitorToken = getVisitorToken();
    const isLiked = state.likedImageIds.has(imageId);

    if (isLiked) {
      const { error } = await supabase
        .from('gallery_image_likes')
        .delete()
        .eq('image_id', imageId)
        .eq('visitor_token', visitorToken);

      if (error) {
        setState((prev) => ({ ...prev, error: error.message }));
        return;
      }
    } else {
      const { error } = await supabase
        .from('gallery_image_likes')
        .insert({ image_id: imageId, visitor_token: visitorToken });

      if (error) {
        setState((prev) => ({ ...prev, error: error.message }));
        return;
      }
    }

    await refresh();
  }, [refresh, state.likedImageIds]);

  const toggleFavorite = useCallback((imageId: string) => {
    setState((prev) => {
      const next = new Set(prev.favoriteImageIds);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        next.add(imageId);
      }

      writeFavorites([...next]);

      return {
        ...prev,
        favoriteImageIds: next,
      };
    });
  }, []);

  return {
    likeCounts: state.likeCounts,
    likedImageIds: state.likedImageIds,
    favoriteImageIds: state.favoriteImageIds,
    loading: state.loading,
    error: state.error,
    refresh,
    toggleLike,
    toggleFavorite,
  };
};
