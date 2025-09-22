export function AssignmentsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={`sk-${i}`} className="animate-pulse">
          <td>
            <div className="bg-base-300 h-4 w-40 rounded" />
          </td>
          <td className="hidden md:table-cell">
            <div className="bg-base-300 h-4 w-64 rounded" />
          </td>
          <td>
            <div className="bg-base-300 h-4 w-16 rounded" />
          </td>
          <td className="hidden md:table-cell">
            <div className="bg-base-300 h-4 w-28 rounded" />
          </td>
          <td className="hidden lg:table-cell">
            <div className="bg-base-300 h-4 w-28 rounded" />
          </td>
          <td className="text-right">
            <div className="bg-base-300 h-8 w-24 rounded" />
          </td>
        </tr>
      ))}
    </>
  );
}
