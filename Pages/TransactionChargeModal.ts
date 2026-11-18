import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** The five charge-basis rows the Default Charge Amounts table can render. */
export const CHARGE_BASIS_ROWS = [
  'Per Transaction',
  'Per Txn — Own Bank',
  'Per Txn — Other Bank',
  'Per File',
  'Per Card',
] as const;

export type ChargeBasis = (typeof CHARGE_BASIS_ROWS)[number];

/**
 * Transaction Charge drawer opened from the Configured Charges grid ("New Charge"),
 * scoped to the rail currently selected in the grid. Hosts the Global Charge and
 * Preferential Charges tabs.
 *
 * NOTE: the drawer root has role=dialog but no accessible name — it is identified by
 * its heading. RECOMMENDATION for the dev team: add aria-label="Transaction Charge"
 * to the drawer so it can be targeted by name.
 */
export class TransactionChargeModal extends BasePage {
  readonly root: Locator;
  readonly heading: Locator;
  readonly statusBadge: Locator;
  readonly railSubtitle: Locator;
  readonly closeDrawerButton: Locator;
  readonly globalTab: Locator;
  readonly preferentialTab: Locator;

  readonly applicableMessages: Locator;
  readonly createNewRuleButton: Locator;
  readonly browseRulesButton: Locator;
  readonly rulesTable: Locator;
  readonly rulesEmptyState: Locator;

  readonly defaultChargeAmountsTable: Locator;
  readonly currencySelect: Locator;
  readonly vatInput: Locator;
  readonly minInput: Locator;
  readonly maxInput: Locator;
  readonly chargeDescriptionInput: Locator;

  readonly browseCorporateButton: Locator;
  readonly corporateSearchInput: Locator;
  readonly corporateEmptyState: Locator;
  readonly validFromInput: Locator;
  readonly validToInput: Locator;

  readonly deactivateButton: Locator;
  readonly activateButton: Locator;
  readonly editButton: Locator;
  readonly saveChangesButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    super(page);
    // `.first()` keeps this on the outer drawer when a picker dialog is nested inside it.
    this.root = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: /Transaction Charge/ }) })
      .first();
    this.heading = this.root.getByRole('heading', { level: 2 });
    this.statusBadge = this.root.getByText(/^(DRAFT|ACTIVE|INACTIVE|PENDING APPROVAL|REJECTED|EXPIRED)$/);
    this.railSubtitle = this.root.getByText(/— /).first();
    this.closeDrawerButton = this.root.getByRole('button', { name: 'Close drawer' });
    this.globalTab = this.root.getByRole('button', { name: 'Global Charge' });
    this.preferentialTab = this.root.getByRole('button', { name: /^Preferential Charges/ });

    this.applicableMessages = this.root.getByText('Applicable Messages').locator('..');
    this.createNewRuleButton = this.root.getByRole('button', { name: '+ Create New Rule' });
    this.browseRulesButton = this.root.getByRole('button', { name: 'Browse', exact: true }).first();
    this.rulesTable = this.root.getByRole('table').first();
    this.rulesEmptyState = this.root.getByText('No rules selected. Click Browse to pick rules.');

    this.defaultChargeAmountsTable = this.root.getByRole('table').last();
    this.currencySelect = this.root.getByRole('combobox');
    this.vatInput = this.root.getByText('VAT %').locator('..').getByRole('textbox');
    this.minInput = this.root.getByText('Min', { exact: true }).locator('..').getByRole('textbox');
    this.maxInput = this.root.getByText('Max', { exact: true }).locator('..').getByRole('textbox');
    this.chargeDescriptionInput = this.root.getByText('Charge Description').locator('..').getByRole('textbox');

    this.browseCorporateButton = this.root
      .getByText('Corporate / Retail Customer')
      .locator('..')
      .getByRole('button', { name: 'Browse' });
    this.corporateSearchInput = this.root.getByRole('textbox', { name: 'Search corporate or customer' });
    this.corporateEmptyState = this.root.getByText('No corporate or customer selected. Click Browse to add.');
    this.validFromInput = this.root.getByText('Valid From').locator('..').getByRole('textbox');
    this.validToInput = this.root.getByText('Valid To').locator('..').getByRole('textbox');

    this.deactivateButton = this.root.getByRole('button', { name: 'Deactivate' });
    this.activateButton = this.root.getByRole('button', { name: 'Activate', exact: true });
    this.editButton = this.root.getByRole('button', { name: 'Edit', exact: true });
    this.saveChangesButton = this.root.getByRole('button', { name: 'Save Changes' });
    this.closeButton = this.root.getByRole('button', { name: 'Close', exact: true });
  }

  async openGlobalTab(): Promise<void> {
    await this.globalTab.click();
  }

  async openPreferentialTab(): Promise<void> {
    await this.preferentialTab.click();
  }

  /** Applicable Messages renders each WPS message type as a read-only pill. */
  messagePill(message: string): Locator {
    return this.applicableMessages.getByText(message, { exact: true });
  }

  /** Rows currently rendered in the Default Charge Amounts table. */
  chargeBasisRows(): Locator {
    return this.defaultChargeAmountsTable.locator('tbody tr');
  }

  chargeBasisRow(basis: ChargeBasis): Locator {
    return this.chargeBasisRows().filter({ hasText: basis });
  }

  fixedAmountInput(basis: ChargeBasis): Locator {
    return this.chargeBasisRow(basis).getByRole('textbox').first();
  }

  variableAmountInput(basis: ChargeBasis): Locator {
    return this.chargeBasisRow(basis).getByRole('textbox').last();
  }

  async setDefaultChargeAmount(basis: ChargeBasis, fixed: string, variable?: string): Promise<void> {
    await this.fixedAmountInput(basis).fill(fixed);
    if (variable !== undefined) {
      await this.variableAmountInput(basis).fill(variable);
    }
  }

  async setFooterValues(options: { vat?: string; min?: string; max?: string; currency?: string }): Promise<void> {
    if (options.currency) await this.currencySelect.selectOption(options.currency);
    if (options.vat !== undefined) await this.vatInput.fill(options.vat);
    if (options.min !== undefined) await this.minInput.fill(options.min);
    if (options.max !== undefined) await this.maxInput.fill(options.max);
  }

  async setChargeDescription(text: string): Promise<void> {
    await this.chargeDescriptionInput.fill(text);
  }

  async setValidity(from: string, to?: string): Promise<void> {
    await this.validFromInput.fill(from);
    if (to !== undefined) await this.validToInput.fill(to);
  }

  attachedRuleRow(ruleName: string): Locator {
    return this.rulesTable.locator('tbody tr').filter({ hasText: ruleName });
  }

  async openBrowseRules(): Promise<void> {
    await this.browseRulesButton.click();
  }

  async openBrowseCorporate(): Promise<void> {
    await this.browseCorporateButton.click();
  }

  /**
   * Saves and waits for the write to actually land.
   *
   * A bare click returns far too early: the success alert() is still queued, the drawer
   * is still covering the grid, and the grid has not refetched — so a search() that
   * follows immediately filters a stale list and the brand-new record looks missing.
   * That race is the single largest source of flakiness in this suite.
   *
   * Throws when the save is silently rejected (this build gives no feedback at all on a
   * rejected save), so the failure is reported at the save rather than surfacing later
   * as a misleading "row not found".
   */
  async save(): Promise<string> {
    const message = await this.saveAndCaptureDialog();
    if (message === null) {
      throw new Error(
        'Save Changes produced no dialog: the save was rejected silently and no record was created.',
      );
    }
    await this.root.waitFor({ state: 'hidden', timeout: 15_000 });
    return message;
  }

  /**
   * This build has no inline validation anywhere. It signals through native dialogs:
   * an accepted save raises alert("✓ Charge configuration submitted for approval"),
   * while a rejected one does nothing at all and leaves the drawer open.
   *
   * Returns the dialog text, or null when the save was silently swallowed.
   */
  async saveAndCaptureDialog(timeout = 5000): Promise<string | null> {
    const dialogText = this.page
      .waitForEvent('dialog', { timeout })
      .then(async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        return message;
      })
      .catch(() => null);

    await this.saveChangesButton.click();
    return dialogText;
  }

  /**
   * Deactivate/Activate raise a native confirm() before applying.
   *
   * Unlike save(), the drawer does NOT close itself after a status change — verified in
   * the browser: it stays open over the grid with Deactivate/Close/Save Changes still
   * showing. So close it explicitly here; leaving it up means the following grid read
   * either hits the covered grid or sees the pre-change status.
   */
  async confirmStatusChange(action: 'Deactivate' | 'Activate'): Promise<string | null> {
    const dialogText = this.page
      .waitForEvent('dialog', { timeout: 5000 })
      .then(async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        return message;
      })
      .catch(() => null);

    await this.root.getByRole('button', { name: action, exact: true }).click();
    const message = await dialogText;

    if (message !== null) {
      await this.closeButton.click();
      await this.root.waitFor({ state: 'hidden', timeout: 15_000 });
    }
    return message;
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }
}
