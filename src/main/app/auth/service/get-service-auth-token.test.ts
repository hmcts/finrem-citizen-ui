import type { AxiosStatic } from 'axios';
import config from 'config';
import { authenticator } from 'otplib';

jest.mock('axios', () => ({
  post: jest.fn(),
}));

jest.mock('config');
jest.mock('otplib', () => ({
  authenticator: { generate: jest.fn() },
}));

const mockInfo = jest.fn();
const mockError = jest.fn();

jest.mock('@hmcts/nodejs-logging', () => ({
  Logger: {
    getLogger: () => ({
      info: mockInfo,
      error: mockError,
    }),
  },
}));

const flush = () => new Promise(resolve => process.nextTick(resolve));

describe('service-auth-token', () => {
  const modulePath = '../../../../main/app/auth/service/get-service-auth-token';

  let svc: {
    getTokenFromApi: () => void;
    initAuthToken: () => void;
    getServiceAuthToken: () => string | undefined;
  };

  let axios: AxiosStatic;

  const mockConfigHappy = () => {
    (config.get as jest.Mock).mockImplementation(
      (k: string) =>
        ({
          'services.authProvider.url': 'http://auth.test',
          'services.authProvider.microservice': 'svc',
          'services.authProvider.secret': 'secret',
        })[k]
    );

    (authenticator.generate as jest.Mock).mockReturnValue('OTP');
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.useFakeTimers();

    jest.isolateModules(() => {
      axios = require('axios');
      svc = require(modulePath);
    });
  });

  it('stores token on success', async () => {
    mockConfigHappy();
    (axios.post as jest.Mock).mockResolvedValue({ data: 'TOKEN' });

    svc.getTokenFromApi();
    await flush();

    expect(svc.getServiceAuthToken()).toBe('TOKEN');
  });

  it('logs error on failure', async () => {
    mockConfigHappy();

    const error = new Error('failed') as Error & {
      response?: { status: number; data: string };
    };
    error.response = { status: 500, data: 'ERR' };

    (axios.post as jest.Mock).mockRejectedValue(error);

    svc.getTokenFromApi();
    await flush();

    expect(mockError).toHaveBeenCalledWith(500, 'ERR');
  });

  it('calls getTokenFromApi and sets interval', async () => {
    mockConfigHappy();
    (axios.post as jest.Mock).mockResolvedValue({ data: 'T1' });

    const spy = jest.spyOn(svc, 'getTokenFromApi');

    svc.initAuthToken();
    svc.getTokenFromApi();
    await flush();

    (axios.post as jest.Mock).mockResolvedValue({ data: 'T2' });

    jest.advanceTimersByTime(1000 * 60 * 60);

    svc.getTokenFromApi();
    await flush();

    expect(spy).toHaveBeenCalledTimes(4);
    expect(svc.getServiceAuthToken()).toBe('T2');
  });
});
