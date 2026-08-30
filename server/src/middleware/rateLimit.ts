import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

interface Attempt {
  count: number;
  firstAt: number;
}

const WINDOW_MS = 60_000; // 1 minute
const MAX_ATTEMPTS = 10;
const API_MAX_REQUESTS = 300; // 300 requests per minute per IP for general API

const globalForLimiter = globalThis as unknown as {
  loginAttempts?: Map<string, Attempt>;
  apiAttempts?: Map<string, Attempt>;
};

const attempts = globalForLimiter.loginAttempts ?? new Map<string, Attempt>();
globalForLimiter.loginAttempts = attempts;

const apiAttempts = globalForLimiter.apiAttempts ?? new Map<string, Attempt>();
globalForLimiter.apiAttempts = apiAttempts;

function clientKey(req: Request): string {
  const username = typeof req.body?.username === 'string' ? req.body.username.toLowerCase() : '';
  const ip = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  return `${ip}|${username}`;
}

function ipKey(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? 'unknown';
}

function checkRateLimit(
  map: Map<string, Attempt>,
  key: string,
  max: number,
  next: NextFunction,
  message: string,
): void {
  const now = Date.now();
  if (map.size > 10_000) {
    for (const [k, v] of map) {
      if (now - v.firstAt > WINDOW_MS) map.delete(k);
    }
  }
  const entry = map.get(key);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    map.set(key, { count: 1, firstAt: now });
    return next();
  }
  entry.count += 1;
  if (entry.count > max) {
    next(new ApiError(429, message));
    return;
  }
  next();
}

export function loginRateLimit(req: Request, _res: Response, next: NextFunction): void {
  checkRateLimit(attempts, clientKey(req), MAX_ATTEMPTS, next, 'Too many login attempts. Please wait a minute and try again.');
}

export function apiRateLimit(req: Request, _res: Response, next: NextFunction): void {
  checkRateLimit(apiAttempts, ipKey(req), API_MAX_REQUESTS, next, 'Too many requests. Please slow down.');
}
