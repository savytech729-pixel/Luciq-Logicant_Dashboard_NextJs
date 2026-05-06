/**
 * Detects when Next.js is running `next build` (including route evaluation).
 * Kept separate from `lib/env.ts` so middleware/auth can import it without
 * eagerly validating DATABASE_URL / GEMINI_API_KEY (which would 500 every page).
 */
export function useBuildTimeEnvPlaceholders(): boolean {
  if (process.env.SKIP_ENV_VALIDATION === "1") return true

  const phase = process.env.NEXT_PHASE
  if (phase === "phase-production-build" || phase === "phase-development-build") return true
  if (phase?.startsWith?.("phase-production-")) return true

  if (process.env.npm_lifecycle_event === "build") return true

  const argv = process.argv
  if (
    argv.includes("build") &&
    argv.some((a) => typeof a === "string" && (a.includes("next") || /next(\.js)?$/i.test(a)))
  ) {
    return true
  }

  return false
}
