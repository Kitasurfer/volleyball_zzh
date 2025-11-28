import { useState } from 'react';
import type { MediaFilters, MediaTypeFilter } from '../../../types/admin/media';
import { useLanguage } from '../../../lib/LanguageContext';

interface Props {
  onChange: (filters: MediaFilters) => void;
}

const MediaFilters = ({ onChange }: Props) => {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<MediaFilters>({ search: '', language: 'all', mediaType: 'all' });
  const ui = t.admin.media.filters;

  const languageOptions: Array<{ label: string; value: string | 'all' }> = [
    { label: ui.languageAll, value: 'all' },
    { label: 'DE', value: 'de' },
    { label: 'EN', value: 'en' },
    { label: 'RU', value: 'ru' },
  ];

  const mediaTypeOptions: Array<{ label: string; value: MediaTypeFilter | 'all' }> = [
    { label: ui.mediaAll, value: 'all' },
    { label: ui.mediaImage, value: 'image' },
    { label: ui.mediaVideo, value: 'video' },
    { label: ui.mediaDocument, value: 'document' },
    { label: ui.mediaAudio, value: 'audio' },
    { label: ui.mediaOther, value: 'other' },
  ];

  const updateFilters = (values: Partial<MediaFilters>) => {
    const next = { ...filters, ...values };
    setFilters(next);
    onChange(next);
  };

  return (
    <form className="grid gap-3 md:grid-cols-3">
      <div className="md:col-span-1">
        <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.searchLabel}</label>
        <input
          type="search"
          value={filters.search}
          onChange={(event) => updateFilters({ search: event.target.value })}
          placeholder={ui.searchPlaceholder}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.languageLabel}</label>
        <select
          value={filters.language}
          onChange={(event) => updateFilters({ language: event.target.value as MediaFilters['language'] })}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.mediaTypeLabel}</label>
        <select
          value={filters.mediaType}
          onChange={(event) => updateFilters({ mediaType: event.target.value as MediaFilters['mediaType'] })}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
        >
          {mediaTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
};

export default MediaFilters;
