import { Page, Locator } from '@playwright/test';

export class ProductDetailPage {
    page: Page;
    readonly backToProductsButton: Locator;
    readonly productName: Locator;
    readonly productDescription: Locator;
    readonly productPrice: Locator;
    readonly addToCartButton: Locator;
    readonly removeButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.backToProductsButton = page.getByRole('button', { name: 'Back to products' });
        // The inventory -> detail navigation is client-side, so for a moment both pages' elements can exist, and
        // the detail page reuses the inventory card test ids. Every locator here therefore only matches on the
        // detail page: the buttons use their exact test ids (inventory buttons are "add-to-cart-<product>"), and the
        // text locators are scoped to the one card that holds those buttons.
        this.addToCartButton = page.getByTestId('add-to-cart');
        this.removeButton = page.getByTestId('remove');
        const detailCard = page.getByTestId('inventory-item').filter({ has: this.addToCartButton.or(this.removeButton) });
        this.productName = detailCard.getByTestId('inventory-item-name');
        this.productDescription = detailCard.getByTestId('inventory-item-desc');
        this.productPrice = detailCard.getByTestId('inventory-item-price');
    }

    async goto(productId: number) {
        await this.page.goto(`/inventory-item.html?id=${productId}`);
    }

    async addToCart() {
        await this.addToCartButton.click();
    }

    async removeFromCart() {
        await this.removeButton.click();
    }

    async backToProducts() {
        await this.backToProductsButton.click();
    }
}
