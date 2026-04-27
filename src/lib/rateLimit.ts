const requests = new Map<string, { count: number; reset: number }>();

export function checkRateLimit(ip: string, limit = 5, windowMs = 120_000) {
  const now = Date.now();
  const entry = requests.get(ip);

  if (!entry || now > entry.reset) {
    requests.set(ip, { count: 1, reset: now + windowMs });
    return false;
  }

  if (entry.count >= limit) {
    return true;
  }

  entry.count++;
  return false;
}
