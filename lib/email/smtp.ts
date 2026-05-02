import { env } from "@/lib/env";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(input: SendEmailInput) {
  if (!env.BREVO_API_KEY || !env.BREVO_FROM_EMAIL) {
    const reason = "Brevo API email provider is not fully configured.";
    console.warn(reason);
    return { sent: false, reason };
  }

  const apiResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { email: env.BREVO_FROM_EMAIL },
      to: (Array.isArray(input.to) ? input.to : [input.to]).map((email) => ({ email })),
      subject: input.subject,
      htmlContent: input.html,
      textContent: input.text || "",
    }),
  });

  if (!apiResponse.ok) {
    const bodyText = await apiResponse.text();
    return { sent: false, reason: `Brevo API error: ${apiResponse.status} ${bodyText}` };
  }

  return { sent: true };
}
