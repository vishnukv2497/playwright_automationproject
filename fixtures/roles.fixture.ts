import { test as base } from './pages.fixture';
import { getRolesEnvConfig } from '../utils/env.util';

/**
 * Roles specs (tests/ui/roles). Mirrors auth.fixture, but against ROLES_BASE_URL (the dev
 * host) instead of BASE_URL, and adds `trackRole()`: every role a test registers is deleted
 * once the test finishes (pass or fail), so repeated runs do not pile records into the
 * shared environment.
 */
export const test = base.extend<{ autoLogin: void; trackRole: (code: string) => string }>({
  baseURL: async ({}, use) => {
    await use(getRolesEnvConfig().baseUrl);
  },

  autoLogin: [
    async ({ loginPage }, use) => {
      const { adminUsername, adminPassword } = getRolesEnvConfig();
      await loginPage.goto();
      await loginPage.login(adminUsername, adminPassword);
      await use();
    },
    { auto: true },
  ],

  trackRole: async ({ rolesPage }, use) => {
    const created: string[] = [];
    await use((code) => {
      created.push(code);
      return code;
    });
    if (created.length === 0) return;
    await rolesPage.goto();
    for (const code of created) {
      await rolesPage.deleteIfPresent(code);
    }
  },
});

export { expect } from '@playwright/test';
