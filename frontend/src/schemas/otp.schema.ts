import type { ApiResponse } from "./api.schema";

export type Channel = "sms" | "email";

export type SendCodeReq = { channel: Channel; value: string };
export interface SendCodeResponse extends ApiResponse {}
