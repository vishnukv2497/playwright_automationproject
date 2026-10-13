import { Page, Locator } from '@playwright/test';

export class SoftwarePage {
    private readonly page: Page;

    // Locators
    private readonly lnkSoftwareMenu: Locator;
    private readonly headingSoftware: Locator;
    private readonly breadcrumbSoftware: Locator;
    private readonly txtEmptyCategory: Locator;
    private readonly productThumbs: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators (scoped: footer and menus repeat category names)
        this.lnkSoftwareMenu = page.locator('#menu').getByRole('link', { name: 'Software', exact: true });
        this.headingSoftware = page.locator('#content').getByRole('heading', { name: 'Software', exact: true });
        this.breadcrumbSoftware = page.locator('.breadcrumb').getByRole('link', { name: 'Software', exact: true });
        this.txtEmptyCategory = page.locator('#content').getByText('There are no products to list in this category.');
        this.productThumbs = page.locator('#content .product-thumb');
    }

    /**
     * Clicks the top-level "Software" item in the main menu
     */
    async clickSoftwareMenu(): Promise<void> {
        await this.lnkSoftwareMenu.click();
    }

    /**
     * Verifies the Software category page is displayed
     * @returns Promise<boolean> - true if the "Software" heading is visible
     */
    async isSoftwarePageExists(): Promise<boolean> {
        try {
            await this.headingSoftware.waitFor({ state: 'visible', timeout: 10000 });
            return true;
        } catch (error) {
            console.log(`Error checking Software page: ${error}`);
            return false;
        }
    }

    /**
     * Checks the breadcrumb ends with the "Software" category
     * @returns Promise<boolean> - true if the breadcrumb entry is visible
     */
    async isBreadcrumbDisplayed(): Promise<boolean> {
        try {
            await this.breadcrumbSoftware.waitFor({ state: 'visible', timeout: 10000 });
            return true;
        } catch (error) {
            console.log(`Error checking Software breadcrumb: ${error}`);
            return false;
        }
    }

    /**
     * Checks the empty-category message is displayed
     * @returns Promise<boolean> - true if "no products" text is visible
     */
    async isEmptyMessageDisplayed(): Promise<boolean> {
        try {
            await this.txtEmptyCategory.waitFor({ state: 'visible', timeout: 10000 });
            return true;
        } catch (error) {
            console.log(`Error checking empty category message: ${error}`);
            return false;
        }
    }

    /**
     * @returns Promise<number> - number of products listed in the category
     */
    async getProductCount(): Promise<number> {
        return this.productThumbs.count();
    }
}
