import type { Request, Response } from 'express';

const DEFAULT_COOKIE_NAME = 'REFRESH_TOKEN';
const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;

export function getRefreshTokenCookieName(): string {
  return process.env['REFRESH_TOKEN_COOKIE_NAME'] ?? DEFAULT_COOKIE_NAME;
}

export function parseCookies(req: Request): Record<string, string> {
  const rawCookieHeader = req.headers.cookie;

  if (!rawCookieHeader) {
    return {};
  }

  return rawCookieHeader
    .split(';')
    .reduce<Record<string, string>>((acc, part) => {
      const [rawKey, ...rawValueParts] = part.trim().split('=');

      if (!rawKey || rawValueParts.length === 0) {
        return acc;
      }

      acc[rawKey] = decodeURIComponent(rawValueParts.join('='));
      return acc;
    }, {});
}

export function setRefreshTokenCookie(
  res: Response,
  token: string,
  expiresAt: Date,
): void {
  res.cookie(getRefreshTokenCookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    path: '/api/auth',
    expires: expiresAt,
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.cookie(getRefreshTokenCookieName(), '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    path: '/api/auth',
    expires: new Date(Date.now() - THIRTY_DAYS_IN_MS),
  });
}
