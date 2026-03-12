import React from 'react';
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
  if (!albums.length) return null;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {albums.map((album) => {
        const categoryLabel = categoryLabels[album.category] ?? album.category;
        const style = CATEGORY_STYLE[album.category] ?? CATEGORY_STYLE.other;
        const rawTitle = album.title?.trim() ?? '';
        const displayTitle = isFilenameLike(rawTitle) ? null : rawTitle || null;

        return (
          <button
            key={album.id}
            type="button"
            onClick={() => onAlbumOpen(album.id)}
            className="group relative flex h-full flex-col overflow-hidden rounded-[30px] border border-white/8 bg-[#0d1f35] text-left shadow-[0_18px_55px_rgba(0,0,0,0.18)] transition-all duration-500 hover:-translate-y-2.5 hover:border-white/15 hover:shadow-[0_30px_85px_rgba(0,0,0,0.34)] focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 focus:ring-offset-[#0f0f1e]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.08),_transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.015),transparent_24%)] opacity-35 transition duration-500 group-hover:opacity-60" />
            <div className="absolute -right-12 top-8 h-28 w-28 rounded-full bg-white/10 opacity-0 blur-3xl transition duration-700 group-hover:scale-150 group-hover:opacity-60" />
            <div className="relative aspect-[1.34/1] overflow-hidden bg-[#060f1a]">
              {album.coverImage ? (
                <img
                  src={album.coverImage.src}
                  alt={displayTitle ?? categoryLabel}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImagesIcon className="h-10 w-10 text-white/15" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1f35]/58 via-[#0d1f35]/10 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_34%)] opacity-30 transition duration-500 group-hover:opacity-55" />

              <span className="absolute left-4 top-4 text-[10px] font-semibold uppercase tracking-[0.34em] text-white/52 transition duration-500 group-hover:text-white/78">
                {String(albums.indexOf(album) + 1).padStart(2, '0')}
              </span>
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white/90 backdrop-blur-sm">
                <Camera className="h-3 w-3" />
                {album.imageCount}
              </span>
            </div>

            <div className="relative flex flex-1 flex-col gap-2.5 bg-[#0d1f35] p-4">
              <span
                className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] transition duration-300 group-hover:-translate-y-0.5 ${style.bg} ${style.text}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                {categoryLabel}
              </span>

              <div className="min-h-[2.75rem] flex-1">
                {displayTitle ? (
                  <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-white/92 transition duration-300 group-hover:text-white">
                    {displayTitle}
                  </h3>
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-2 text-[10px] font-medium text-white/42 transition duration-300 group-hover:border-white/12 group-hover:text-white/55">
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
                <span className="shrink-0 flex items-center gap-0.5 text-white/32 transition-all duration-300 group-hover:translate-x-1 group-hover:text-white/78">
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
