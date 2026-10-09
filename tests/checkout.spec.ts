import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../pages/CheckoutPage';

test.describe('SauceDemo Checkout Flow', () => {

  test('Verify successful product checkout', async ({ page }) => {

    const checkoutPage = new CheckoutPage(page);

    await checkoutPage.navigateToApplication();

    await checkoutPage.login(
      'standard_user',
      'secret_sauce'
    );

    await checkoutPage.addProductToCart();

    await checkoutPage.openCart();

    await checkoutPage.clickCheckout();

    await checkoutPage.enterCustomerDetails(
      'Maria',
      'Babu',
      '682316'
    );

    await checkoutPage.continueCheckout();

    await checkoutPage.finishOrder();

    await expect(
      page.locator('[data-test="complete-header"]')
    ).toHaveText('Thank you for your order!');
  });
});