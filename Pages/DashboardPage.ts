import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * The post-login landing screen. Extend this with other top-level nav
 * actions (Transfers, Beneficiaries, Reports, ...) as more modules are added.
 */
export class DashboardPage extends BasePage {
  readonly newPaymentButton: Locator;
  readonly chargeManagementButton: Locator;

  constructor(page: Page) {
    super(page);
    this.newPaymentButton = page.getByRole('button', { name: 'New Payment' });
    this.chargeManagementButton = page.getByRole('button', { name: 'Charge Management' });
  }

  async openNewPayment(): Promise<void> {
    await this.newPaymentButton.click();
  }

  async openChargeManagement(): Promise<void> {
    await this.chargeManagementButton.click();
  }
}
