import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * "Select Corporate / Retail Customer" picker opened from the Preferential tab.
 *
 * Unlike the other overlays this one is NOT exposed with role=dialog, so it is
 * anchored on its heading and its uniquely-named controls.
 * RECOMMENDATION for the dev team: give this overlay role="dialog" plus
 * aria-label="Select Corporate / Retail Customer".
 */
export class BrowseCorporateModal extends BasePage {
  readonly heading: Locator;
  readonly corporateTab: Locator;
  readonly retailCustomerTab: Locator;
  readonly searchInput: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  readonly selectedCount: Locator;
  readonly confirmSelectionButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Select Corporate / Retail Customer' });
    this.corporateTab = page.getByRole('button', { name: 'Corporate', exact: true });
    this.retailCustomerTab = page.getByRole('button', { name: 'Retail Customer' });
    this.searchInput = page.getByRole('textbox', { name: 'Search by name or code' });
    this.table = this.searchInput.locator('..').getByRole('table');
    this.rows = this.table.locator('tbody tr');
    this.selectedCount = page.getByText(/\d+ customer\(s\) selected/);
    this.confirmSelectionButton = page.getByRole('button', { name: 'Confirm Selection' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
  }

  /**
   * Rows that are actually selectable.
   *
   * Like the charges grid, this table renders more than one thing: while the entity
   * list is loading it shows a single-cell "No results found." row, which `rows` counts
   * as a row but which carries no checkbox. Anything that picks a row positionally must
   * come through here, otherwise it latches onto the placeholder.
   */
  get selectableRows(): Locator {
    return this.rows.filter({ has: this.page.getByRole('checkbox') });
  }

  entityRow(name: string): Locator {
    return this.rows.filter({ hasText: name }).first();
  }

  entityCheckbox(name: string): Locator {
    return this.entityRow(name).getByRole('checkbox');
  }

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text);
  }

  async openCorporateTab(): Promise<void> {
    await this.corporateTab.click();
  }

  async openRetailCustomerTab(): Promise<void> {
    await this.retailCustomerTab.click();
  }

  async selectEntity(name: string): Promise<void> {
    await this.entityCheckbox(name).check();
  }

  /**
   * Selects the first row on the current page — used when any entity will do.
   *
   * textContent() does NOT auto-wait. Reading `rows.first()` before the picker settles
   * returns the "No results found." placeholder, and because check() re-resolves the
   * locator a beat later it happily ticks the real row that has since arrived — so the
   * method used to succeed while returning the wrong name. The caller then looked for
   * "No results found." on the charge form and failed with a locator error that named
   * nothing useful (TC-021). Wait for a genuinely selectable row before reading it.
   */
  async selectFirstEntity(): Promise<string> {
    const row = this.selectableRows.first();
    const checkbox = row.getByRole('checkbox');
    await checkbox.waitFor();

    const label = (await row.getByRole('cell').first().textContent()) ?? '';
    await checkbox.check();
    return label.trim();
  }

  async confirm(): Promise<void> {
    await this.confirmSelectionButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
