import { describe, expect, it, jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';

import { setNoStoreForHtmlRequests, setStaticCachingPolicy } from '../../../../main/modules/caching';

describe('setStaticCachingPolicy', () => {
  it.each([
    '/public/styles.css',
    '/public/javascsript.js',
    '/public/font.woff2',
    '/public/font.otf',
    '/public/font.ttf',
    '/public/font.eot',
    '/public/icon.svg',
    '/public/image.jpeg',
    '/public/image.jpg',
    '/public/image.png',
  ])('Caches static assets %s', filePath => {
    const res = { setHeader: jest.fn() } as unknown as Response;

    setStaticCachingPolicy(res, filePath);

    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'max-age=604800');
  });

  it.each(['/public/view.html'])('does not set cache header for non-cached asset %s', filePath => {
      const res = { setHeader: jest.fn() } as unknown as Response;

      setStaticCachingPolicy(res, filePath);

      expect(res.setHeader).not.toHaveBeenCalled();
    }
  );
});

describe('setNoStoreForHtmlRequests', () => {
  it('sets no-store when request accepts html', () => {
    const req = { accepts: jest.fn().mockReturnValue('html') } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;

    setNoStoreForHtmlRequests(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not set no-store when request does not accept html', () => {
    const req = { accepts: jest.fn().mockReturnValue(false) } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;
    const next = jest.fn() as NextFunction;

    setNoStoreForHtmlRequests(req, res, next);

    expect(res.setHeader).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
