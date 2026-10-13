/**
 * Test Case: Login (Data Driven using External File)
 *
 * Tags: @master @datadriven @web
 *
 * Data: testdata/opencart_logindata.json (one independent test per row)
 *
 * Steps (per row):
 * 1) Navigate to My Account → Login
 * 2) Enter the row's email and password (blank values are left empty)
 * 3) Validate the result against the row's "expected" value (success / failure)
 */

// using custom fixtures
import { test, expect } from '../../fixtures/pageFixtures';
import { DataProvider } from '../../utils/DataReader';

type LoginData = {
    testName?: string;
    TestName?: string;
    email: string;
    password: string;
    expected: string;
};

const loginData: LoginData[] = DataProvider.readJson('./testdata/opencart_logindata.json');

// OpenCart rejects a failed login with "No match", or with the lockout warning once the same email
// has failed 5 times within an hour (the failure rows reuse fixed emails, so repeated runs hit the lockout)
const LOGIN_FAILURE_WARNING =
    /Warning: (No match for E-Mail Address and\/or Password\.|Your account has exceeded allowed number of login attempts\.)/;

for (const data of loginData) {
    const scenario = data.testName ?? data.TestName ?? data.email;

    test(`Login data driven - ${scenario} @master @datadriven @web`, async ({ homePage, loginPage, myAccountPage }) => {
        // Blank/whitespace values are submitted as empty fields, never replaced with dummy data
        const email = data.email.trim() === '' ? '' : data.email;
        const password = data.password.trim() === '' ? '' : data.password;

        await test.step('1) Navigate to the login page', async () => {
            await homePage.clickMyAccount();
            await homePage.clickLogin();
            expect(await loginPage.isLoginPageExists(), 'Login page should be displayed').toBeTruthy();
        });

        await test.step('2) Submit the login form', async () => {
            await loginPage.login(email, password);
        });

        await test.step(`3) Verify the login result is "${data.expected}"`, async () => {
            if (data.expected.toLowerCase() === 'success') {
                expect(await myAccountPage.isMyAccountPageExists(), 'My Account page should be displayed').toBeTruthy();
                expect(await homePage.isLogoutOptionAvailable(), 'Customer should be authenticated').toBeTruthy();
            } else {
                const warning = await loginPage.getLoginErrorMessage();
                expect(warning, 'Login failure warning should be displayed').toMatch(LOGIN_FAILURE_WARNING);
                expect(await homePage.isLogoutOptionAvailable(), 'Customer should not be authenticated').toBeFalsy();
            }
        });

        console.log(`✅ Data-driven login "${scenario}" behaved as expected (${data.expected})`);
    });
}
