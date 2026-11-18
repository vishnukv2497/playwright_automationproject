import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

/** Delete Role confirmation panel for one role (FSD §5.7). Dialog name = role code. */
export class DeleteRolePanel extends BasePage {
  readonly dialog: Locator;
  readonly label: Locator;
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly reason: Locator;
  readonly deleteButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page, readonly code: string) {
    super(page);
    this.dialog = page.getByRole('dialog', { name: code, exact: true }).filter({ hasText: 'Delete Role' });
    // The footer button carries the same words; the label comes first in the DOM.
    this.label = this.dialog.getByText('Delete Role', { exact: true }).first();
    this.title = this.dialog.getByRole('heading', { level: 2 });
    this.subtitle = this.dialog.locator('h2 + p');
    this.reason = this.dialog.getByRole('textbox', { name: 'Reason / Remarks' });
    this.deleteButton = this.dialog.getByRole('button', { name: 'Delete Role' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel', exact: true });
  }

  message(text: string | RegExp): Locator {
    return this.dialog.getByText(text, { exact: typeof text === 'string' });
  }

  async confirm(reason: string): Promise<void> {
    await this.reason.fill(reason);
    await this.deleteButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }
}
