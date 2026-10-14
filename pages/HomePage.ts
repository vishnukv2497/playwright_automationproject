import { Page, Locator } from '@playwright/test';
import { RegistrationPage } from './RegistrationPage';
import { LoginPage } from './LoginPage';
import { SearchResultsPage } from './SearchResultsPage';

export class HomePage {
    private readonly page: Page;

    // Locators
    private readonly headingFeatured: Locator;
    private readonly lnkMyAccount: Locator;
    private readonly lnkRegister: Locator;
    private readonly lnkLogin: Locator;
    private readonly lnkLogout: Locator;
    private readonly txtSearch: Locator;
    private readonly btnSearch: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators (header links live in #top-links on every store page)
        this.headingFeatured = page.getByRole('heading', { name: 'Featured' });
        this.lnkMyAccount = page.locator('#top-links').getByTitle('My Account');
        this.lnkRegister = page.locator('#top-links').getByRole('link', { name: 'Register' });
        this.lnkLogin = page.locator('#top-links').getByRole('link', { name: 'Login' });
        // Rendered (inside the closed dropdown) only for logged-in customers, so hidden elements must be included
        this.lnkLogout = page.locator('#top-links').getByRole('link', { name: 'Logout', includeHidden: true });
        this.txtSearch = page.getByPlaceholder('Search');
        this.btnSearch = page.locator('#search button');
    }

    /**
     * Verifies the store home page is displayed
     * @returns Promise<boolean> - true if the home page "Featured" section is visible
     */
    async isHomePageExists(): Promise<boolean> {
        try {
            await this.headingFeatured.waitFor({ state: 'visible', timeout: 10000 });
            return true;
        } catch (error) {
            console.log(`Error checking home page: ${error}`);
            return false;
        }
    }

    /**
     * Opens the "My Account" dropdown in the header
     */
    async clickMyAccount(): Promise<void> {
        await this.lnkMyAccount.click();
    }

    /**
     * Clicks "Register" in the My Account dropdown
     * @returns Promise<RegistrationPage> - Instance of the registration page
     */
    async clickRegister(): Promise<RegistrationPage> {
        await this.lnkRegister.click();
        return new RegistrationPage(this.page);
    }

    /**
     * Clicks "Login" in the My Account dropdown
     * @returns Promise<LoginPage> - Instance of the login page
     */
    async clickLogin(): Promise<LoginPage> {
        await this.lnkLogin.click();
        return new LoginPage(this.page);
    }

    /**
     * Checks whether the authenticated "Logout" option exists in the header menu.
     * The header menu only renders Logout for a logged-in customer.
     * @returns Promise<boolean> - true if the customer is logged in
     */
    async isLogoutOptionAvailable(): Promise<boolean> {
        return (await this.lnkLogout.count()) > 0;
    }

    /**
     * Enters a product name into the header search box
     * @param productName - Product name to search for
     */
    async enterProductName(productName: string): Promise<void> {
        await this.txtSearch.fill(productName);
    }

    /**
     * Clicks the header search button
     * @returns Promise<SearchResultsPage> - Instance of the search results page
     */
    async clickSearch(): Promise<SearchResultsPage> {
        await this.btnSearch.click();
        return new SearchResultsPage(this.page);
    }
}
