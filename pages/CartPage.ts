import { Locator, Page } from '@playwright/test';

export class CartPage {
  constructor(private readonly page: Page) {}

  readonly items = this.page.locator('.cart_item');
  readonly checkoutButton = this.page.getByRole('button', { name: 'Checkout' });

  item(productName: string): Locator {
    return this.items.filter({
      has: this.page.getByText(productName, { exact: true }),
    });
  }

  itemNames() {
    return this.page.locator('.cart_item .inventory_item_name').allTextContents();
  }

  async checkout() {
    await this.checkoutButton.click();
  }
}