import { useDebounced } from "@/hooks/use-debounce";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (value !== local) setLocal(value);
  }, [value]);

  const debounced = useDebounced(local, delay);
  useEffect(() => {
    if (debounced !== value) onChange(debounced);
  }, [debounced, value, onChange]);

  return (
    <label
      className="input input-bordered flex w-full items-center gap-2"
      data-testid="search-input"
    >
      <input
        aria-label="Search students"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="grow"
      />
      <kbd className="kbd kbd-xs opacity-60">/</kbd>
    </label>
  );
}
