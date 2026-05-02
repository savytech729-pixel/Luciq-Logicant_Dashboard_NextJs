const REQUIRED_ENV_VARS = ["DATABASE_URL", "JWT_SECRET", "GEMINI_API_KEY"] as const;

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number];

function readEnv(name: RequiredEnvVar): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function assertRequiredEnv() {
  for (const envVar of REQUIRED_ENV_VARS) {
    readEnv(envVar);
  }
}

export const env = {
  DATABASE_URL: readEnv("DATABASE_URL"),
  JWT_SECRET: readEnv("JWT_SECRET"),
  GEMINI_API_KEY: readEnv("GEMINI_API_KEY"),
  /** Primary model (Google AI Studio: avoid "pro" on free tier; use 2.0/2.5 flash). */
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  /** Second pass / backup when the primary is unavailable in your region. */
  GEMINI_MODEL_FALLBACK: process.env.GEMINI_MODEL_FALLBACK || "gemini-2.5-flash",
  AI_BUDGET_MODE: process.env.AI_BUDGET_MODE || "low",
  AI_DAILY_CALL_LIMIT: Number(process.env.AI_DAILY_CALL_LIMIT || "300"),
  AI_CACHE_TTL_MS: Number(process.env.AI_CACHE_TTL_MS || "86400000"),
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID || "",
  /** Must match your processor region (e.g. asia-south1). Empty disables OCR until set. */
  GOOGLE_CLOUD_LOCATION: process.env.GOOGLE_CLOUD_LOCATION || "",
  GOOGLE_DOCUMENT_AI_PROCESSOR_ID: process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID || "",
  GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
  BREVO_API_KEY: process.env.BREVO_API_KEY || "",
  BREVO_SMTP_HOST: process.env.BREVO_SMTP_HOST || "",
  BREVO_SMTP_PORT: Number(process.env.BREVO_SMTP_PORT || "587"),
  BREVO_SMTP_LOGIN: process.env.BREVO_SMTP_LOGIN || "",
  BREVO_SMTP_KEY: process.env.BREVO_SMTP_KEY || "",
  BREVO_FROM_EMAIL: process.env.BREVO_FROM_EMAIL || process.env.BREVO_SMTP_LOGIN || "",
  ALERT_SLACK_WEBHOOK_URL: process.env.ALERT_SLACK_WEBHOOK_URL || "",
  ALERT_EMAIL_TO: process.env.ALERT_EMAIL_TO || "",
};
