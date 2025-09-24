type LoadMoreButtonProps = {
  hasNextPage: boolean;
  isFetching: boolean;
  onClick: () => void;
  label?: string;
};

export function LoadMoreButton({
  hasNextPage,
  isFetching,
  onClick,
  label = "Load more",
}: LoadMoreButtonProps) {
  if (!hasNextPage) return null;
  return (
    <div className="border-base-200/50 border-t p-4">
      <button
        type="button"
        className="btn btn-primary btn-wide text-primary-content mx-auto flex gap-2 rounded-xl"
        onClick={onClick}
        disabled={isFetching}
        aria-busy={isFetching}
      >
        {isFetching ? (
          <>
            <span className="loading loading-spinner loading-sm" />
            Loading…
          </>
        ) : (
          <>{label}</>
        )}
      </button>
    </div>
  );
}
