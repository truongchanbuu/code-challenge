import type {
  Channel,
  SendCodeReq,
  SendCodeResponse,
} from "@/schemas/otp.schema";

export async function sendAccessCode(
  { channel, value }: SendCodeReq,
  signal?: AbortSignal,
): Promise<SendCodeResponse> {
  const url = "/api/createAccessCode";
  const body = channel === "sms" ? { phoneNumber: value } : { email: value };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    let msg = "Failed to send code";
    try {
      const json = await res.json();
      msg = json?.message || msg;
    } catch {
      try {
        msg = await res.text();
      } catch {}
    }
    throw new Error(msg);
  }

  return res.json();
}

export async function validateAccessCode(payload: {
  channel: Channel;
  value: string;
  code: string;
}) {
  const url = "/api/validateAccessCode";
  const body =
    payload.channel === "sms"
      ? { phoneNumber: payload.value, accessCode: payload.code }
      : { email: payload.value, accessCode: payload.code };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let msg = "Invalid or expired code";
    try {
      const j = await res.json();
      msg = j?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}
