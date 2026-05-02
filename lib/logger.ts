import { randomUUID } from "crypto";
import { sendOperationalAlert } from "@/lib/alerts";

type LogContext = {
  route: string;
  requestId: string;
  userId?: string;
  meta?: Record<string, unknown>;
};

const errorWindow = new Map<string, { count: number; resetAt: number }>();

export function getRequestId(req: Request) {
  return req.headers.get("x-request-id") || randomUUID();
}

export function logInfo(message: string, context: LogContext) {
  console.info(JSON.stringify({ level: "info", message, ...context }));
}

export function logError(message: string, context: LogContext, error: unknown) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ level: "error", message, error: errorMessage, ...context }));
  const key = context.route;
  const now = Date.now();
  const current = errorWindow.get(key);
  const windowMs = 5 * 60 * 1000;
  if (!current || now > current.resetAt) {
    errorWindow.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  errorWindow.set(key, current);
  if (current.count === 5) {
    void sendOperationalAlert(
      "High 5xx Error Spike",
      `Route: ${context.route}\nRequestId: ${context.requestId}\nCount in 5m: ${current.count}\nLatest: ${errorMessage}`
    );
  }
}
