import { Fragment, useMemo, useState } from 'react';
import ContentFilters from '../../components/admin/content/ContentFilters';
import ContentTable from '../../components/admin/content/ContentTable';
import Pagination from '../../components/admin/common/Pagination';
import ContentEditorModal from '../../components/admin/content/ContentEditorModal';
import type {
  ContentFilters as FilterState,
  ContentEditorInput,
  ContentItemDetail,
} from '../../types/admin/content';
import { useAdminContent } from '../../hooks/useAdminContent';
import { useAdminContentDetail } from '../../hooks/useAdminContentDetail';
import { useAdminContentEditor } from '../../hooks/useAdminContentEditor';
import { useAdminContentDelete } from '../../hooks/useAdminContentDelete';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../lib/LanguageContext';
import { generateSlug } from '../../lib/slug';
import { AdminAlert } from '../../components/admin/common/AdminAlert';

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
  const { t } = useLanguage();
  const admin = t.admin.content;
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
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docLanguage, setDocLanguage] = useState<string>('de');
  const [docUploading, setDocUploading] = useState(false);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const [docUploadSuccess, setDocUploadSuccess] = useState<string | null>(null);
  const { deletingId, deleteError, deleteSuccess, handleDelete } = useAdminContentDelete({ onDeleted: refresh });

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

  const handleDocumentUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!docFile) {
      setDocUploadError('Please choose a document file.');
      return;
    }

    setDocUploadError(null);
    setDocUploadSuccess(null);
    setDocUploading(true);

    try {
      const safeName = docFile.name.replace(/[^a-zA-Z0-9_.-]+/g, '-');
      const storagePath = `uploads/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, docFile, {
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data, error: funcError } = await supabase.functions.invoke<{
        success?: boolean;
        content_id?: string;
        job_id?: string;
        error?: { code?: string; message?: string };
      }>('process-document', {
        body: {
          storage_path: storagePath,
          language: docLanguage,
          type: 'article',
          title: docFile.name,
          tags: [],
        },
      });

      if (funcError) {
        throw funcError;
      }

      if (!data?.success) {
        const message = data?.error?.message || 'Document processing failed.';
        throw new Error(message);
      }

      setDocUploadSuccess('Document uploaded and processing started. It may take some time to appear in the list.');
      setDocFile(null);
      refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setDocUploadError(message);
    } finally {
      setDocUploading(false);
    }
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

    if (!baseInput.title) {
      setFormError('Title is required.');
      return;
    }

    const nextSlugRaw = baseInput.slug || generateSlug(baseInput.title);
    const nextSlug = nextSlugRaw || `content-${Date.now()}`;

    const input: ContentEditorInput = {
      ...baseInput,
      slug: nextSlug,
    };

    try {
      if (editorMode === 'create') {
        await createContent(input);
      } else if (selectedId) {
        await updateContent(selectedId, input);
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
          <h2 className="text-xl font-semibold text-neutral-900">{admin.pageTitle}</h2>
          <p className="mt-1 text-sm text-neutral-500">{admin.pageSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
          >
            {admin.refresh}
          </button>
          <button
            type="button"
            onClick={handleCreate}
            className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-600"
          >
            {admin.newContent}
          </button>
        </div>
      </header>

      <section className="space-y-2 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-neutral-900">Upload document</h3>
        <p className="text-xs text-neutral-500">
          Upload a PDF/DOCX/PPTX document to process it via Docling and create a content item automatically.
        </p>
        <form
          onSubmit={handleDocumentUpload}
          className="mt-2 flex flex-col gap-3 md:flex-row md:items-end"
        >
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase text-neutral-500">
              File
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
              onChange={(event) => setDocFile(event.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm text-neutral-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-neutral-500">
              Language
            </label>
            <select
              value={docLanguage}
              onChange={(event) => setDocLanguage(event.target.value)}
              className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
            >
              <option value="de">DE</option>
              <option value="en">EN</option>
              <option value="ru">RU</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={docUploading || !docFile}
            className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {docUploading ? 'Uploading…' : 'Upload document'}
          </button>
        </form>
        {docUploadError && (
          <AdminAlert variant="error" size="sm" className="mt-2">
            {docUploadError}
          </AdminAlert>
        )}
        {docUploadSuccess && (
          <AdminAlert variant="success" size="sm" className="mt-2">
            {docUploadSuccess}
          </AdminAlert>
        )}
      </section>

      <ContentFilters onChange={setFilters} />

      {actionError && (
        <AdminAlert variant="error" size="sm">
          {admin.actionErrorPrefix} {actionError}
        </AdminAlert>
      )}

      {(deleteError || deleteSuccess) && (
        <AdminAlert variant={deleteError ? 'error' : 'success'} size="sm">
          {deleteError ? `${admin.deleteErrorPrefix} ${deleteError}` : admin.deleteSuccess}
        </AdminAlert>
      )}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-neutral-200 bg-white text-sm text-neutral-500">
          {admin.loading}
        </div>
      ) : error ? (
        <AdminAlert variant="error" size="md">
          {admin.loadErrorPrefix} {error}
        </AdminAlert>
      ) : (
        <Fragment>
          <ContentTable
            items={items}
            onEnqueue={handleEnqueue}
            enqueueingId={enqueueingId}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
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
        <ContentEditorModal
          mode={editorMode}
          detailLoading={detailLoading}
          formError={formError}
          saveError={saveError}
          saveSuccess={saveSuccess}
          editorValues={editorValues}
          saving={saving}
          onClose={closeEditor}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default AdminContentPage;
