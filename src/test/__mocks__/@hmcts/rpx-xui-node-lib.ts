// Mock for @hmcts/rpx-xui-node-lib for unit tests
import { RequestHandler } from 'express';

export const AUTH = {
  EVENT: {
    AUTHENTICATE_SUCCESS: 'authenticate_success',
  },
};

export const SESSION = {
  EVENT: {
    REDIS_CLIENT_READY: 'redis_client_ready',
    REDIS_CLIENT_ERROR: 'redis_client_error',
  },
};

// Mock xuiNode that doesn't make any network calls
export const xuiNode = {
  configure: (): RequestHandler => {
    return (_req, _res, next) => {
      next();
    };
  },
  on: (_event: string, _callback: unknown): void => {
    // Do nothing - just register the event listener without action
  },
};
