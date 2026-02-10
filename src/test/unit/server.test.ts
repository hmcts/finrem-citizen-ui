jest.mock('dotenv/config', () => ({}));

const mockAppListen = jest.fn((_port: number, cb: () => void) => {
  if (cb) cb();
  return { close: jest.fn() };
});

const mockS2SServerInstance = {
  listen: jest.fn((_port: number, _host: string, cb: () => void) => {
    if (cb) cb();
  }),
  close: jest.fn(),
};

let capturedRequestHandler: any;

jest.mock('node:http', () => ({
  createServer: jest.fn((handler: any) => {
    capturedRequestHandler = handler;
    return mockS2SServerInstance;
  }),
}));

const mockHttpsServer = {
  listen: jest.fn((_port: number, cb: () => void) => {
    if (cb) cb();
  }),
  close: jest.fn(),
};

jest.mock('node:https', () => ({
  createServer: jest.fn(() => mockHttpsServer),
}));

describe('server', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalPort = process.env.PORT;

  beforeEach(() => {
    jest.clearAllMocks();
    capturedRequestHandler = null;
    mockAppListen.mockImplementation((_port: number, cb: () => void) => {
      if (cb) cb();
      return { close: jest.fn() };
    });
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    if (originalPort) {
      process.env.PORT = originalPort;
    } else {
      delete process.env.PORT;
    }
    jest.restoreAllMocks();
  });

  describe('test/development mode (with mock S2S)', () => {
    beforeEach(() => {
      jest.mock('../../main/app', () => ({
        app: {
          locals: { ENV: 'test', shutdown: false },
          listen: mockAppListen,
        },
      }));
    });

    it('should start mock S2S server in test mode', () => {
      const http = require('node:http');

      jest.isolateModules(() => {
        process.env.NODE_ENV = 'test';
        require('../../main/server');
      });

      expect(http.createServer).toHaveBeenCalled();
      expect(mockS2SServerInstance.listen).toHaveBeenCalled();
    });

    it('should handle /lease requests in mock S2S', () => {
      jest.isolateModules(() => {
        process.env.NODE_ENV = 'test';
        require('../../main/server');
      });

      expect(capturedRequestHandler).toBeDefined();

      const req = { method: 'POST', url: '/lease' };
      const res = { writeHead: jest.fn(), end: jest.fn() };

      capturedRequestHandler(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'text/plain' });
      expect(res.end).toHaveBeenCalledWith(expect.stringContaining('eyJ'));
    });

    it('should handle /health requests in mock S2S', () => {
      jest.isolateModules(() => {
        process.env.NODE_ENV = 'test';
        require('../../main/server');
      });

      const req = { method: 'GET', url: '/health' };
      const res = { writeHead: jest.fn(), end: jest.fn() };

      capturedRequestHandler(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
      expect(res.end).toHaveBeenCalledWith(JSON.stringify({ status: 'UP' }));
    });

    it('should return 404 for unknown routes in mock S2S', () => {
      jest.isolateModules(() => {
        process.env.NODE_ENV = 'test';
        require('../../main/server');
      });

      const req = { method: 'GET', url: '/unknown' };
      const res = { writeHead: jest.fn(), end: jest.fn() };

      capturedRequestHandler(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(404);
      expect(res.end).toHaveBeenCalled();
    });

    it('should start main app and listen on port', () => {
      jest.isolateModules(() => {
        process.env.NODE_ENV = 'test';
        require('../../main/server');
      });

      expect(mockAppListen).toHaveBeenCalled();
    });
  });

  describe('development mode with HTTPS', () => {
    it('should start HTTPS server when SSL certs are available', () => {
      jest.mock('../../main/app', () => ({
        app: {
          locals: { ENV: 'development', shutdown: false },
          listen: mockAppListen,
        },
      }));

      jest.mock('node:fs', () => ({
        readFileSync: jest.fn(() => Buffer.from('mock-cert')),
      }));

      const https = require('node:https');

      jest.isolateModules(() => {
        process.env.NODE_ENV = 'development';
        require('../../main/server');
      });

      expect(https.createServer).toHaveBeenCalled();
    });

    it('should fall back to HTTP when SSL certs fail to load', () => {
      jest.mock('../../main/app', () => ({
        app: {
          locals: { ENV: 'development', shutdown: false },
          listen: mockAppListen,
        },
      }));

      jest.mock('node:fs', () => ({
        readFileSync: jest.fn(() => {
          throw new Error('File not found');
        }),
      }));

      jest.isolateModules(() => {
        process.env.NODE_ENV = 'development';
        require('../../main/server');
      });

      expect(mockAppListen).toHaveBeenCalled();
    });
  });

  describe('production mode', () => {
    it('should start directly without mock S2S in production', () => {
      jest.mock('../../main/app', () => ({
        app: {
          locals: { ENV: 'production', shutdown: false },
          listen: mockAppListen,
        },
      }));

      jest.isolateModules(() => {
        process.env.NODE_ENV = 'production';
        require('../../main/server');
      });

      expect(mockAppListen).toHaveBeenCalled();
    });
  });

  describe('graceful shutdown', () => {
    it('should register signal handlers', () => {
      const processOnSpy = jest.spyOn(process, 'on');

      jest.mock('../../main/app', () => ({
        app: {
          locals: { ENV: 'test', shutdown: false },
          listen: mockAppListen,
        },
      }));

      jest.isolateModules(() => {
        process.env.NODE_ENV = 'test';
        require('../../main/server');
      });

      const signalCalls = processOnSpy.mock.calls.filter(
        ([event]) => event === 'SIGINT' || event === 'SIGTERM'
      );
      expect(signalCalls.length).toBeGreaterThanOrEqual(2);

      processOnSpy.mockRestore();
    });
  });
});
