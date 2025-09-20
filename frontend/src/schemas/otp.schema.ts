export type Channel = "sms" | "email";

export type SendCodeReq = { channel: Channel; value: string };
export type SendCodeRes = { requestId: string; to: string };
