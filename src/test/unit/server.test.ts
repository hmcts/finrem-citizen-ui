jest.mock('dotenv/config', () => ({}));

const mockAppListen = jest.fn((_port: number, cb: () => void) => {
  if (cb) {
    cb();
  }
  return { close: jest.fn() };
});

const mockHttpsServer = {
  listen: jest.fn((_port: number, cb: () => void) => {
    if (cb) {
      cb();
    }
  }),
  close: jest.fn(),
};

jest.mock('node:https', () => ({
  createServer: jest.fn(() => mockHttpsServer),
}));

describe('server', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalPort = process.env.PORT;
  const originalProtocol = process.env.PROTOCOL;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppListen.mockImplementation((_port: number, cb: () => void) => {
      if (cb) {
        cb();
      }
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
    if (originalProtocol) {
      process.env.PROTOCOL = originalProtocol;
    } else {
      delete process.env.PROTOCOL;
    }
    jest.restoreAllMocks();
  });

  describe('non-development mode', () => {
    beforeEach(() => {
      jest.mock('../../main/app', () => ({
        app: {
          locals: { ENV: 'test', shutdown: false },
          listen: mockAppListen,
        },
      }));
    });

    it('should start app and listen on port', () => {
      jest.isolateModules(() => {
        process.env.NODE_ENV = 'test';
        require('../../main/server');
      });

      expect(mockAppListen).toHaveBeenCalled();
    });

    it('should use default port 3100 when PORT is not set', () => {
      delete process.env.PORT;

      jest.isolateModules(() => {
        process.env.NODE_ENV = 'test';
        require('../../main/server');
      });

      expect(mockAppListen).toHaveBeenCalledWith(3100, expect.any(Function));
    });

    it('should use custom PORT when set', () => {
      process.env.PORT = '4000';

      jest.isolateModules(() => {
        process.env.NODE_ENV = 'test';
        require('../../main/server');
      });

      expect(mockAppListen).toHaveBeenCalledWith(4000, expect.any(Function));
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

    it('should use HTTP when PROTOCOL env var is set to http', () => {
      jest.mock('../../main/app', () => ({
        app: {
          locals: { ENV: 'development', shutdown: false },
          listen: mockAppListen,
        },
      }));

      jest.isolateModules(() => {
        process.env.NODE_ENV = 'development';
        process.env.PROTOCOL = 'http';
        require('../../main/server');
      });

      expect(mockAppListen).toHaveBeenCalled();
    });
  });

  describe('production mode', () => {
    it('should start directly in production', () => {
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

    it('should set shutdown flag and close server when signal is received', () => {
      jest.useFakeTimers();
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      const processOnSpy = jest.spyOn(process, 'on');

      const appLocals = { ENV: 'test', shutdown: false };
      const mockClose = jest.fn();
      mockAppListen.mockImplementation((_port: number, cb: () => void) => {
        if (cb) {
          cb();
        }
        return { close: mockClose };
      });

      jest.mock('../../main/app', () => ({
        app: {
          locals: appLocals,
          listen: mockAppListen,
        },
      }));

      jest.isolateModules(() => {
        process.env.NODE_ENV = 'test';
        require('../../main/server');
      });

      const sigintCall = processOnSpy.mock.calls.find(
        ([event]) => event === 'SIGINT'
      );
      expect(sigintCall).toBeDefined();

      const shutdownHandler = sigintCall![1] as () => void;
      shutdownHandler();

      expect(appLocals.shutdown).toBe(true);

      jest.advanceTimersByTime(4000);

      expect(mockClose).toHaveBeenCalled();
      expect(mockExit).toHaveBeenCalledWith(0);

      processOnSpy.mockRestore();
      mockExit.mockRestore();
      jest.useRealTimers();
    });
  });
});
