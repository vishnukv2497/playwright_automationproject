import { Page, Locator } from '@playwright/test';
import { ShoppingCartPage } from './ShoppingCartPage';

export class ProductPage {
    private readonly page: Page;

    // Locators
    private readonly headingProductName: Locator;
    private readonly lblProductPrice: Locator;
    private readonly txtQuantity: Locator;
    private readonly btnAddToCart: Locator;
    private readonly msgSuccess: Locator;
    private readonly lnkShoppingCart: Locator;

    constructor(page: Page) {
        this.page = page;

        // Initialize locators
        this.headingProductName = page.locator('#content').getByRole('heading', { level: 1 });
        this.lblProductPrice = page.locator('#content').getByRole('heading', { level: 2, name: /^\$[\d,]+\.\d{2}$/ });
        this.txtQuantity = page.getByLabel('Qty');
        this.btnAddToCart = page.locator('#button-cart'); // related products also have "Add to Cart" buttons
        this.msgSuccess = page.locator('.alert-success');
        this.lnkShoppingCart = this.msgSuccess.getByRole('link', { name: 'shopping cart' });
    }

    /**
     * Verifies the product details page is displayed
     * @returns Promise<boolean> - true if the product name and Add to Cart button are visible
     */
    async isProductPageExists(): Promise<boolean> {
        try {
            await this.headingProductName.waitFor({ state: 'visible', timeout: 10000 });
            return await this.btnAddToCart.isVisible();
        } catch (error) {
            console.log(`Error checking product page: ${error}`);
            return false;
        }
    }

    /**
     * Gets the product name shown on the details page
     * @returns Promise<string> - Product name
     */
    async getProductName(): Promise<string> {
        return ((await this.headingProductName.textContent()) ?? '').trim();
    }

    /**
     * Gets the product price shown on the details page
     * @returns Promise<string> - Price text, e.g. "$602.00"
     */
    async getProductPrice(): Promise<string> {
        return ((await this.lblProductPrice.textContent()) ?? '').trim();
    }

    /**
     * Sets the quantity to add
     * @param quantity - Quantity as text
     */
    async setQuantity(quantity: string): Promise<void> {
        await this.txtQuantity.fill(quantity);
    }

    /**
     * Clicks "Add to Cart"
     */
    async addToCart(): Promise<void> {
        await this.btnAddToCart.click();
    }

    /**
     * Gets the success message shown after adding to the cart
     * @returns Promise<string> - Message text, e.g. "Success: You have added MacBook to your shopping cart!"
     */
    async getConfirmationMessage(): Promise<string> {
        await this.msgSuccess.waitFor({ state: 'visible' });
        return ((await this.msgSuccess.textContent()) ?? '').trim();
    }

    /**
     * Clicks the "shopping cart" link in the success message
     * @returns Promise<ShoppingCartPage> - Instance of the shopping cart page
     */
    async clickShoppingCartLink(): Promise<ShoppingCartPage> {
        await this.lnkShoppingCart.click();
        return new ShoppingCartPage(this.page);
    }
}
