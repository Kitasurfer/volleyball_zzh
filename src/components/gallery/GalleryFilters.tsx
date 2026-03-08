import React from 'react';
import { Trophy, Star, Waves, Zap, MoreHorizontal, Layers, Dumbbell } from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  all: Layers,
  spieltage: Trophy,
  events: Star,
  beach: Waves,
  training: Dumbbell,
  action: Zap,
  other: MoreHorizontal,
};

interface GalleryFiltersProps {
  filters: Record<string, string>;
  activeFilter: string;
  onFilterChange: (key: string) => void;
  counts?: Record<string, number>;
}

const GalleryFilters: React.FC<GalleryFiltersProps> = ({
  filters,
  activeFilter,
  onFilterChange,
  counts,
}) => (
  <div className="mb-8 flex flex-wrap gap-2">
    {Object.entries(filters).map(([key, label]) => {
      const isActive = activeFilter === key;
      const Icon = CATEGORY_ICONS[key] ?? MoreHorizontal;
      const count = counts?.[key];
      return (
        <button
          key={key}
          type="button"
          onClick={() => onFilterChange(key)}
          className={`
            inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold
            transition-all duration-200
            ${isActive
              ? 'border-accent-400 bg-accent-400 text-primary-900 shadow-[0_0_20px_rgba(250,204,21,0.28)]'
              : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white'
            }
          `}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span>{label}</span>
          {count !== undefined && count > 0 && (
            <span
              className={`min-w-[1.2rem] rounded-full text-center text-[10px] font-bold leading-5 ${
                isActive ? 'bg-primary-900/20 text-primary-900' : 'bg-white/12 text-white/55'
              }`}
            >
              {count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export default GalleryFilters;
