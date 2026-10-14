import { describe, expect, it, jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';

import { setCspNonce } from '../../../../main/modules/csp-nonce';

describe('setCspNonce', () => {
  it('stores a nonce for each response', () => {
    const req = {} as Request;
    const res = { locals: {} } as unknown as Response;
    const next = jest.fn() as NextFunction;

    setCspNonce(req, res, next);

    expect(res.locals.nonce).toEqual(expect.any(String));
    expect((res.locals.nonce as string).length).toBeGreaterThan(0);
    expect((res.locals.nonce as string)).not.toContain('-');
    expect(next).toHaveBeenCalledWith();
  });

  it('generates a different nonce for subsequent requests', () => {
    const req = {} as Request;
    const firstResponse = { locals: {} } as unknown as Response;
    const secondResponse = { locals: {} } as unknown as Response;
    const next = jest.fn() as NextFunction;

    setCspNonce(req, firstResponse, next);
    setCspNonce(req, secondResponse, next);

    expect(firstResponse.locals.nonce).not.toEqual(secondResponse.locals.nonce);
  });
});
