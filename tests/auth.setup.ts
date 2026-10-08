import { test as setup, expect } from '../fixtures/pages';
import { STORAGE_STATE } from '../playwright.config';
import { users } from '../test-data/users';

// saucedemo keeps the session in a single cookie (session-username) that expires after 10 minutes,
// so log in fresh on every run instead of reusing an old .auth file.
setup('log in as standard_user', async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login(users.standard.username, users.standard.password);
    await expect(page).toHaveURL(/inventory\.html/);

    await page.context().storageState({ path: STORAGE_STATE });
});
