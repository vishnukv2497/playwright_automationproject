import { Page, Locator } from '@playwright/test';

export class LoginPage {
    private readonly page: Page;

    // Locators
    private readonly headingReturningCustomer: Locator;
    private readonly txtEmail: Locator;
    private readonly txtPassword: Locator;
    private readonly btnLogin: Locator;
    private readonly msgWarning: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators
        this.headingReturningCustomer = page.getByRole('heading', { name: 'Returning Customer' });
        this.txtEmail = page.getByLabel('E-Mail Address');
        this.txtPassword = page.getByLabel('Password');
        this.btnLogin = page.getByRole('button', { name: 'Login' });
        this.msgWarning = page.locator('.alert-danger');
    }

    /**
     * Verifies the login page is displayed
     * @returns Promise<boolean> - true if the "Returning Customer" section is visible
     */
    async isLoginPageExists(): Promise<boolean> {
        try {
            await this.headingReturningCustomer.waitFor({ state: 'visible', timeout: 10000 });
            return true;
        } catch (error) {
            console.log(`Error checking login page: ${error}`);
            return false;
        }
    }

    /**
     * Enters the email address
     * @param email - Login email
     */
    async setEmail(email: string): Promise<void> {
        await this.txtEmail.fill(email);
    }

    /**
     * Enters the password
     * @param password - Login password
     */
    async setPassword(password: string): Promise<void> {
        await this.txtPassword.fill(password);
    }

    /**
     * Clicks the Login button
     */
    async clickLogin(): Promise<void> {
        await this.btnLogin.click();
    }

    /**
     * Logs in with the given credentials
     * @param email - Login email
     * @param password - Login password
     */
    async login(email: string, password: string): Promise<void> {
        try {
            await this.setEmail(email);
            await this.setPassword(password);
            await this.clickLogin();
        } catch (error) {
            console.log(`Error during login: ${error}`);
            throw error;
        }
    }

    /**
     * Gets the warning shown after a failed login
     * @returns Promise<string> - Warning text, e.g. "Warning: No match for E-Mail Address and/or Password."
     */
    async getLoginErrorMessage(): Promise<string> {
        await this.msgWarning.waitFor({ state: 'visible' });
        return ((await this.msgWarning.textContent()) ?? '').trim();
    }
}
