import { Request, Response } from 'express';

import homeRoute from '../../../main/routes/home';

jest.mock('@hmcts/properties-volume', () => ({
  addTo: jest.fn(),
}));

describe('routes/home', () => {
  let getHandler: (req: Request, res: Response) => void;

  beforeEach(() => {
    const app: any = {
      get: jest.fn((_path: string, handler: any) => {
        getHandler = handler;
      }),
    };
    homeRoute(app);
  });

  it('should redirect to IDAM login when not authenticated', () => {
    const req = { session: {} } as Request;
    const res = { redirect: jest.fn() } as unknown as Response;

    getHandler(req, res);

    expect(res.redirect).toHaveBeenCalledWith(
      expect.stringContaining('/login?client_id=')
    );
  });

  it('should render home when authenticated', () => {
    const authData = { email: 'user@example.com', roles: ['citizen'] };
    const req = { session: { auth: authData } } as any;
    const res = { render: jest.fn() } as unknown as Response;

    getHandler(req, res);

    expect(res.render).toHaveBeenCalledWith('home', { user: authData });
  });
});
