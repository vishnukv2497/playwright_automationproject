import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export type Rail = 'All' | 'NPSS / IPP' | 'IPI' | 'FTS / UAEFTS' | 'WPS' | 'SWIFT';
export type ChargeCategoryFilter = 'All' | 'Global' | 'Preferential';

/**
 * The Configured Charges grid shown under a selected category card:
 * rail filter chips, category filter chips, search, the records table and pagination.
 *
 * Columns: SL | Charge Name | Rail | Category | Corporate / Customer | Description | Status | Actions
 */
export class ConfiguredChargesGridPage extends BasePage {
  readonly newChargeButton: Locator;
  readonly searchInput: Locator;
  readonly filtersButton: Locator;
  readonly columnsButton: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  readonly dataRows: Locator;
  readonly placeholderRows: Locator;
  readonly emptyState: Locator;
  readonly rowsPerPage: Locator;
  readonly nextPageButton: Locator;
  readonly previousPageButton: Locator;

  constructor(page: Page) {
    super(page);
    this.newChargeButton = page.getByRole('button', { name: 'New Charge' });
    this.searchInput = page.getByRole('textbox', { name: 'Search charges' });
    this.filtersButton = page.getByRole('button', { name: 'Filters' });
    this.columnsButton = page.getByRole('button', { name: 'Columns' });
    this.table = page.getByRole('table');
    this.rows = this.table.locator('tbody tr');
    // A populated row has all eight columns; the loading placeholder is a single row
    // with one spanning cell, so it has no 5th column. Splitting the two apart is what
    // lets a read distinguish "the grid is empty" from "the grid has not answered yet".
    this.dataRows = this.table.locator('tbody tr:has(td:nth-child(5))');
    this.placeholderRows = this.table.locator('tbody tr:not(:has(td:nth-child(5)))');
    this.emptyState = this.table.getByText('No charges match the current filters.');
    this.rowsPerPage = page.getByRole('combobox').last();
    this.nextPageButton = page.getByRole('button', { name: 'Next' });
    this.previousPageButton = page.getByRole('button', { name: 'Previous' });
  }

  /**
   * Blocks until the grid has committed to a final state.
   *
   * One <tbody> renders three different things: a loading placeholder, the explicit
   * "No charges match the current filters." row, and populated rows. The first two are
   * single-cell rows, so `count()` and `allTextContents()` — neither of which auto-waits
   * — read them both as zero data rows. Every read that follows a filter, a search or a
   * save must come through here, otherwise "at most N" and "none of these" assertions
   * pass vacuously. That is exactly how DEF-5 reported green while the defect was on
   * screen.
   */
  async waitForGrid(): Promise<void> {
    await this.table.waitFor();
    await expect(this.dataRows.first().or(this.emptyState)).toBeVisible();

    // "No charges match the current filters." is NOT a reliable terminal state: the grid
    // flashes it for a beat after a rail chip or page-size change before the rows arrive.
    // Verified — clicking the WPS chip shows the empty row, then ten records ~1s later.
    // So when the empty state is what surfaced, give the rows a bounded chance to appear
    // before accepting "no results" as the answer. This only ever delays a grid that is
    // genuinely empty, and it never decides the test: the caller's assertion still runs.
    if (await this.emptyState.isVisible()) {
      await this.dataRows
        .first()
        .waitFor({ timeout: 10_000 })
        .catch(() => undefined);
    }
  }

  /** Rail chips share their label with the per-row Rail badge buttons, so scope to the first. */
  railFilter(rail: Rail): Locator {
    return this.page.getByRole('button', { name: rail, exact: true }).first();
  }

  async filterByRail(rail: Rail): Promise<void> {
    await this.railFilter(rail).click();
    await this.waitForGrid();
  }

  /**
   * "All" exists on both the rail row and the category row; "Global"/"Preferential"
   * only on the category row. The category chips render after the rail chips, so the
   * last match is the category one in every case.
   */
  categoryFilter(category: ChargeCategoryFilter): Locator {
    return this.page.getByRole('button', { name: category, exact: true }).last();
  }

  /**
   * DEFECT (verified): the category chips filter only the rows already loaded into the
   * current page, not the whole result set. With the default page size of 10, clicking
   * "Global" on a page that happens to hold ten Preferential records shows
   * "No charges match the current filters." while 29 Global records exist. Callers that
   * need the full set must raise the page size FIRST — see setRowsPerPage().
   */
  async filterByCategory(category: ChargeCategoryFilter): Promise<void> {
    await this.categoryFilter(category).click();
    await this.waitForGrid();
  }

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text);
    await this.waitForGrid();
  }

  /** Page size changes refetch the grid, so settle before anything reads rows. */
  async setRowsPerPage(size: string): Promise<void> {
    await this.rowsPerPage.selectOption(size);
    await this.waitForGrid();
  }

  async openNewCharge(): Promise<void> {
    await this.newChargeButton.click();
  }

  rowByChargeName(name: string): Locator {
    return this.dataRows.filter({ hasText: name }).first();
  }

  /**
   * The first populated row. Deliberately NOT `rows.first()` — during a refetch that
   * resolves to the loading placeholder, which carries no action buttons, so clicking
   * View/Edit on it times out.
   */
  async firstDataRow(): Promise<Locator> {
    await this.waitForGrid();
    const row = this.dataRows.first();
    await expect(row).toBeVisible();
    return row;
  }

  /** Cell index 4 (0-based) is the Corporate / Customer column. */
  corporateCell(row: Locator): Locator {
    return row.getByRole('cell').nth(4);
  }

  /**
   * Every Corporate / Customer cell on the current page, as one flat locator.
   * Built from `table` rather than chained off the multi-match `rows` locator,
   * which does not reliably resolve when read with allTextContents().
   */
  corporateCells(): Locator {
    return this.table.locator('tbody tr td:nth-child(5)');
  }

  statusCell(row: Locator): Locator {
    return row.getByRole('cell').nth(6);
  }

  /**
   * Row action buttons (View / Edit / History) carry no accessible name or test id.
   * RECOMMENDATION for the dev team: add data-testid="charge-row-view|edit|history"
   * (or aria-label) so these stop depending on DOM order.
   */
  rowAction(row: Locator, action: 'view' | 'edit' | 'history'): Locator {
    const index = { view: 0, edit: 1, history: 2 }[action];
    return row.getByRole('cell').last().getByRole('button').nth(index);
  }

  async openRowAction(name: string, action: 'view' | 'edit' | 'history'): Promise<void> {
    await this.rowAction(this.rowByChargeName(name), action).click();
  }

  /**
   * The read-only panel opened by the View row action. It is a different dialog from the
   * editable Transaction Charge drawer: it is labelled per record ("Charge CCWPSG…"),
   * its only control is Close, and Escape does not dismiss it.
   */
  get detailDrawer(): Locator {
    return this.page.getByRole('dialog', { name: /^Charge / });
  }

  /** Rows on the current page matching a given status text, e.g. "Active". */
  rowsWithStatus(status: string): Locator {
    return this.dataRows.filter({ has: this.page.getByRole('cell', { name: status, exact: true }) });
  }

  /**
   * Count of populated rows, read only once the grid has settled.
   * Use this instead of `rows.count()`: a bare count mid-refetch returns the stale or
   * empty value and turns an "at most N" assertion into a vacuous pass.
   */
  async dataRowCount(): Promise<number> {
    await this.waitForGrid();
    return this.dataRows.count();
  }
}
