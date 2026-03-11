import axios, { AxiosRequestHeaders, AxiosResponse, AxiosStatic } from 'axios';
import jwt from 'jsonwebtoken';

import { APPLICANT_2_SIGN_IN_URL, CALLBACK_URL, SIGN_IN_URL } from '../../../steps/urls';

import { OidcResponse, getRedirectUrl, getSystemUser, getUserDetails, idamTokenCache } from './oidc';

jest.mock('config', () => {
  const get = jest.fn();
  return {
    __esModule: true,
    default: { get },
    get,
  };
});

const { get: mockedConfigGet } = require('config');

// axios mock
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<AxiosStatic>;

// --- test tokens ---
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

const mockToken = jwt.sign(mockPayload, mockSecret, { expiresIn: '1h' });
const mockSystemToken = jwt.sign(mockSystemPayload, mockSecret, { expiresIn: '1h' });

beforeEach(() => {
  jest.clearAllMocks();
  idamTokenCache.flushAll();

  const values: Record<string, string> = {
    'services.idam.clientID': 'divorce',
    'services.idam.authorizationURL': 'https://idam-web-public.aat.platform.hmcts.net/login',
    'services.idam.systemUsername': 'system.user@hmcts.net',
    'services.idam.systemPassword': 'Passw0rd!',
    'services.idam.clientSecret': 'super-secret',
    'services.idam.tokenURL': 'https://idam-api/token',
    'services.idam.caching': 'true',
  };

  mockedConfigGet.mockImplementation((key: string) => values[key]);
});

describe('getRedirectUrl', () => {
  test('should create a valid URL to redirect to the login screen', () => {
    expect(getRedirectUrl('http://localhost', SIGN_IN_URL)).toBe(
      'https://idam-web-public.aat.platform.hmcts.net/login?client_id=divorce&response_type=code&redirect_uri=http://localhost/oauth2/callback'
    );
  });

  test('should create a valid URL to redirect to applicant2 login screen', () => {
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
      idToken: mockToken,
      refreshToken: undefined,
      sub: 'test@test.com',
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
    statusText: 'OK',
    headers: {},
    config: { headers: [] as unknown as AxiosRequestHeaders },
  };

  const expectedGetSystemUserResponse = {
    email: 'user-email',
    accessToken: 'systemUserTestToken',
    idToken: mockSystemToken,
    refreshToken: undefined,
    sub: 'user-email',
    id: '456',
    givenName: undefined,
    familyName: undefined,
    roles: ['caseworker-divorce-systemupdate', 'caseworker-caa', 'caseworker', 'caseworker-divorce'],
  };

  test('Cache enabled', async () => {
    mockedAxios.post.mockResolvedValue(accessTokenResponse);

    const result = await getSystemUser();
    expect(result).toStrictEqual(expectedGetSystemUserResponse);
  });

  test('Cache disabled', async () => {
    mockedConfigGet.mockImplementation((key: string) => {
      if (key === 'services.idam.caching') {
        return 'false';
      }
      if (key === 'services.idam.authorizationURL') {
        return 'https://idam-web-public.aat.platform.hmcts.net/loginwddwdw';
      }
      return {
        'services.idam.clientID': 'divorce',
        'services.idam.systemUsername': 'system.user@hmcts.net',
        'services.idam.systemPassword': 'Passw0rd!',
        'services.idam.clientSecret': 'super-secret',
        'services.idam.tokenURL': 'https://idam-api/token',
      }[key];
    });

    mockedAxios.post.mockResolvedValue(accessTokenResponse);

    const result = await getSystemUser();
    expect(result).toStrictEqual(expectedGetSystemUserResponse);
  });
});
