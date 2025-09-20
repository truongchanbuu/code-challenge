import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.getAttribute("data-theme") === "dark";
  });

  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [isDark]);

  return (
    <label className="swap swap-rotate">
      <input
        type="checkbox"
        className="sr-only"
        aria-label="Toggle theme"
        checked={isDark}
        onChange={() => setIsDark((v) => !v)}
      />
      <Sun className="swap-off h-6 w-6" aria-hidden="true" />
      <Moon className="swap-on h-6 w-6" aria-hidden="true" />
    </label>
  );
}
