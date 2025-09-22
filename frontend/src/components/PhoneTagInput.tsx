import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

type Props = {
  value: string[];
  onChange: (phones: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxTags?: number;
};

type Token = { raw: string; norm?: string; valid: boolean };

function normalizeVNPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  let national = "";
  if (raw.trim().startsWith("+84")) national = digits.slice(2);
  else if (digits.startsWith("84")) national = digits.slice(2);
  else if (digits.startsWith("0")) national = digits.slice(1);
  else if (digits.length >= 9 && digits.length <= 11) national = digits;
  else return null;

  if (national.length < 8 || national.length > 11) return null;
  return `+84${national}`;
}

function parseMany(input: string): string[] {
  return input
    .split(/[\n,;\s]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function PhoneTagsInput({
  value,
  onChange,
  placeholder = "Type a phone and press Enter or ,",
  disabled,
  className,
  maxTags,
}: Props) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTokens(value.map((v) => ({ raw: v, norm: v, valid: true })));
  }, [value]);

  const validPhones = useMemo(
    () =>
      Array.from(
        new Set(tokens.filter((t) => t.valid && t.norm).map((t) => t.norm!)),
      ),
    [tokens],
  );

  useEffect(() => {
    onChange(validPhones);
  }, [validPhones, onChange]);

  const tryAddMany = (raws: string[]) => {
    if (!raws.length) return;
    const next = [...tokens];
    for (const r of raws) {
      const norm = normalizeVNPhone(r);
      const valid = !!norm;
      const exists = valid && next.some((t) => t.norm === norm);
      if (exists) continue;
      if (maxTags && next.filter((t) => t.valid).length >= maxTags) break;
      next.push({ raw: r, norm: norm ?? undefined, valid });
    }
    setTokens(next);
  };

  const commitCurrent = () => {
    const raws = parseMany(text);
    if (raws.length) tryAddMany(raws);
    setText("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitCurrent();
    } else if (
      e.key === "Backspace" &&
      text.length === 0 &&
      tokens.length > 0
    ) {
      e.preventDefault();
      setTokens((prev) => prev.slice(0, -1));
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const clip = e.clipboardData.getData("text");
    if (clip && /[\n,;\s]/.test(clip)) {
      e.preventDefault();
      tryAddMany(parseMany(clip));
    }
  };

  const removeAt = (idx: number) => {
    setTokens((prev) => prev.filter((_, i) => i !== idx));
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div
      className={clsx(
        "border-base-300 bg-base-100 min-h-12 w-full rounded-lg border p-2",
        "focus-within:ring-primary flex flex-wrap items-center gap-2 focus-within:ring-2",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {tokens.map((t, i) => (
        <span
          key={`${t.norm ?? t.raw}-${i}`}
          className={clsx(
            "badge gap-1",
            t.valid ? "badge-ghost" : "badge-error",
          )}
          title={t.valid ? t.norm : `Invalid: ${t.raw}`}
        >
          {t.valid ? t.norm : t.raw}
          <button
            type="button"
            className="ml-1 opacity-70 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              removeAt(i);
            }}
            aria-label="Remove"
          >
            ✕
          </button>
        </span>
      ))}

      <input
        ref={inputRef}
        className="input input-ghost h-8 min-w-[10ch] flex-1 focus:outline-none"
        placeholder={tokens.length === 0 ? placeholder : ""}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onBlur={() => text && commitCurrent()}
        disabled={disabled}
        inputMode="tel"
        autoComplete="off"
      />
    </div>
  );
}
