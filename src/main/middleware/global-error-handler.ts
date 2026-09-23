import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

import { RouteNames, ViewNames } from '../constants';
import { AppInsights } from '../modules/appinsights';
import { CSRFToken } from '../modules/csrf';

const { Logger } = require('@hmcts/nodejs-logging');

const logger = Logger.getLogger('global-error-handler');

const DEFAULT_ERROR_MESSAGE = 'Unexpected error';

type ErrorLike = {
  message?: unknown;
  stack?: unknown;
  status?: unknown;
  statusCode?: unknown;
  code?: unknown;
};

function isErrorLike(error: unknown): error is ErrorLike {
  return typeof error === 'object' && error !== null;
}

function isCsrfValidationError(error: unknown): boolean {
  return isErrorLike(error) && error.code === CSRFToken.VALIDATION_ERROR_CODE;
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

  const rawStatus = error.status ?? error.statusCode;
  const status = Number(rawStatus);

  return Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
}

function getTelemetryProperties(req: Request, statusCode: number, errorId: string): Record<string, string> {
  return {
    errorId,
    method: req.method,
    statusCode: statusCode.toString(),
    url: req.originalUrl || req.url,
    idamUserId: req.session?.user?.id || 'not-available',
    caseReference: req.session?.caseNumber?.trim() || 'not-available',
    sessionId: req.session?.id || 'not-available',
  };
}

export function globalErrorHandler(error: unknown, req: Request, res: Response, next: NextFunction): void {
  const normalisedError = toError(error);
  const statusCode = getStatusCode(error);
  const errorId = randomUUID();

  const telemetryProperties = getTelemetryProperties(req, statusCode, errorId);

  logger.error(`[${errorId}] ${normalisedError.stack || normalisedError.message}`);
  logger.error(`[${errorId}] context=${JSON.stringify(telemetryProperties)}`);

  AppInsights.trackException(normalisedError, telemetryProperties);

  if (res.headersSent) {
    next(normalisedError);
    return;
  }

  if (isCsrfValidationError(error)) {
    res.redirect(RouteNames.csrfError);
    return;
  }

  res.locals.message = normalisedError.message;
  res.locals.error = process.env.NODE_ENV === 'development' ? normalisedError : {};
  res.locals.errorId = errorId; 

  res.status(statusCode);
  res.render(ViewNames.Error);
}
