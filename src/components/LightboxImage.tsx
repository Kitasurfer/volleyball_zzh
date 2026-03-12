import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent } from './ui';

interface LightboxImageProps {
  src: string;
  alt: string;
  className?: string;
  wrapperClassName?: string;
}

export const LightboxImage: React.FC<LightboxImageProps> = ({
  src,
  alt,
  className,
  wrapperClassName,
}) => {
  const [open, setOpen] = useState(false);

  const wrapperClasses = [
    'relative cursor-zoom-in',
    'transition-transform duration-200 hover:scale-[1.01]',
    wrapperClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={wrapperClasses} aria-label={alt}>
          <img src={src} alt={alt} className={className} />
          <span className="pointer-events-none absolute inset-0 rounded-lg bg-black/10 opacity-0 transition-opacity duration-200 hover:opacity-100" />
        </button>
      </DialogTrigger>
      <DialogContent className="h-[100dvh] w-screen max-w-none border-none bg-black p-0">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/70 p-2 text-white shadow-lg transition-colors hover:bg-black/85 sm:right-4 sm:top-4"
          aria-label={alt}
        >
          <X className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex h-full w-full items-center justify-center bg-black px-0 py-0 focus:outline-none sm:px-4 sm:py-4"
          aria-label={alt}
        >
          <img
            src={src}
            alt={alt}
            className="h-auto max-h-[100dvh] w-auto max-w-[100vw] object-contain cursor-zoom-out sm:max-h-[calc(100dvh-2rem)] sm:max-w-[calc(100vw-2rem)]"
          />
        </button>
      </DialogContent>
    </Dialog>
  );
};
