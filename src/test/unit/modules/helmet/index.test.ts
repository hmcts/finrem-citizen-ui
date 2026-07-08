import { describe, expect, it, jest } from '@jest/globals';
import type { Express } from 'express';
import helmet from 'helmet';

import { Helmet } from '../../../../main/modules/helmet';

jest.mock('helmet', () => ({
  __esModule: true,
  default: jest.fn(() => jest.fn()),
}));

describe('Helmet', () => {
  it('allows Google Analytics and Google Tag Manager endpoints in the content security policy', () => {
    const app = { use: jest.fn() } as unknown as Express;

    new Helmet(false).enableFor(app);

    expect(helmet).toHaveBeenCalledWith(
      expect.objectContaining({
        contentSecurityPolicy: {
          directives: expect.objectContaining({
            connectSrc: ["'self'", '*.google-analytics.com', 'www.googletagmanager.com'],
            imgSrc: ["'self'", '*.google-analytics.com', 'www.googletagmanager.com'],
            scriptSrc: expect.arrayContaining(['*.google-analytics.com', 'www.googletagmanager.com']),
          }),
        },
      })
    );
  });
});
