export function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-1 text-sm opacity-70">{title}</div>
      {subtitle && <div className="text-xs opacity-60">{subtitle}</div>}
    </div>
  );
}
