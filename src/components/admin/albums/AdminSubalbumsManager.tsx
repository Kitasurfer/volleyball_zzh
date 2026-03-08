import { useEffect, useMemo, useState } from 'react';
import { SUPPORTED_LANGUAGES, type Language } from '../../../types';
import { useLanguage } from '../../../lib/LanguageContext';
import { AdminAlert } from '../common/AdminAlert';
import {
  useAdminAlbumSubalbums,
  type AdminSubalbumItem,
  type AdminSubalbumTranslationState,
} from '../../../hooks/useAdminAlbumSubalbums';

interface Props {
  albumId: string | 'new';
}

const emptyTranslations = (): AdminSubalbumTranslationState => ({
  de: { title: '', subtitle: '', description: '' },
  en: { title: '', subtitle: '', description: '' },
  ru: { title: '', subtitle: '', description: '' },
  it: { title: '', subtitle: '', description: '' },
});

const AdminSubalbumsManager = ({ albumId }: Props) => {
  const { language } = useLanguage();
  const { items, loading, saving, error, success, loadSubalbums, saveSubalbum } = useAdminAlbumSubalbums();
  const [selectedId, setSelectedId] = useState<string>('new');
  const [slug, setSlug] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('published');
  const [activeLang, setActiveLang] = useState<Language>('de');
  const [translations, setTranslations] = useState<AdminSubalbumTranslationState>(emptyTranslations);

  const ui = useMemo(() => ({
    de: {
      title: 'Unteralben',
      subtitle: 'Verwalten Sie echte Unteralben innerhalb des ausgewählten Galerie-Albums.',
      empty: 'Wählen Sie zuerst ein gespeichertes Album aus.',
      listTitle: 'Unteralbum-Liste',
      formTitle: 'Unteralbum-Details',
      newLabel: '+ Neues Unteralbum',
      slug: 'Slug',
      date: 'Datum',
      order: 'Reihenfolge',
      status: 'Status',
      draft: 'Entwurf',
      published: 'Veröffentlicht',
      archived: 'Archiviert',
      translations: 'Übersetzungen',
      save: 'Unteralbum speichern',
      saving: 'Speichern…',
    },
    en: {
      title: 'Subalbums',
      subtitle: 'Manage real subalbums inside the selected gallery album.',
      empty: 'Select a saved album first.',
      listTitle: 'Subalbum list',
      formTitle: 'Subalbum details',
      newLabel: '+ New subalbum',
      slug: 'Slug',
      date: 'Date',
      order: 'Order',
      status: 'Status',
      draft: 'Draft',
      published: 'Published',
      archived: 'Archived',
      translations: 'Translations',
      save: 'Save subalbum',
      saving: 'Saving…',
    },
    ru: {
      title: 'Подальбомы',
      subtitle: 'Управляйте настоящими подальбомами внутри выбранного альбома галереи.',
      empty: 'Сначала выберите уже сохранённый альбом.',
      listTitle: 'Список подальбомов',
      formTitle: 'Данные подальбома',
      newLabel: '+ Новый подальбом',
      slug: 'Slug',
      date: 'Дата',
      order: 'Порядок',
      status: 'Статус',
      draft: 'Черновик',
      published: 'Опубликован',
      archived: 'Архив',
      translations: 'Переводы',
      save: 'Сохранить подальбом',
      saving: 'Сохраняем…',
    },
    it: {
      title: 'Sottoalbum',
      subtitle: 'Gestisci veri sottoalbum all’interno dell’album selezionato.',
      empty: 'Seleziona prima un album già salvato.',
      listTitle: 'Elenco sottoalbum',
      formTitle: 'Dettagli sottoalbum',
      newLabel: '+ Nuovo sottoalbum',
      slug: 'Slug',
      date: 'Data',
      order: 'Ordine',
      status: 'Stato',
      draft: 'Bozza',
      published: 'Pubblicato',
      archived: 'Archiviato',
      translations: 'Traduzioni',
      save: 'Salva sottoalbum',
      saving: 'Salvataggio…',
    },
  })[language], [language]);

  useEffect(() => {
    if (albumId === 'new') return;
    void loadSubalbums(albumId);
  }, [albumId, loadSubalbums]);

  const selectItem = (item: AdminSubalbumItem | null) => {
    if (!item) {
      setSelectedId('new');
      setSlug('');
      setEventDate('');
      setSortOrder(0);
      setStatus('published');
      setActiveLang('de');
      setTranslations(emptyTranslations());
      return;
    }

    setSelectedId(item.id);
    setSlug(item.slug);
    setEventDate(item.eventDate);
    setSortOrder(item.sortOrder);
    setStatus(item.status as 'draft' | 'published' | 'archived');
    setTranslations(item.translations);
  };

  if (albumId === 'new') {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-500">
        {ui.empty}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{ui.title}</h3>
            <p className="mt-1 text-xs text-neutral-500">{ui.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => selectItem(null)}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            {ui.newLabel}
          </button>
        </div>
        <div className="max-h-[360px] overflow-y-auto rounded-lg border border-neutral-200 bg-white">
          {loading ? (
            <div className="p-3 text-xs text-neutral-500">Loading…</div>
          ) : (
            <ul className="divide-y divide-neutral-100 text-sm">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => selectItem(item)}
                    className={`flex w-full flex-col items-start px-3 py-2 text-left hover:bg-neutral-50 ${selectedId === item.id ? 'bg-primary-50' : ''}`}
                  >
                    <span className="font-medium text-neutral-900">{item.translations[activeLang]?.title || item.slug}</span>
                    <span className="text-xs text-neutral-500">{item.slug} • {item.eventDate || '—'}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <form
        className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 md:col-span-2"
        onSubmit={async (event) => {
          event.preventDefault();
          await saveSubalbum({
            id: selectedId === 'new' ? undefined : selectedId,
            albumId,
            slug,
            eventDate,
            sortOrder,
            status,
            translations,
          });
        }}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{ui.formTitle}</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.slug}</label>
            <input
              type="text"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.date}</label>
            <input
              type="date"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.order}</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(Number(event.target.value))}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.status}</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as 'draft' | 'published' | 'archived')}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
            >
              <option value="draft">{ui.draft}</option>
              <option value="published">{ui.published}</option>
              <option value="archived">{ui.archived}</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{ui.translations}</h4>
            <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 p-0.5">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLang(lang)}
                  className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${activeLang === lang ? 'rounded-full bg-primary-500 text-white shadow-sm' : 'text-neutral-600'}`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-neutral-100 bg-neutral-50 p-3">
            <input
              type="text"
              value={translations[activeLang].title}
              onChange={(event) => setTranslations((prev) => ({ ...prev, [activeLang]: { ...prev[activeLang], title: event.target.value } }))}
              placeholder="Title"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
            />
            <input
              type="text"
              value={translations[activeLang].subtitle}
              onChange={(event) => setTranslations((prev) => ({ ...prev, [activeLang]: { ...prev[activeLang], subtitle: event.target.value } }))}
              placeholder="Subtitle"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
            />
            <textarea
              value={translations[activeLang].description}
              onChange={(event) => setTranslations((prev) => ({ ...prev, [activeLang]: { ...prev[activeLang], description: event.target.value } }))}
              placeholder="Description"
              rows={4}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
            />
          </div>
        </div>

        {error && <AdminAlert variant="error" size="sm">{error}</AdminAlert>}
        {success && <AdminAlert variant="success" size="sm">{success}</AdminAlert>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {saving ? ui.saving : ui.save}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSubalbumsManager;
