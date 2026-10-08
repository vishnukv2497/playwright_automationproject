import { test, expect } from '../../fixtures/pages';
import { products } from '../../test-data/products';
import { customer } from '../../test-data/checkout';

test('end-to-end purchase of 2 items', { tag: '@smoke' }, async ({ inventoryPage, header, cartPage, checkoutInfoPage, checkoutOverviewPage, checkoutCompletePage }) => {
    const items = [products.backpack, products.bikeLight];
    const prices: string[] = [];

    await test.step('Add 2 items from the inventory', async () => {
        await inventoryPage.goto();
        for (const name of items) {
            prices.push((await inventoryPage.cardDetails(name)).price);
            await inventoryPage.addToCart(name);
        }
        await expect(header.cartBadge).toHaveText('2');
    });

    await test.step('Cart shows both items with their inventory prices', async () => {
        await header.openCart();
        await expect(cartPage.itemNames).toHaveText(items);
        await expect(cartPage.itemPrices).toHaveText(prices);
    });

    await test.step('Enter customer details', async () => {
        await cartPage.checkout();
        await expect(checkoutInfoPage.title).toHaveText('Checkout: Your Information');
        await checkoutInfoPage.fillCustomerDetails(customer);
        await checkoutInfoPage.continueToOverview();
    });

    await test.step('Overview lists both items', async () => {
        await expect(checkoutOverviewPage.title).toHaveText('Checkout: Overview');
        await expect(checkoutOverviewPage.itemNames).toHaveText(items);
        await expect(checkoutOverviewPage.itemPrices).toHaveText(prices);
    });

    await test.step('Finish shows the order confirmation', async () => {
        await checkoutOverviewPage.finish();
        await expect(checkoutCompletePage.title).toHaveText('Checkout: Complete!');
        await expect(checkoutCompletePage.completeHeader).toHaveText('Thank you for your order!');
    });

    await test.step('Cart badge is cleared', async () => {
        await expect(header.cartBadge).toBeHidden();
    });
});
