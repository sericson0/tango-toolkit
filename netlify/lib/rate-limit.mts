/**
 * Simple in-memory rate limiter for Netlify Functions.
 *
 * Limits requests per IP within a sliding time window. Works within a
 * single warm function instance — requests across cold starts are not
 * tracked, but this still prevents burst abuse from a single client.
 */

const stores = new Map<string, Map<string, number[]>>();

export interface RateLimitOptions {
  /** Max requests allowed per window (default: 10) */
  max?: number;
  /** Window duration in seconds (default: 60) */
  windowSeconds?: number;
}

/**
 * Returns a 429 Response if the IP has exceeded the limit, or null if
 * the request is allowed.
 */
export function checkRateLimit(
  req: Request,
  name: string,
  opts: RateLimitOptions = {}
): Response | null {
  const { max = 10, windowSeconds = 60 } = opts;

  const ip =
    req.headers.get("x-nf-client-connection-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  const store = stores.get(name)!;

  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  let timestamps = store.get(ip) || [];
  // Remove entries outside the window
  timestamps = timestamps.filter((t) => now - t < windowMs);

  if (timestamps.length >= max) {
    return new Response("Too many requests. Please try again later.", {
      status: 429,
      headers: {
        "Retry-After": String(windowSeconds),
      },
    });
  }

  timestamps.push(now);
  store.set(ip, timestamps);

  // Periodically clean up old IPs to prevent memory growth
  if (store.size > 1000) {
    for (const [key, ts] of store) {
      if (ts.every((t) => now - t >= windowMs)) {
        store.delete(key);
      }
    }
  }

  return null;
}
