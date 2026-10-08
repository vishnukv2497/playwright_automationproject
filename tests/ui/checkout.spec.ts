import { test, expect } from '../../fixtures/pages';
import { products } from '../../test-data/products';
import { customer, incompleteCustomers, TAX_RATE } from '../../test-data/checkout';
import { formatCents, toCents } from '../../utils/money';

test.describe('checkout', { tag: '@regression' }, () => {
    test.describe('validation', () => {
        for (const { missingField, details, expectedError } of incompleteCustomers) {
            test(`${missingField} is required`, async ({ page, checkoutInfoPage }) => {
                await test.step(`Continue without ${missingField}`, async () => {
                    await checkoutInfoPage.goto();
                    await checkoutInfoPage.fillCustomerDetails(details);
                    await checkoutInfoPage.continueToOverview();
                });

                await test.step('Exact error is shown and checkout does not advance', async () => {
                    await expect(checkoutInfoPage.errorMessage).toHaveText(expectedError);
                    await expect(page).toHaveURL('/checkout-step-one.html');
                });
            });
        }
    });

    test.describe('cancel', () => {
        test('on "Your Information" goes back to the cart', async ({ page, inventoryPage, header, cartPage, checkoutInfoPage }) => {
            await test.step('Add an item and start checkout', async () => {
                await inventoryPage.goto();
                await inventoryPage.addToCart(products.backpack);
                await header.openCart();
                await cartPage.checkout();
                await expect(checkoutInfoPage.title).toHaveText('Checkout: Your Information');
            });

            await test.step('Cancel', async () => {
                await checkoutInfoPage.cancel();
            });

            await test.step('Back on the cart with the item still in it', async () => {
                await expect(page).toHaveURL('/cart.html');
                await expect(cartPage.title).toHaveText('Your Cart');
                await expect(cartPage.itemNames).toHaveText([products.backpack]);
            });
        });

        test('on "Overview" goes back to the inventory', async ({ page, inventoryPage, header, cartPage, checkoutInfoPage, checkoutOverviewPage }) => {
            await test.step('Add an item and get to the overview', async () => {
                await inventoryPage.goto();
                await inventoryPage.addToCart(products.backpack);
                await header.openCart();
                await cartPage.checkout();
                await checkoutInfoPage.fillCustomerDetails(customer);
                await checkoutInfoPage.continueToOverview();
                await expect(checkoutOverviewPage.title).toHaveText('Checkout: Overview');
            });

            await test.step('Cancel', async () => {
                await checkoutOverviewPage.cancel();
            });

            await test.step('Back on the inventory with the item still in the cart', async () => {
                await expect(page).toHaveURL('/inventory.html');
                await expect(inventoryPage.title).toHaveText('Products');
                await expect(header.cartBadge).toHaveText('1');
            });
        });
    });

    test('overview totals add up', async ({ inventoryPage, header, cartPage, checkoutInfoPage, checkoutOverviewPage }) => {
        const items = [products.backpack, products.bikeLight, products.boltTShirt];
        let itemTotal = 0;

        await test.step('Add 3 items and get to the overview', async () => {
            await inventoryPage.goto();
            for (const name of items) {
                await inventoryPage.addToCart(name);
            }
            await header.openCart();
            await cartPage.checkout();
            await checkoutInfoPage.fillCustomerDetails(customer);
            await checkoutInfoPage.continueToOverview();
            await expect(checkoutOverviewPage.itemPrices).toHaveCount(items.length);
        });

        await test.step('Item total is the sum of the item prices', async () => {
            const prices = await checkoutOverviewPage.itemPrices.allInnerTexts();
            itemTotal = prices.map(toCents).reduce((sum, cents) => sum + cents, 0);
            await expect(checkoutOverviewPage.subtotalLabel).toHaveText(`Item total: ${formatCents(itemTotal)}`);
        });

        // itemTotal is in cents, so rounding to a whole number rounds the tax to 2 decimals.
        const tax = Math.round(itemTotal * TAX_RATE);

        await test.step(`Tax is ${TAX_RATE * 100}% of the item total, rounded to the cent`, async () => {
            await expect(checkoutOverviewPage.taxLabel).toHaveText(`Tax: ${formatCents(tax)}`);
        });

        await test.step('Total is item total plus tax', async () => {
            await expect(checkoutOverviewPage.totalLabel).toHaveText(`Total: ${formatCents(itemTotal + tax)}`);
        });
    });
});
