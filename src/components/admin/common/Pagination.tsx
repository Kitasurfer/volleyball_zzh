interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ page, pageSize, total, onPageChange }: Props) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs text-neutral-500">
        Showing {start}-{end} of {total} items
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-lg border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400"
        >
          Previous
        </button>
        <span className="text-xs font-semibold text-neutral-600">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded-lg border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:text-neutral-400"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
