/**
 * Manual test setup - creates a citizen user and contested case for manual testing.
 * Usage: yarn setup:manual-test
 * Output: Login credentials and case number to use in the application.
 */

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

describe('Setup Manual Test', () => {
  it(
    'creates citizen user and contested case for manual testing',
    async () => {
      const appEnv = process.env.RUNNING_ENV || 'aat';
      const applicationUrl = getApplicationUrl();

       
      console.log('\n========================================\n📋 Creating test setup...\n========================================\n');

      // Create citizen user
       
      console.log('Creating citizen user...');
      const idamService = new IdamApiService();
      const user = await idamService.createCitizenUser();
       
      console.log('✓ User created\n');

      // Create contested case
       
      console.log('Creating contested case...');
      const caseId = String(
        await ContestedCaseFactory.createAndProcessFormACaseUpToProgressToListing(false)
      );
      const formattedCaseId = caseId.replace(/(\d{4})(?=\d)/g, '$1-');
       
      console.log('✓ Case created\n');

      // Assertion to satisfy Jest (before logging to ensure test completion)
      expect(user.username).toBeTruthy();
      expect(formattedCaseId).toBeTruthy();

      // Output results for manual testing (after assertions)
       
      console.log(`
========================================
✅ Setup Complete
========================================

Environment: ${appEnv}
URL: ${applicationUrl}

Login Credentials:
  Username: ${user.username}
  Password: ${user.password}

Case:
  Formatted: ${formattedCaseId}
  Raw:       ${caseId}

Usage: Log in with the credentials above, then enter the formatted case number.
========================================
`);
    },
    180_000 // 3 minute timeout to allow case factory to complete
  );
});
