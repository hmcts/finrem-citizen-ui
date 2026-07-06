import { AxiosError } from 'axios';
import { NextFunction, Request, Response } from 'express';

import { ViewNames } from '../common-constants';
import { AppInsights } from '../modules/appinsights';

const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('global-error-handler');

const DEFAULT_ERROR_MESSAGE = 'Unexpected error';

type ErrorLike = {
  message?: unknown;
  stack?: unknown;
  status?: unknown;
  statusCode?: unknown;
};

function isErrorLike(error: unknown): error is ErrorLike {
  return typeof error === 'object' && error !== null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error || isErrorLike(error)) {
    return typeof error.message === 'string' && error.message ? error.message : DEFAULT_ERROR_MESSAGE;
  }

  return typeof error === 'string' && error ? error : DEFAULT_ERROR_MESSAGE;
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  const normalisedError = new Error(getErrorMessage(error));

  if (isErrorLike(error) && typeof error.stack === 'string') {
    normalisedError.stack = error.stack;
  }

  return normalisedError;
}

function getStatusCode(error: unknown): number {
  if (!isErrorLike(error)) {
    return 500;
  }

  const status = Number(error.status || error.statusCode);

  return status >= 400 && status < 600 ? status : 500;
}

function getTelemetryProperties(req: Request, statusCode: number): Record<string, string> {
  return {
    method: req.method,
    statusCode: statusCode.toString(),
    url: req.originalUrl || req.url,
  };
}

export function globalErrorHandler(error: unknown, req: Request, res: Response, next: NextFunction): void {
  const normalisedError = toError(error);
  const statusCode = getStatusCode(error);

  logger.error(normalisedError.stack || normalisedError.message);
  AppInsights.trackException(normalisedError, getTelemetryProperties(req, statusCode));

  if (res.headersSent) {
    next(normalisedError);
    return;
  }

  res.locals.message = normalisedError.message;
  res.locals.error = process.env.NODE_ENV === 'development' ? normalisedError : {};
  res.status(statusCode);
  res.render(ViewNames.Error);
}

export function trackApiClientExceptionTelemetry(
  error: unknown,
  errorMessage: string
): void {
  const axiosError = error as AxiosError;

  AppInsights.trackException(
    error instanceof Error ? error : new Error(errorMessage),
    {
      method: axiosError.config?.method ?? 'unknown',
      url: axiosError.config?.url ?? 'unknown',
      statusCode: String(axiosError.response?.status ?? 0),
    }
  );
}
