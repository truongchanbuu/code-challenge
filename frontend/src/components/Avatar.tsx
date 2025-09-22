import { useMemo } from "react";

interface AvatarProps {
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "circle" | "rounded" | "square";
  showBorder?: boolean;
  className?: string;
}

export default function Avatar({
  name,
  size = "md",
  variant = "circle",
  showBorder = false,
  className = "",
}: AvatarProps) {
  const { initials, colorClass } = useMemo(() => {
    const processedInitials = getInitials(name);
    const color = getColorFromName(name || "");
    return {
      initials: processedInitials,
      colorClass: color,
    };
  }, [name]);

  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-base",
    lg: "w-16 h-16 text-xl",
    xl: "w-20 h-20 text-2xl",
  };

  const variantClasses = {
    circle: "rounded-full",
    rounded: "rounded-xl",
    square: "rounded-lg",
  };

  const borderClass = showBorder
    ? "ring-2 ring-white ring-offset-2 ring-offset-gray-100"
    : "";

  return (
    <div className="relative inline-block">
      <div
        className={` ${sizeClasses[size]} ${variantClasses[variant]} ${colorClass} ${borderClass} ${className} flex items-center justify-center font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl`}
      >
        <span className="select-none">{initials}</span>
      </div>
    </div>
  );
}

function getInitials(name?: string): string {
  if (!name?.trim()) return "?";

  const cleanName = name.trim();
  const words = cleanName.split(/\s+/).filter((word) => word.length > 0);

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0][0].toUpperCase();

  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function getColorFromName(name: string): string {
  // Generate consistent colors based on name hash
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const gradients = [
    "bg-gradient-to-br from-blue-500 to-blue-600",
    "bg-gradient-to-br from-purple-500 to-purple-600",
    "bg-gradient-to-br from-green-500 to-green-600",
    "bg-gradient-to-br from-red-500 to-red-600",
    "bg-gradient-to-br from-yellow-500 to-orange-500",
    "bg-gradient-to-br from-pink-500 to-pink-600",
    "bg-gradient-to-br from-indigo-500 to-indigo-600",
    "bg-gradient-to-br from-teal-500 to-teal-600",
    "bg-gradient-to-br from-cyan-500 to-cyan-600",
    "bg-gradient-to-br from-emerald-500 to-emerald-600",
    "bg-gradient-to-br from-violet-500 to-violet-600",
    "bg-gradient-to-br from-rose-500 to-rose-600",
    "bg-gradient-to-br from-amber-500 to-orange-500",
    "bg-gradient-to-br from-lime-500 to-lime-600",
    "bg-gradient-to-br from-sky-500 to-sky-600",
  ];

  return gradients[Math.abs(hash) % gradients.length];
}
