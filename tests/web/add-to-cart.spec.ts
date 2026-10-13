/**
 * Test Case: Add Product to Cart
 *
 * Tags: @master @regression @web
 *
 * Steps:
 * 1) Search for a known product and open its details page
 * 2) Set the quantity and click Add to Cart
 * 3) Verify the success message
 * 4) Open the shopping cart and verify the product and quantity
 */

// using custom fixtures
import { test, expect } from '../../fixtures/pageFixtures';
import { Helper } from '../../utils/helper';

test('Add product to cart test @master @regression @web', async ({ homePage, searchResultsPage, productPage, shoppingCartPage }) => {
    const { productName, productQuantity } = Helper.getProductDetails();

    await test.step('1) Search for the product and open its details page', async () => {
        await homePage.enterProductName(productName);
        await homePage.clickSearch();
        await searchResultsPage.selectProduct(productName);
        expect(await productPage.isProductPageExists(), 'Product details page should be displayed').toBeTruthy();
        expect(await productPage.getProductName(), 'Product page should show the selected product').toBe(productName);
    });

    await test.step('2) Set the quantity and add the product to the cart', async () => {
        await productPage.setQuantity(productQuantity);
        await productPage.addToCart();
    });

    await test.step('3) Verify the add-to-cart success message', async () => {
        const message = await productPage.getConfirmationMessage();
        expect(message, 'Add-to-cart success message should be displayed').toContain(`Success: You have added ${productName} to your shopping cart!`);
    });

    await test.step('4) Verify the product and quantity in the shopping cart', async () => {
        await productPage.clickShoppingCartLink();
        expect(await shoppingCartPage.isShoppingCartPageExists(), 'Shopping cart page should be displayed').toBeTruthy();
        expect(await shoppingCartPage.isProductInCart(productName), `"${productName}" should be in the cart`).toBeTruthy();
        expect(await shoppingCartPage.getProductQuantity(productName), 'Cart quantity should match the requested quantity').toBe(productQuantity);
    });

    console.log('✅ Product added to cart successfully!');
});
