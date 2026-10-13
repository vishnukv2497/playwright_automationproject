/**
 * Test Case: Login and navigate to the Software category
 *
 * Tags: @master @regression @web
 *
 * Steps:
 * 1) Log in with the configured valid customer credentials
 * 2) Verify the My Account page is reachable
 * 3) Open "Software" from the main menu and verify the category page
 *    (the demo store has no dashboard; Software is an empty category)
 */

import { test, expect } from '../../fixtures/pageFixtures';
import { Helper } from '../../utils/helper';

test('Login and open Software category @master @regression @web', async ({ page, homePage, loginPage, myAccountPage, softwarePage }) => {
    const { email, password } = Helper.getLoginDetails();

    await test.step('1) Log in with valid credentials', async () => {
        await homePage.clickMyAccount();
        await homePage.clickLogin();
        expect(await loginPage.isLoginPageExists(), 'Login page should be displayed').toBeTruthy();
        await loginPage.login(email, password);
    });

    await test.step('2) Verify My Account page is reachable', async () => {
        expect(await myAccountPage.isMyAccountPageExists(), 'My Account page should be displayed').toBeTruthy();
        await expect(page).toHaveURL(/route=account\/account/);
    });

    await test.step('3) Navigate to Software and verify the category page', async () => {
        await softwarePage.clickSoftwareMenu();
        expect(await softwarePage.isSoftwarePageExists(), 'Software heading should be displayed').toBeTruthy();
        await expect(page, 'URL should point to the Software category').toHaveURL(/route=product\/category&path=17/);
        await expect(page).toHaveTitle('Software');
        expect(await softwarePage.isBreadcrumbDisplayed(), 'Breadcrumb should show Software').toBeTruthy();
        expect(await softwarePage.isEmptyMessageDisplayed(), 'Empty-category message should be displayed').toBeTruthy();
        expect(await softwarePage.getProductCount(), 'Software category has no products').toBe(0);
    });
});
