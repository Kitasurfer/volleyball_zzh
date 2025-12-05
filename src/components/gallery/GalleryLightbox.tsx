import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Download, Info } from 'lucide-react';
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
}) => {
  const [zoom, setZoom] = useState(1);
  const [showInfo, setShowInfo] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const currentImage = images[currentIndex];

  // Reset zoom and loading when image changes
  useEffect(() => {
    setZoom(1);
    setImageLoading(true);
  }, [currentIndex]);

  // Reset zoom when lightbox closes
  useEffect(() => {
    if (!open) {
      setZoom(1);
      setShowInfo(false);
    }
  }, [open]);

  // Scroll thumbnail into view
  useEffect(() => {
    if (thumbnailContainerRef.current && open) {
      const thumbnail = thumbnailContainerRef.current.children[currentIndex] as HTMLElement;
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex, open]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.5, 1));

  const handleDownload = async () => {
    if (!currentImage) return;
    try {
      const response = await fetch(currentImage.src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${currentImage.title.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Touch handlers for swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      onNext();
    }
    if (isRightSwipe) {
      onPrevious();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-full w-full items-center justify-center bg-black/95 p-0">
        <div className="relative flex h-full w-full max-h-screen max-w-screen flex-col items-center justify-center overflow-hidden">
          {/* Top Controls */}
          <div className="absolute left-6 right-6 top-6 z-40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowInfo(!showInfo)}
                className="h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60"
                title="Toggle info"
              >
                <Info className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60"
                title="Download"
              >
                <Download className="h-5 w-5" />
              </Button>
              {zoom === 1 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  className="h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60"
                  title="Zoom in"
                >
                  <ZoomIn className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  className="h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60"
                  title="Zoom out"
                >
                  <ZoomOut className="h-5 w-5" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-white/70">
              <span>
                {currentIndex + 1} / {images.length}
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
          </div>

          {/* Main Image */}
          {currentImage && (
            <figure
              className="relative flex h-full w-full items-center justify-center px-4 py-20"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                </div>
              )}
              <img
                src={currentImage.src}
                alt={currentImage.title}
                onLoad={() => setImageLoading(false)}
                className="max-h-full max-w-full object-contain transition-all duration-300 ease-out"
                style={{
                  transform: `scale(${zoom})`,
                  cursor: zoom > 1 ? 'zoom-out' : 'zoom-in',
                }}
                onClick={() => {
                  if (zoom === 1) handleZoomIn();
                  else handleZoomOut();
                }}
              />

              {/* Info Overlay */}
              {showInfo && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-8 text-white">
                  <h3 className="text-2xl font-semibold">{currentImage.title}</h3>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/60">
                    {currentImage.albumTitle && (
                      <span>Album: {currentImage.albumTitle}</span>
                    )}
                    {currentImage.eventDate && (
                      <span>Date: {new Date(currentImage.eventDate).toLocaleDateString()}</span>
                    )}
                    {currentImage.category && (
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase">
                        {currentImage.category}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {!showInfo && (
                <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-center text-white">
                  <h3 className="text-xl font-semibold">{currentImage.title}</h3>
                  <p className="mt-2 text-xs text-white/60">{navigationHelp}</p>
                </figcaption>
              )}
            </figure>
          )}

          {/* Navigation Arrows */}
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

          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-4 right-4 z-40">
              <div
                ref={thumbnailContainerRef}
                className="flex gap-2 overflow-x-auto rounded-lg bg-black/60 p-3 backdrop-blur-sm scrollbar-hide"
                style={{ scrollbarWidth: 'none' }}
              >
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => {
                      const diff = index - currentIndex;
                      if (diff > 0) {
                        for (let i = 0; i < diff; i++) onNext();
                      } else if (diff < 0) {
                        for (let i = 0; i < Math.abs(diff); i++) onPrevious();
                      }
                    }}
                    className={`flex-shrink-0 overflow-hidden rounded transition-all duration-200 ${
                      index === currentIndex
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-black/60'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={image.src}
                      alt={image.title}
                      className="h-16 w-16 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Custom scrollbar hide */}
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryLightbox;
