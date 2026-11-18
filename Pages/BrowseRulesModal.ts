import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Rule picker opened from a charge drawer's "Browse" / "Browse Rules" button.
 * Renders as a nested dialog on top of the charge drawer.
 *
 * Row checkboxes carry no accessible name; they are reached through the row, whose
 * name comes from the rule name + condition summary text.
 * RECOMMENDATION for the dev team: add data-testid="rule-select-<code>" per row.
 */
export class BrowseRulesModal extends BasePage {
  readonly root: Locator;
  readonly searchInput: Locator;
  readonly railFilter: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  readonly paginationSummary: Locator;
  readonly nextPageButton: Locator;
  readonly confirmButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    // This dialog is nested inside the charge drawer, so the drawer also "has" the
    // search box — the innermost match is the picker itself.
    this.root = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('textbox', { name: 'Search rules by name, code, rail or status' }) })
      .last();
    this.searchInput = this.root.getByRole('textbox', { name: 'Search rules by name, code, rail or status' });
    this.railFilter = this.root.getByRole('combobox', { name: 'Filter by rail' });
    this.table = this.root.getByRole('table');
    this.rows = this.table.locator('tbody tr');
    this.paginationSummary = this.root.getByText(/Page \d+ of \d+/);
    this.nextPageButton = this.root.getByRole('button', { name: 'Next' });
    this.confirmButton = this.root.getByRole('button', { name: 'Confirm' });
    this.cancelButton = this.root.getByRole('button', { name: 'Cancel' });
  }

  ruleRow(ruleName: string): Locator {
    return this.rows.filter({ hasText: ruleName }).first();
  }

  ruleCheckbox(ruleName: string): Locator {
    return this.ruleRow(ruleName).getByRole('checkbox');
  }

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text);
  }

  async filterByRail(rail: string): Promise<void> {
    await this.railFilter.selectOption(rail);
  }

  async selectRule(ruleName: string): Promise<void> {
    await this.ruleCheckbox(ruleName).check();
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
