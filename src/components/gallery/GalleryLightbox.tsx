import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button, Dialog, DialogClose, DialogContent } from '../ui';
import type { GalleryImage } from '../../hooks/useGalleryImages';

interface GalleryLightboxProps {
  open: boolean;
  images: GalleryImage[];
  currentIndex: number;
  onOpenChange: (open: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
  navigationHelp: string;
}

const GalleryLightbox: React.FC<GalleryLightboxProps> = ({
  open,
  images,
  currentIndex,
  onOpenChange,
  onPrevious,
  onNext,
  navigationHelp,
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex h-full w-full items-center justify-center bg-black/95 p-0">
      <div className="relative flex h-full w-full max-h-screen max-w-screen items-center justify-center overflow-hidden">
        <div className="absolute right-6 top-6 z-40 flex items-center gap-3 text-sm text-white/70">
          <span>
            {currentIndex + 1}/{images.length}
          </span>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
        </div>
        {images[currentIndex] && (
          <figure className="relative flex h-full w-full items-center justify-center">
            <img
              src={images[currentIndex].src}
              alt={images[currentIndex].title}
              className="h-full w-full max-h-screen max-w-screen object-contain"
            />
            <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8 text-center text-white">
              <h3 className="text-2xl font-semibold">{images[currentIndex].title}</h3>
              <p className="mt-3 text-sm text-white/70">{navigationHelp}</p>
            </figcaption>
          </figure>
        )}

        {images.length > 1 && (
          <>
            <div className="absolute left-4 top-1/2 z-30 -translate-y-1/2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrevious}
                className="h-12 w-12 rounded-full border border-white/30 bg-black/40 text-white hover:bg-black/70"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            </div>
            <div className="absolute right-4 top-1/2 z-30 -translate-y-1/2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                className="h-12 w-12 rounded-full border border-white/30 bg-black/40 text-white hover:bg-black/70"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </>
        )}
      </div>
    </DialogContent>
  </Dialog>
);

export default GalleryLightbox;
