import React from 'react';
import { Button } from '../ui';

interface GalleryFiltersProps {
  filters: Record<string, string>;
  activeFilter: string;
  onFilterChange: (key: string) => void;
}

const GalleryFilters: React.FC<GalleryFiltersProps> = ({ filters, activeFilter, onFilterChange }) => (
  <div className="mt-12 flex flex-wrap justify-center gap-3">
    {Object.entries(filters).map(([key, label]) => (
      <Button
        key={key}
        variant={activeFilter === key ? 'accent' : 'ghost'}
        className={`rounded-full border border-white/10 px-5 py-2 text-sm font-semibold transition-all ${
          activeFilter === key ? 'shadow-lg shadow-accent-500/30' : 'text-white/70 hover:text-white'
        }`}
        onClick={() => onFilterChange(key)}
      >
        {label}
      </Button>
    ))}
  </div>
);

export default GalleryFilters;
