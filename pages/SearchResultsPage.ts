import { Page, Locator } from '@playwright/test';
import { ProductPage } from './ProductPage';

export class SearchResultsPage {
    private readonly page: Page;

    // Locators
    private readonly headingSearchResults: Locator;
    private readonly productTitles: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators
        this.headingSearchResults = page.getByRole('heading', { name: /^Search - / });
        this.productTitles = page.locator('.product-thumb h4');
    }

    /**
     * Verifies the search results page is displayed
     * @returns Promise<boolean> - true if the "Search - <term>" heading is visible
     */
    async isSearchResultsPageExists(): Promise<boolean> {
        try {
            await this.headingSearchResults.waitFor({ state: 'visible', timeout: 10000 });
            return true;
        } catch (error) {
            console.log(`Error checking search results page: ${error}`);
            return false;
        }
    }

    /**
     * Gets the names of all products in the search results
     * @returns Promise<string[]> - Product names as displayed
     */
    async getProductNames(): Promise<string[]> {
        await this.headingSearchResults.waitFor({ state: 'visible' });
        return (await this.productTitles.getByRole('link').allTextContents()).map((name) => name.trim());
    }

    /**
     * Checks whether a product with exactly this name is in the results
     * @param productName - Exact product name
     * @returns Promise<boolean> - true if the product is listed
     */
    async isProductExist(productName: string): Promise<boolean> {
        const names = await this.getProductNames();
        return names.includes(productName);
    }

    /**
     * Opens the product details page of the given product
     * @param productName - Exact product name
     * @returns Promise<ProductPage> - Instance of the product page
     */
    async selectProduct(productName: string): Promise<ProductPage> {
        try {
            await this.productTitles.getByRole('link', { name: productName, exact: true }).click();
            return new ProductPage(this.page);
        } catch (error) {
            console.log(`Error selecting product "${productName}": ${error}`);
            throw error;
        }
    }
}
