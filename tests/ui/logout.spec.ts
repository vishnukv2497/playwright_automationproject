import { test, expect } from '../../fixtures/pages';

// Starts logged in as standard_user (storageState). Logging out only clears this test's own browser context.
test.describe('logout', { tag: '@smoke' }, () => {
    test('returns to the login page', async ({ page, inventoryPage, header, loginPage }) => {
        await test.step('Open the inventory (already logged in)', async () => {
            await inventoryPage.goto();
            await expect(inventoryPage.title).toHaveText('Products');
        });

        await test.step('Log out from the menu', async () => {
            await header.logout();
        });

        await test.step('Login page is shown', async () => {
            await expect(page).toHaveURL('/');
            await expect(loginPage.loginButton).toBeVisible();
        });
    });

    test('blocks going straight to /inventory.html afterwards', async ({ page, inventoryPage, header, loginPage }) => {
        await test.step('Log out', async () => {
            await inventoryPage.goto();
            await header.logout();
            await expect(page).toHaveURL('/');
        });

        await test.step('Go straight to /inventory.html', async () => {
            await inventoryPage.goto();
        });

        await test.step('Redirected to the login page with an error', async () => {
            await expect(page).toHaveURL('/');
            await expect(loginPage.errorMessage).toHaveText("Epic sadface: You can only access '/inventory.html' when you are logged in.");
            await expect(inventoryPage.inventoryItems).toHaveCount(0);
        });
    });
});
