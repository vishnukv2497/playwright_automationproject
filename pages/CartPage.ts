import { Page, Locator } from '@playwright/test';

export class CartPage {
    page: Page;
    readonly title: Locator;
    readonly cartItems: Locator;
    readonly itemNames: Locator;
    readonly itemPrices: Locator;
    readonly continueShoppingButton: Locator;
    readonly checkoutButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.title = page.getByTestId('title');
        this.cartItems = page.getByTestId('inventory-item');
        this.itemNames = page.getByTestId('inventory-item-name');
        this.itemPrices = page.getByTestId('inventory-item-price');
        this.continueShoppingButton = page.getByRole('button', { name: 'Continue Shopping' });
        this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
    }

    async goto() {
        await this.page.goto('/cart.html');
    }

    /** The cart line whose product name is exactly productName. Its quantity is item(...).getByTestId('item-quantity'). */
    item(productName: string): Locator {
        return this.cartItems.filter({ has: this.page.getByText(productName, { exact: true }) });
    }

    async removeItem(productName: string) {
        await this.item(productName).getByRole('button', { name: 'Remove' }).click();
    }

    async continueShopping() {
        await this.continueShoppingButton.click();
    }

    async checkout() {
        await this.checkoutButton.click();
    }
}
