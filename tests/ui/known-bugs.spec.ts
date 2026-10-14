import { expect, test } from '@playwright/test';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { inventoryProducts } from '../../test-data/inventoryProducts';

/** saucedemo users that ship with deliberate bugs. All of them use the default password from InventoryPage.login. */
const users = {
    standard: 'standard_user',
    problem: 'problem_user',
    error: 'error_user',
    performanceGlitch: 'performance_glitch_user',
} as const;

// saucedemo ships users with deliberate bugs. test.fail() marks a test that is expected to fail because the
// app is broken on purpose; if the app is ever fixed, the test passes and Playwright reports it as unexpected.
test.describe('known-bug users', { tag: '@regression' }, () => {
    test('problem_user: sorting by Name (Z to A) reorders the products', async ({ page }) => {
        // Apps bug (intentional): sorting does nothing for problem_user. The list stays A to Z and the dropdown snaps back.
        test.fail();
        const inventoryPage = new InventoryPage(page);
        let expectedOrder: string[] = [];

        await test.step('Log in as problem_user', async () => {
            await inventoryPage.openLoginPage();
            await inventoryPage.login(users.problem);
            await expect(inventoryPage.products).toHaveCount(6);
            const names = await inventoryPage.productNames();
            expectedOrder = [...names].sort((a, b) => a.localeCompare(b)).reverse();
        });

        await test.step('Sort by Name (Z to A)', async () => {
            await inventoryPage.sortBy('za');
        });

        await test.step('All 6 names are in Z to A order', async () => {
            await expect.poll(() => inventoryPage.productNames()).toEqual(expectedOrder);
        });
    });

    for (const key of ['standard', 'problem'] as const) {
        const username = users[key];

        test(`${username}: every product shows its own image`, async ({ page }) => {
            // App bug (intentional): problem_user gets the same placeholder image (sl-404) for every product.
            // standard_user runs the same check as a control, to prove the check itself is valid.
            test.fail(key === 'problem', 'problem_user shows the same placeholder image for every product');
            const inventoryPage = new InventoryPage(page);
            const images = inventoryPage.products.locator('img');

            await test.step(`Log in as ${username}`, async () => {
                await inventoryPage.openLoginPage();
                await inventoryPage.login(username);
                await expect(images).toHaveCount(6);
            });

            await test.step('The 6 product images are 6 different images', async () => {
                const sources = await images.evaluateAll((elements) => elements.map((element) => element.getAttribute('src')));
                expect(new Set(sources).size).toBe(6);
            });
        });
    }

    test('error_user: can complete a purchase', async ({ page }) => {
        // App bug (intentional): for error_user the Last Name field ignores typing and Finish does nothing,
        // so the order never reaches "Thank you for your order!".
        test.fail();
        const inventoryPage = new InventoryPage(page);
        const cartPage = new CartPage(page);
        const checkoutPage = new CheckoutPage(page);

        await test.step('Log in as error_user and add the Backpack', async () => {
            await inventoryPage.openLoginPage();
            await inventoryPage.login(users.error);
            await inventoryPage.addProduct(inventoryProducts[0].name);
            await expect(inventoryPage.cartBadge).toHaveText('1');
        });

        await test.step('Check out with customer details', async () => {
            await inventoryPage.openCart();
            await cartPage.checkout();
            await checkoutPage.enterCustomerDetails('Maria', 'Babu', '682316');
            await checkoutPage.continueCheckout();
            await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');
        });

        await test.step('Finish shows the order confirmation', async () => {
            await checkoutPage.finishOrder();
            await expect(checkoutPage.confirmationHeader).toHaveText('Thank you for your order!');
        });
    });

    test('performance_glitch_user: login completes within 10 seconds', async ({ page }) => {
        // Not test.fail: login is deliberately slow (about 5-7 s) but stays inside the 10 s budget.
        const inventoryPage = new InventoryPage(page);
        const budgetMs = 10_000;
        let elapsedMs = 0;

        await test.step('Log in as performance_glitch_user', async () => {
            await inventoryPage.openLoginPage();
            const start = Date.now();
            await inventoryPage.login(users.performanceGlitch);
            await expect(page.locator('[data-test="title"]')).toHaveText('Products', { timeout: budgetMs });
            elapsedMs = Date.now() - start;
        });

        await test.step(`Inventory appeared within ${budgetMs / 1000} s`, async () => {
            test.info().annotations.push({ type: 'login time', description: `${elapsedMs} ms` });
            expect(elapsedMs).toBeLessThan(budgetMs);
        });
    });
});
