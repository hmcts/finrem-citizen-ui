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

jest.mock('otplib', () => ({
  generate: jest.fn().mockResolvedValue('12345'),
}));

jest.useFakeTimers({ legacyFakeTimers: true });

import axios, { AxiosStatic } from 'axios';

import { getServiceAuthToken, initAuthToken } from '../../../../../main/app/auth/service/get-service-auth-token';

const mockedAxios = axios as unknown as jest.Mocked<AxiosStatic>;

beforeEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

describe('initAuthToken', () => {
  test('Should set an interval to start fetching a token', async () => {
    (mockedAxios.post as jest.Mock).mockResolvedValue({ data: 'token' });

    await initAuthToken();

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'http://rpe-service-auth-provider-aat.service.core-compute-aat.internal/lease',
      {
        microservice: 'finrem_citizen_ui',
        oneTimePassword: expect.anything(),
      }
    );
  });

  test('Should log and rethrow errors when token retrieval fails', async () => {
    const error = { response: { status: 500, data: 'Error' } };
    (mockedAxios.post as jest.Mock).mockRejectedValue(error);

    await expect(initAuthToken()).rejects.toEqual(error);

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to obtain service authorisation token',
      error
    );
  });
});

describe('getServiceAuthToken', () => {
  test('Should return a token', async () => {
    (mockedAxios.post as jest.Mock).mockResolvedValue({ data: 'token' });

    await initAuthToken();

    expect(getServiceAuthToken()).toBe('token');
  });

  test('Should throw an error if token is not available', async () => {
    (mockedAxios.post as jest.Mock).mockResolvedValue({ data: null });

    await initAuthToken();

    expect(() => getServiceAuthToken()).toThrow(
      'Service authorisation token is unavailable'
    );
  });
});
