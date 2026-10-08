import { test, expect } from '../../fixtures/pages';
import { users } from '../../test-data/users';

test.describe('SauceDemo - login with all known users', () => {
    // These tests are about logging in, so they start logged out.
    test.use({ storageState: { cookies: [], origins: [] } });

    for (const [key, user] of Object.entries(users)) {
        test(`${key} (${user.username}) - ${user.canLogin ? 'can login' : 'cannot login'}`, async ({ page, loginPage }) => {
            await loginPage.goto();
            await loginPage.login(user.username, user.password);

            if (user.canLogin) {
                await expect(page).toHaveURL(/inventory\.html/);
            } else {
                await expect(loginPage.errorMessage).toBeVisible();
            }
        });
    }
});
