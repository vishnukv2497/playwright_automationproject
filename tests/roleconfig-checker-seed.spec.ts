import { test } from '../fixtures/pages.fixture';
import { getRoleConfigEnv } from '../utils/env.util';

// Seed for Playwright MCP exploration of the Role Configuration suite as the Checker: logs in to
// ROLES_BASE_URL (dev host) as CHECKER_USER, so the agent starts authenticated there.
test.use({ baseURL: process.env.ROLES_BASE_URL });

test.describe('Role configuration checker seed', () => {
  test('seed', async ({ loginPage }) => {
    test.skip(!process.env.CHECKER_USER, 'CHECKER_USER / CHECKER_PASS not configured');
    const { checker } = getRoleConfigEnv();
    await loginPage.goto();
    await loginPage.login(checker.username, checker.password);
  });
});
