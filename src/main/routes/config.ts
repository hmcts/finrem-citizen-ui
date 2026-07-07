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
  const safeConfig: Record<string, unknown> = {};
  const sensitiveKeys = ['secrets', 'systemPassword', 'clientSecret', 'secret'];
  
  const allKeys = Object.keys(config.util.toObject());
  
  for (const key of allKeys) {
    if (sensitiveKeys.includes(key)) {
      continue;
    }
    
    if (config.has(key)) {
      const value = config.get(key);
      
      if (key === 'services') {
        safeConfig[key] = filterSensitiveKeys(value as Record<string, unknown>, sensitiveKeys);
      } else {
        safeConfig[key] = value;
      }
    }
  }
  
  return safeConfig;
}

function filterSensitiveKeys(obj: Record<string, unknown>, sensitiveKeys: string[]): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.includes(key)) {
      continue;
    }
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      filtered[key] = filterSensitiveKeys(value as Record<string, unknown>, sensitiveKeys);
    } else {
      filtered[key] = value;
    }
  }
  
  return filtered;
}

export default function setupConfigRoute(app: Application): void {
  app.get(RouteNames.config, nonProdOnly, (_req: Request, res: Response) => {
    const safeConfig = buildSafeConfig();
    res.status(200).json(safeConfig);
  });
}
