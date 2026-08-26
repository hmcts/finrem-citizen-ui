import { describe, expect, jest, test } from '@jest/globals';

import setupCookiesRoute from '../../../main/routes/cookies';

describe('cookies route', () => {
  test('registers GET /cookies and renders cookies view', () => {
    const get = jest.fn();
    const app = { get } as unknown as { get: (path: string, handler: (...args: unknown[]) => void) => void };

    setupCookiesRoute(app as never);

    expect(get).toHaveBeenCalledTimes(1);
    expect(get.mock.calls[0][0]).toBe('/cookies');

    const handler = get.mock.calls[0][1] as (_req: unknown, res: { render: (viewName: string) => void }) => void;
    const render = jest.fn();

    handler({}, { render });

    expect(render).toHaveBeenCalledWith('cookies');
  });
});
