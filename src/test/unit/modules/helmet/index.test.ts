import { describe, expect, it, jest } from '@jest/globals';
import type { Express } from 'express';
import helmet from 'helmet';

import { Helmet } from '../../../../main/modules/helmet';

jest.mock('helmet', () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn()),
}));

describe('Helmet', () => {
  it('allows Google Tag Manager endpoints and the per-response nonce in the content security policy', () => {
    const app = { use: jest.fn() } as unknown as Express;

    new Helmet(false).enableFor(app);

    const helmetMock = helmet as unknown as jest.Mock;
    const options = helmetMock.mock.calls[0][0] as {
      contentSecurityPolicy: {
        directives: Record<string, unknown[]>;
      };
    };
    const { directives } = options.contentSecurityPolicy;
    const scriptSrc = directives.scriptSrc;
    const nonceDirective = scriptSrc.find(directive => typeof directive === 'function') as (
      req: unknown,
      res: { locals: { cspNonce: string } }
    ) => string;

    expect(directives.connectSrc).toEqual([
      "'self'",
      'https://*.google-analytics.com',
      'https://*.analytics.google.com',
      'https://www.googletagmanager.com',
      'https://*.googletagmanager.com',
    ]);
    expect(directives.frameSrc).toEqual(['https://www.googletagmanager.com']);
    expect(directives.imgSrc).toEqual([
      "'self'",
      'https://*.google-analytics.com',
      'https://www.googletagmanager.com',
      'https://*.googletagmanager.com',
    ]);
    expect(scriptSrc).toEqual(
      expect.arrayContaining(['https://www.googletagmanager.com', 'https://*.googletagmanager.com'])
    );
    expect(nonceDirective({}, { locals: { cspNonce: 'abc123' } })).toBe("'nonce-abc123'");
  });
});
