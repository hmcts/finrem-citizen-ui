import fs from 'fs';
import path from 'path';

import { test as setup } from '@playwright/test';

import { IdamPage } from './functional/pom/idamPage.page';
import { IdamApiService } from './functional/utils/helpers/idamCreateUser';

const authFile = path.join(process.cwd(), 'test/.auth/user.json');

setup('authenticate', async ({ page }) => {
  console.log('🚀 Starting Authentication Setup...');

  const idamApi = new IdamApiService();
  const idamPage = new IdamPage(page);

  // Create the user
  const user = await idamApi.createCitizenUser();
  console.log(`👤 Created test user: ${user.username}`);

  // Login via UI
  await page.goto('/');
  await idamPage.login(user);

  // Ensure directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Save state
  await page.context().storageState({ path: authFile });
});
