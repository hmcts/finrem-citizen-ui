import config from 'config';
import { Application, NextFunction, Request, Response } from 'express';

import { RouteNames } from '../common-constants';

function nonProdOnly(req: Request, res: Response, next: NextFunction) {
  const env = process.env.NODE_ENV || 'development';
  const allowedEnvs = ['local', 'development', 'test', 'aat', 'preview'];
  
  if (!allowedEnvs.includes(env)) {
    return res.status(404).send('Not Found');
  }
  
  next();
}

function buildSafeConfig(): Record<string, unknown> {
  const urls: Record<string, unknown> = {};
  
  if (config.has('services')) {
    const services = config.get<Record<string, unknown>>('services');
    urls.services = extractUrls(services);
  }
  
  if (config.has('oidc')) {
    const oidc = config.get<Record<string, unknown>>('oidc');
    urls.oidc = extractUrls(oidc);
  }
  
  return urls;
}

function extractUrls(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && (key.toLowerCase().includes('url') || key.toLowerCase() === 'issuer')) {
      result[key] = value;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nested = extractUrls(value as Record<string, unknown>);
      if (Object.keys(nested).length > 0) {
        result[key] = nested;
      }
    }
  }
  
  return result;
}

export default function setupConfigRoute(app: Application): void {
  app.get(RouteNames.config, nonProdOnly, (_req: Request, res: Response) => {
    const safeConfig = buildSafeConfig();
    res.status(200).json(safeConfig);
  });
}
