import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * "New Role" / "Modify <code>" drawer. Both share the same form; on Modify the Role Code is
 * rendered as a disabled "Role name" textbox instead of the editable "Role code".
 */
export class RoleFormDrawer extends BasePage {
  readonly dialog: Locator;
  readonly duplicateFrom: Locator;
  readonly roleCode: Locator;
  readonly roleName: Locator;
  readonly description: Locator;
  readonly baseRole: Locator;
  readonly status: Locator;
  readonly remarks: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  /** Only rendered when the deployment applies role changes without a Checker. */
  readonly makerOnlyNote: Locator;

  constructor(page: Page) {
    super(page);
    this.dialog = page.getByRole('dialog', { name: /^(New Role|Modify .+)$/ });
    this.duplicateFrom = this.dialog.getByRole('combobox', { name: 'Duplicate from role' });
    this.roleCode = this.dialog.getByRole('textbox', { name: 'Role code' });
    this.roleName = this.dialog.getByRole('textbox', { name: 'Role name' });
    this.description = this.dialog.getByRole('textbox', { name: 'Description' });
    this.baseRole = this.dialog.getByRole('combobox', { name: 'Base role' });
    this.status = this.dialog.getByRole('combobox', { name: /status/i });
    this.remarks = this.dialog.getByRole('textbox', { name: 'Maker remarks' });
    this.submitButton = this.dialog.getByRole('button', { name: 'Submit for approval' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.makerOnlyNote = this.dialog.getByText(/applies immediately on save \(Maker-only\)/);
  }

  /** Base role options excluding the disabled "Choose a base role" placeholder. */
  async baseRoleOptions(): Promise<string[]> {
    const all = await this.baseRole.locator('option:not([disabled])').allTextContents();
    return all.map((t) => t.trim());
  }

  /** Inline validation or server error text rendered inside the drawer. */
  error(text: string | RegExp): Locator {
    return this.dialog.getByText(text);
  }

  async fill(data: { code?: string; description?: string; baseRole?: string; remarks?: string }): Promise<void> {
    if (data.code !== undefined) await this.roleCode.fill(data.code);
    if (data.description !== undefined) await this.description.fill(data.description);
    if (data.baseRole !== undefined) await this.baseRole.selectOption(data.baseRole);
    if (data.remarks !== undefined) await this.remarks.fill(data.remarks);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }
}

/** "Delete <code>" confirmation drawer. */
export class RoleDeleteDrawer extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  dialog(code: string): Locator {
    return this.page.getByRole('dialog', { name: `Delete ${code}`, exact: true });
  }

  remarks(code: string): Locator {
    return this.dialog(code).getByRole('textbox', { name: 'Maker remarks' });
  }

  submitButton(code: string): Locator {
    return this.dialog(code).getByRole('button', { name: 'Propose deletion' });
  }

  /** "N users currently hold <code>. ..." — shown instead of blocking the delete. */
  usersWarning(code: string): Locator {
    return this.dialog(code).getByText(/users? currently holds? /);
  }

  async cancel(code: string): Promise<void> {
    await this.dialog(code).getByRole('button', { name: 'Cancel' }).click();
    await this.dialog(code).waitFor({ state: 'hidden' });
  }
}

export type RoleDetailTab = 'Overview' | 'Screen Mapping' | 'Screen Config' | 'Audit Trail';
export type AccessPrivilege = 'Unmapped' | 'Viewer' | 'Actor';

/**
 * Role detail drawer (title = role code). View, Screen Mapping and Audit Trail row actions
 * all open this drawer, each on its own tab.
 */
export class RoleDetailDrawer extends BasePage {
  readonly dialog: Locator;
  readonly panel: Locator;

  constructor(page: Page, readonly code: string) {
    super(page);
    this.dialog = page.getByRole('dialog', { name: code, exact: true });
    this.panel = this.dialog.getByRole('tabpanel');
  }

  tab(name: RoleDetailTab): Locator {
    return this.dialog.getByRole('tab', { name, exact: true });
  }

  async openTab(name: RoleDetailTab): Promise<void> {
    await this.tab(name).click();
  }

  async close(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Close drawer' }).click();
    await this.dialog.waitFor({ state: 'hidden' });
  }

  // --- Overview tab ---

  /** Value next to a label in the Role Details list (Role Name, Status, Base Role, ...). */
  overviewValue(label: string): Locator {
    return this.panel
      .getByRole('term')
      .filter({ hasText: new RegExp(`^${escapeRegExp(label)}$`) })
      .locator('xpath=following-sibling::*[1]');
  }

  // --- Screen Mapping tab ---

  /** "<n> of <total> mapped". */
  get mappedSummary(): Locator {
    return this.panel.getByText(/^\d+ of \d+ mapped$/);
  }

  get screenFilter(): Locator {
    return this.panel.getByRole('combobox', { name: 'Filter screens' });
  }

  get mappingRows(): Locator {
    return this.panel.getByRole('row').filter({ has: this.page.getByRole('button', { name: 'Modify mapping' }) });
  }

  mappingRow(screen: string): Locator {
    return this.mappingRows.filter({
      has: this.page.getByRole('cell', { name: new RegExp(`^${escapeRegExp(screen)} `) }),
    });
  }

  /** Screen display name (first line of the Screen cell) of a mapping row. */
  async screenName(row: Locator): Promise<string> {
    return (await row.getByRole('cell').first().innerText()).split('\n')[0].trim();
  }

  privilegeCell(row: Locator): Locator {
    return row.getByRole('cell').nth(1);
  }

  // --- Screen Config tab ---

  get configScreen(): Locator {
    return this.panel.getByRole('combobox', { name: 'Screen', exact: true });
  }

  elementMode(permissionKey: string): Locator {
    return this.panel.getByRole('combobox', { name: `Mode: ${permissionKey}` });
  }

  /** Selected Mode label ("No opinion" / "hidden" / "disabled") — option values differ ("hide"). */
  elementModeLabel(permissionKey: string): Locator {
    return this.elementMode(permissionKey).locator('option:checked');
  }

  elementGranted(permissionKey: string): Locator {
    return this.panel.getByRole('checkbox', { name: `Granted: ${permissionKey}` });
  }

  get configComments(): Locator {
    return this.panel.getByRole('textbox', { name: 'Modification comments' });
  }

  get configSubmit(): Locator {
    return this.panel.getByRole('button', { name: 'Submit for approval' });
  }

  // --- Audit Trail tab ---

  get auditSectionFilter(): Locator {
    return this.panel.getByRole('combobox', { name: 'Filter by section' });
  }

  get auditSearch(): Locator {
    return this.panel.getByRole('searchbox', { name: 'Search the audit trail' });
  }

  /** "<n> changes" counter above the feed. */
  get auditSummary(): Locator {
    return this.panel.getByText(/^\d+ changes?$/);
  }

  /**
   * One element per audit card. Cards carry no role or test id; every card has exactly one
   * "Purpose:" line, three div levels below the card container.
   */
  get auditCards(): Locator {
    return this.panel.getByText(/^Purpose:/).locator('xpath=ancestor::div[3]');
  }

  get auditNoMatch(): Locator {
    return this.panel.getByText('No matching changes');
  }

  async auditCount(): Promise<number> {
    return Number((await this.auditSummary.innerText()).match(/\d+/)![0]);
  }
}

/** Per-screen "Modify mapping" drawer (title = screen display name). */
export class ScreenMappingDrawer extends BasePage {
  readonly dialog: Locator;
  readonly accessPrivilege: Locator;
  readonly comments: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page, screen: string) {
    super(page);
    this.dialog = page.getByRole('dialog', { name: screen, exact: true });
    this.accessPrivilege = this.dialog.getByRole('combobox', { name: 'Access privilege' });
    this.comments = this.dialog.getByRole('textbox', { name: 'Modification comments' });
    this.submitButton = this.dialog.getByRole('button', { name: 'Submit for approval' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }

  /** Options read "Viewer — the page key alone" etc.; select by the leading privilege word. */
  async setPrivilege(privilege: AccessPrivilege): Promise<void> {
    const label = await this.accessPrivilege
      .locator('option')
      .filter({ hasText: new RegExp(`^${privilege} —`) })
      .textContent();
    await this.accessPrivilege.selectOption({ label: label!.trim() });
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }
}
