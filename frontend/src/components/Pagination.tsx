type Props = {
  pageSize: number;
  showingFrom: number;
  showingTo: number;
  hasNext: boolean;
  onLoadMore: () => void;
  onPageSizeChange: (n: number) => void;
  total?: number | null;
};

export default function LoadMoreFooter({
  pageSize,
  showingFrom,
  showingTo,
  hasNext,
  onLoadMore,
  onPageSizeChange,
  total = null,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="opacity-70">Rows</span>
        <select
          className="select select-bordered select-sm w-20"
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
          {showingFrom}-{showingTo}
          {total != null ? ` of ${total}` : " of ?"}
        </span>
      </div>

      <button
        className="btn btn-sm"
        onClick={onLoadMore}
        disabled={!hasNext}
        aria-label="Load more"
      >
        Load more
      </button>
    </div>
  );
}
