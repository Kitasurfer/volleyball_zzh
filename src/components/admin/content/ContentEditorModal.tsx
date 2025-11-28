import type { FormEvent } from 'react';
import type { ContentEditorInput } from '../../../types/admin/content';
import { useLanguage } from '../../../lib/LanguageContext';

interface ContentEditorModalProps {
  mode: 'create' | 'edit';
  detailLoading: boolean;
  formError: string | null;
  saveError: string | null;
  saveSuccess: string | null;
  editorValues: ContentEditorInput;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const ContentEditorModal = ({
  mode,
  detailLoading,
  formError,
  saveError,
  saveSuccess,
  editorValues,
  saving,
  onClose,
  onSubmit,
}: ContentEditorModalProps) => {
  const { t } = useLanguage();
  const ui = t.admin.content.editor;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-900/40 px-4">
      <div className="relative w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              {mode === 'create' ? ui.titleCreate : ui.titleEdit}
            </h3>
            <p className="mt-1 text-xs text-neutral-500">
              {mode === 'create' ? ui.subtitleCreate : ui.subtitleEdit}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
          >
            {ui.close}
          </button>
        </header>

        {detailLoading && mode === 'edit' && (
          <div className="mt-6 text-sm text-neutral-500">{ui.loadingDetails}</div>
        )}

        {formError && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">{formError}</div>
        )}
        {saveError && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">{saveError}</div>
        )}
        {saveSuccess && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-600">{saveSuccess}</div>
        )}

        <form className="mt-4 space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.fieldTitle}</label>
              <input
                name="title"
                type="text"
                defaultValue={editorValues.title}
                required
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.fieldSlug}</label>
              <input
                name="slug"
                type="text"
                defaultValue={editorValues.slug}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.fieldLanguage}</label>
              <select
                name="language"
                defaultValue={editorValues.language}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="de">DE</option>
                <option value="en">EN</option>
                <option value="ru">RU</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.fieldStatus}</label>
              <select
                name="status"
                defaultValue={editorValues.status}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
              >
                <option value="draft">{ui.statusDraft}</option>
                <option value="review">{ui.statusReview}</option>
                <option value="published">{ui.statusPublished}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.fieldType}</label>
              <input
                name="type"
                type="text"
                defaultValue={editorValues.type}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.fieldSummary}</label>
              <textarea
                name="summary"
                defaultValue={editorValues.summary ?? ''}
                rows={3}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.fieldTags}</label>
              <input
                name="tags"
                type="text"
                defaultValue={editorValues.tags.join(', ')}
                className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.fieldPublishedAt}</label>
            <input
              name="publishedAt"
              type="datetime-local"
              defaultValue={editorValues.publishedAt ?? ''}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.fieldBodyMarkdown}</label>
            <textarea
              name="bodyMarkdown"
              defaultValue={editorValues.bodyMarkdown ?? ''}
              rows={6}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-500">{ui.fieldBodyHtml}</label>
            <textarea
              name="bodyHtml"
              defaultValue={editorValues.bodyHtml ?? ''}
              rows={6}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100"
            >
              {ui.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {saving ? ui.submitSaving : mode === 'create' ? ui.submitCreate : ui.submitUpdate}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContentEditorModal;
