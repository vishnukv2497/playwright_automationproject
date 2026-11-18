import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';

export type NewRoleInput = {
  code?: string;
  description?: string;
  baseRole?: string;
  remarks?: string;
};

/** "Create Role" right slide-in panel, opened by + New Role (FSD §5.1). */
export class NewRolePanel extends BasePage {
  readonly dialog: Locator;
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly infoNote: Locator;
  readonly duplicateFrom: Locator;
  readonly roleCode: Locator;
  readonly description: Locator;
  readonly baseRole: Locator;
  /** FSD: Status is system-set on create — there should be no Status control in this panel. */
  readonly status: Locator;
  readonly remarks: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.dialog = page.getByRole('dialog', { name: 'Create Role' });
    this.title = this.dialog.getByRole('heading', { level: 2 });
    this.subtitle = this.dialog.locator('h2 + p');
    this.infoNote = this.dialog.getByText(/Fields marked \* are mandatory/);
    this.duplicateFrom = this.dialog.getByRole('combobox', { name: 'Duplicate from role' });
    this.roleCode = this.dialog.getByRole('textbox', { name: 'Role code' });
    this.description = this.dialog.getByRole('textbox', { name: 'Description' });
    this.baseRole = this.dialog.getByRole('combobox', { name: 'Base role' });
    this.status = this.dialog.getByRole('combobox', { name: 'Status' });
    this.remarks = this.dialog.getByRole('textbox', { name: 'Remarks' });
    this.saveButton = this.dialog.getByRole('button', { name: 'Save Role' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }

  /** Visible label text of a field (e.g. "Role Code *"), matched by the label's leading words. */
  fieldLabel(startsWith: string): Locator {
    return this.dialog.getByText(new RegExp(`^${startsWith}`), { exact: false }).first();
  }

  /** Inline validation message rendered inside the panel. */
  message(text: string | RegExp): Locator {
    return this.dialog.getByText(text, { exact: typeof text === 'string' });
  }

  /** Base Role options, without the disabled "Choose a base role" placeholder. */
  async baseRoleOptions(): Promise<string[]> {
    return (await this.baseRole.locator('option:not([disabled])').allTextContents()).map((t) => t.trim());
  }

  async fill(data: NewRoleInput): Promise<void> {
    if (data.code !== undefined) await this.roleCode.fill(data.code);
    if (data.description !== undefined) await this.description.fill(data.description);
    if (data.baseRole !== undefined) await this.baseRole.selectOption({ label: data.baseRole });
    if (data.remarks !== undefined) await this.remarks.fill(data.remarks);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }
}
