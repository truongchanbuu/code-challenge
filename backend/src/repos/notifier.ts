export interface OtpNotifier {
    sendLoginCode(to: string, otp: string, ttlMinutes: number): Promise<void>;
}
