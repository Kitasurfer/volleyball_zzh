import React from 'react';

interface GalleryHeroProps {
  title: string;
  description: string;
}

const GalleryHero: React.FC<GalleryHeroProps> = ({ title, description }) => (
  <div className="mx-auto max-w-3xl text-center">
    <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">{title}</h1>
    <p className="mt-4 text-base text-white/70 lg:text-lg">{description}</p>
  </div>
);

export default GalleryHero;
