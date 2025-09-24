import { memo } from "react";

const SkeletonRow = memo(({ index }: { index: number }) => (
  <tr key={`sk-${index}`} className="animate-pulse">
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
));

SkeletonRow.displayName = "SkeletonRow";

export const Skeleton = memo(({ rows = 4 }: { rows?: number }) => {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonRow key={i} index={i} />
      ))}
    </>
  );
});

Skeleton.displayName = "Skeleton";

const SKELETON_ROWS = Array.from({ length: 10 }, (_, i) => i);

export const SkeletonOptimized = memo(({ rows = 4 }: { rows?: number }) => {
  return (
    <>
      {SKELETON_ROWS.slice(0, rows).map((i) => (
        <SkeletonRow key={i} index={i} />
      ))}
    </>
  );
});

SkeletonOptimized.displayName = "SkeletonOptimized";
