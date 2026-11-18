import { test, expect } from '../../../fixtures/auth.fixture';
import { caseTitle } from '../../../testdata/charge-configuration-cases';

/**
 * Access Control — TC-045.
 *
 * The negative half of this case needs a user account WITHOUT Charge Configuration
 * access. Only the admin account is available in this environment, so the denial path
 * cannot be exercised. The positive half (an authorised user can reach the screen)
 * is asserted below so the permitted path still has coverage.
 */
test.describe('Charge Configuration - Access Control', () => {
  // Matches the other charge-configuration specs. This one was left on the 30s default
  // and, being a full login + dashboard + menu walk, it timed out under parallel load
  // against this shared demo host while passing in ~5s on its own.
  test.describe.configure({ timeout: 90_000 });

  test('TC-045a - Authorised user can reach Charge Configuration via the menu @critical', async ({
    chargeLandingPage,
    page,
  }) => {
    await page.goto('/dashboard');
    await chargeLandingPage.gotoViaMenu();

    await expect(chargeLandingPage.heading).toBeVisible();
    await expect(chargeLandingPage.categoryCard('Transaction Charge')).toBeVisible();
  });

  test.fixme(caseTitle('TC-045'), async () => {
    // Needs credentials for a user without Charge Configuration access, to assert the
    // menu entry is hidden and /config/charges is denied. No such account was provided;
    // add READONLY_USERNAME / READONLY_PASSWORD to .env and a second-user fixture to enable.
  });
});
