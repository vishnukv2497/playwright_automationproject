/**
 * Test Case: Invalid Login
 *
 * Tags: @master @regression @web
 *
 * Steps:
 * 1) Navigate to My Account → Login
 * 2) Log in with an unregistered email and a random password
 * 3) Verify the warning message and that the customer is not authenticated
 */

// using custom fixtures
import { test, expect } from '../../fixtures/pageFixtures';
import { RandomDataUtil } from '../../utils/dataGenerator';

test('Invalid login test @master @regression @web', async ({ page, homePage, loginPage }) => {
    const email = RandomDataUtil.getEmail();
    const password = RandomDataUtil.getPassword();

    await test.step('1) Navigate to the login page', async () => {
        await homePage.clickMyAccount();
        await homePage.clickLogin();
        expect(await loginPage.isLoginPageExists(), 'Login page should be displayed').toBeTruthy();
    });

    await test.step('2) Log in with invalid credentials', async () => {
        await loginPage.login(email, password);
    });

    await test.step('3) Verify the login is rejected', async () => {
        const warning = await loginPage.getLoginErrorMessage();
        expect(warning, 'Invalid-login warning should be displayed').toContain('Warning: No match for E-Mail Address and/or Password.');
        await expect(page, 'Customer should stay on the login page').toHaveURL(/route=account\/login/);
        expect(await homePage.isLogoutOptionAvailable(), 'Customer should not be authenticated').toBeFalsy();
    });

    console.log('✅ Invalid login was rejected as expected!');
});
