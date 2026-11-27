import { describe, expect, jest, test } from '@jest/globals';

import { PublicRoutes } from '../../../main/constants';
import { renderLocalizedView } from '../../../main/modules/i18n';
import setupContactUsRoute from '../../../main/routes/contact-us';
import { generateContactUsContent } from '../../../main/views/contact-us/content';

jest.mock('../../../main/modules/i18n', () => ({
  renderLocalizedView: jest.fn(),
}));

describe('contact us route', () => {
  test('registers GET /contact-us and renders view', () => {
    const renderLocalizedViewMock = renderLocalizedView as jest.MockedFunction<typeof renderLocalizedView>;
    const get = jest.fn();
    const app = { get } as unknown as { get: (path: string, handler: (...args: unknown[]) => void) => void };

    setupContactUsRoute(app as never);

    expect(get).toHaveBeenCalledTimes(1);
    expect(get.mock.calls[0][0]).toBe(PublicRoutes.contactUs);

    const handler = get.mock.calls[0][1] as (req: unknown, res: unknown) => void;
    const req = {};
    const res = {};

    handler(req, res);

    expect(renderLocalizedViewMock).toHaveBeenCalledTimes(1);
    expect(renderLocalizedViewMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'contact-us/index',
      generateContactUsContent
    );
  });
});
