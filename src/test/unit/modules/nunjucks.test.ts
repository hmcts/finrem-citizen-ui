import * as express from 'express';
import * as nunjucks from 'nunjucks';

import { Nunjucks } from '../../../main/modules/nunjucks';

jest.mock('nunjucks', () => {
  const mockEnv = {
    addFilter: jest.fn(),
  };
  return {
    configure: jest.fn(() => mockEnv),
  };
});

describe('modules/nunjucks', () => {
  let app: Partial<express.Express>;

  beforeEach(() => {
    app = {
      set: jest.fn(),
      use: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should set view engine to njk', () => {
    const nunjucksModule = new Nunjucks(false);
    nunjucksModule.enableFor(app as express.Express);

    expect(app.set).toHaveBeenCalledWith('view engine', 'njk');
  });

  it('should configure nunjucks with correct options', () => {
    const nunjucksModule = new Nunjucks(true);
    nunjucksModule.enableFor(app as express.Express);

    expect(nunjucks.configure).toHaveBeenCalledWith(
      expect.arrayContaining([expect.any(String), expect.any(String)]),
      expect.objectContaining({
        autoescape: true,
        watch: true,
        express: app,
      })
    );
  });

  it('should set watch to false in production mode', () => {
    const nunjucksModule = new Nunjucks(false);
    nunjucksModule.enableFor(app as express.Express);

    expect(nunjucks.configure).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        watch: false,
      })
    );
  });

  it('should add nunjucks filters', () => {
    const nunjucksModule = new Nunjucks(false);
    nunjucksModule.enableFor(app as express.Express);

    const mockEnv = (nunjucks.configure as jest.Mock).mock.results[0].value;
    expect(mockEnv.addFilter).toHaveBeenCalledWith('offsetDate', expect.any(Function));
    expect(mockEnv.addFilter).toHaveBeenCalledWith('taskStatus', expect.any(Function));
    expect(mockEnv.addFilter).toHaveBeenCalledWith('taskListWarningMessage', expect.any(Function));
    expect(mockEnv.addFilter).toHaveBeenCalledWith('taskListFormItems', expect.any(Function));
  });

  it('should register middleware that sets pagePath', () => {
    const nunjucksModule = new Nunjucks(false);
    nunjucksModule.enableFor(app as express.Express);

    expect(app.use).toHaveBeenCalled();

    // Get the middleware function
    const middleware = (app.use as jest.Mock).mock.calls[0][0];
    const req = { path: '/test-path' } as express.Request;
    const res = { locals: {} } as unknown as express.Response;
    const next = jest.fn();

    middleware(req, res, next);

    expect(res.locals.pagePath).toBe('/test-path');
    expect(next).toHaveBeenCalled();
  });
});
