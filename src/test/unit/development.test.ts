import path from 'path';

describe('development', () => {
  const webpackConfigPath = path.resolve(__dirname, '../../../webpack.config');

  beforeEach(() => {
    jest.resetModules();
  });

  it('should not setup webpack in non-development mode', () => {
    const { setupDev } = require('../../main/development');
    const app = { use: jest.fn() } as any;
    setupDev(app, false);
    expect(app.use).not.toHaveBeenCalled();
  });

  it('should setup webpack in development mode', () => {
    const mockCompiler = {};
    const mockWebpackDevMiddleware = jest.fn(() => 'middleware');
    const mockWebpack = jest.fn(() => mockCompiler);

    jest.doMock('webpack-dev-middleware', () => mockWebpackDevMiddleware);
    jest.doMock('webpack', () => mockWebpack);
    jest.doMock(webpackConfigPath, () => ({ entry: 'test' }));

    const { setupDev } = require('../../main/development');
    const app = { use: jest.fn() } as any;
    setupDev(app, true);

    expect(mockWebpack).toHaveBeenCalled();
    expect(mockWebpackDevMiddleware).toHaveBeenCalledWith(mockCompiler, { publicPath: '/' });
    expect(app.use).toHaveBeenCalledWith('middleware');
  });
});
