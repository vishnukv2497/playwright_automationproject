/**
 * Test Case: User Registration
 *
 * Tags: @master @sanity @regression @web
 *
 * Steps:
 * 1) Navigate to My Account → Register and verify the registration page
 * 2) Fill all mandatory fields with unique random data, accept the Privacy Policy and submit
 * 3) Verify the "Your Account Has Been Created!" confirmation
 * 4) Continue to My Account and verify the new account is logged in
 */

// using custom fixtures
import { test, expect } from '../../fixtures/pageFixtures';
import { RandomDataUtil } from '../../utils/dataGenerator';

test('User registration test @master @sanity @regression @web', async ({ homePage, registrationPage, myAccountPage }) => {
    const userData = {
        firstName: RandomDataUtil.getFirstName(),
        lastName: RandomDataUtil.getLastName(),
        email: `${Date.now()}.${RandomDataUtil.getEmail()}`, // timestamp keeps the email unique on the shared site
        telephone: RandomDataUtil.getPhoneNumber(),
        password: RandomDataUtil.getPassword(),
    };

    await test.step('1) Navigate to the registration page', async () => {
        await homePage.clickMyAccount();
        await homePage.clickRegister();
        expect(await registrationPage.isRegistrationPageExists(), 'Registration page should be displayed').toBeTruthy();
    });

    await test.step('2) Fill and submit the registration form', async () => {
        await registrationPage.completeRegistration(userData);
    });

    await test.step('3) Verify the account-created confirmation', async () => {
        const confirmation = await registrationPage.getConfirmationMsg();
        expect(confirmation, 'Account-created confirmation should be displayed').toBe('Your Account Has Been Created!');
    });

    await test.step('4) Verify the new account is available through My Account', async () => {
        await registrationPage.clickContinueToMyAccount();
        expect(await myAccountPage.isMyAccountPageExists(), 'My Account page should be displayed').toBeTruthy();
        expect(await homePage.isLogoutOptionAvailable(), 'New customer should be logged in').toBeTruthy();
    });

    console.log(`✅ Registration completed successfully for ${userData.email}`);
});
