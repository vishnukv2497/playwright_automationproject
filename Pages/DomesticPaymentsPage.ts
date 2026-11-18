import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * "New Payment" > "Domestic Payments" hub. Add one button/locator per
 * payment type here (WPS Salary, Own Account Transfer, Third Party, ...)
 * and keep the actual screen logic in that payment type's own Page Object.
 */
export class DomesticPaymentsPage extends BasePage {
  readonly domesticPaymentsLink: Locator;
  readonly wpsSalaryButton: Locator;

  constructor(page: Page) {
    super(page);
    this.domesticPaymentsLink = page.getByRole('link', { name: 'Domestic Payments' });
    this.wpsSalaryButton = page.getByRole('button', { name: 'WPS Salary' });
  }

  async openDomesticPayments(): Promise<void> {
    await this.domesticPaymentsLink.click();
  }

  async openWpsSalary(): Promise<void> {
    await this.wpsSalaryButton.click();
  }
}
