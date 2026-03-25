import { describe } from '@jest/globals';

import { getSystemUser } from '../../../../main/app/auth/user';
import { getCaseApi } from '../../../../main/app/case/case-api';
import { ViewNames } from '../../../../main/common-constants';
import { getHomePageForUser } from '../../../../main/functions/util/homepage';

jest.mock('../../../../main/app/case/case-api', () => ({
  getCaseApi: jest.fn(),
}));

jest.mock('../../../../main/app/auth/user', () => ({
  getSystemUser: jest.fn(),
}));

describe('getHomePageForUser', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let session: any;
  let mockGetExistingUserCase: jest.Mock;
  let mockGetCaseById: jest.Mock;

  beforeEach(() => {
    mockGetExistingUserCase = jest.fn();
    mockGetCaseById = jest.fn();

    (getCaseApi as jest.Mock).mockReturnValue({
      getExistingUserCase: mockGetExistingUserCase,
      getCaseById: mockGetCaseById,
    });

    (getSystemUser as jest.Mock).mockResolvedValue({
      accessToken: 'mock-access',
      idToken: 'mock-id',
      refreshToken: undefined,
      sub: '123',
      id: 'system-user',
      email: 'system@test.com',
      givenName: 'System',
      familyName: 'User',
      roles: ['admin'],
    });

    session = {
      user: { id: 'user-123' },
      caseData: undefined,
    };
  });

  test('should route to dashboard when caseId exists', async () => {
    const mockCaseData = { id: 'CASE123' };

    mockGetExistingUserCase.mockResolvedValue('CASE123');
    mockGetCaseById.mockResolvedValue(mockCaseData);

    const homepageResult = await getHomePageForUser(session);

    expect(mockGetExistingUserCase).toHaveBeenCalled();
    expect(mockGetCaseById).toHaveBeenCalledWith('CASE123');
    expect(session.caseData).toEqual(mockCaseData);
    expect(homepageResult).toBe(ViewNames.Dashboard);

    expect(getSystemUser).toHaveBeenCalled();
  });

  test('should route to enterCaseNumber when caseId is empty', async () => {
    mockGetExistingUserCase.mockResolvedValue('');

    const result = await getHomePageForUser(session);

    expect(mockGetCaseById).not.toHaveBeenCalled();
    expect(session.caseData).toBeUndefined();
    expect(result).toBe(ViewNames.EnterCaseNumber);
  });

  test('should route to enterCaseNumber when caseId is undefined', async () => {
    mockGetExistingUserCase.mockResolvedValue(undefined);

    const result = await getHomePageForUser(session);

    expect(mockGetCaseById).not.toHaveBeenCalled();
    expect(result).toBe(ViewNames.EnterCaseNumber);
  });
});
