import { Page, Locator } from '@playwright/test';
import { MyAccountPage } from './MyAccountPage';

export type RegistrationData = {
    firstName: string;
    lastName: string;
    email: string;
    telephone: string;
    password: string;
};

export class RegistrationPage {
    private readonly page: Page;

    // Locators
    private readonly headingRegister: Locator;
    private readonly txtFirstName: Locator;
    private readonly txtLastName: Locator;
    private readonly txtEmail: Locator;
    private readonly txtTelephone: Locator;
    private readonly txtPassword: Locator;
    private readonly txtConfirmPassword: Locator;
    private readonly chkPrivacyPolicy: Locator;
    private readonly btnContinue: Locator;
    private readonly msgConfirmation: Locator;
    private readonly lnkContinueToAccount: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators
        this.headingRegister = page.getByRole('heading', { name: 'Register Account' });
        this.txtFirstName = page.getByLabel('First Name');
        this.txtLastName = page.getByLabel('Last Name');
        this.txtEmail = page.getByLabel('E-Mail');
        this.txtTelephone = page.getByLabel('Telephone');
        this.txtPassword = page.getByLabel('Password', { exact: true });
        this.txtConfirmPassword = page.getByLabel('Password Confirm');
        this.chkPrivacyPolicy = page.locator('input[name="agree"]'); // checkbox has no associated label
        this.btnContinue = page.getByRole('button', { name: 'Continue' });

        // Account-created confirmation page shown after a successful registration
        this.msgConfirmation = page.getByRole('heading', { name: 'Your Account Has Been Created!' });
        this.lnkContinueToAccount = page.locator('#content').getByRole('link', { name: 'Continue' });
    }

    /**
     * Verifies the registration page is displayed
     * @returns Promise<boolean> - true if the "Register Account" heading is visible
     */
    async isRegistrationPageExists(): Promise<boolean> {
        try {
            await this.headingRegister.waitFor({ state: 'visible', timeout: 10000 });
            return true;
        } catch (error) {
            console.log(`Error checking registration page: ${error}`);
            return false;
        }
    }

    /**
     * Enters the first name
     * @param firstName - First name
     */
    async setFirstName(firstName: string): Promise<void> {
        await this.txtFirstName.fill(firstName);
    }

    /**
     * Enters the last name
     * @param lastName - Last name
     */
    async setLastName(lastName: string): Promise<void> {
        await this.txtLastName.fill(lastName);
    }

    /**
     * Enters the email address
     * @param email - Email address
     */
    async setEmail(email: string): Promise<void> {
        await this.txtEmail.fill(email);
    }

    /**
     * Enters the telephone number
     * @param telephone - Telephone number
     */
    async setTelephone(telephone: string): Promise<void> {
        await this.txtTelephone.fill(telephone);
    }

    /**
     * Enters the password
     * @param password - Password
     */
    async setPassword(password: string): Promise<void> {
        await this.txtPassword.fill(password);
    }

    /**
     * Enters the password confirmation
     * @param password - Password to confirm
     */
    async setConfirmPassword(password: string): Promise<void> {
        await this.txtConfirmPassword.fill(password);
    }

    /**
     * Accepts the Privacy Policy
     */
    async setPrivacyPolicy(): Promise<void> {
        await this.chkPrivacyPolicy.check();
    }

    /**
     * Submits the registration form
     */
    async clickContinue(): Promise<void> {
        await this.btnContinue.click();
    }

    /**
     * Fills all mandatory fields, accepts the Privacy Policy and submits the form
     * @param userData - Customer details to register
     */
    async completeRegistration(userData: RegistrationData): Promise<void> {
        try {
            await this.setFirstName(userData.firstName);
            await this.setLastName(userData.lastName);
            await this.setEmail(userData.email);
            await this.setTelephone(userData.telephone);
            await this.setPassword(userData.password);
            await this.setConfirmPassword(userData.password);
            await this.setPrivacyPolicy();
            await this.clickContinue();
        } catch (error) {
            console.log(`Error completing registration: ${error}`);
            throw error;
        }
    }

    /**
     * Gets the account-created confirmation heading text
     * @returns Promise<string> - Confirmation text, e.g. "Your Account Has Been Created!"
     */
    async getConfirmationMsg(): Promise<string> {
        await this.msgConfirmation.waitFor({ state: 'visible' });
        return ((await this.msgConfirmation.textContent()) ?? '').trim();
    }

    /**
     * Clicks "Continue" on the account-created page
     * @returns Promise<MyAccountPage> - Instance of the My Account page
     */
    async clickContinueToMyAccount(): Promise<MyAccountPage> {
        await this.lnkContinueToAccount.click();
        return new MyAccountPage(this.page);
    }
}
