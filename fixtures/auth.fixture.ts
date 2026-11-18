import { test as base } from './pages.fixture';
import { getEnvConfig } from '../utils/env.util';

/**
 * Extends the pages fixture with an automatic UI login, so every payment/module
 * spec (the other ~80% of the app) can start directly from the dashboard instead
 * of repeating the login steps. Import `test`/`expect` from THIS file for any
 * scenario that requires an authenticated session; import from `pages.fixture`
 * directly only for specs that test the login screen itself.
 */
export const test = base.extend<{ autoLogin: void }>({
  autoLogin: [
    async ({ loginPage }, use) => {
      const { adminUsername, adminPassword } = getEnvConfig();
      await loginPage.goto();
      await loginPage.login(adminUsername, adminPassword);
      await use();
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
