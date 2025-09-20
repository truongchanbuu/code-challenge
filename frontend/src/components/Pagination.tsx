interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const prev = () => onPageChange(Math.max(1, page - 1));
  const next = () => onPageChange(Math.min(pages, page + 1));

  return (
    <div
      className="flex items-center justify-between gap-3"
      data-testid="pagination"
    >
      <div className="flex w-full items-center gap-2">
        <span className="opacity-70">Rows</span>
        <select
          className="select select-bordered select-sm w-15"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          aria-label="Rows per page"
        >
          {[10, 25, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <span className="opacity-70">
          {total === 0
            ? "0-0"
            : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)}`}{" "}
          of {total}
        </span>
      </div>

      <div className="join">
        <button
          className="btn btn-sm join-item"
          onClick={prev}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          «
        </button>
        <button className="btn btn-sm join-item pointer-events-none">
          Page {page} / {pages}
        </button>
        <button
          className="btn btn-sm join-item"
          onClick={next}
          disabled={page >= pages}
          aria-label="Next page"
        >
          »
        </button>
      </div>
    </div>
  );
}
