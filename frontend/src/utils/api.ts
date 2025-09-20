export async function sendCodeApi(
  { channel, value }: SendCodeReq,
  signal?: AbortSignal,
): Promise<SendCodeRes> {
  const url =
    channel === "sms"
      ? "/api/auth/createAccessCode"
      : "/api/auth/email/sendCode";

  const body = channel === "sms" ? { phone: value } : { email: value };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to send code");
  }
  return res.json();
}

export async function validateAccessCode(payload: {
  requestId: string;
  code: string;
}) {
  const res = await fetch("/api/validateAccessCode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Invalid or expired code");
  return res.json();
}
