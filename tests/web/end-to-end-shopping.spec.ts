/**
 * Test Case: End-to-End Shopping Journey
 *
 * Tags: @master @regression @e2e @web
 *
 * Steps:
 * 1) Register a new customer with unique random data
 * 2) Log out
 * 3) Log in again with the new credentials
 * 4) Search for a known product and open its details page
 * 5) Add the product to the cart
 * 6) Verify product, quantity, price and cart total in the shopping cart
 */

// using custom fixtures
import { test, expect } from '../../fixtures/pageFixtures';
import { RandomDataUtil } from '../../utils/dataGenerator';
import { Helper } from '../../utils/helper';

test('End-to-end shopping journey test @master @regression @e2e @web', async ({
    homePage,
    registrationPage,
    myAccountPage,
    logoutPage,
    loginPage,
    searchResultsPage,
    productPage,
    shoppingCartPage,
}) => {
    const userData = {
        firstName: RandomDataUtil.getFirstName(),
        lastName: RandomDataUtil.getLastName(),
        email: `${Date.now()}.${RandomDataUtil.getEmail()}`, // timestamp keeps the email unique on the shared site
        telephone: RandomDataUtil.getPhoneNumber(),
        password: RandomDataUtil.getPassword(),
    };
    const { productName, productQuantity, totalPrice } = Helper.getProductDetails();
    let productPrice = '';

    await test.step('1) Register a new customer', async () => {
        await homePage.clickMyAccount();
        await homePage.clickRegister();
        await registrationPage.completeRegistration(userData);
        expect(await registrationPage.getConfirmationMsg(), 'Registration should succeed').toBe('Your Account Has Been Created!');
    });

    await test.step('2) Log out', async () => {
        await registrationPage.clickContinueToMyAccount();
        expect(await myAccountPage.isMyAccountPageExists(), 'My Account page should be displayed').toBeTruthy();
        await myAccountPage.clickLogout();
        expect(await logoutPage.isLogoutPageExists(), 'Logout confirmation page should be displayed').toBeTruthy();
        await logoutPage.clickContinue();
        expect(await homePage.isHomePageExists(), 'Home page should be displayed after logout').toBeTruthy();
    });

    await test.step('3) Log in again with the new credentials', async () => {
        await homePage.clickMyAccount();
        await homePage.clickLogin();
        await loginPage.login(userData.email, userData.password);
        expect(await myAccountPage.isMyAccountPageExists(), 'Login with the new account should succeed').toBeTruthy();
        expect(await homePage.isLogoutOptionAvailable(), 'Customer should be authenticated').toBeTruthy();
    });

    await test.step('4) Search for the product and open its details page', async () => {
        await homePage.enterProductName(productName);
        await homePage.clickSearch();
        expect(await searchResultsPage.isProductExist(productName), `"${productName}" should be in the search results`).toBeTruthy();
        await searchResultsPage.selectProduct(productName);
        expect(await productPage.isProductPageExists(), 'Product details page should be displayed').toBeTruthy();
        productPrice = await productPage.getProductPrice();
    });

    await test.step('5) Add the product to the cart', async () => {
        await productPage.setQuantity(productQuantity);
        await productPage.addToCart();
        expect(await productPage.getConfirmationMessage(), 'Add-to-cart success message should be displayed')
            .toContain(`Success: You have added ${productName} to your shopping cart!`);
    });

    await test.step('6) Verify product, quantity, price and total in the cart', async () => {
        await productPage.clickShoppingCartLink();
        expect(await shoppingCartPage.isShoppingCartPageExists(), 'Shopping cart page should be displayed').toBeTruthy();
        expect(await shoppingCartPage.isProductInCart(productName), `"${productName}" should be in the cart`).toBeTruthy();
        expect(await shoppingCartPage.getProductQuantity(productName), 'Cart quantity should match').toBe(productQuantity);
        expect(await shoppingCartPage.getUnitPrice(productName), 'Cart unit price should match the product page price').toBe(productPrice);

        const cartTotal = await shoppingCartPage.getCartTotal();
        const expectedTotal = Helper.convertPriceToNumber(productPrice) * Number(productQuantity);
        expect(Helper.convertPriceToNumber(cartTotal), 'Cart total should equal unit price × quantity').toBeCloseTo(expectedTotal, 2);
        expect(cartTotal, 'Cart total should match the expected total price').toBe(totalPrice);
    });

    console.log(`✅ End-to-end shopping journey completed successfully for ${userData.email}`);
});
