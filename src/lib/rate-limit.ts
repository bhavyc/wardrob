export class RateLimiter {
  private map = new Map<string, { count: number; lastReset: number }>();

  constructor(private limit: number, private windowMs: number) {}

  check(ip: string): boolean {
    const now = Date.now();
    const record = this.map.get(ip);

    if (!record) {
      this.map.set(ip, { count: 1, lastReset: now });
      return true;
    }

    if (now - record.lastReset > this.windowMs) {
      record.count = 1;
      record.lastReset = now;
      return true;
    }

    if (record.count >= this.limit) {
      return false;
    }

    record.count += 1;
    return true;
  }
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return 'unknown-ip';
}
