import { describe, expect, it, jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';

const passThroughMiddleware = (_req: Request, _res: Response, next: NextFunction): void => next();
const noopModuleClass = class {
  public enableFor(): void {}
};

type AppMiddlewareStack = { handle: unknown }[];
type AppWithStack = {
  router?: { stack?: AppMiddlewareStack };
  _router?: { stack?: AppMiddlewareStack };
};

function getMiddlewareStack(app: unknown): AppMiddlewareStack {
  const typedApp = app as AppWithStack;
  return typedApp.router?.stack || typedApp._router?.stack || [];
}

jest.mock('config', () => ({
  get: jest.fn((key: string) => (key === 'useCSRFProtection' ? true : undefined)),
}));

jest.mock('glob', () => ({
  glob: {
    sync: jest.fn(() => []),
  },
}));

jest.mock('../../../main/development', () => ({
  setupDev: jest.fn(),
}));

jest.mock('../../../main/middleware', () => ({
  caseContextMiddleware: passThroughMiddleware,
  contactEmailMiddleware: passThroughMiddleware,
  globalErrorHandler: jest.fn(),
  routeAccessMiddleware: passThroughMiddleware,
}));

jest.mock('../../../main/modules/appinsights', () => ({
  AppInsights: class {
    public enable(): void {}
  },
}));

jest.mock('../../../main/modules/nunjucks', () => ({
  Nunjucks: noopModuleClass,
}));

jest.mock('../../../main/modules/helmet', () => ({
  Helmet: noopModuleClass,
}));

jest.mock('../../../main/modules/properties-volume', () => ({
  PropertiesVolume: noopModuleClass,
}));

jest.mock('../../../main/modules/session', () => ({
  Session: noopModuleClass,
}));

jest.mock('../../../main/modules/csrf', () => ({
  CSRFToken: noopModuleClass,
}));

jest.mock('../../../main/modules/oidc', () => ({
  OIDCModule: noopModuleClass,
}));

jest.mock('../../../main/modules/rate-limiter', () => ({
  createDefaultRateLimiter: jest.fn(() => passThroughMiddleware),
}));

describe('app wiring', () => {
  it('configures static middleware with the static caching policy', async () => {
    jest.resetModules();

    const express = (await import('express')).default;
    const staticSpy = jest.spyOn(express, 'static');
    const { setStaticCachingPolicy } = await import('../../../main/modules/caching');

    await import('../../../main/app');

    expect(staticSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ setHeaders: setStaticCachingPolicy })
    );
  });

  it('registers no store for HTML requests', async () => {
    jest.resetModules();

    const { setNoStoreForHtmlRequests } = await import('../../../main/modules/caching');
    const { app } = await import('../../../main/app');

    expect(
      getMiddlewareStack(app).some(layer => layer.handle === setNoStoreForHtmlRequests)
    ).toBe(true);
  });
});