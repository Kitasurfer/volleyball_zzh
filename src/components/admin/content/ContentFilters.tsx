import { useState } from 'react';
import type { ContentFilters, ContentStatus } from '../../../types/admin/content';

interface Props {
  onChange: (filters: ContentFilters) => void;
}

const statusOptions: Array<{ label: string; value: ContentStatus | 'all' }> = [
  { label: 'All statuses', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'In Review', value: 'review' },
  { label: 'Published', value: 'published' },
];

const languageOptions: Array<{ label: string; value: string | 'all' }> = [
  { label: 'All languages', value: 'all' },
  { label: 'DE', value: 'de' },
  { label: 'EN', value: 'en' },
  { label: 'RU', value: 'ru' },
];

const ContentFilters = ({ onChange }: Props) => {
  const [filters, setFilters] = useState<ContentFilters>({
    search: '',
    status: 'all',
    language: 'all',
  });

  const updateFilters = (values: Partial<ContentFilters>) => {
    const next = { ...filters, ...values };
    setFilters(next);
    onChange(next);
  };

  return (
    <form className="grid gap-3 md:grid-cols-3">
      <div className="md:col-span-1">
        <label className="block text-xs font-semibold uppercase text-neutral-500">Search</label>
        <input
          type="search"
          value={filters.search}
          onChange={(event) => updateFilters({ search: event.target.value })}
          placeholder="Title or ID…"
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-neutral-500">Status</label>
        <select
          value={filters.status}
          onChange={(event) => updateFilters({ status: event.target.value as ContentFilters['status'] })}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-neutral-500">Language</label>
        <select
          value={filters.language}
          onChange={(event) => updateFilters({ language: event.target.value as ContentFilters['language'] })}
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
        >
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
};

export default ContentFilters;
