export function autoE164(raw: string) {
  const s = raw.replace(/[^\d+]/g, "");
  if (s.startsWith("+84")) return s;
  if (/^84\d+$/.test(s)) return `+${s}`;
  if (/^0\d{9}$/.test(s)) return `+84${s.slice(1)}`;

  return s;
}
