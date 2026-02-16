import { Application, Request, Response } from 'express';

import homeRoute from '../../../main/routes/home';

jest.mock('@hmcts/properties-volume', () => ({
  addTo: jest.fn(),
}));

describe('routes/home', () => {
  let getHandler: (req: Request, res: Response) => void;

  beforeEach(() => {
    const mockGet = jest.fn((_path: string, handler: (req: Request, res: Response) => void) => {
      getHandler = handler;
    });
    const app = { get: mockGet } as unknown as Application;
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
    const req = { session: { auth: authData } } as unknown as Request;
    const res = { render: jest.fn() } as unknown as Response;

    getHandler(req, res);

    expect(res.render).toHaveBeenCalledWith('home', { user: authData });
  });
});
