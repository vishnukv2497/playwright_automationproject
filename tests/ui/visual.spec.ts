import fs from 'fs';
import { test, expect } from '../../fixtures/pages';
import { users } from '../../test-data/users';

// Baselines live in visual.spec.ts-snapshots/ and are only kept for Chromium on this OS.
// To refresh them, update the standard_user tests only, never the visual_user one:
//   npx playwright test visual.spec.ts --project=chromium --update-snapshots --grep-invert visual_user
test.describe('visual', { tag: '@regression' }, () => {
    test.skip(({ browserName }) => browserName !== 'chromium', 'Screenshot baselines are only kept for Chromium');

    test('standard_user inventory matches the baseline', async ({ page, inventoryPage }) => {
        await test.step('Open the inventory as standard_user', async () => {
            await inventoryPage.goto();
            await expect(inventoryPage.itemImages).toHaveCount(6);
        });

        await test.step('Inventory looks the same as the baseline', async () => {
            await expect(page).toHaveScreenshot('inventory.png', { fullPage: true });
        });
    });

    test.describe('logged out', () => {
        test.use({ storageState: { cookies: [], origins: [] } });

        test('login page matches the baseline', async ({ page, loginPage }) => {
            await test.step('Open the login page', async () => {
                await loginPage.goto();
                await expect(loginPage.loginButton).toBeVisible();
            });

            await test.step('Login page looks the same as the baseline', async () => {
                await expect(page).toHaveScreenshot('login.png');
            });
        });

        test('visual_user inventory differs from the standard_user baseline', async ({ page, loginPage, inventoryPage }) => {
            // Without a standard_user baseline, this test would write its own broken screenshot as the baseline.
            test.skip(!fs.existsSync(test.info().snapshotPath('inventory.png', { kind: 'screenshot' })), 'Create the standard_user inventory baseline first');
            // App bug (intentional): visual_user shows random prices on every load, the placeholder image on the
            // Backpack, a cart icon moved down and left, and a misaligned "Add to cart" button. The diff image is attached.
            test.fail();

            await test.step('Log in as visual_user', async () => {
                await loginPage.goto();
                await loginPage.login(users.visual.username, users.visual.password);
                await expect(inventoryPage.itemImages).toHaveCount(6);
            });

            await test.step('Inventory looks the same as the standard_user baseline', async () => {
                await expect(page).toHaveScreenshot('inventory.png', { fullPage: true });
            });
        });
    });
});
