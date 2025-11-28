import React from 'react';
import { Maximize2 } from 'lucide-react';
import { Card, CardContent } from '../ui';
import type { GalleryImage } from '../../hooks/useGalleryImages';

interface GalleryGridProps {
  images: GalleryImage[];
  filters: Record<string, string>;
  fullscreenLabel: string;
  onImageOpen: (index: number) => void;
}

const GalleryGrid: React.FC<GalleryGridProps> = ({ images, filters, fullscreenLabel, onImageOpen }) => (
  <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
    {images.map((image, index) => (
      <button
        key={image.src}
        type="button"
        onClick={() => onImageOpen(index)}
        className="group relative block w-full text-left focus:outline-none"
      >
        <Card className="overflow-hidden border-white/5 bg-white/5 backdrop-blur">
          <div className="relative h-64 w-full overflow-hidden">
            <img
              src={image.src}
              alt={image.title}
              className="h-full w-full transform object-cover transition duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 p-4 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="text-base font-semibold">{image.title}</span>
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-white/70">
                <Maximize2 className="h-4 w-4" />
                {fullscreenLabel}
              </span>
            </div>
          </div>
          <CardContent className="flex items-center justify-between bg-black/20 py-4 text-white">
            <span className="text-sm uppercase tracking-wider text-white/60">
              {filters[image.category as keyof typeof filters] ?? image.category}
            </span>
            <span className="text-sm font-medium text-white">{image.title}</span>
          </CardContent>
        </Card>
      </button>
    ))}
  </div>
);

export default GalleryGrid;
