import { test, expect } from '../../fixtures/pages.fixture';
import { getEnvConfig } from '../../utils/env.util';

/**
 * Login screen coverage.
 *
 * Imports from `pages.fixture`, NOT `auth.fixture`: the auth fixture logs in
 * automatically before every test, so a login spec built on it would be asserting
 * against a session that was already established before the test body ran.
 */
test.describe('TransactHub Login', () => {
  test('Login with valid credentials', async ({ loginPage, page }) => {
    // Credentials come from the gitignored .env via env.util — never inline them here.
    const { adminUsername, adminPassword } = getEnvConfig();

    // goto() uses the configured baseURL, so this spec follows BASE_URL to whichever
    // environment it is pointed at instead of pinning one host.
    await loginPage.goto();
    await expect(page.getByText('Welcome Back')).toBeVisible();

    await loginPage.login(adminUsername, adminPassword);

    // The operations sidebar renders only once authenticated, so it — not a URL change
    // — is the signal that the session is real. login() already waits for it; asserting
    // it here keeps the test's own pass condition explicit.
    await expect(page.getByRole('navigation', { name: 'Operations navigation' })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
