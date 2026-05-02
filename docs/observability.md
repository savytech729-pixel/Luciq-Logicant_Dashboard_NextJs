# Observability Notes

## Request Correlation
- Critical auth and AI-heavy APIs now emit a `requestId` in JSON responses.
- Structured logs include `route`, `requestId`, and `userId` where available.

## Recommended Alerting
- Track spikes of HTTP `429` on auth and screening routes.
- Track HTTP `5xx` count by route and environment.
- Trigger alert when `/api/admin/candidates/screen` failure rate exceeds 5% over 5 minutes.

## Log Shipping
- Send JSON logs to your platform log sink (Vercel logs, Datadog, or ELK).
- Index fields: `level`, `route`, `requestId`, `userId`.
