class RateLimiter {
  private timestamps: number[] = [];
  private windowMs: number;
  private maxRequests: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canRequest(): boolean {
    this.prune();
    return this.timestamps.length < this.maxRequests;
  }

  nextAvailableIn(): number {
    this.prune();
    if (this.timestamps.length < this.maxRequests) return 0;
    const oldest = this.timestamps[0];
    return Math.max(0, oldest + this.windowMs - Date.now());
  }

  recordRequest(): void {
    this.prune();
    this.timestamps.push(Date.now());
  }

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    const delay = this.nextAvailableIn();
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
    }
    this.recordRequest();
    return fn();
  }

  private prune(): void {
    const cutoff = Date.now() - this.windowMs;
    while (this.timestamps.length > 0 && this.timestamps[0] <= cutoff) {
      this.timestamps.shift();
    }
  }
}

export const perSecondLimiter = new RateLimiter(2, 1000);
export const perHourLimiter = new RateLimiter(1200, 3600_000);

export async function rateLimitedFetch<T>(fn: () => Promise<T>): Promise<T> {
  await perHourLimiter.throttle(() => perSecondLimiter.throttle(async () => undefined));
  return fn();
}
