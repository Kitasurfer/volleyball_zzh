import { Fragment, useMemo, useState } from 'react';
import ContentFilters from '../../components/admin/content/ContentFilters';
import ContentTable from '../../components/admin/content/ContentTable';
import Pagination from '../../components/admin/common/Pagination';
import type {
  ContentFilters as FilterState,
  ContentEditorInput,
  ContentItemDetail,
} from '../../types/admin/content';
import { useAdminContent } from '../../hooks/useAdminContent';
import { useAdminContentDetail } from '../../hooks/useAdminContentDetail';
import { useAdminContentEditor } from '../../hooks/useAdminContentEditor';
import { supabase } from '../../lib/supabase';

interface PaginationState {
  page: number;
  pageSize: number;
}

const emptyEditorInput: ContentEditorInput = {
  title: '',
  slug: '',
  language: 'de',
  status: 'draft',
  summary: null,
  bodyMarkdown: null,
  bodyHtml: null,
  type: 'article',
  tags: [],
  publishedAt: null,
  mediaLinks: [],
};

const AdminContentPage = () => {
  const [filters, setFilters] = useState<FilterState>({ search: '', status: 'all', language: 'all' });
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 20 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editorInitial, setEditorInitial] = useState<ContentEditorInput>(emptyEditorInput);
  const { items, loading, error, total, refresh } = useAdminContent(filters, pagination);
  const { item: selectedItem, loading: detailLoading } = useAdminContentDetail(selectedId);
  const { saving, error: saveError, success: saveSuccess, createContent, updateContent, resetStatus } = useAdminContentEditor();
  const [enqueueingId, setEnqueueingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleEnqueue = async (contentId: string) => {
    if (enqueueingId) return;
    setActionError(null);
    setEnqueueingId(contentId);

    const { error: rpcError } = await supabase.rpc('admin_enqueue_vector_job', {
      content_id: contentId,
      reason: 'admin_manual',
    });

    if (rpcError) {
      setActionError(rpcError.message);
    } else {
      refresh();
    }

    setEnqueueingId(null);
  };

  const handleCreate = () => {
    setEditorMode('create');
    setEditorInitial(emptyEditorInput);
    setSelectedId(null);
    setFormError(null);
    resetStatus();
    setIsEditorOpen(true);
  };

  const buildEditorInput = (detail: ContentItemDetail): ContentEditorInput => ({
    title: detail.title,
    slug: detail.slug,
    language: detail.language,
    status: detail.status,
    summary: detail.summary,
    bodyMarkdown: detail.bodyMarkdown,
    bodyHtml: detail.bodyHtml,
    type: detail.type,
    tags: detail.tags,
    publishedAt: detail.publishedAt,
    mediaLinks: detail.media.map((link) => ({ mediaId: link.mediaId, role: link.role, position: link.position })),
  });

  const handleEdit = (contentId: string) => {
    setEditorMode('edit');
    setSelectedId(contentId);
    setIsEditorOpen(true);
    setFormError(null);
    resetStatus();
  };

  const editorValues = useMemo(() => {
    if (editorMode === 'create') return editorInitial;
    if (!selectedItem) return editorInitial;
    return buildEditorInput(selectedItem);
  }, [editorInitial, editorMode, selectedItem]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const formData = new FormData(event.currentTarget);
    const baseInput: ContentEditorInput = {
      title: formData.get('title')?.toString().trim() ?? '',
      slug: formData.get('slug')?.toString().trim() ?? '',
      language: formData.get('language')?.toString() ?? 'de',
      status: formData.get('status')?.toString() as ContentEditorInput['status'],
      summary: formData.get('summary')?.toString() || null,
      bodyMarkdown: formData.get('bodyMarkdown')?.toString() || null,
      bodyHtml: formData.get('bodyHtml')?.toString() || null,
      type: formData.get('type')?.toString() || 'article',
      tags: formData
        .get('tags')
        ?.toString()
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean) ?? [],
      publishedAt: formData.get('publishedAt')?.toString() || null,
      mediaLinks: editorValues.mediaLinks,
    };

    if (!baseInput.title || !baseInput.slug) {
      setFormError('Title and slug are required.');
      return;
    }

    try {
      if (editorMode === 'create') {
        await createContent(baseInput);
      } else if (selectedId) {
        await updateContent(selectedId, baseInput);
      }

      setIsEditorOpen(false);
      refresh();
    } catch (error) {
      console.error('Failed to save content:', error);
    }
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setSelectedId(null);
    setFormError(null);
    resetStatus();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Content Manager</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Filter, inspect, and synchronize knowledge base articles across languages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-600"
          >
            New content
          </button>
        </div>
      </header>

      <ContentFilters onChange={setFilters} />

      {actionError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-neutral-200 bg-white text-sm text-neutral-500">
          Loading content…
        </div>
      ) : error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
          Failed to load content: {error}
        </div>
      ) : (
        <Fragment>
          <ContentTable
            items={items}
            onEnqueue={handleEnqueue}
            enqueueingId={enqueueingId}
            onEdit={handleEdit}
          />
          <Pagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            total={total}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          />
        </Fragment>
      )}

      {isEditorOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-900/40 px-4">
          <div className="relative w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
            <header className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  {editorMode === 'create' ? 'Create content' : 'Edit content'}
                </h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Fill the fields below to {editorMode === 'create' ? 'add a new article' : 'update this article'}.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-lg border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
              >
                Close
              </button>
            </header>

            {(detailLoading && editorMode === 'edit') && (
              <div className="mt-6 text-sm text-neutral-500">Loading content details…</div>
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

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-500">Title</label>
                  <input
                    name="title"
                    type="text"
                    defaultValue={editorValues.title}
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-500">Slug</label>
                  <input
                    name="slug"
                    type="text"
                    defaultValue={editorValues.slug}
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-500">Language</label>
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
                  <label className="block text-xs font-semibold uppercase text-neutral-500">Status</label>
                  <select
                    name="status"
                    defaultValue={editorValues.status}
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="review">Review</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-500">Type</label>
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
                  <label className="block text-xs font-semibold uppercase text-neutral-500">Summary</label>
                  <textarea
                    name="summary"
                    defaultValue={editorValues.summary ?? ''}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-neutral-500">Tags (comma separated)</label>
                  <input
                    name="tags"
                    type="text"
                    defaultValue={editorValues.tags.join(', ')}
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-500">Published at</label>
                <input
                  name="publishedAt"
                  type="datetime-local"
                  defaultValue={editorValues.publishedAt ?? ''}
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-500">Body (Markdown)</label>
                <textarea
                  name="bodyMarkdown"
                  defaultValue={editorValues.bodyMarkdown ?? ''}
                  rows={6}
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-500">Body (HTML)</label>
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
                  onClick={closeEditor}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
                >
                  {saving ? 'Saving…' : editorMode === 'create' ? 'Create content' : 'Update content'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContentPage;
