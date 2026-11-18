import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

export type RoleChange = {
  description?: string;
  baseRole?: string;
  status?: 'Active' | 'Disabled';
  comments?: string;
};

/** "Record Details" right slide-in panel, opened by a row's View & Modify button (FSD §5.3). */
export class ViewModifyPanel extends BasePage {
  readonly dialog: Locator;
  readonly label: Locator;
  readonly title: Locator;
  readonly roleCode: Locator;
  readonly description: Locator;
  readonly baseRole: Locator;
  readonly status: Locator;
  readonly createdBy: Locator;
  readonly createdOn: Locator;
  readonly lastModified: Locator;
  readonly comments: Locator;
  readonly commentsHint: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly closeDrawerButton: Locator;
  /** Shown while a change on this role awaits a Checker (BR-ROLES-013). */
  readonly pendingBanner: Locator;
  // Rejected New Role (FSD §8 row 9): the initiator can Resubmit or Close the request.
  readonly closeRemarks: Locator;
  readonly resubmitButton: Locator;
  readonly closeRequestButton: Locator;
  /** Options of the Status dropdown (for web-first checks — the panel fills in after it opens). */
  readonly statusOptionItems: Locator;
  /**
   * The editable "Resubmit" form that Resubmit opens on top of this panel. It is also a "Record Details" dialog;
   * the stacked one is the last in the DOM.
   */
  readonly resubmitForm: Locator;

  constructor(page: Page) {
    super(page);
    this.dialog = page.getByRole('dialog', { name: 'Record Details' });
    this.label = this.dialog.getByText('View & Modify', { exact: true });
    this.title = this.dialog.getByRole('heading', { level: 2 });
    this.roleCode = this.dialog.getByRole('textbox', { name: 'Role Code' });
    this.description = this.dialog.getByRole('textbox', { name: 'Role Description' });
    this.baseRole = this.dialog.getByRole('combobox', { name: 'Base role' });
    this.status = this.dialog.getByRole('combobox', { name: 'Status' });
    this.createdBy = this.dialog.getByRole('textbox', { name: 'Created By' });
    this.createdOn = this.dialog.getByRole('textbox', { name: 'Created On' });
    this.lastModified = this.dialog.getByRole('textbox', { name: 'Last Modified' });
    this.comments = this.dialog.getByRole('textbox', { name: 'Modification Comments' });
    this.commentsHint = this.dialog.getByText('This comment will be recorded in the audit trail.');
    this.saveButton = this.dialog.getByRole('button', { name: 'Save', exact: true });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel', exact: true });
    this.closeDrawerButton = this.dialog.getByRole('button', { name: 'Close drawer' });
    this.pendingBanner = this.dialog.getByText(/is awaiting a Checker/);
    this.closeRemarks = this.dialog.getByRole('textbox', { name: 'Close remarks (optional)' });
    this.resubmitButton = this.dialog.getByRole('button', { name: 'Resubmit', exact: true });
    this.closeRequestButton = this.dialog.getByRole('button', { name: 'Close', exact: true });
    this.statusOptionItems = this.status.locator('option');
    this.resubmitForm = page.getByRole('dialog', { name: 'Record Details' }).last();
  }

  /** Rejected New Role: open the Resubmit form, comment, and resubmit the request to the Checker. */
  async resubmit(comments: string): Promise<void> {
    await this.resubmitButton.click();
    await this.resubmitForm.getByRole('textbox', { name: 'Modification Comments' }).fill(comments);
    await this.resubmitForm.getByRole('button', { name: 'Resubmit', exact: true }).click();
  }

  message(text: string | RegExp): Locator {
    return this.dialog.getByText(text, { exact: typeof text === 'string' });
  }

  async selectedBaseRole(): Promise<string> {
    return (await this.baseRole.locator('option:checked').textContent())?.trim() ?? '';
  }

  async selectedStatus(): Promise<string> {
    return (await this.status.locator('option:checked').textContent())?.trim() ?? '';
  }

  async statusOptions(): Promise<string[]> {
    return (await this.status.locator('option').allTextContents()).map((t) => t.trim());
  }

  async change(data: RoleChange): Promise<void> {
    if (data.description !== undefined) await this.description.fill(data.description);
    if (data.baseRole !== undefined) await this.baseRole.selectOption({ label: data.baseRole });
    if (data.status !== undefined) await this.status.selectOption({ label: data.status });
    if (data.comments !== undefined) await this.comments.fill(data.comments);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }

  async close(): Promise<void> {
    await this.closeDrawerButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }
}
