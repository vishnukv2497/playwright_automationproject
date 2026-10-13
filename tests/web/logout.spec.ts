/**
 * Test Case: Logout
 *
 * Tags: @master @regression @web
 *
 * Steps:
 * 1) Log in with the configured valid customer credentials
 * 2) Click Logout in the account menu and verify the logout confirmation page
 * 3) Click Continue and verify the redirect to the home page
 * 4) Verify authenticated account options are no longer available
 */

// using custom fixtures
import { test, expect } from '../../fixtures/pageFixtures';
import { Helper } from '../../utils/helper';

test('User logout test @master @regression @web', async ({ homePage, loginPage, myAccountPage, logoutPage }) => {
    const { email, password } = Helper.getLoginDetails();

    await test.step('1) Log in with valid credentials', async () => {
        await homePage.clickMyAccount();
        await homePage.clickLogin();
        await loginPage.login(email, password);
        expect(await myAccountPage.isMyAccountPageExists(), 'Login should succeed before logout').toBeTruthy();
    });

    await test.step('2) Log out and verify the logout confirmation page', async () => {
        await myAccountPage.clickLogout();
        expect(await logoutPage.isLogoutPageExists(), 'Logout confirmation page should be displayed').toBeTruthy();
    });

    await test.step('3) Continue to the home page', async () => {
        await logoutPage.clickContinue();
        expect(await homePage.isHomePageExists(), 'Customer should be redirected to the home page').toBeTruthy();
    });

    await test.step('4) Verify authenticated options are no longer available', async () => {
        expect(await homePage.isLogoutOptionAvailable(), 'Logout option should no longer be available').toBeFalsy();
    });

    console.log('✅ Logout completed successfully!');
});
