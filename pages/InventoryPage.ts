import { Locator, Page } from '@playwright/test';

/** Option values of the sort dropdown: Name (A to Z), Name (Z to A), Price (low to high), Price (high to low). */
export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage {
  constructor(private readonly page: Page) {}

  readonly username = this.page.getByRole('textbox', { name: 'Username' });
  readonly password = this.page.getByRole('textbox', { name: 'Password' });
  readonly loginButton = this.page.getByRole('button', { name: 'Login' });
  readonly products = this.page.locator('.inventory_item');
  readonly cartBadge = this.page.locator('.shopping_cart_badge');
  readonly cartLink = this.page.locator('[data-test="shopping-cart-link"]');
  readonly sortDropdown = this.page.locator('[data-test="product-sort-container"]');
  readonly headerLogo = this.page.locator('.app_logo');

  async openLoginPage() {
    await this.page.goto('https://www.saucedemo.com/');
  }

  async login(username = 'standard_user', password = 'secret_sauce') {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
  }

  async openInventory() {
    await this.openLoginPage();
    await this.login();
  }

  productCard(productName: string): Locator {
    return this.products.filter({
      has: this.page.getByText(productName, { exact: true }),
    });
  }

  productNames() {
    return this.page.locator('.inventory_item_name').allTextContents();
  }

  productPrices() {
    return this.page.locator('.inventory_item_price').allTextContents();
  }

  async addProduct(productName: string) {
    await this.productCard(productName).getByRole('button', { name: 'Add to cart' }).click();
  }

  async removeProduct(productName: string) {
    await this.productCard(productName).getByRole('button', { name: 'Remove' }).click();
  }

  async openCart() {
    await this.cartLink.click();
  }

  async openMenu() {
    await this.page.getByRole('button', { name: 'Open Menu' }).click();
  }

  async sortBy(value: SortOption) {
    await this.sortDropdown.selectOption(value);
  }

  async openProductByName(productName: string) {
    await this.productCard(productName).locator('.inventory_item_name').click();
  }

  async openProductByImage(productName: string) {
    await this.productCard(productName).locator('img').click();
  }
}