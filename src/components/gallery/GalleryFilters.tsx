import React from 'react';

interface GalleryFiltersProps {
  filters: Record<string, string>;
  activeFilter: string;
  onFilterChange: (key: string) => void;
}

const GalleryFilters: React.FC<GalleryFiltersProps> = ({ 
  filters, 
  activeFilter, 
  onFilterChange 
}) => (
  <div className="mb-6 border-b border-white/10">
    <nav className="flex gap-6 overflow-x-auto pb-px">
      {Object.entries(filters).map(([key, label]) => {
        const isActive = activeFilter === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onFilterChange(key)}
            className={`relative whitespace-nowrap py-3 text-sm font-medium transition-colors duration-200 ${
              isActive 
                ? 'text-white' 
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            {label}
            {isActive && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-white rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  </div>
);

export default GalleryFilters;
