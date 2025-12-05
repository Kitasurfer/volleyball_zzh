import React, { useState } from 'react';
import { Images as ImagesIcon, Play } from 'lucide-react';
import type { GalleryAlbum } from '../../hooks/useGalleryImages';

interface GalleryAlbumGridProps {
  albums: GalleryAlbum[];
  title?: string;
  subtitle?: string;
  eventLabel: string;
  photosLabel: string;
  onAlbumOpen: (albumId: string) => void;
}

const GalleryAlbumGrid: React.FC<GalleryAlbumGridProps> = ({
  albums,
  eventLabel,
  photosLabel,
  onAlbumOpen,
}) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());

  if (!albums.length) return null;

  const handleImageLoad = (albumId: string) => {
    setLoadedImages((prev) => new Set(prev).add(albumId));
  };

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {albums.map((album) => {
        const isLoaded = loadedImages.has(album.id);
        return (
          <button
            key={album.id}
            type="button"
            onClick={() => onAlbumOpen(album.id)}
            className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 focus:ring-offset-primary-900"
          >
            {/* Image */}
            {!isLoaded && album.coverImage && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-neutral-700 to-neutral-800" />
            )}
            {album.coverImage ? (
              <img
                src={album.coverImage.src}
                alt={album.title}
                loading="lazy"
                onLoad={() => handleImageLoad(album.id)}
                className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                  isLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-800 to-primary-900">
                <ImagesIcon className="h-12 w-12 text-white/20" />
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Play icon on hover */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                <Play className="h-6 w-6 text-white fill-white ml-1" />
              </div>
            </div>

            {/* Content */}
            <div className="absolute inset-x-0 bottom-0 p-4">
              {/* Category badge */}
              <span className="inline-block rounded-full bg-accent-500/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white mb-2">
                {album.category}
              </span>
              
              {/* Title */}
              <h3 className="text-lg font-bold text-white leading-tight mb-2">
                {album.title}
              </h3>

              {/* Meta info */}
              <div className="flex items-center gap-4 text-xs text-white/70">
                {album.eventDate && (
                  <span>
                    {new Date(album.eventDate).toLocaleDateString('de-DE', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <ImagesIcon className="h-3.5 w-3.5" />
                  {album.imageCount} {photosLabel}
                </span>
              </div>
            </div>

            {/* Hover border effect */}
            <div className="absolute inset-0 rounded-xl border-2 border-transparent transition-colors duration-300 group-hover:border-accent-400/50" />
          </button>
        );
      })}
    </div>
  );
};

export default GalleryAlbumGrid;
