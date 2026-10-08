import { Page, Locator } from '@playwright/test';

export type SortOption =
    | 'Name (A to Z)'
    | 'Name (Z to A)'
    | 'Price (low to high)'
    | 'Price (high to low)';

export class InventoryPage {
    page: Page;
    readonly title: Locator;
    readonly sortDropdown: Locator;
    readonly inventoryItems: Locator;
    readonly itemNames: Locator;
    readonly itemPrices: Locator;
    readonly itemImages: Locator;

    constructor(page: Page) {
        this.page = page;
        this.title = page.getByTestId('title');
        this.sortDropdown = page.getByRole('combobox', { name: 'Sort products' });
        this.inventoryItems = page.getByTestId('inventory-item');
        this.itemNames = page.getByTestId('inventory-item-name');
        this.itemPrices = page.getByTestId('inventory-item-price');
        this.itemImages = this.inventoryItems.getByRole('img');
    }

    async goto() {
        await this.page.goto('/inventory.html');
    }

    /** The product card whose name is exactly productName. */
    item(productName: string): Locator {
        return this.inventoryItems.filter({ has: this.page.getByText(productName, { exact: true }) });
    }

    addToCartButton(productName: string): Locator {
        return this.item(productName).getByRole('button', { name: 'Add to cart' });
    }

    removeButton(productName: string): Locator {
        return this.item(productName).getByRole('button', { name: 'Remove' });
    }

    /** Name, description and price as shown on the product's inventory card. */
    async cardDetails(productName: string): Promise<{ name: string; description: string; price: string }> {
        const card = this.item(productName);
        return {
            name: await card.getByTestId('inventory-item-name').innerText(),
            description: await card.getByTestId('inventory-item-desc').innerText(),
            price: await card.getByTestId('inventory-item-price').innerText(),
        };
    }

    async addToCart(productName: string) {
        await this.addToCartButton(productName).click();
    }

    async removeFromCart(productName: string) {
        await this.removeButton(productName).click();
    }

    async openProduct(productName: string) {
        await this.item(productName).getByTestId('inventory-item-name').click();
    }

    async sortBy(option: SortOption) {
        await this.sortDropdown.selectOption({ label: option });
    }
}
