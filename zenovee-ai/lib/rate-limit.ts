type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();

export function resolveClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  return forwardedFor.split(",")[0]?.trim() || "0.0.0.0";
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = store.get(key);

  if (!current || now >= current.resetAt) {
    const next: Bucket = { count: 1, resetAt: now + windowMs };
    store.set(key, next);
    return { allowed: true, remaining: Math.max(0, limit - 1), retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  store.set(key, current);
  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}
