import { describe, expect, it, jest } from '@jest/globals';
import type { Application, Request, Response } from 'express';

import { RouteNames, ViewNames } from '../../main/common-constants';
import setupCsrfErrorRoute from '../../main/routes/csrf-error';

type RouteHandler = (req: Request, res: Response) => void;

function getRegisteredHandler(mockFn: jest.Mock, route: string): RouteHandler {
  const call = mockFn.mock.calls.find((entry: unknown[]) => entry[0] === route);

  if (!call) {
    throw new Error(`Expected route handler for ${route} to be registered`);
  }

  return call[1] as RouteHandler;
}

describe('CSRF error route', () => {
  it('renders the expected error view with status 400', () => {
    const mockGet = jest.fn();
    const app = {
      get: mockGet,
    } as unknown as Application;

    setupCsrfErrorRoute(app);

    const handler = getRegisteredHandler(mockGet, RouteNames.csrfError);
    const req = {} as Request;
    const render = jest.fn();
    const status = jest.fn().mockReturnValue({ render });
    const res = {
      status,
    } as unknown as Response;

    handler(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(render).toHaveBeenCalledWith(ViewNames.Error);
  });
});
