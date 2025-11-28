import React from 'react';

interface TrainingHeroProps {
  title: string;
  description: string;
}

export const TrainingHero: React.FC<TrainingHeroProps> = ({ title, description }) => (
  <div className="text-center mb-12">
    <h1 className="text-h1 font-bold text-primary-900 mb-4">{title}</h1>
    <p className="text-body-lg text-neutral-700">{description}</p>
    <div className="w-24 h-1 bg-accent-500 mx-auto mt-6" />
  </div>
);
