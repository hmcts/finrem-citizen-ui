import { describe } from '@jest/globals';

import { getSystemUser } from '../../../../main/app/auth/user';
import { getCaseApi } from '../../../../main/app/case/case-api';
import { UserDetails } from '../../../../main/app/controller/AppRequest';
import { RouteNames } from '../../../../main/common-constants';
import { getHomePageForUser } from '../../../../main/functions/util/commonUtil';

jest.mock('../../../../main/app/case/case-api', () => ({
  getCaseApi: jest.fn(),
}));

jest.mock('../../../../main/app/auth/user', () => ({
  getSystemUser: jest.fn(),
}));

describe('getHomePageForUser', () => {
  let mockGetExistingUserCase: jest.Mock;
  let mockGetCaseById: jest.Mock;
  let userDetails: UserDetails;

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

    userDetails = {  accessToken: 'token',
      idToken: 'id',
      refreshToken: undefined,
      sub: 'test@test.com',
      email: 'test@test.com',
      givenName: 'John',
      familyName: 'Dorian',
      id: '123',
      roles: ['citizen'] };
  });

  test('should route to dashboard when caseId exists', async () => {
    const mockCaseData = { id: 'CASE123' };

    mockGetExistingUserCase.mockResolvedValue('CASE123');
    mockGetCaseById.mockResolvedValue(mockCaseData);

    const homepageResult = await getHomePageForUser(userDetails);

    const expectedResult = {
      caseData: {
        id: 'CASE123',
      },
      url: RouteNames.dashboard,
    };

    expect(mockGetExistingUserCase).toHaveBeenCalled();
    expect(mockGetCaseById).toHaveBeenCalledWith('CASE123');
    expect(homepageResult).toEqual(expectedResult);
    expect(getSystemUser).toHaveBeenCalled();
  });

  test.each([
    ['empty string', ''],
    ['undefined', undefined],
  ])(
    'should route to enterCaseNumber when caseId is %s',
    async (_, caseId) => {
      mockGetExistingUserCase.mockResolvedValue(caseId);

      const result = await getHomePageForUser(userDetails);

      expect(mockGetCaseById).not.toHaveBeenCalled();
      expect(result).toEqual({ 'url': RouteNames.enterCaseNumber });
    }
  );
});
