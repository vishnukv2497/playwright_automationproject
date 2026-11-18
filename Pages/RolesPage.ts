import { Page, Locator, test, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { RoleFormDrawer, RoleDeleteDrawer, RoleDetailDrawer, ScreenMappingDrawer } from './RoleDrawers';

export type RowAction = 'View' | 'Edit' | 'Screen Mapping' | 'Audit Trail' | 'Delete';
export type RoleTab = 'All' | 'Active' | 'Pending' | 'Disabled';

/** Grid columns in display order — used to read a cell by name instead of by index. */
export const ROLE_COLUMNS = [
  'Role Code',
  'Base Role',
  'Users',
  'Created',
  'Created By',
  'Last Modified',
  'Last Modified By',
  'Status',
  'Last Action',
  'Actions',
] as const;
export type RoleColumn = (typeof ROLE_COLUMNS)[number];

/** Administration > Roles (/user-management/roles). */
export class RolesPage extends BasePage {
  readonly heading: Locator;
  readonly newRoleButton: Locator;
  /** Data rows only — the empty-state row has no View button. */
  readonly dataRows: Locator;
  readonly rowsPerPage: Locator;
  readonly form: RoleFormDrawer;
  readonly deleteDrawer: RoleDeleteDrawer;
  /** Outcome drawer shown after any accepted change request ("... — change request #N"). */
  readonly resultDrawer: Locator;

  constructor(page: Page) {
    super(page);
    const main = page.getByRole('main');
    this.heading = page.getByRole('heading', { name: 'Roles', level: 1 });
    this.newRoleButton = page.getByRole('button', { name: 'New Role' });
    this.dataRows = main.getByRole('row').filter({ has: page.getByRole('button', { name: 'View', exact: true }) });
    this.rowsPerPage = main.getByRole('combobox').filter({ has: page.getByRole('option', { name: '20', exact: true }) });
    this.form = new RoleFormDrawer(page);
    this.deleteDrawer = new RoleDeleteDrawer(page);
    this.resultDrawer = page.getByRole('dialog').filter({ hasText: /change request #\d+/ });
  }

  async goto(): Promise<void> {
    await this.page.goto('/user-management/roles');
    await this.heading.waitFor();
    await this.dataRows.first().waitFor();
    // Records accumulate across runs; the largest page keeps every row addressable without paging.
    const sizes = await this.rowsPerPage.locator('option').allTextContents();
    await this.rowsPerPage.selectOption(sizes[sizes.length - 1].trim());
  }

  tab(name: RoleTab): Locator {
    return this.page.getByRole('main').getByRole('tab', { name, exact: true });
  }

  columnHeader(column: RoleColumn): Locator {
    // Accessible names read "<Column> Sort <Column> ascending Filter <Column>"; anchoring on the
    // suffix keeps "Created" from also matching "Created By".
    return this.page
      .getByRole('main')
      .getByRole('columnheader', { name: new RegExp(`^${column}( Sort| Filter|$)`) });
  }

  detail(code: string): RoleDetailDrawer {
    return new RoleDetailDrawer(this.page, code);
  }

  mappingDrawer(screen: string): ScreenMappingDrawer {
    return new ScreenMappingDrawer(this.page, screen);
  }

  roleRow(code: string): Locator {
    return this.dataRows.filter({ has: this.page.getByRole('button', { name: code, exact: true }) });
  }

  cell(code: string, column: RoleColumn): Locator {
    return this.roleRow(code).getByRole('cell').nth(ROLE_COLUMNS.indexOf(column));
  }

  /** The status pill inside the Status cell (carries the colour class and an explanatory title). */
  statusBadge(code: string): Locator {
    return this.cell(code, 'Status').locator('[title]').first();
  }

  async columnValues(column: RoleColumn): Promise<string[]> {
    const count = await this.dataRows.count();
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      // textContent, not innerText: Base Role is upper-cased by CSS only.
      const text = await this.dataRows.nth(i).getByRole('cell').nth(ROLE_COLUMNS.indexOf(column)).textContent();
      out.push((text ?? '').trim());
    }
    return out;
  }

  async roleCodes(): Promise<string[]> {
    const count = await this.dataRows.count();
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      out.push((await this.dataRows.nth(i).getByRole('cell').first().getByRole('button').first().innerText()).trim());
    }
    return out;
  }

  rowAction(code: string, action: RowAction): Locator {
    return this.roleRow(code).getByRole('button', { name: action, exact: true });
  }

  async openAction(code: string, action: RowAction): Promise<void> {
    await this.closeDrawers();
    await this.rowAction(code, action).click();
  }

  /**
   * Closes every open drawer, top-most first. Edit opens over the role's detail drawer, and
   * cancelling the form leaves the detail drawer's overlay covering the grid.
   */
  async closeDrawers(): Promise<void> {
    const open = this.page.getByRole('dialog');
    for (let remaining = await open.count(); remaining > 0; remaining--) {
      await open.last().getByRole('button', { name: 'Close drawer' }).click();
      await expect(open).toHaveCount(remaining - 1);
    }
  }

  /** True when the New Role drawer advertises the Maker-only (apply-on-save) workflow. */
  async isMakerOnly(): Promise<boolean> {
    await this.newRoleButton.click();
    await this.form.dialog.waitFor();
    const makerOnly = await this.form.makerOnlyNote.isVisible();
    await this.form.cancel();
    return makerOnly;
  }

  /**
   * Roles whose Edit action is disabled because a change submitted by `user` awaits a Checker.
   * The disabled button's title reads "Edit — <action> by <user> is awaiting a Checker. ...".
   */
  async rolesAwaitingChecker(user: string): Promise<string[]> {
    const count = await this.dataRows.count();
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      const row = this.dataRows.nth(i);
      const edit = row.getByRole('button', { name: 'Edit', exact: true });
      const title = (await edit.getAttribute('title')) ?? '';
      if ((await edit.isDisabled()) && title.includes(`by ${user} is awaiting a Checker`)) {
        out.push((await row.getByRole('cell').first().getByRole('button').first().innerText()).trim());
      }
    }
    return out;
  }

  async closeResult(): Promise<void> {
    await this.resultDrawer.getByRole('button', { name: 'Close', exact: true }).click();
    await this.resultDrawer.waitFor({ state: 'hidden' });
  }

  /**
   * Full create flow. Fails fast with the server's own error when the create request is
   * rejected (e.g. HTTP 503 ADMIN_APPROVAL_POLICY_UNAVAILABLE), rather than timing out on
   * a success drawer that will never appear.
   */
  async createRole(data: {
    code: string;
    duplicateFrom?: string;
    description?: string;
    baseRole?: string;
    remarks: string;
  }): Promise<void> {
    await this.newRoleButton.click();
    if (data.duplicateFrom) await this.form.duplicateFrom.selectOption(data.duplicateFrom);
    await this.form.fill(data);
    const response = this.page.waitForResponse(
      (r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/iam/roles',
      { timeout: 60_000 },
    );
    await this.form.submit();
    const r = await response;
    if (!r.ok()) {
      throw new Error(`Creating role "${data.code}" was rejected by the server: HTTP ${r.status()} ${await r.text()}`);
    }
    await this.resultDrawer.waitFor({ timeout: 30_000 });
    await this.closeResult();
    await this.roleRow(data.code).waitFor();
  }

  /**
   * Cleanup helper: proposes deletion of a role this run created, if it is still listed and
   * its Delete action is available. Under Maker-Checker the role stays listed (Pending) until
   * a Checker approves; a role whose own creation is still pending cannot be deleted at all.
   * Never throws — cleanup must not mask the test's own result — but records what it skipped.
   */
  async deleteIfPresent(code: string): Promise<void> {
    try {
      if ((await this.roleRow(code).count()) === 0) return;
      const del = this.rowAction(code, 'Delete');
      if (await del.isDisabled()) {
        test.info().annotations.push({
          type: 'cleanup',
          description: `${code} not deleted: ${(await del.getAttribute('title')) ?? 'Delete disabled'}`,
        });
        return;
      }
      await del.click();
      await this.deleteDrawer.remarks(code).fill('Automation cleanup');
      await this.deleteDrawer.submitButton(code).click();
      await this.resultDrawer.waitFor({ timeout: 30_000 });
      await this.closeResult();
    } catch (error) {
      test.info().annotations.push({ type: 'cleanup', description: `${code} not deleted: ${String(error).slice(0, 200)}` });
    }
  }
}
