import { UserDetails } from '../controller/AppRequest';

import { CaseApi, getCaseApi } from './case-api';
import * as caseApiClient from './case-api-client';
import { CaseRole } from './definition';

jest.mock('axios');

const userDetails: UserDetails = {
  accessToken: '123',
  idToken: '',
  refreshToken: undefined,
  sub: '',
  email: 'billy@bob.com',
  givenName: 'billy',
  familyName: 'bob',
  id: 'something',
  roles: ['something'],
};

describe('CaseApi', () => {
  const mockApiClient = {
    getCaseById: jest.fn(),
  };

  let api: CaseApi;
  beforeEach(() => {
    api = new CaseApi(mockApiClient as unknown as caseApiClient.CaseApiClient);
  });

  afterEach(() => {
    mockApiClient.getCaseById.mockClear();
  });

  test('Should return case for caseId passed', async () => {
    const expectedCase = { id: '1234', state: 'Draft', accessCode: 'NFSDCLV3' };
    mockApiClient.getCaseById.mockResolvedValue(expectedCase);

    const actualCase = await api.getCaseById('1234');
    expect(actualCase).toStrictEqual(expectedCase);
  });

  test('Should throw error when case could not be fetched', async () => {
    mockApiClient.getCaseById.mockRejectedValue(new Error('Case could not be retrieved.'));

    await expect(api.getCaseById('1234')).rejects.toThrow('Case could not be retrieved.');
  });
});

describe('getCaseApi', () => {
  test('should create a CaseApi', () => {
    expect(getCaseApi(userDetails, {} as never)).toBeInstanceOf(CaseApi);
  });
});

test('Should call addCaseUserRoles with assignments', async () => {
  const mockApiClient = {
    getCaseById: jest.fn(),
    addCaseUserRoles: jest.fn(),
  };

  const api = new CaseApi(mockApiClient as unknown as caseApiClient.CaseApiClient);

  const assignments = [{ case_id: '1234', user_id: 'user1', case_role: CaseRole.APPLICANT }];

  mockApiClient.addCaseUserRoles.mockResolvedValue(undefined);

  await api.addUsersToCase(assignments);

  expect(mockApiClient.addCaseUserRoles).toHaveBeenCalledTimes(1);
  expect(mockApiClient.addCaseUserRoles).toHaveBeenCalledWith(assignments);
});
