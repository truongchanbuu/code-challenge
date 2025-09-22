export interface Notifier {
    sendLoginCode(to: string, otp: string, ttlMinutes: number): Promise<void>;
    sendAccountSetupInvite(to: string, link: string): Promise<void>;
}
