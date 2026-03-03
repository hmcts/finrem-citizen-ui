import axios, { AxiosRequestHeaders, AxiosResponse, AxiosStatic } from 'axios';
import jwt from 'jsonwebtoken';

import { APPLICANT_2_SIGN_IN_URL, CALLBACK_URL, SIGN_IN_URL } from '../../../steps/urls';

import { OidcResponse, getRedirectUrl, getSystemUser, getUserDetails } from './oidc';

const config = require('config');

jest.mock('axios');
jest.mock('config');

const mockedConfig = config as jest.Mocked<typeof config>;
const mockedAxios = axios as jest.Mocked<AxiosStatic>;

const mockSecret = 'mock-secret';
const mockPayload = {
  uid: '123',
  id: '123',
  sub: 'test@test.com',
  email: 'test@test.com',
  given_name: 'John',
  family_name: 'Dorian',
  roles: ['citizen'],
};
const mockSystemPayload = {
  uid: '456',
  sub: 'user-email',
  name: 'System',
  roles: ['caseworker-divorce-systemupdate', 'caseworker-caa', 'caseworker', 'caseworker-divorce'],
};
// Generate a mock JWT for testing
const mockToken = jwt.sign(mockPayload, mockSecret, { expiresIn: '1h' });
const mockSystemToken = jwt.sign(mockSystemPayload, mockSecret, { expiresIn: '1h' });

describe('getRedirectUrl', () => {
  test('should create a valid URL to redirect to the login screen', () => {
    mockedConfig.get.mockReturnValueOnce('divorce');
    mockedConfig.get.mockReturnValueOnce('https://idam-web-public.aat.platform.hmcts.net/login');
    expect(getRedirectUrl('http://localhost', SIGN_IN_URL)).toBe(
      'https://idam-web-public.aat.platform.hmcts.net/login?client_id=divorce&response_type=code&redirect_uri=http://localhost/oauth2/callback'
    );
  });

  test('should create a valid URL to redirect to applicant2 login screen', () => {
    mockedConfig.get.mockReturnValueOnce('divorce');
    mockedConfig.get.mockReturnValueOnce('https://idam-web-public.aat.platform.hmcts.net/login');
    expect(getRedirectUrl('http://localhost', APPLICANT_2_SIGN_IN_URL)).toBe(
      'https://idam-web-public.aat.platform.hmcts.net/login?client_id=divorce&response_type=code&redirect_uri=http://localhost/oauth2/callback-applicant2'
    );
  });
});

describe('getUserDetails', () => {
  test('should exchange a code for a token and decode a JWT to get the user details', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        id_token: mockToken,
        access_token: 'token',
      },
    } as AxiosResponse);

    const result = await getUserDetails('http://localhost', '123', CALLBACK_URL);
    expect(result).toStrictEqual({
      accessToken: 'token',
      email: 'test@test.com',
      givenName: 'John',
      familyName: 'Dorian',
      id: '123',
      roles: ['citizen'],
    });
  });

  test('should throw error if missing data from request', async () => {
    await expect(getUserDetails('http://localhost', '', CALLBACK_URL)).rejects.toThrow(
      'Missing data for createIdamToken.'
    );
  });
});

describe('getSystemUser', () => {
  const accessTokenResponse: AxiosResponse<OidcResponse> = {
    status: 200,
    data: {
      id_token: mockSystemToken,
      access_token: 'systemUserTestToken',
    },
    statusText: 'wsssw',
    headers: { test: 'now' },
    config: { headers: [] as unknown as AxiosRequestHeaders },
  };

  const expectedGetSystemUserResponse: {
    givenName: undefined;
    familyName: undefined;
    roles: string[];
    id: string;
    accessToken: string;
    email: string;
  } = {
    email: 'user-email',
    accessToken: 'systemUserTestToken',
    id: '456',
    givenName: undefined,
    familyName: undefined,
    roles: ['caseworker-divorce-systemupdate', 'caseworker-caa', 'caseworker', 'caseworker-divorce'],
  };

  test('Cache enabled', async () => {
    mockedConfig.get.mockReturnValueOnce('divorce');
    mockedConfig.get.mockReturnValueOnce('https://idam-web-public.aat.platform.hmcts.net/login');
    mockedConfig.get.mockReturnValueOnce('true');
    mockedAxios.post.mockResolvedValue(accessTokenResponse);

    const result = await getSystemUser();
    expect(result).toStrictEqual(expectedGetSystemUserResponse);
  });

  test('Cache disabled', async () => {
    mockedConfig.get.mockReturnValueOnce('divorce');
    mockedConfig.get.mockReturnValueOnce('https://idam-web-public.aat.platform.hmcts.net/loginwddwdw');
    mockedConfig.get.mockReturnValue('false');
    mockedAxios.post.mockResolvedValue(accessTokenResponse);

    const result = await getSystemUser();
    expect(result).toStrictEqual(expectedGetSystemUserResponse);
  });
});
