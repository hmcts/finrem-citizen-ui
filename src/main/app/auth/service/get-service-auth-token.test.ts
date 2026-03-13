const logger = {
  info: jest.fn(),
  error: jest.fn(),
};
jest.mock('@hmcts/nodejs-logging', () => ({
  Logger: {
    getLogger: jest.fn(() => logger),
  },
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

jest.useFakeTimers({ legacyFakeTimers: true });

import axios, { AxiosStatic } from 'axios';

import { getServiceAuthToken, initAuthToken } from './get-service-auth-token';

const mockedAxios = axios as unknown as jest.Mocked<AxiosStatic>;

describe('initAuthToken', () => {
  test('Should set an interval to start fetching a token', () => {
    (mockedAxios.post as jest.Mock).mockResolvedValue('token');

    initAuthToken();
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://rpe-service-auth-provider-aat.service.core-compute-aat.internal/lease',
      {
        microservice: 'finrem_citizen_ui',
        oneTimePassword: expect.anything(),
      }
    );
  });

  test('Should log errors', () => {
    (mockedAxios.post as jest.Mock).mockRejectedValue({
      response: { status: 500, data: 'Error' },
    });

    initAuthToken();
    return new Promise<void>(resolve => {
      setImmediate(() => {
        expect(logger.error).toHaveBeenCalledWith(500, 'Error');
        resolve();
      });
    });
  });
});

describe('getServiceAuthToken', () => {
  test('Should return a token', async () => {
    (mockedAxios.post as jest.Mock).mockResolvedValue({ data: 'token' });

    initAuthToken();

    return new Promise<void>(resolve => {
      setImmediate(() => {
        expect(getServiceAuthToken()).not.toBeUndefined();
        resolve();
      });
    });
  });
});
