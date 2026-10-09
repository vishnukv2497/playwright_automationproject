import { expect, test } from '@playwright/test';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { inventoryProducts } from '../../test-data/inventoryProducts';

test('end-to-end purchase of 2 items', { tag: '@smoke' }, async ({ page }) => {
    const inventoryPage = new InventoryPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const items = [inventoryProducts[0].name, inventoryProducts[1].name];
    const prices: string[] = [];

    await test.step('Log in and add 2 items from the inventory', async () => {
        await inventoryPage.openInventory();
        for (const name of items) {
            prices.push(await inventoryPage.productCard(name).locator('.inventory_item_price').innerText());
            await inventoryPage.addProduct(name);
        }
        await expect(inventoryPage.cartBadge).toHaveText('2');
    });

    await test.step('Cart and overview list both items with their inventory prices', async () => {
        await inventoryPage.openCart();
        await expect(cartPage.items.locator('.inventory_item_name')).toHaveText(items);
        await expect(cartPage.items.locator('.inventory_item_price')).toHaveText(prices);
        await cartPage.checkout();
        await checkoutPage.enterCustomerDetails('Maria', 'Babu', '682316');
        await checkoutPage.continueCheckout();
        await expect(checkoutPage.itemRows.locator('.inventory_item_name')).toHaveText(items);
        await expect(checkoutPage.itemRows.locator('.inventory_item_price')).toHaveText(prices);
    });

    await test.step('Finish confirms the order and clears the cart', async () => {
        await checkoutPage.finishOrder();
        await expect(checkoutPage.confirmationHeader).toHaveText('Thank you for your order!');
        await expect(inventoryPage.cartBadge).toBeHidden();
    });
});
