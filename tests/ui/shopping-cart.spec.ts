import { test, expect } from '../../fixtures/pages';
import { products } from '../../test-data/products';

test.describe('cart', { tag: '@regression' }, () => {
    test('adding from the inventory page puts the item in the cart', async ({ inventoryPage, header, cartPage }) => {
        await test.step('Add the Backpack from the inventory', async () => {
            await inventoryPage.goto();
            await inventoryPage.addToCart(products.backpack);
        });

        await test.step('Badge shows 1 and the card button switches to Remove', async () => {
            await expect(header.cartBadge).toHaveText('1');
            await expect(inventoryPage.removeButton(products.backpack)).toBeVisible();
        });

        await test.step('Cart contains the Backpack', async () => {
            await header.openCart();
            await expect(cartPage.itemNames).toHaveText([products.backpack]);
        });
    });

    test('removing from the inventory page takes the item out of the cart', async ({ inventoryPage, header, cartPage }) => {
        await test.step('Add the Backpack, then remove it from the inventory', async () => {
            await inventoryPage.goto();
            await inventoryPage.addToCart(products.backpack);
            await expect(header.cartBadge).toHaveText('1');
            await inventoryPage.removeFromCart(products.backpack);
        });

        await test.step('Badge is gone and the card button switches back to Add to cart', async () => {
            await expect(header.cartBadge).toBeHidden();
            await expect(inventoryPage.addToCartButton(products.backpack)).toBeVisible();
        });

        await test.step('Cart is empty', async () => {
            await header.openCart();
            await expect(cartPage.title).toHaveText('Your Cart');
            await expect(cartPage.cartItems).toHaveCount(0);
        });
    });

    test('adding from the product detail page puts the item in the cart', async ({ inventoryPage, productDetailPage, header, cartPage }) => {
        await test.step('Open the Bike Light and add it to the cart', async () => {
            await inventoryPage.goto();
            await inventoryPage.openProduct(products.bikeLight);
            await productDetailPage.addToCart();
        });

        await test.step('Badge shows 1 and the button switches to Remove', async () => {
            await expect(header.cartBadge).toHaveText('1');
            await expect(productDetailPage.removeButton).toBeVisible();
        });

        await test.step('Cart contains the Bike Light', async () => {
            await header.openCart();
            await expect(cartPage.itemNames).toHaveText([products.bikeLight]);
        });
    });

    test('removing from the product detail page takes the item out of the cart', async ({ inventoryPage, productDetailPage, header, cartPage }) => {
        await test.step('Open the Bike Light, add it, then remove it', async () => {
            await inventoryPage.goto();
            await inventoryPage.openProduct(products.bikeLight);
            await productDetailPage.addToCart();
            await expect(header.cartBadge).toHaveText('1');
            await productDetailPage.removeFromCart();
        });

        await test.step('Badge is gone and the button switches back to Add to cart', async () => {
            await expect(header.cartBadge).toBeHidden();
            await expect(productDetailPage.addToCartButton).toBeVisible();
        });

        await test.step('Cart is empty', async () => {
            await header.openCart();
            await expect(cartPage.title).toHaveText('Your Cart');
            await expect(cartPage.cartItems).toHaveCount(0);
        });
    });

    test('badge counts the items in the cart', async ({ inventoryPage, header }) => {
        const items = [products.backpack, products.bikeLight, products.onesie];

        await test.step('Badge goes up by one for each item added', async () => {
            await inventoryPage.goto();
            await expect(header.cartBadge).toBeHidden();
            for (const [index, name] of items.entries()) {
                await inventoryPage.addToCart(name);
                await expect(header.cartBadge).toHaveText(String(index + 1));
            }
        });

        await test.step('Badge goes down by one when an item is removed', async () => {
            await inventoryPage.removeFromCart(products.bikeLight);
            await expect(header.cartBadge).toHaveText('2');
        });
    });

    test('cart persists after a page reload', async ({ page, inventoryPage, header, cartPage }) => {
        const items = [products.fleeceJacket, products.onesie];

        await test.step('Add 2 items and open the cart', async () => {
            await inventoryPage.goto();
            for (const name of items) {
                await inventoryPage.addToCart(name);
            }
            await header.openCart();
            await expect(cartPage.itemNames).toHaveText(items);
        });

        await test.step('Reload the page', async () => {
            await page.reload();
        });

        await test.step('Cart still holds both items', async () => {
            await expect(cartPage.itemNames).toHaveText(items);
            await expect(header.cartBadge).toHaveText('2');
        });
    });

    test('Reset App State clears the cart', async ({ inventoryPage, header, cartPage }) => {
        await test.step('Add 2 items', async () => {
            await inventoryPage.goto();
            await inventoryPage.addToCart(products.backpack);
            await inventoryPage.addToCart(products.boltTShirt);
            await expect(header.cartBadge).toHaveText('2');
        });

        await test.step('Reset App State from the menu', async () => {
            await header.resetAppState();
        });

        await test.step('Badge is gone and the cart is empty', async () => {
            await expect(header.cartBadge).toBeHidden();
            await header.closeMenu();
            await header.openCart();
            await expect(cartPage.title).toHaveText('Your Cart');
            await expect(cartPage.cartItems).toHaveCount(0);
        });
    });
});
