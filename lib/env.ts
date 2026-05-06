const REQUIRED_ENV_VARS = ["DATABASE_URL", "JWT_SECRET", "GEMINI_API_KEY"] as const;

type RequiredEnvVar = (typeof REQUIRED_ENV_VARS)[number]

/**
 * During `next build`, Next evaluates server route modules (e.g. Prisma + env) without
 * every production secret (unless each var is enabled for "Build" on Vercel). Use
 * placeholders only in this phase so the bundle can be produced; real requests still
 * need actual env vars at runtime.
 *
 * Note: Turbopack / "Collecting page data" often loads routes without setting
 * `NEXT_PHASE=phase-production-build`, so we also key off the package lifecycle and argv.
 */
function useBuildTimeEnvPlaceholders(): boolean {
  if (process.env.SKIP_ENV_VALIDATION === "1") return true

  const phase = process.env.NEXT_PHASE
  if (phase === "phase-production-build" || phase === "phase-development-build") return true
  if (phase?.startsWith?.("phase-production-")) return true

  // `pnpm run build` / `npm run build` — present on Vercel install + build steps
  if (process.env.npm_lifecycle_event === "build") return true

  // Fallback when lifecycle is missing (some CI / nested Next invocations)
  const argv = process.argv
  if (
    argv.includes("build") &&
    argv.some((a) => typeof a === "string" && (a.includes("next") || /next(\.js)?$/.test(a)))
  ) {
    return true
  }

  return false
}

function readEnv(name: RequiredEnvVar): string {
  const value = process.env[name]
  if (!value || value.trim().length === 0) {
    if (useBuildTimeEnvPlaceholders()) {
      return `__NEXT_BUILD_PLACEHOLDER_${name}__`
    }
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function assertRequiredEnv() {
  for (const envVar of REQUIRED_ENV_VARS) {
    readEnv(envVar)
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
