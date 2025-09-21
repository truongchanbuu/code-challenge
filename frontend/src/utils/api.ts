import type { Channel } from "@/schemas/otp.schema";

export async function sendAccessCode(
  { channel, value }: any,
  signal?: AbortSignal,
): Promise<any> {
  const url = "/api/auth/createAccessCode";
  const body = channel === "sms" ? { phoneNumber: value } : { email: value };

  const result = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!result.ok) {
    let msg = "Failed to send code";
    try {
      const json = await result.json();
      msg = json?.message || msg;
    } catch {
      try {
        msg = await result.text();
      } catch {}
    }
    throw new Error(msg);
  }

  return result.json();
}

export async function validateAccessCode(payload: {
  channel: Channel;
  value: string;
  code: string;
}) {
  const url = "/api/auth/validateAccessCode";
  const body =
    payload.channel === "sms"
      ? { phoneNumber: payload.value, accessCode: payload.code }
      : { email: payload.value, accessCode: payload.code };

  const result = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!result.ok) {
    let msg = "Invalid or expired code";
    try {
      const j = await result.json();
      msg = j?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return result.json();
}

export async function setupAccount(payload: any) {
  const url = "/api/auth/setup-account";

  const result = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!result.ok) {
    let msg = "Failed to send code";
    try {
      const json = await result.json();
      msg = json?.message || msg;
    } catch {
      try {
        msg = await result.text();
      } catch {}
    }
    throw new Error(msg);
  }

  return result.json();
}

export async function loginPassword(payload: {
  username: string;
  password: string;
}) {
  const url = "/api/auth/loginPassword";

  const result = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!result.ok) {
    let msg = "Invalid or expired code";
    try {
      const j = await result.json();
      msg = j?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return result.json();
}
