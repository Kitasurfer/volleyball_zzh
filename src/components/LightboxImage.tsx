import React, { useState } from 'react';
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
      <DialogContent className="flex max-h-screen max-w-[96vw] items-center justify-center border-none bg-black/95 p-0">
        <img
          src={src}
          alt={alt}
          className="max-h-[90vh] w-auto max-w-full object-contain"
        />
      </DialogContent>
    </Dialog>
  );
};
