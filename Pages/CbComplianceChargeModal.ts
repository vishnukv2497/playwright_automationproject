import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/** WPS message types offered once the WPS rail is selected. */
export const WPS_MESSAGE_TYPES = [
  'SIF (Salary Instruction File)',
  'DIF (Deduction Instruction File)',
  'RFA (Refund Application)',
  'EIF (End of Service)',
] as const;

/**
 * CB Compliance Charge drawer ("New CB Compliance Charge"), opened from the
 * Configured Charges grid under the CB Compliance Charges category.
 *
 * Simplified structure versus Transaction Charge: rail selector, message-type
 * checkboxes, a single flat Amount, description and an optional attached rule.
 */
export class CbComplianceChargeModal extends BasePage {
  readonly root: Locator;
  readonly heading: Locator;
  readonly closeDrawerButton: Locator;
  readonly railSelect: Locator;
  readonly amountInput: Locator;
  readonly amountCurrencyBadge: Locator;
  readonly currencySelect: Locator;
  readonly descriptionInput: Locator;
  readonly browseRulesButton: Locator;
  readonly ruleEmptyState: Locator;
  readonly saveConfigurationButton: Locator;
  readonly closeButton: Locator;
  readonly submitForApprovalButton: Locator;

  constructor(page: Page) {
    super(page);
    // Matched on the heading rather than on the dialog's accessible name: creating shows
    // "New CB Compliance Charge" but opening an existing record from the grid changes the
    // title, and a name-scoped root then silently resolves to nothing in Edit mode.
    // `.first()` keeps this on the outer drawer when a picker is nested inside it.
    this.root = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: /CB Compliance Charge/ }) })
      .first();
    this.heading = this.root.getByRole('heading', { level: 2 });
    this.closeDrawerButton = this.root.getByRole('button', { name: 'Close drawer' });
    this.railSelect = this.root.getByRole('combobox').first();
    this.amountInput = this.root.getByRole('textbox', { name: '0.00' });
    // The currency renders as a static badge next to Amount rather than a control.
    this.amountCurrencyBadge = this.root.getByText('AED', { exact: true });
    // Expected by the FSD but not present in the current build — see TC-038 / defect 3.
    this.currencySelect = this.root.getByRole('combobox', { name: 'Currency' });
    this.descriptionInput = this.root.getByRole('textbox', { name: 'Short description of this compliance charge' });
    this.browseRulesButton = this.root.getByRole('button', { name: 'Browse Rules' });
    this.ruleEmptyState = this.root.getByText('No rule selected. Click Browse Rules to attach screening logic.');
    this.saveConfigurationButton = this.root.getByRole('button', { name: 'Save Configuration' });
    this.closeButton = this.root.getByRole('button', { name: 'Close', exact: true });
    this.submitForApprovalButton = this.root.getByRole('button', { name: 'Submit for Approval' });
  }

  async selectRail(rail: string): Promise<void> {
    await this.railSelect.selectOption(rail);
  }

  messageCheckbox(message: string | RegExp): Locator {
    return this.root.getByRole('checkbox', { name: message });
  }

  /** All message-type checkboxes currently offered for the selected rail. */
  messageCheckboxes(): Locator {
    return this.root.getByRole('checkbox');
  }

  async selectMessage(message: string): Promise<void> {
    await this.messageCheckbox(message).check();
  }

  async setAmount(amount: string): Promise<void> {
    await this.amountInput.fill(amount);
  }

  async setDescription(text: string): Promise<void> {
    await this.descriptionInput.fill(text);
  }

  async openBrowseRules(): Promise<void> {
    await this.browseRulesButton.click();
  }

  /**
   * An attached rule, as rendered in the Rule Selection area once Browse Rules is
   * confirmed. The area swaps `ruleEmptyState` for the rule name plus an "×" that
   * detaches it, so the name being present is what proves the link was made.
   */
  attachedRule(ruleName: string): Locator {
    return this.root.getByText(ruleName, { exact: true });
  }

  /**
   * Saves and waits for the write to land — see TransactionChargeModal.save(); the click
   * alone returns before the alert is dismissed and before the grid refetches, so a
   * search() that follows filters a stale list.
   */
  async save(): Promise<string> {
    const message = await this.saveAndCaptureDialog();
    if (message === null) {
      throw new Error(
        'Save Configuration produced no dialog: the save was rejected silently and no record was created.',
      );
    }
    await this.root.waitFor({ state: 'hidden', timeout: 15_000 });
    return message;
  }

  /**
   * As with Transaction Charge, feedback comes from a native dialog rather than inline
   * validation. Returns the dialog text, or null when the save is silently swallowed.
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

    await this.saveConfigurationButton.click();
    return dialogText;
  }

  /** Deactivate/Activate raise a native confirm() before applying — see TransactionChargeModal. */
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
