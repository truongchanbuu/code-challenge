export function autoE164(raw: string) {
  const s = raw.replace(/[^\d+]/g, "");
  if (s.startsWith("+84")) return s;
  if (/^84\d+$/.test(s)) return `+${s}`;
  if (/^0\d{9}$/.test(s)) return `+84${s.slice(1)}`;

  return s;
}

export function normalizePhone(input: string): string {
  const s = input.replace(/[^+\d]/g, "");
  if (s.startsWith("+")) return s;
  if (s.startsWith("0")) return "+84" + s.slice(1);
  if (s.startsWith("84")) return "+" + s;
  return s;
}
