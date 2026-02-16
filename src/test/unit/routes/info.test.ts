import { infoRequestHandler } from '@hmcts/info-provider';
import { Router } from 'express';

import infoRoute from '../../../main/routes/info';

jest.mock('@hmcts/info-provider', () => ({
  infoRequestHandler: jest.fn(() => jest.fn()),
}));

describe('routes/info', () => {
  it('should register a GET /info route', () => {
    const app = {
      get: jest.fn(),
    } as unknown as Router;

    infoRoute(app);

    expect(app.get).toHaveBeenCalledWith('/info', expect.any(Function));
  });

  it('should call infoRequestHandler with extra build info', () => {
    const app = {
      get: jest.fn(),
    } as unknown as Router;

    infoRoute(app);

    expect(infoRequestHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        extraBuildInfo: expect.objectContaining({
          name: 'expressjs-template',
          host: expect.any(String),
          uptime: expect.any(Number),
        }),
      })
    );
  });
});
