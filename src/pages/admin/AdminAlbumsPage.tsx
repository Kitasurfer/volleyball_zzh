import { useAdminAlbums, LANGUAGES } from '../../hooks/useAdminAlbums';
import AdminAlbumsList from '../../components/admin/albums/AdminAlbumsList';
import { useLanguage } from '../../lib/LanguageContext';
import { AdminAlert } from '../../components/admin/common/AdminAlert';

const AdminAlbumsPage = () => {
  const { t } = useLanguage();
  const admin = t.admin.albums;
  const {
    albums,
    selectedId,
    slug,
    category,
    season,
    status,
    eventDate,
    translations,
    activeLang,
    loading,
    saving,
    error,
    success,
    resetForm,
    selectAlbum,
    setSlug,
    setCategory,
    setSeason,
    setStatus,
    setEventDate,
    setActiveLang,
    handleTranslationChange,
    handleSubmit,
  } = useAdminAlbums();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">{admin.pageTitle}</h2>
          <p className="mt-1 text-sm text-neutral-500">{admin.pageSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
        >
          {admin.newAlbum}
        </button>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <AdminAlbumsList
          albums={albums}
          loading={loading}
          selectedId={selectedId}
          onSelect={selectAlbum}
        />

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 md:col-span-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{admin.detailsTitle}</h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-500">{admin.slugLabel}</label>
              <input
                type="text"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder={admin.slugPlaceholder}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-500">{admin.categoryLabel}</label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="spieltage">{admin.categoryTeam}</option>
                <option value="action">{admin.categoryAction}</option>
                <option value="beach">{admin.categoryBeach}</option>
                <option value="training">{admin.categoryTraining}</option>
                <option value="events">{admin.categoryEvents}</option>
                <option value="other">{admin.categoryOther}</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-500">{admin.seasonLabel}</label>
              <input
                type="text"
                value={season}
                onChange={(event) => setSeason(event.target.value)}
                placeholder={admin.seasonPlaceholder}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-500">{admin.eventDateLabel}</label>
              <input
                type="date"
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-500">{admin.statusLabel}</label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="draft">{admin.statusDraft}</option>
                <option value="published">{admin.statusPublished}</option>
                <option value="archived">{admin.statusArchived}</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{admin.translationsTitle}</h3>
              <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 p-0.5">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveLang(lang)}
                    className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
                      activeLang === lang
                        ? 'rounded-full bg-primary-500 text-white shadow-sm'
                        : 'text-neutral-600'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-neutral-100 bg-neutral-50 p-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-500">{admin.fieldTitle}</label>
                <input
                  type="text"
                  value={translations[activeLang].title}
                  onChange={(event) =>
                    handleTranslationChange(activeLang, 'title', event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-500">{admin.fieldSubtitle}</label>
                <input
                  type="text"
                  value={translations[activeLang].subtitle}
                  onChange={(event) =>
                    handleTranslationChange(activeLang, 'subtitle', event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-500">{admin.fieldDescription}</label>
                <textarea
                  value={translations[activeLang].description}
                  onChange={(event) =>
                    handleTranslationChange(activeLang, 'description', event.target.value)
                  }
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {error && (
            <AdminAlert variant="error" size="sm">
              {admin.errorPrefix} {error}
            </AdminAlert>
          )}
          {success && (
            <AdminAlert variant="success" size="sm">
              {admin.successSaved}
            </AdminAlert>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {saving ? admin.saveSaving : admin.saveDefault}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminAlbumsPage;
