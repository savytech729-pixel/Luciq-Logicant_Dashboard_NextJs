const buckets = new Map<string, { count: number; resetAt: number }>();

type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
};

export function checkRateLimit(config: RateLimitConfig) {
  const now = Date.now();
  const bucket = buckets.get(config.key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(config.key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true };
  }

  if (bucket.count >= config.limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  buckets.set(config.key, bucket);
  return { allowed: true };
}
