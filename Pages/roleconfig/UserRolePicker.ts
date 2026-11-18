import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Read-only view of which roles can be assigned to a user: the "Roles" checklist in Administration › User ›
 * New User. Specs only read it and close the form — they never save a user.
 */
export class UserRolePicker extends BasePage {
  readonly newUserButton: Locator;
  readonly dialog: Locator;
  readonly rolesHeading: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.newUserButton = page.getByRole('main').getByRole('button', { name: 'New User' });
    this.dialog = page.getByRole('dialog', { name: 'Create User' });
    this.rolesHeading = this.dialog.getByText('Roles *', { exact: true });
    this.closeButton = this.dialog.getByRole('button', { name: 'Close', exact: true }).first();
  }

  async open(): Promise<void> {
    await this.page.goto('/administration/users');
    await this.newUserButton.click();
    await this.rolesHeading.waitFor();
    // The role checklist renders after the roles request completes.
    await this.dialog.getByRole('checkbox').first().waitFor();
  }

  roleOption(code: string): Locator {
    return this.dialog.getByRole('checkbox', { name: code, exact: true });
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }
}
