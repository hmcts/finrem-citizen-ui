import { describe, expect, jest, test } from '@jest/globals';
import config from 'config';

import { PublicRoutes } from '../../../main/constants';

jest.mock('config', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

import setupCookiesRoute from '../../../main/routes/cookies';

type ConfigModule = {
  get: <T>(key: string) => T;
};

describe('cookies route', () => {
  test('registers GET /cookies and renders cookies view', () => {
    const mockedConfig = config as unknown as jest.Mocked<ConfigModule>;
    mockedConfig.get.mockReturnValue('finrem_session');

    const get = jest.fn();
    const app = { get } as unknown as { get: (path: string, handler: (...args: unknown[]) => void) => void };

    setupCookiesRoute(app as never);

    expect(get).toHaveBeenCalledTimes(1);
    expect(get.mock.calls[0][0]).toBe(PublicRoutes.cookies);

    const handler = get.mock.calls[0][1] as (
      _req: unknown,
      res: { render: (viewName: string, options?: Record<string, unknown>) => void }
    ) => void;
    const render = jest.fn();

    handler({}, { render });

    expect(mockedConfig.get).toHaveBeenCalledWith('session.cookieName');
    expect(render).toHaveBeenCalledWith('cookies', { sessionCookieName: 'finrem_session' });
  });
});
