import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

interface Attempt {
  count: number;
  firstAt: number;
}

const WINDOW_MS = 60_000; // 1 minute
const MAX_ATTEMPTS = 10;

const globalForLimiter = globalThis as unknown as {
  loginAttempts?: Map<string, Attempt>;
};

const attempts = globalForLimiter.loginAttempts ?? new Map<string, Attempt>();
globalForLimiter.loginAttempts = attempts;

function clientKey(req: Request): string {
  const username = typeof req.body?.username === 'string' ? req.body.username.toLowerCase() : '';
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  return `${ip}|${username}`;
}

export function loginRateLimit(req: Request, _res: Response, next: NextFunction): void {
  const now = Date.now();
  const key = clientKey(req);

  // Periodic sweep so the map does not grow unbounded.
  if (attempts.size > 10_000) {
    for (const [k, v] of attempts) {
      if (now - v.firstAt > WINDOW_MS) attempts.delete(k);
    }
  }

  const entry = attempts.get(key);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
    return next();
  }

  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) {
    next(new ApiError(429, 'Too many login attempts. Please wait a minute and try again.'));
    return;
  }
  next();
}
