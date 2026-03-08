import React, { useState } from 'react';
import { Camera, Calendar, Images as ImagesIcon, ChevronRight } from 'lucide-react';
import type { GalleryAlbum } from '../../hooks/useGalleryImages';

// Matches any string that ends with an image extension (covers WhatsApp names with dots like 19.49.19)
const isFilenameLike = (s: string) =>
  /\.(?:jpg|jpeg|png|webp|gif|bmp|avif|heic)$/i.test(s.trim());

const CATEGORY_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  spieltage: { bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-300', dot: 'bg-amber-400' },
  events:    { bg: 'bg-sky-500/20 border-sky-500/40',     text: 'text-sky-300',   dot: 'bg-sky-400'   },
  beach:     { bg: 'bg-teal-500/20 border-teal-500/40',   text: 'text-teal-300',  dot: 'bg-teal-400'  },
  training:  { bg: 'bg-violet-500/20 border-violet-500/40', text: 'text-violet-300', dot: 'bg-violet-400' },
  action:    { bg: 'bg-rose-500/20 border-rose-500/40',   text: 'text-rose-300',  dot: 'bg-rose-400'  },
  other:     { bg: 'bg-neutral-500/20 border-neutral-500/30', text: 'text-neutral-300', dot: 'bg-neutral-400' },
};

interface GalleryAlbumGridProps {
  albums: GalleryAlbum[];
  categoryLabels: Record<string, string>;
  dateLocale: string;
  seasonLabel: string;
  eventLabel: string;
  photosLabel: string;
  onAlbumOpen: (albumId: string) => void;
}

const GalleryAlbumGrid: React.FC<GalleryAlbumGridProps> = ({
  albums,
  categoryLabels,
  dateLocale,
  seasonLabel,
  photosLabel,
  onAlbumOpen,
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  if (!albums.length) return null;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {albums.map((album) => {
        const isLoaded = loadedImages.has(album.id);
        const categoryLabel = categoryLabels[album.category] ?? album.category;
        const style = CATEGORY_STYLE[album.category] ?? CATEGORY_STYLE.other;
        const rawTitle = album.title?.trim() ?? '';
        const displayTitle = isFilenameLike(rawTitle) ? null : rawTitle || null;

        return (
          <button
            key={album.id}
            type="button"
            onClick={() => onAlbumOpen(album.id)}
            className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-white/8 bg-[#0d1f35] text-left shadow-[0_16px_50px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-1.5 hover:border-white/15 hover:shadow-[0_22px_55px_rgba(0,0,0,0.32)] focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 focus:ring-offset-[#0f0f1e]"
          >
            {/* Image */}
            <div className="relative aspect-[1.34/1] overflow-hidden bg-[#060f1a]">
              {!isLoaded && album.coverImage && (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#0d1f35] to-[#060f1a]" />
              )}
              {album.coverImage ? (
                <img
                  src={album.coverImage.src}
                  alt={displayTitle ?? categoryLabel}
                  loading="lazy"
                  onLoad={() => setLoadedImages((prev) => new Set(prev).add(album.id))}
                  className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06] ${
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImagesIcon className="h-10 w-10 text-white/15" />
                </div>
              )}

              {/* Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1f35]/80 via-transparent to-transparent" />

              {/* Photo count – top right */}
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
                <Camera className="h-3 w-3" />
                {album.imageCount}
              </span>
            </div>

            {/* Card footer */}
            <div className="flex flex-1 flex-col gap-2.5 bg-[#0d1f35] p-4">
              {/* Category badge */}
              <span
                className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${style.bg} ${style.text}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                {categoryLabel}
              </span>

              {/* Title or empty spacer */}
              <div className="min-h-[2.75rem] flex-1">
                {displayTitle ? (
                  <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-white/92">
                    {displayTitle}
                  </h3>
                ) : null}
              </div>

              {/* Meta row */}
              <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-2 text-[10px] font-medium text-white/42">
                <span className="flex min-w-0 items-center gap-1 truncate">
                  {album.eventDate ? (
                    <>
                      <Calendar className="h-3 w-3" />
                      {new Date(album.eventDate).toLocaleDateString(dateLocale, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </>
                  ) : album.season ? (
                    `${seasonLabel} ${album.season}`
                  ) : null}
                </span>
                <span className="shrink-0 flex items-center gap-0.5 text-white/32 transition-colors group-hover:text-white/70">
                  {photosLabel}
                  <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default GalleryAlbumGrid;
