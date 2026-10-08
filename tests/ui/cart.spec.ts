import { test, expect } from '../../fixtures/pages';
import { users } from '../../test-data/users';

// This test is about logging in, so it starts logged out.
test.use({ storageState: { cookies: [], origins: [] } });

test('Login with valid credentials', async ({ page, loginPage, inventoryPage }) => {
  await loginPage.goto();
  await loginPage.login(users.standard.username, users.standard.password);

  await expect(page).toHaveURL(/inventory\.html/);
  await expect(inventoryPage.title).toHaveText('Products');
});
