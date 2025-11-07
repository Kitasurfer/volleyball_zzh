import { useState } from 'react';
import type { ChatSessionFilters } from '../../../types/admin/chat';

interface Props {
  onChange: (filters: ChatSessionFilters) => void;
}

const languageOptions: Array<{ label: string; value: string | 'all' }> = [
  { label: 'All languages', value: 'all' },
  { label: 'DE', value: 'de' },
  { label: 'EN', value: 'en' },
  { label: 'RU', value: 'ru' },
];

const ChatSessionsFilters = ({ onChange }: Props) => {
  const [filters, setFilters] = useState<ChatSessionFilters>({ search: '', language: 'all' });

  const updateFilters = (values: Partial<ChatSessionFilters>) => {
    const next = { ...filters, ...values };
    setFilters(next);
    onChange(next);
  };

  return (
    <form className="grid gap-3 md:grid-cols-3">
      <div className="md:col-span-2">
        <label className="block text-xs font-semibold uppercase text-neutral-500">Search</label>
        <input
          type="search"
          value={filters.search}
          onChange={(event) => updateFilters({ search: event.target.value })}
          placeholder="User hash or session ID…"
          className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-neutral-500">Language</label>
        <select
          value={filters.language}
          onChange={(event) => updateFilters({ language: event.target.value as ChatSessionFilters['language'] })}
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

export default ChatSessionsFilters;
