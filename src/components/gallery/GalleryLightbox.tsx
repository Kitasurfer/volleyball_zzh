import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Download, Heart, Star, Share2 } from 'lucide-react';
import { Button, Dialog, DialogClose, DialogContent } from '../ui';
import type { GalleryImage } from '../../hooks/useGalleryImages';

const isFilenameLike = (value: string) =>
  /\.(?:jpg|jpeg|png|webp|gif|bmp|avif|heic)$/i.test(value.trim());

type LocationBlock = {
  title: string;
  addressLabel: string;
  address: string;
  mapLabel: string;
  mapEmbed: string;
  mapLink: string;
  cta: string;
};

type GalleryLightboxLabels = {
  close: string;
  download: string;
  zoomIn: string;
  zoomOut: string;
  previous: string;
  next: string;
  share: string;
  like: string;
  unlike: string;
  favorite: string;
  unfavorite: string;
  featured: string;
  bestOf: string;
  photoCounter: string;
  untitled: string;
  showMap: string;
  hideMap: string;
};

interface GalleryLightboxProps {
  open: boolean;
  images: GalleryImage[];
  currentIndex: number;
  onOpenChange: (open: boolean) => void;
  onPrevious: () => void;
  onNext: () => void;
  navigationHelp: string;
  locationBlock?: LocationBlock | null;
  // Engagement
  onLike?: (imageId: string) => Promise<void> | void;
  onFavorite?: (imageId: string) => void;
  onShare?: (image: GalleryImage) => void;
  likedImageIds?: Set<string>;
  favoriteImageIds?: Set<string>;
  likeCounts?: Record<string, number>;
  labels?: Partial<GalleryLightboxLabels>;
}

const GalleryLightbox: React.FC<GalleryLightboxProps> = ({
  open,
  images,
  currentIndex,
  onOpenChange,
  onPrevious,
  onNext,
  navigationHelp,
  locationBlock,
  onLike,
  onFavorite,
  onShare,
  likedImageIds,
  favoriteImageIds,
  likeCounts,
  labels,
}) => {
  const [zoom, setZoom] = useState(1);
  const [imageLoading, setImageLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isLocationCollapsed, setIsLocationCollapsed] = useState(true);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const currentImage = images[currentIndex];
  const hasEngagement = Boolean(onLike || onFavorite || onShare);
  const hasThumbnails = images.length > 1;
  const text: GalleryLightboxLabels = {
    close: 'Close',
    download: 'Download',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    previous: 'Previous',
    next: 'Next',
    share: 'Share',
    like: 'Like',
    unlike: 'Unlike',
    favorite: 'Save favorite',
    unfavorite: 'Remove favorite',
    featured: 'Featured',
    bestOf: 'Top',
    photoCounter: 'Photo',
    untitled: 'Photo',
    showMap: 'Show map',
    hideMap: 'Hide map',
    ...labels,
  };

  useEffect(() => {
    setZoom(1);
    setImageLoading(true);
  }, [currentIndex]);

  useEffect(() => {
    if (!open) setZoom(1);
  }, [open]);

  useEffect(() => {
    if (thumbnailContainerRef.current && open) {
      const thumbnail = thumbnailContainerRef.current.children[currentIndex] as HTMLElement;
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex, open]);

  useEffect(() => {
    if (isLocationCollapsed) setIsMapOpen(false);
  }, [isLocationCollapsed]);

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
      const fileNameBase = (currentImage.title || currentImage.subalbumTitle || currentImage.albumTitle || text.untitled)
        .replace(/\s+/g, '_')
        .replace(/[^\w\-]+/g, '_');
      link.download = `${fileNameBase || 'gallery_photo'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

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
    if (distance > minSwipeDistance) onNext();
    if (distance < -minSwipeDistance) onPrevious();
  };

  // Bottom offset: thumbnails (5rem) + engagement bar (3.5rem) + gap
  const bottomOffset = hasThumbnails && hasEngagement
    ? '9.5rem'
    : hasThumbnails
    ? '5.5rem'
    : hasEngagement
    ? '4rem'
    : '1.5rem';

  const isLiked = currentImage ? Boolean(likedImageIds?.has(currentImage.id)) : false;
  const isFavorite = currentImage ? Boolean(favoriteImageIds?.has(currentImage.id)) : false;
  const likeCount = currentImage ? (likeCounts?.[currentImage.id] ?? 0) : 0;
  const rawTitle = currentImage?.title?.trim() ?? '';
  const safeTitle = rawTitle && !isFilenameLike(rawTitle) ? rawTitle : '';
  const rawCaption = currentImage?.caption?.trim() ?? '';
  const safeCaption = rawCaption && !isFilenameLike(rawCaption) ? rawCaption : '';
  const displayTitle = safeTitle || currentImage?.subalbumTitle || currentImage?.albumTitle || text.untitled;
  const displayCaption = safeCaption && safeCaption !== safeTitle ? safeCaption : null;
  const displayMeta = [
    currentImage?.subalbumTitle || currentImage?.albumTitle || null,
    currentImage?.eventDate
      ? new Date(currentImage.eventDate).toLocaleDateString()
      : null,
  ].filter(Boolean).join(' • ');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-full w-full items-center justify-center bg-black/96 p-0">
        <div className="relative flex h-full w-full max-h-screen max-w-screen flex-col items-center justify-center overflow-hidden">

          {/* Top controls */}
          <div className="absolute left-4 right-4 top-4 z-40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="h-10 w-10 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                title={text.download}
                aria-label={text.download}
              >
                <Download className="h-4.5 w-4.5" />
              </Button>
              {zoom === 1 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomIn}
                  className="h-10 w-10 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                  title={text.zoomIn}
                  aria-label={text.zoomIn}
                >
                  <ZoomIn className="h-4.5 w-4.5" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleZoomOut}
                  className="h-10 w-10 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                  title={text.zoomOut}
                  aria-label={text.zoomOut}
                >
                  <ZoomOut className="h-4.5 w-4.5" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-black/40 px-3 py-1 text-sm font-medium text-white/70 backdrop-blur-sm">
                {text.photoCounter} {currentIndex + 1} / {images.length}
              </span>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                  aria-label={text.close}
                >
                  <X className="h-5 w-5" />
                </Button>
              </DialogClose>
            </div>
          </div>

          {/* Main image */}
          {currentImage && (
            <figure
              className="relative flex h-full w-full items-center justify-center px-16 py-24"
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
                alt={displayTitle}
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
              <figcaption className="sr-only">{navigationHelp}</figcaption>
            </figure>
          )}

          {currentImage && (
            <div className="pointer-events-none absolute inset-x-3 bottom-24 z-20 sm:inset-x-4 sm:bottom-24 md:left-6 md:right-auto md:max-w-[420px]">
              <div className="rounded-2xl border border-white/10 bg-black/55 px-4 py-3 shadow-2xl backdrop-blur-md">
                <div className="flex flex-wrap items-center gap-2">
                  {currentImage.isBestOfTournament && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                      <Star className="h-3 w-3" />
                      {text.bestOf}
                    </span>
                  )}
                  {currentImage.isFeatured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                      <Star className="h-3 w-3" />
                      {text.featured}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                  {displayMeta || currentImage.albumTitle || text.untitled}
                </div>
                <div className="mt-1 text-base font-semibold leading-snug text-white sm:text-lg">
                  {displayTitle}
                </div>
                {displayCaption && (
                  <div className="mt-1 text-sm leading-6 text-white/70">
                    {displayCaption}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location block */}
          {locationBlock && (
            <>
              {isLocationCollapsed && (
                <div className="absolute z-30" style={{ bottom: bottomOffset, right: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsLocationCollapsed(false)}
                    className="inline-flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-sm font-semibold text-white shadow-lg ring-1 ring-white/20 backdrop-blur"
                  >
                    {locationBlock.mapLabel || text.showMap}
                  </button>
                </div>
              )}

              {!isLocationCollapsed && (
                <div
                  className="absolute left-4 z-30 mx-auto w-[340px] max-w-[92vw] space-y-3 rounded-xl border border-white/15 bg-black/75 p-4 shadow-xl backdrop-blur"
                  style={{ bottom: bottomOffset }}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-1">
                      <h3 className="text-lg font-semibold text-white">{locationBlock.title}</h3>
                      <p className="text-[11px] uppercase tracking-wide text-white/55">{locationBlock.addressLabel}</p>
                      <p className="text-sm font-medium leading-snug text-white">{locationBlock.address}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsLocationCollapsed(true)}
                      className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
                    >
                      ×
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={locationBlock.mapLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-accent-300 transition-colors hover:text-accent-100"
                    >
                      {locationBlock.cta} →
                    </a>
                    <button
                      type="button"
                      onClick={() => setIsMapOpen((prev) => !prev)}
                      className="ml-auto inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/20"
                    >
                      {isMapOpen ? text.hideMap : (locationBlock.mapLabel || text.showMap)}
                    </button>
                  </div>
                  {isMapOpen && (
                    <div className="h-36 w-full overflow-hidden rounded-lg border border-white/10 bg-black/40">
                      <iframe
                        src={locationBlock.mapEmbed}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={locationBlock.title}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <div className="absolute left-3 top-1/2 z-30 hidden -translate-y-1/2 sm:block">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPrevious}
                  className="h-12 w-12 rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-sm hover:bg-black/75"
                  aria-label={text.previous}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              </div>
              <div className="absolute right-3 top-1/2 z-30 hidden -translate-y-1/2 sm:block">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNext}
                  className="h-12 w-12 rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-sm hover:bg-black/75"
                  aria-label={text.next}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </>
          )}

          {images.length > 1 && (
            <div className="absolute inset-x-3 bottom-[5.4rem] z-30 flex items-center justify-between sm:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrevious}
                className="h-11 w-11 rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-sm hover:bg-black/75"
                aria-label={text.previous}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                className="h-11 w-11 rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-sm hover:bg-black/75"
                aria-label={text.next}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Engagement bar */}
          {hasEngagement && currentImage && (
            <div
              className="absolute left-1/2 z-40 -translate-x-1/2"
              style={{ bottom: hasThumbnails ? '5.25rem' : '1.25rem' }}
            >
              <div className="flex items-center gap-1 rounded-full border border-white/15 bg-black/70 px-3 py-2 shadow-xl backdrop-blur-md">
                {onLike && (
                  <button
                    type="button"
                    onClick={() => void onLike(currentImage.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-200 ${
                      isLiked
                        ? 'bg-rose-500 text-white shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                        : 'text-white/75 hover:bg-white/10 hover:text-white'
                    }`}
                    aria-label={isLiked ? text.unlike : text.like}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">{isLiked ? text.unlike : text.like}</span>
                    <span>{likeCount > 0 ? likeCount : ''}</span>
                  </button>
                )}

                {onFavorite && (
                  <button
                    type="button"
                    onClick={() => onFavorite(currentImage.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-all duration-200 ${
                      isFavorite
                        ? 'bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                        : 'text-white/75 hover:bg-white/10 hover:text-white'
                    }`}
                    aria-label={isFavorite ? text.unfavorite : text.favorite}
                  >
                    <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">{isFavorite ? text.unfavorite : text.favorite}</span>
                  </button>
                )}

                {onShare && (
                  <button
                    type="button"
                    onClick={() => onShare(currentImage)}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                    aria-label={text.share}
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">{text.share}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-3 right-3 z-40">
              <div
                ref={thumbnailContainerRef}
                className="flex gap-1.5 overflow-x-auto rounded-xl bg-black/65 p-2.5 backdrop-blur-sm"
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
                    className={`flex-shrink-0 overflow-hidden rounded-lg transition-all duration-200 ${
                      index === currentIndex
                        ? 'ring-2 ring-accent-400 ring-offset-1 ring-offset-black/60'
                        : 'opacity-45 hover:opacity-80'
                    }`}
                  >
                    <img
                      src={image.src}
                      alt={image.title}
                      className="h-14 w-14 object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryLightbox;
