import { test, expect } from '../../fixtures/pages';
import { users, invalidLogins } from '../../test-data/users';

// Login tests start logged out.
test.use({ storageState: { cookies: [], origins: [] } });

test('standard_user lands on the inventory showing 6 products', { tag: '@smoke' }, async ({ page, loginPage, inventoryPage }) => {
    await test.step('Log in as standard_user', async () => {
        await loginPage.goto();
        await loginPage.login(users.standard.username, users.standard.password);
    });

    await test.step('Inventory page shows 6 products', async () => {
        await expect(page).toHaveURL('/inventory.html');
        await expect(inventoryPage.title).toHaveText('Products');
        await expect(inventoryPage.inventoryItems).toHaveCount(6);
    });
});

test.describe('login is rejected', { tag: '@regression' }, () => {
    for (const { scenario, username, password, expectedError } of invalidLogins) {
        test(`${scenario}`, async ({ page, loginPage }) => {
            await test.step(`Submit username "${username}" and password "${password ? '***' : ''}"`, async () => {
                await loginPage.goto();
                await loginPage.login(username, password);
            });

            await test.step('Exact error is shown and the user stays on the login page', async () => {
                await expect(loginPage.errorMessage).toHaveText(expectedError);
                await expect(page).toHaveURL('/');
            });
        });
    }
});
