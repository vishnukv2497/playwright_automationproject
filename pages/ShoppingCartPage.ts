import { Page, Locator } from '@playwright/test';

export class ShoppingCartPage {
    private readonly page: Page;

    // Locators
    private readonly headingShoppingCart: Locator;
    private readonly cartRows: Locator;
    private readonly rowCartTotal: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators
        this.headingShoppingCart = page.getByRole('heading', { name: /^Shopping Cart/ });
        this.cartRows = page.locator('#content form table tbody tr');
        this.rowCartTotal = page.getByRole('row', { name: /^Total:/ });
    }

    /**
     * Returns the cart row of the given product (matched by its exact name link)
     * @param productName - Exact product name
     */
    private getProductRow(productName: string): Locator {
        return this.cartRows.filter({ has: this.page.getByRole('link', { name: productName, exact: true }) });
    }

    /**
     * Verifies the shopping cart page is displayed
     * @returns Promise<boolean> - true if the "Shopping Cart" heading is visible
     */
    async isShoppingCartPageExists(): Promise<boolean> {
        try {
            await this.headingShoppingCart.waitFor({ state: 'visible', timeout: 10000 });
            return true;
        } catch (error) {
            console.log(`Error checking shopping cart page: ${error}`);
            return false;
        }
    }

    /**
     * Checks whether the product is in the cart
     * @param productName - Exact product name
     * @returns Promise<boolean> - true if a cart row exists for the product
     */
    async isProductInCart(productName: string): Promise<boolean> {
        await this.headingShoppingCart.waitFor({ state: 'visible' });
        return (await this.getProductRow(productName).count()) === 1;
    }

    /**
     * Gets the quantity of the product in the cart
     * @param productName - Exact product name
     * @returns Promise<string> - Quantity, e.g. "1"
     */
    async getProductQuantity(productName: string): Promise<string> {
        return await this.getProductRow(productName).locator('input[name^="quantity"]').inputValue();
    }

    /**
     * Gets the unit price of the product (Unit Price column)
     * @param productName - Exact product name
     * @returns Promise<string> - Price text, e.g. "$602.00"
     */
    async getUnitPrice(productName: string): Promise<string> {
        return ((await this.getProductRow(productName).getByRole('cell').nth(4).textContent()) ?? '').trim();
    }

    /**
     * Gets the cart grand total (the "Total:" row of the totals table)
     * @returns Promise<string> - Total text, e.g. "$602.00"
     */
    async getCartTotal(): Promise<string> {
        return ((await this.rowCartTotal.getByRole('cell').last().textContent()) ?? '').trim();
    }
}
