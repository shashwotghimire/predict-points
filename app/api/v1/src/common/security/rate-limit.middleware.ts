import type { NextFunction, Request, Response } from 'express';

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message: string;
  keyPrefix: string;
};

export function createRateLimitMiddleware(options: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();
  const cleanupInterval = setInterval(
    () => {
      const now = Date.now();
      for (const [key, bucket] of buckets.entries()) {
        if (bucket.resetAt <= now) buckets.delete(key);
      }
    },
    Math.max(options.windowMs, 30_000),
  );
  cleanupInterval.unref?.();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const source = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${options.keyPrefix}:${source}`;
    const current = buckets.get(key);

    const bucket: Bucket =
      !current || current.resetAt <= now
        ? { count: 0, resetAt: now + options.windowMs }
        : current;

    bucket.count += 1;
    buckets.set(key, bucket);

    const remaining = Math.max(0, options.max - bucket.count);
    res.setHeader('X-RateLimit-Limit', String(options.max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader(
      'X-RateLimit-Reset',
      String(Math.floor(bucket.resetAt / 1000)),
    );

    if (bucket.count > options.max) {
      return res.status(429).json({
        statusCode: 429,
        message: options.message,
      });
    }

    return next();
  };
}
