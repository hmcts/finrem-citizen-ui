import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';

import { ViewNames } from '../../../main/common-constants';
import { globalErrorHandler } from '../../../main/middleware/global-error-handler';
import { AppInsights } from '../../../main/modules/appinsights';

jest.mock('@hmcts/nodejs-logging', () => {
  const logger = {
    error: jest.fn(),
  };

  return {
    __mockLogger: logger,
    Logger: {
      getLogger: jest.fn(() => logger),
    },
  };
});

type MockResponse = Response & {
  locals: Record<string, unknown>;
  status: jest.MockedFunction<(statusCode: number) => Response>;
  render: jest.MockedFunction<(view: string) => void>;
};

type MockLogger = {
  error: jest.Mock;
};

type LoggingMock = {
  __mockLogger: MockLogger;
};

function getMockLogger(): MockLogger {
  const loggingMock = jest.requireMock('@hmcts/nodejs-logging') as LoggingMock;

  return loggingMock.__mockLogger;
}

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    originalUrl: '/problem?x=1',
    url: '/problem?x=1',
    ...overrides,
  } as unknown as Request;
}

function makeRes(headersSent = false): MockResponse {
  const res = {
    headersSent,
    locals: {},
    status: jest.fn(),
    render: jest.fn(),
  } as unknown as MockResponse;

  res.status.mockReturnValue(res);

  return res;
}

describe('globalErrorHandler', () => {
  let next: NextFunction;
  let trackExceptionSpy: jest.SpiedFunction<typeof AppInsights.trackException>;
  let mockLogger: MockLogger;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    next = jest.fn();
    mockLogger = getMockLogger();
    trackExceptionSpy = jest.spyOn(AppInsights, 'trackException').mockImplementation(() => undefined);
  });

  it('renders the error page and tracks Error instances in AppInsights', () => {
    process.env.NODE_ENV = 'production';
    const error = Object.assign(new Error('Request failed'), { status: 400 });
    const req = makeReq({ method: 'POST', originalUrl: '/submit', url: '/submit' });
    const res = makeRes();

    globalErrorHandler(error, req, res, next);

    expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Request failed'));
    expect(trackExceptionSpy).toHaveBeenCalledWith(error, {
      method: 'POST',
      statusCode: '400',
      url: '/submit',
    });
    expect(res.locals.message).toBe('Request failed');
    expect(res.locals.error).toEqual({});
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.render).toHaveBeenCalledWith(ViewNames.Error);
    expect(next).not.toHaveBeenCalled();
  });

  it('normalises error-like objects and keeps them visible in development', () => {
    process.env.NODE_ENV = 'development';
    const req = makeReq({ method: 'PATCH' });
    const res = makeRes();

    globalErrorHandler(
      {
        message: 'Object failure',
        stack: 'Object stack',
        statusCode: 503,
      },
      req,
      res,
      next
    );

    expect(mockLogger.error).toHaveBeenCalledWith('Object stack');
    expect(trackExceptionSpy).toHaveBeenCalledWith(expect.any(Error), {
      method: 'PATCH',
      statusCode: '503',
      url: '/problem?x=1',
    });
    expect(res.locals.message).toBe('Object failure');
    expect(res.locals.error).toBeInstanceOf(Error);
    expect((res.locals.error as Error).message).toBe('Object failure');
    expect(res.status).toHaveBeenCalledWith(503);
  });

  it('falls back to a server error for invalid status codes and missing messages', () => {
    const req = makeReq({ originalUrl: '', url: '/fallback-url' });
    const res = makeRes();

    globalErrorHandler({ status: 200 }, req, res, next);

    expect(trackExceptionSpy).toHaveBeenCalledWith(expect.any(Error), {
      method: 'GET',
      statusCode: '500',
      url: '/fallback-url',
    });
    expect(res.locals.message).toBe('Unexpected error');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith(ViewNames.Error);
  });

  it('normalises string errors', () => {
    const req = makeReq();
    const res = makeRes();

    globalErrorHandler('String failure', req, res, next);

    expect(trackExceptionSpy).toHaveBeenCalledWith(expect.any(Error), {
      method: 'GET',
      statusCode: '500',
      url: '/problem?x=1',
    });
    expect(res.locals.message).toBe('String failure');
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('delegates to Express when headers have already been sent', () => {
    const error = new Error('Headers already sent');
    const req = makeReq();
    const res = makeRes(true);

    globalErrorHandler(error, req, res, next);

    expect(trackExceptionSpy).toHaveBeenCalledWith(error, {
      method: 'GET',
      statusCode: '500',
      url: '/problem?x=1',
    });
    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.render).not.toHaveBeenCalled();
  });
});
