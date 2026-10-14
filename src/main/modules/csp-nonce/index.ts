import crypto from 'crypto';
import type { RequestHandler } from 'express';

export const setCspNonce: RequestHandler = (_req, res, next) => {
  res.locals.nonce = crypto.randomUUID().replace(/-/g, '');
  next();
};
