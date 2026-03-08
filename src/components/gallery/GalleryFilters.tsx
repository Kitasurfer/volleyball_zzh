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
            inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-[0_8px_24px_rgba(0,0,0,0.14)] backdrop-blur-sm
            transition-all duration-200
            ${isActive
              ? 'border-accent-400 bg-accent-400 text-primary-900 shadow-[0_0_20px_rgba(250,204,21,0.28)]'
              : 'border-slate-300/70 bg-white/90 text-slate-700 hover:-translate-y-0.5 hover:border-primary-300 hover:bg-white hover:text-slate-900 hover:shadow-[0_12px_28px_rgba(0,0,0,0.16)]'
            }
          `}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span>{label}</span>
          {count !== undefined && count > 0 && (
            <span
              className={`min-w-[1.2rem] rounded-full text-center text-[10px] font-bold leading-5 ${
                isActive ? 'bg-primary-900/20 text-primary-900' : 'bg-slate-200 text-slate-700'
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
