/**
 * Manual test setup - creates a citizen user and contested case for manual testing.
 * Usage: yarn setup:manual-test
 * Output: Login credentials and case number to use in the application.
 */

import { describe, expect, it } from '@jest/globals';
import dotenv from 'dotenv';

import { ContestedCaseFactory } from '../../functional/utils/factories/contested/ContestedCaseFactory';
import { IdamApiService } from '../../functional/utils/helpers/idamCreateUser';

dotenv.config({ quiet: true });

const getApplicationUrl = (): string => {
  const env = process.env.RUNNING_ENV || 'aat';
  if (env.startsWith('pr-')) {
    return `https://finrem-citizen-ui-${env}.preview.platform.hmcts.net`;
  }
  return `https://finrem-citizen-ui.${env}.platform.hmcts.net`;
};

const buildMockAccessCodeInjectionUrl = (
  applicationUrl: string,
  caseId: string,
  applicantCode: string,
  respondentCode: string
): string => {
  const params = new URLSearchParams({
    caseNumber: caseId,
    applicantCode,
    respondentCode,
  });

  return `${applicationUrl}/__test/inject-case-session?${params.toString()}`;
};

describe('Setup Manual Test', () => {
  it(
    'creates citizen user and contested case for manual testing',
    async () => {
      const appEnv = process.env.RUNNING_ENV || 'aat';
      const applicationUrl = getApplicationUrl();
      const useRealIntegration = process.env.ACCESS_CODE_REAL_INTEGRATION === 'true';
      const useMockAccessCodes = !useRealIntegration && process.env.MOCK_ACCESS_CODES !== 'false';
      let modeLabel = 'real case only';
      if (useRealIntegration) {
        modeLabel = 'real integration (Form C at hearing)';
      } else if (useMockAccessCodes) {
        modeLabel = 'mock access codes enabled';
      }

      console.log('\n========================================\n📋 Creating test setup...\n========================================\n');

      console.log('Creating citizen user...');
      const idamService = new IdamApiService();
      const user = await idamService.createCitizenUser();

      console.log('✓ User created\n');

      console.log('Creating contested case...');
      let caseDetails;
      if (useRealIntegration) {
        caseDetails = await ContestedCaseFactory.createContestedCaseWithHearingAndAccessCode();
      } else if (useMockAccessCodes) {
        caseDetails = await ContestedCaseFactory.createContestedCaseWithMockedAccessCode();
      } else {
        caseDetails = {
          caseId: String(await ContestedCaseFactory.createAndProcessFormACaseUpToProgressToListing(false)),
          applicantCode: undefined,
          respondentCode: undefined,
        };
      }
      const caseId = caseDetails.caseId;
      const formattedCaseId = caseId.replace(/(\d{4})(?=\d)/g, '$1-');
      const mockInjectionUrl =
        caseDetails.applicantCode && caseDetails.respondentCode
          ? buildMockAccessCodeInjectionUrl(
              applicationUrl,
              caseId,
              caseDetails.applicantCode,
              caseDetails.respondentCode
            )
          : undefined;

      console.log('✓ Case created\n');

      expect(user.username).toBeTruthy();
      expect(formattedCaseId).toBeTruthy();

      console.log(`
========================================
✅ Setup Complete
========================================

Environment: ${appEnv}
URL: ${applicationUrl}
Mode: ${modeLabel}

Login Credentials:
  Username: ${user.username}
  Password: ${user.password}

Case:
  Formatted: ${formattedCaseId}
  Raw:       ${caseId}

${
  useMockAccessCodes
    ? `Mock Access Codes:
  Applicant: ${caseDetails.applicantCode}
  Respondent: ${caseDetails.respondentCode}

Mock Session Injection URL:
  ${mockInjectionUrl}

Mock Access Code Workflow:
  1. Log in with the credentials above.
  2. Open the Mock Session Injection URL in the same browser session.
  3. You will be redirected to the access-code page.
  4. Enter APPCODE1 or RSPCODE1 to continue.

Note: this only works where ENABLE_TEST_SUPPORT_ROUTES=true.`
    : ''
}

Usage: Log in with the credentials above, then enter the formatted case number.
========================================
`);
    },
    180_000
  );
});