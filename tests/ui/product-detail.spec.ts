import { test, expect } from '../../fixtures/pages';
import { allProductNames } from '../../test-data/products';

test.describe('product detail', { tag: '@regression' }, () => {
    for (const productName of allProductNames) {
        test(`${productName} matches its inventory card`, async ({ page, inventoryPage, productDetailPage }) => {
            let card = { name: '', description: '', price: '' };

            await test.step('Read the inventory card', async () => {
                await inventoryPage.goto();
                card = await inventoryPage.cardDetails(productName);
            });

            await test.step('Open the product', async () => {
                await inventoryPage.openProduct(productName);
                await expect(page).toHaveURL(/\/inventory-item\.html\?id=\d+$/);
            });

            await test.step('Name, description and price match the card', async () => {
                await expect(productDetailPage.productName).toHaveText(card.name);
                await expect(productDetailPage.productDescription).toHaveText(card.description);
                await expect(productDetailPage.productPrice).toHaveText(card.price);
            });
        });
    }
});
