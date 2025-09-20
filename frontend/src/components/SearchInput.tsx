import { useEffect, useMemo, useState } from "react";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Search name, email, phone…",
  delay = 400,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  delay?: number;
}) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  const debounced = useMemo(() => {
    const timeoutRef: { id?: number } = {};
    return (v: string) => {
      if (timeoutRef.id) window.clearTimeout(timeoutRef.id);
      timeoutRef.id = window.setTimeout(() => onChange(v), delay);
    };
  }, [onChange, delay]);

  return (
    <label
      className="input input-bordered flex w-full items-center gap-2"
      data-testid="search-input"
    >
      <input
        aria-label="Search students"
        value={local}
        onChange={(e) => {
          setLocal(e.target.value);
          debounced(e.target.value);
        }}
        placeholder={placeholder}
        className="grow"
      />
      <kbd className="kbd kbd-xs opacity-60">/</kbd>
    </label>
  );
}
