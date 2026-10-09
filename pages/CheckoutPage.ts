import { Locator, Page } from '@playwright/test';

export class CheckoutPage {
  private readonly page!: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get username(): Locator { return this.page.locator('[data-test="username"]'); }
  get password(): Locator { return this.page.locator('[data-test="password"]'); }
  get loginButton(): Locator { return this.page.locator('[data-test="login-button"]'); }
  get addToCartButton(): Locator { return this.page.locator('[data-test="add-to-cart-sauce-labs-backpack"]'); }
  get shoppingCart(): Locator { return this.page.locator('[data-test="shopping-cart-link"]'); }
  get checkoutButton(): Locator { return this.page.locator('[data-test="checkout"]'); }
  get firstName(): Locator { return this.page.locator('[data-test="firstName"]'); }
  get lastName(): Locator { return this.page.locator('[data-test="lastName"]'); }
  get postalCode(): Locator { return this.page.locator('[data-test="postalCode"]'); }
  get continueButton(): Locator { return this.page.locator('[data-test="continue"]'); }
  get finishButton(): Locator { return this.page.locator('[data-test="finish"]'); }
  get itemRows(): Locator { return this.page.locator('.cart_item'); }
  get subtotal(): Locator { return this.page.locator('.summary_subtotal_label'); }
  get tax(): Locator { return this.page.locator('.summary_tax_label'); }
  get total(): Locator { return this.page.locator('.summary_total_label'); }
  get confirmationHeader(): Locator { return this.page.locator('[data-test="complete-header"]'); }

  // Methods

  async navigateToApplication() {
    await this.page.goto('https://www.saucedemo.com/');
  }

  async login(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
  }

  async addProductToCart() {
    await this.addToCartButton.click();
  }

  async openCart() {
    await this.shoppingCart.click();
  }

  async clickCheckout() {
    await this.checkoutButton.click();
  }

  async enterCustomerDetails(
    firstName: string,
    lastName: string,
    postalCode: string
  ) {
    await this.firstName.fill(firstName);
    await this.lastName.fill(lastName);
    await this.postalCode.fill(postalCode);
  }

  async continueCheckout() {
    await this.continueButton.click();
  }

  async finishOrder() {
    await this.finishButton.click();
  }
}