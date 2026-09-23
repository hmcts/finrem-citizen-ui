import { describe, expect, it, jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';

import { setNoStoreForHtmlRequests, setStaticCachingPolicy } from '../../../../main/modules/caching';

describe('setStaticCachingPolicy', () => {
  it('sets cache header for configured static asset extensions', () => {
    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;

    setStaticCachingPolicy(res, '/public/main.123abc.css');

    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'max-age=604800');
  });

  it('sets cache header for jpeg assets', () => {
    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;

    setStaticCachingPolicy(res, '/public/hero-image.jpeg');

    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'max-age=604800');
  });

  it('does not set cache header for non-configured extensions', () => {
    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;

    setStaticCachingPolicy(res, '/public/config.json');

    expect(res.setHeader).not.toHaveBeenCalled();
  });
});

describe('setNoStoreForHtmlRequests', () => {
  it('sets no-store when request accepts html', () => {
    const req = {
      accepts: jest.fn().mockReturnValue('html'),
    } as unknown as Request;
    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    setNoStoreForHtmlRequests(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not set no-store when request does not accept html', () => {
    const req = {
      accepts: jest.fn().mockReturnValue(false),
    } as unknown as Request;
    const res = {
      setHeader: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    setNoStoreForHtmlRequests(req, res, next);

    expect(res.setHeader).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
