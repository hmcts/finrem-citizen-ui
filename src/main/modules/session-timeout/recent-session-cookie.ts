import config from 'config';
import type { CookieOptions, Response } from 'express';

export const RECENT_SESSION_COOKIE = 'fcui-recent-session';

const GRACE_PERIOD_SECONDS = 30 * 60;

function cookieOptions(): CookieOptions {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };
}

export function setRecentSessionCookie(res: Response): void {
  const sessionTtl = config.get<number>('session.ttlInSeconds');

  res.cookie(RECENT_SESSION_COOKIE, '1', {
    ...cookieOptions(),
    maxAge: (sessionTtl + GRACE_PERIOD_SECONDS) * 1000,
  });
}

export function clearRecentSessionCookie(res: Response): void {
  res.clearCookie(RECENT_SESSION_COOKIE, cookieOptions());
}
