import { env } from "@/lib/env";
import { sendEmail } from "@/lib/email/smtp";

export async function sendOperationalAlert(title: string, details: string) {
  const payload = { text: `*${title}*\n${details}` };

  if (env.ALERT_SLACK_WEBHOOK_URL) {
    try {
      await fetch(env.ALERT_SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      // best-effort alerting
    }
  }

  if (env.ALERT_EMAIL_TO) {
    try {
      await sendEmail({
        to: env.ALERT_EMAIL_TO,
        subject: `[Alert] ${title}`,
        html: `<p><strong>${title}</strong></p><pre>${details}</pre>`,
        text: `${title}\n${details}`,
      });
    } catch {
      // best-effort alerting
    }
  }
}
