import { test, expect } from '../../fixtures/pages';
import { users } from '../../test-data/users';
import { products } from '../../test-data/products';
import { customer } from '../../test-data/checkout';

// saucedemo ships users with deliberate bugs. test.fail() marks a test that is expected to fail because the
// app is broken on purpose; if the app is ever fixed, the test passes and Playwright reports it as unexpected.
test.describe('known-bug users', { tag: '@regression' }, () => {
    // Each test logs in as its own user, so start logged out.
    test.use({ storageState: { cookies: [], origins: [] } });

    test('problem_user: sorting by Name (Z to A) reorders the products', async ({ loginPage, inventoryPage }) => {
        // App bug (intentional): sorting does nothing for problem_user. The list stays A to Z and the dropdown snaps back.
        test.fail();
        let expectedOrder: string[] = [];

        await test.step('Log in as problem_user', async () => {
            await loginPage.goto();
            await loginPage.login(users.problem.username, users.problem.password);
            await expect(inventoryPage.inventoryItems).toHaveCount(6);
            const names = await inventoryPage.itemNames.allInnerTexts();
            expectedOrder = [...names].sort((a, b) => a.localeCompare(b)).reverse();
        });

        await test.step('Sort by Name (Z to A)', async () => {
            await inventoryPage.sortBy('Name (Z to A)');
        });

        await test.step('All 6 names are in Z to A order', async () => {
            await expect(inventoryPage.itemNames).toHaveText(expectedOrder);
        });
    });

    for (const key of ['standard', 'problem'] as const) {
        const user = users[key];

        test(`${user.username}: every product shows its own image`, async ({ loginPage, inventoryPage }) => {
            // App bug (intentional): problem_user gets the same placeholder image (sl-404) for every product.
            // standard_user runs the same check as a control, to prove the check itself is valid.
            test.fail(key === 'problem', 'problem_user shows the same placeholder image for every product');

            await test.step(`Log in as ${user.username}`, async () => {
                await loginPage.goto();
                await loginPage.login(user.username, user.password);
                await expect(inventoryPage.itemImages).toHaveCount(6);
            });

            await test.step('The 6 product images are 6 different images', async () => {
                const sources = await inventoryPage.itemImages.evaluateAll((images) => images.map((image) => image.getAttribute('src')));
                expect(new Set(sources).size).toBe(6);
            });
        });
    }

    test('error_user: can complete a purchase', async ({ loginPage, inventoryPage, header, cartPage, checkoutInfoPage, checkoutOverviewPage, checkoutCompletePage }) => {
        // App bug (intentional): for error_user the Last Name field ignores typing and Finish does nothing,
        // so the order never reaches "Thank you for your order!".
        test.fail();

        await test.step('Log in as error_user and add the Backpack', async () => {
            await loginPage.goto();
            await loginPage.login(users.error.username, users.error.password);
            await inventoryPage.addToCart(products.backpack);
            await expect(header.cartBadge).toHaveText('1');
        });

        await test.step('Check out with customer details', async () => {
            await header.openCart();
            await cartPage.checkout();
            await checkoutInfoPage.fillCustomerDetails(customer);
            await checkoutInfoPage.continueToOverview();
            await expect(checkoutOverviewPage.title).toHaveText('Checkout: Overview');
        });

        await test.step('Finish shows the order confirmation', async () => {
            await checkoutOverviewPage.finish();
            await expect(checkoutCompletePage.completeHeader).toHaveText('Thank you for your order!');
        });
    });

    test('performance_glitch_user: login completes within 10 seconds', async ({ loginPage, inventoryPage }) => {
        // Not test.fail: login is deliberately slow (about 5-7 s) but stays inside the 10 s budget.
        const budgetMs = 10_000;
        let elapsedMs = 0;

        await test.step('Log in as performance_glitch_user', async () => {
            await loginPage.goto();
            const start = Date.now();
            await loginPage.login(users.performanceGlitch.username, users.performanceGlitch.password);
            await expect(inventoryPage.title).toHaveText('Products', { timeout: budgetMs });
            elapsedMs = Date.now() - start;
        });

        await test.step(`Inventory appeared within ${budgetMs / 1000} s`, async () => {
            test.info().annotations.push({ type: 'login time', description: `${elapsedMs} ms` });
            expect(elapsedMs).toBeLessThan(budgetMs);
        });
    });
});
