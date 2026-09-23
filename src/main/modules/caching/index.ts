import type { NextFunction, Request, Response } from 'express';
import * as path from 'path';

const CACHED_ASSET_FILE_TYPES = /\.(woff2?|ttf|otf|eot|svg|png|css|js)$/i;
const CACHED_ASSET_CACHE_MAX_AGE_SECONDS = 604800;

export function setStaticCachingPolicy(res: Response, filePath: string): void {
  if (path.extname(filePath).match(CACHED_ASSET_FILE_TYPES)) {
    res.setHeader('Cache-Control', `max-age=${CACHED_ASSET_CACHE_MAX_AGE_SECONDS}`);
  }
}

export function setNoStoreForHtmlRequests(req: Request, res: Response, next: NextFunction): void {
  if (req.accepts('html')) {
    res.setHeader('Cache-Control', 'no-store');
  }

  next();
}
