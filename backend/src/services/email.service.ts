import nodemailer, { Transporter } from "nodemailer";
import { Notifier } from "../repos/notifier";
import { AppError, ERROR_CODE } from "../config/error";
import { APP_NAME } from "../config/constants";

export class EmailNotifier implements Notifier {
    private transporter: Transporter;
    private from: string;

    constructor({ config }: { config: any }) {
        const cfg = config?.email;
        if (!cfg) throw new Error("Missing email config");
        this.from =
            cfg.from ||
            (cfg.gmailUser
                ? `Online Classroom Management System <${cfg.gmailUser}>`
                : "");

        if (!this.from) {
            throw new Error("EMAIL_FROM (or gmail user) is required");
        }

        if (!cfg.gmailUser || !cfg.gmailAppPassword) {
            throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD are required");
        }

        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: cfg.gmailUser,
                pass: cfg.gmailAppPassword,
            },
        });
    }

    async sendAccountSetupInvite(to: string, link: string): Promise<void> {
        const subject = "[Online Classroom] Complete your account setup";
        const text = `You're invited as a student. Click to set your username and password: ${link}`;
        const html = `
            <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#111">
                <h2 style="margin:0 0 12px">Complete your account</h2>
                <p style="margin:0 0 8px">You’ve been invited as a student. Click the button below to set your username and password.</p>
                <p style="margin:14px 0"><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Set up your account</a></p>
                <p style="margin:10px 0"><a href="${link}">${link}</a></p>
                <p style="font-size:12px;color:#666;margin-top:16px">This link expires soon. If you didn’t expect this, ignore this email.</p>
            </div>
        `;
        try {
            await this.transporter.sendMail({
                from: this.from,
                to,
                subject,
                text,
                html,
            });
        } catch (e: any) {
            console.error("[EmailError]", {
                name: e?.name,
                message: e?.message,
                code: e?.code,
                command: e?.command,
                response: e?.response,
            });
            throw new AppError(
                "Email delivery failed",
                502,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async sendLoginCode(
        to: string,
        otp: string,
        ttlMinutes: number
    ): Promise<void> {
        const subject = "[Online Classroom Management System] - OTP Login Code";
        const text = `Your code is ${otp}. It expires in ${ttlMinutes} minutes.`;
        const html = this.renderHtmlTemplate({ otp, ttlMinutes });

        try {
            await this.transporter.sendMail({
                from: this.from,
                to,
                subject,
                text,
                html,
            });
        } catch (e: any) {
            console.error("[EmailError]", {
                name: e?.name,
                message: e?.message,
                code: e?.code,
                command: e?.command,
                response: e?.response,
            });

            throw new AppError(
                "Email delivery failed",
                502,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    async sendNotification(opts: {
        to: string | string[];
        subject?: string;
        title?: string;
        body?: string;
        html?: string;
        text?: string;
        actionUrl?: string;
        actionText?: string;
        attachments?: Array<{
            filename: string;
            content?: any;
            path?: string;
            contentType?: string;
        }>;
    }): Promise<void> {
        const {
            to,
            subject,
            title,
            body,
            html,
            text,
            actionUrl,
            actionText = "Open",
            attachments,
        } = opts ?? ({} as any);

        const ensureArray = (v: string | string[]) =>
            Array.isArray(v) ? v : [v];

        const finalText =
            text ||
            [
                title ? `${title}` : undefined,
                body ? `${body}` : undefined,
                actionUrl ? `Open: ${actionUrl}` : undefined,
            ]
                .filter(Boolean)
                .join("\n\n") ||
            "You have a new notification.";

        const esc = (s?: string) =>
            (s ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");

        const finalHtml =
            html ||
            `
                <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#111">
                    ${title ? `<h2 style="margin:0 0 12px">${esc(title)}</h2>` : ""}
                    ${body ? `<p style="margin:0 0 8px">${esc(body)}</p>` : ""}
                    ${
                        actionUrl
                            ? `
                        <p style="margin:14px 0">
                        <a href="${actionUrl}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">
                            ${esc(actionText)}
                        </a>
                        </p>
                        <p style="margin:10px 0"><a href="${actionUrl}">${actionUrl}</a></p>
                    `
                            : ""
                    }
                    <p style="font-size:12px;color:#666;margin-top:16px">If you didn’t expect this, you can ignore this email.</p>
                </div>
            `;

        const finalSubject =
            subject || title
                ? `[${APP_NAME}] ${title}`
                : `[${APP_NAME}] You have a new notification`;

        try {
            await this.transporter.sendMail({
                from: this.from,
                to: ensureArray(to).join(","),
                subject: finalSubject,
                text: finalText,
                html: finalHtml,
                attachments,
            });
        } catch (e: any) {
            console.error("[EmailError]", {
                name: e?.name,
                message: e?.message,
                code: e?.code,
                command: e?.command,
                response: e?.response,
            });
            throw new AppError(
                "Email delivery failed",
                502,
                ERROR_CODE.INTERNAL_ERROR
            );
        }
    }

    private renderHtmlTemplate({
        otp,
        ttlMinutes,
    }: {
        otp: string;
        ttlMinutes: number;
    }) {
        return `
            <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#111">
                <h2 style="margin:0 0 12px">Online Classroom Management System</h2>
                <p style="margin:0 0 8px">Your login code:</p>
                <div style="font-size:28px;font-weight:700;letter-spacing:2px;margin:8px 0 12px">${otp}</div>
                <p style="margin:0 0 8px">This code expires in <b>${ttlMinutes} minutes</b>.</p>
                <p style="font-size:12px;color:#666;margin-top:16px">If you didn’t request this code, you can safely ignore this email.</p>
            </div>
         `;
    }
}
