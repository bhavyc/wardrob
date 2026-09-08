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
  const realIp = request.headers.get('x-real-ip');
  if (realIp && realIp.trim().length > 0) {
    return realIp.trim();
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp && cfConnectingIp.trim().length > 0) {
    return cfConnectingIp.trim();
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const rawIp = forwardedFor.split(',')[0]?.trim();
    if (rawIp && /^[\da-fA-F.:]+$/.test(rawIp)) {
      return rawIp;
    }
  }

  return '127.0.0.1';
}
