import { AlertCircle, RefreshCw } from "lucide-react";

type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function ErrorBanner({
  message,
  onRetry,
  retryLabel = "Retry",
  className = "",
}: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className={`flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm ${className}`}
    >
      <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
      <div className="flex font-medium text-red-800">{message}</div>
      {onRetry && (
        <button
          type="button"
          className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:border-red-400 hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:outline-none"
          onClick={onRetry}
          aria-label={retryLabel}
        >
          <RefreshCw className="h-3 w-3" />
          {retryLabel}
        </button>
      )}
    </div>
  );
}
