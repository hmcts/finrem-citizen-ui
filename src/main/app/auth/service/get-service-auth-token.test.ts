jest.mock('axios');
jest.mock('@hmcts/nodejs-logging');
jest.useFakeTimers({ legacyFakeTimers: true });

import axios, { AxiosStatic } from 'axios';

import { getServiceAuthToken, initAuthToken } from './get-service-auth-token';

const { Logger } = require('@hmcts/nodejs-logging');
const logger = {
  info: jest.fn(),
  error: jest.fn(),
};
Logger.getLogger.mockReturnValue(logger);

const mockedAxios = axios as jest.Mocked<AxiosStatic>;

describe('initAuthToken', () => {
  test('Should set an interval to start fetching a token', () => {
    mockedAxios.post.mockResolvedValue('token');

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
    mockedAxios.post.mockRejectedValue({ response: { status: 500, data: 'Error' } });

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
    mockedAxios.post.mockResolvedValue({ data: 'token' });

    initAuthToken();

    return new Promise<void>(resolve => {
      setImmediate(() => {
        expect(getServiceAuthToken()).not.toBeUndefined();
        resolve();
      });
    });
  });
});
