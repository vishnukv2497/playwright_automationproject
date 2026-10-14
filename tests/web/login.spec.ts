/**
 * Test Case: Valid Login
 *
 * Tags: @master @sanity @regression @web
 *
 * Steps:
 * 1) Navigate to My Account → Login and verify the login page
 * 2) Log in with the configured valid customer credentials
 * 3) Verify the customer reaches the authenticated My Account area
 */

// using custom fixtures
import { test, expect } from '../../fixtures/pageFixtures';
import { Helper } from '../../utils/helper';

test('Valid login test @master @sanity @regression @web', async ({ page, homePage, loginPage, myAccountPage }) => {
    const { email, password } = Helper.getLoginDetails();

    await test.step('1) Navigate to the login page', async () => {
        await homePage.clickMyAccount();
        await homePage.clickLogin();
        expect(await loginPage.isLoginPageExists(), 'Login page should be displayed').toBeTruthy();
    });

    await test.step('2) Log in with valid credentials', async () => {
        await loginPage.login(email, password);
    });

    await test.step('3) Verify successful authentication', async () => {
        expect(await myAccountPage.isMyAccountPageExists(), 'My Account page should be displayed').toBeTruthy();
        await expect(page, 'Customer should be redirected to the My Account section').toHaveURL(/route=account\/account/);
        expect(await homePage.isLogoutOptionAvailable(), 'Authenticated account navigation should be available').toBeTruthy();
    });

    console.log('✅ Valid login completed successfully!');
});
