import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';
import { NewRolePanel } from './NewRolePanel';
import { ViewModifyPanel } from './ViewModifyPanel';
import { ScreenMappingPanel } from './ScreenMappingPanel';
import { AuditTrailPanel } from './AuditTrailPanel';
import { DeleteRolePanel } from './DeleteRolePanel';

/** Grid columns in their default order (the grid lets a user reorder them; specs use the default layout). */
export const ROLE_GRID_COLUMNS = [
  'Sl',
  'Role Code',
  'Base Role',
  'Total Users',
  'Created Date',
  'Created By',
  'Last Modified',
  'Last Modified By',
  'Status',
  'Last Action',
  'Actions',
] as const;
export type RoleGridColumn = (typeof ROLE_GRID_COLUMNS)[number];

/** Row action buttons, by accessible name (the Screen Mapping button's visible text is "Screen Map"). */
export type RoleRowAction = 'View & Modify' | 'Screen Mapping' | 'Audit Trail' | 'Delete';

/** Administration › Roles (/user-management/roles) — the Roles list and its toolbar. */
export class RolesListPage extends BasePage {
  readonly main: Locator;
  readonly breadcrumb: Locator;
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly newRoleButton: Locator;
  readonly filtersButton: Locator;
  readonly searchButton: Locator;
  readonly clearButton: Locator;
  readonly exportButton: Locator;
  readonly exportCsvButton: Locator;
  readonly columnHeaders: Locator;
  /** Data rows only — the empty-state row has no View & Modify button. */
  readonly dataRows: Locator;
  readonly recordCount: Locator;
  readonly rowsPerPage: Locator;
  readonly nextPage: Locator;
  readonly previousPage: Locator;
  readonly roleCodeFilter: Locator;
  readonly baseRoleFilter: Locator;
  readonly statusFilter: Locator;
  readonly newRole: NewRolePanel;
  readonly viewModify: ViewModifyPanel;

  constructor(page: Page) {
    super(page);
    this.main = page.getByRole('main');
    this.breadcrumb = this.main
      .getByRole('paragraph')
      .filter({ has: page.getByRole('button', { name: 'Payment Hub Operations Console' }) });
    this.heading = this.main.getByRole('heading', { name: 'Roles', level: 1 });
    // The sub-title has no role or label of its own; it is the paragraph right after the page heading.
    this.subtitle = this.main.locator('h1 + p');
    this.newRoleButton = this.main.getByRole('button', { name: 'New Role' });
    // Every column filter also renders its own Search/Clear; the toolbar's come first in the DOM.
    this.filtersButton = this.main.getByRole('button', { name: 'Filters', exact: true }).first();
    this.searchButton = this.main.getByRole('button', { name: 'Search', exact: true }).first();
    this.clearButton = this.main.getByRole('button', { name: 'Clear', exact: true }).first();
    this.exportButton = this.main.getByRole('button', { name: 'Export', exact: true });
    this.exportCsvButton = page.getByRole('button', { name: 'Export CSV' });
    this.columnHeaders = this.main.getByRole('columnheader');
    this.dataRows = this.main.getByRole('row').filter({ has: page.getByRole('button', { name: 'View & Modify' }) });
    this.recordCount = this.main.getByText(/^Showing\s*\d+–\d+\s*of\s*\d+\s*records$/);
    this.rowsPerPage = this.main.getByRole('combobox').filter({ has: page.getByRole('option', { name: '100', exact: true }) });
    this.nextPage = this.main.getByRole('button', { name: 'Next', exact: true });
    this.previousPage = this.main.getByRole('button', { name: 'Previous', exact: true });
    this.roleCodeFilter = this.main.getByRole('textbox', { name: 'Filter Role Code' });
    this.baseRoleFilter = this.main.getByRole('combobox', { name: 'Filter Base Role' });
    this.statusFilter = this.main.getByRole('combobox', { name: 'Filter Status' });
    this.newRole = new NewRolePanel(page);
    this.viewModify = new ViewModifyPanel(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/user-management/roles');
    await this.dataRows.first().waitFor();
  }

  /** Column filters are hidden until the toolbar's Filters button is toggled on. */
  async showFilters(): Promise<void> {
    if (!(await this.roleCodeFilter.isVisible())) await this.filtersButton.click();
    await this.roleCodeFilter.waitFor();
  }

  /** Sets the given column filters and applies them with the toolbar Search button. */
  async filter(criteria: { code?: string; baseRole?: string; status?: string }): Promise<void> {
    await this.showFilters();
    if (criteria.code !== undefined) await this.roleCodeFilter.fill(criteria.code);
    if (criteria.baseRole !== undefined) await this.baseRoleFilter.selectOption({ label: criteria.baseRole });
    if (criteria.status !== undefined) await this.statusFilter.selectOption({ label: criteria.status });
    await this.searchButton.click();
  }

  /** Narrows the grid to one role by its code, so a row is reachable whatever page it would sit on. */
  async findRole(code: string): Promise<void> {
    await this.filter({ code });
    await this.row(code).waitFor();
  }

  /** Loads the grid fresh (it filters the data it loaded), narrows it to the role and clicks a row action. */
  async openRole(code: string, action: RoleRowAction): Promise<void> {
    await this.goto();
    await this.findRole(code);
    await this.open(code, action);
  }

  async clearFilters(): Promise<void> {
    await this.clearButton.click();
  }

  async showMaxRowsPerPage(): Promise<void> {
    await this.rowsPerPage.selectOption('100');
  }

  row(code: string): Locator {
    return this.dataRows.filter({ has: this.page.getByRole('button', { name: code, exact: true }) });
  }

  cell(code: string, column: RoleGridColumn): Locator {
    return this.row(code).getByRole('cell').nth(ROLE_GRID_COLUMNS.indexOf(column));
  }

  /** Status pill (it carries a tooltip explaining the status). */
  statusBadge(code: string): Locator {
    return this.cell(code, 'Status').getByTitle(/./);
  }

  /** The description is rendered under the code in the Role Code cell. */
  async descriptionOf(code: string): Promise<string> {
    const lines = (await this.cell(code, 'Role Code').innerText()).split('\n').map((l) => l.trim());
    return lines.slice(1).join(' ').trim();
  }

  rowAction(code: string, action: RoleRowAction): Locator {
    return this.row(code).getByRole('button', { name: action, exact: true });
  }

  async open(code: string, action: RoleRowAction): Promise<void> {
    await this.rowAction(code, action).click();
  }

  /** Text of one column for every row on the current page (textContent: Base Role is upper-cased by CSS only). */
  async columnValues(column: RoleGridColumn): Promise<string[]> {
    const index = ROLE_GRID_COLUMNS.indexOf(column);
    return this.dataRows.evaluateAll(
      (rows, i) => rows.map((r) => (r.querySelectorAll('td')[i]?.textContent ?? '').trim()),
      index,
    );
  }

  /** Role codes on the current page, top to bottom. */
  async codesOnPage(): Promise<string[]> {
    return this.dataRows.evaluateAll((rows) =>
      rows.map((r) => (r.querySelector('td:nth-child(2) button')?.textContent ?? '').trim()),
    );
  }

  mapping(code: string): ScreenMappingPanel {
    return new ScreenMappingPanel(this.page, code);
  }

  audit(code: string): AuditTrailPanel {
    return new AuditTrailPanel(this.page, code);
  }

  deletePanel(code: string): DeleteRolePanel {
    return new DeleteRolePanel(this.page, code);
  }

  /** The transient success/info message the app announces after a save (it disappears after a few seconds). */
  notification(text: string | RegExp): Locator {
    return this.page.getByRole('status').filter({ hasText: text });
  }
}
