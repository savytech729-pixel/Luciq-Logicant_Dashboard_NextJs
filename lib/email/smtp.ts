import { env } from "@/lib/env";
import nodemailer from "nodemailer";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(input: SendEmailInput) {
  const recipients = (Array.isArray(input.to) ? input.to : [input.to]).map((email) => ({ email }));
  const smtpConfigured =
    !!env.BREVO_SMTP_HOST &&
    Number.isFinite(env.BREVO_SMTP_PORT) &&
    env.BREVO_SMTP_PORT > 0 &&
    !!env.BREVO_SMTP_LOGIN &&
    !!env.BREVO_SMTP_KEY &&
    !!env.BREVO_FROM_EMAIL;
  const apiConfigured = !!env.BREVO_API_KEY && !!env.BREVO_FROM_EMAIL;

  const sendViaSmtp = async () => {
    if (!smtpConfigured) {
      return { sent: false, reason: "Brevo SMTP is not fully configured." };
    }
    try {
      const transporter = nodemailer.createTransport({
        host: env.BREVO_SMTP_HOST,
        port: env.BREVO_SMTP_PORT,
        secure: env.BREVO_SMTP_PORT === 465,
        auth: {
          user: env.BREVO_SMTP_LOGIN,
          pass: env.BREVO_SMTP_KEY,
        },
      });
      await transporter.sendMail({
        from: env.BREVO_FROM_EMAIL,
        to: recipients.map((r) => r.email).join(","),
        subject: input.subject,
        html: input.html,
        text: input.text || "",
      });
      return { sent: true as const };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { sent: false as const, reason: `Brevo SMTP error: ${message}` };
    }
  };

  // Prefer API when configured, but automatically fail over to SMTP if API blocks by IP.
  if (apiConfigured) {
    const apiResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { email: env.BREVO_FROM_EMAIL },
        to: recipients,
        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text || "",
      }),
    });

    if (apiResponse.ok) {
      return { sent: true };
    }
    const bodyText = await apiResponse.text();
    const smtpResult = await sendViaSmtp();
    if (smtpResult.sent) {
      return { sent: true };
    }
    return {
      sent: false,
      reason: `Brevo API error: ${apiResponse.status} ${bodyText}; fallback failed: ${smtpResult.reason}`,
    };
  }

  const smtpResult = await sendViaSmtp();
  if (smtpResult.sent) return { sent: true };
  return { sent: false, reason: "Brevo email provider is not fully configured (API and SMTP)." };
}
