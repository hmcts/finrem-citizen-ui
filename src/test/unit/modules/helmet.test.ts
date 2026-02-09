import * as express from 'express';

import { Helmet } from '../../../main/modules/helmet';

jest.mock('helmet', () => {
  const helmetFn = jest.fn(() => jest.fn());
  return {
    __esModule: true,
    default: helmetFn,
  };
});

describe('modules/helmet', () => {
  let app: Partial<express.Express>;

  beforeEach(() => {
    app = {
      use: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should apply helmet middleware', () => {
    const helmetModule = new Helmet(false);
    helmetModule.enableFor(app as express.Express);

    expect(app.use).toHaveBeenCalled();
  });

  it('should include unsafe-eval in dev mode', () => {
    const helmet = require('helmet').default;

    const helmetModule = new Helmet(true);
    helmetModule.enableFor(app as express.Express);

    expect(helmet).toHaveBeenCalledWith(
      expect.objectContaining({
        contentSecurityPolicy: expect.objectContaining({
          directives: expect.objectContaining({
            scriptSrc: expect.arrayContaining(["'unsafe-eval'"]),
          }),
        }),
      })
    );
  });

  it('should not include unsafe-eval in production mode', () => {
    const helmet = require('helmet').default;

    const helmetModule = new Helmet(false);
    helmetModule.enableFor(app as express.Express);

    expect(helmet).toHaveBeenCalledWith(
      expect.objectContaining({
        contentSecurityPolicy: expect.objectContaining({
          directives: expect.objectContaining({
            scriptSrc: expect.not.arrayContaining(["'unsafe-eval'"]),
          }),
        }),
      })
    );
  });
});
