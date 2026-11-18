import { Page, Locator, Dialog } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Charge Management > Charge Configuration screen: browse a charge template,
 * pick a rule, set rates and save it for a payment category (WPS, Domestic, ...).
 */
export class ChargeConfigurationPage extends BasePage {
  readonly chargeConfigurationLink: Locator;
  readonly newChargeButton: Locator;
  readonly confirmButton: Locator;
  readonly loadingIndicator: Locator;
  readonly sifFileScopeCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    this.chargeConfigurationLink = page.getByRole('link', { name: 'Charge Configuration' });
    this.newChargeButton = page.getByRole('button', { name: 'New Charge' });
    this.confirmButton = page.getByRole('button', { name: 'Confirm' });
    this.loadingIndicator = page.getByRole('status', { name: 'Loading' });
    this.sifFileScopeCheckbox = page.getByRole('checkbox', { name: 'SIF (Salary Instruction File)' });
  }

  /** Screen data (grid rows, category tabs) loads async after navigation/category switches. */
  async waitForContentToLoad(): Promise<void> {
    await this.loadingIndicator.waitFor({ state: 'hidden' });
  }

  async openChargeConfiguration(): Promise<void> {
    await this.chargeConfigurationLink.click();
    await this.waitForContentToLoad();
  }

  /** The charge view dropdown's accessible name is "View → <view name>", e.g.
   *  "View → Transaction Charge Per" or "View → CB Compliance Charges". */
  chargeViewButton(viewName: string): Locator {
    return this.page.getByRole('button', { name: `View → ${viewName}` });
  }

  async selectChargeView(viewName: string): Promise<void> {
    await this.chargeViewButton(viewName).click();
    await this.waitForContentToLoad();
  }

  /** @deprecated use `selectChargeView('Transaction Charge Per')` */
  async openTransactionChargePerView(): Promise<void> {
    await this.selectChargeView('Transaction Charge Per');
  }

  /** The category buttons (WPS, Domestic, ...) render more than one match for the same
   *  accessible name (tab + section heading) — the first is the clickable tab. */
  categoryButton(category: string): Locator {
    return this.page.getByRole('button', { name: category }).first();
  }

  async selectCategory(category: string): Promise<void> {
    await this.categoryButton(category).click();
    await this.waitForContentToLoad();
  }

  async openNewCharge(): Promise<void> {
    await this.newChargeButton.click();
  }

  async enableSifFileScope(): Promise<void> {
    await this.sifFileScopeCheckbox.check();
  }

  /** The amount field's accessible name is its "0.00" placeholder in views that label it;
   *  other views leave it unlabeled — see `setChargeRateByFieldIndex`. */
  chargeAmountInput(placeholder = '0.00'): Locator {
    return this.page.getByRole('textbox', { name: placeholder });
  }

  async setChargeAmount(value: string, placeholder = '0.00'): Promise<void> {
    const input = this.chargeAmountInput(placeholder);
    await input.click();
    await input.fill(value);
  }

  /** The "browse rule catalog" button's label varies by view ("Browse", "Browse Rules", ...). */
  browseButton(label = 'Browse'): Locator {
    return this.page.getByRole('button', { name: label });
  }

  async browseChargeTemplates(label = 'Browse'): Promise<void> {
    await this.browseButton(label).click();
  }

  /**
   * Picks a row from the browse-templates table. The cells carry no accessible name or
   * test id, so this is positional (4th column) — update it if the table columns change.
   */
  async selectBrowseResultRow(rowIndex = 0): Promise<void> {
    await this.page
      .locator('.divide-y.divide-\\[var\\(--border-light\\)\\] > tr > td:nth-child(4)')
      .nth(rowIndex)
      .click();
  }

  ruleRowCheckbox(ruleName: string): Locator {
    return this.page.getByRole('row', { name: ruleName }).getByRole('checkbox');
  }

  async selectRule(ruleName: string): Promise<void> {
    await this.ruleRowCheckbox(ruleName).check();
  }

  /** No-op if already unchecked — used to establish a known starting state, since this
   *  shared demo backend can carry a rule selection over from an earlier test run. */
  async deselectRule(ruleName: string): Promise<void> {
    await this.ruleRowCheckbox(ruleName).uncheck();
  }

  async confirmSelection(): Promise<void> {
    await this.confirmButton.click();
  }

  /** Unlabeled rate input identified by its position among the page's textboxes. */
  async setChargeRateByFieldIndex(index: number, value: string): Promise<void> {
    const input = this.page.getByRole('textbox').nth(index);
    await input.click();
    await input.fill(value);
  }

  /** Unlabeled per-row rate input in the charge grid. */
  async setChargeRateInRow(rowIndex: number, value: string): Promise<void> {
    const input = this.page.locator(`tr:nth-child(${rowIndex}) > td:nth-child(2) > .input-cls`);
    await input.click();
    await input.fill(value);
  }

  /** The persist button's label varies by view ("Save Changes", "Save Configuration", ...). */
  saveButton(label = 'Save Changes'): Locator {
    return this.page.getByRole('button', { name: label });
  }

  /**
   * Saving triggers a native confirm dialog, so the listener must be armed before
   * the click; returns the dialog message for the caller to assert on.
   */
  async saveChanges(onDialog: 'accept' | 'dismiss' = 'dismiss', label = 'Save Changes'): Promise<string> {
    const [dialog] = await Promise.all([
      this.page.waitForEvent('dialog'),
      this.saveButton(label).click(),
    ]);

    const message = (dialog as Dialog).message();
    if (onDialog === 'accept') {
      await dialog.accept();
    } else {
      await dialog.dismiss();
    }
    return message;
  }

  // --- CB Compliance Charges lifecycle workflow (rail/message/approval/draft/activation) ---
  //
  // VERIFIED against the live drawer ("New CB Compliance Charge"). The drawer exposes
  // exactly four buttons — Close drawer / Browse Rules / Save Configuration / Close —
  // one unlabelled rail <select>, two textboxes (placeholders "0.00" and "Short
  // description of this compliance charge") and the four message checkboxes for the
  // selected rail. The amount and description locators below have been corrected to
  // match; see Pages/CbComplianceChargeModal.ts, which models the same drawer.
  //
  // The remaining members target controls that DO NOT EXIST in this build:
  //   - currencySelect()          the currency is a static AED badge, not a control (defect 3)
  //   - submitForApprovalButton() there is no Submit for Approval, only Save Configuration
  //   - saveAsDraftButton()       there is no Save As Draft
  //   - activate/deactivate       the CB drawer offers no status control at all (see TC-042)
  //   - fieldValidationMessage()  this build has no inline validation anywhere; feedback
  //                               comes from native alert()/confirm() dialogs
  //   - statusBadge()             no data-testid="charge-status" is rendered
  // They are left in place deliberately: TC_CB_003..TC_CB_010 assert the documented FSD
  // behaviour and fail against these gaps, which is the intended signal.

  messageCheckbox(messageType: string): Locator {
    return this.page.getByRole('checkbox', { name: messageType });
  }

  async selectMessage(messageType: string): Promise<void> {
    await this.messageCheckbox(messageType).check();
  }

  /** The Amount box is unlabelled — its accessible name comes from the "0.00" placeholder. */
  amountField(): Locator {
    return this.page.getByRole('textbox', { name: '0.00' });
  }

  async setAmount(value: string): Promise<void> {
    const input = this.amountField();
    await input.click();
    await input.fill(value);
  }

  currencySelect(): Locator {
    return this.page.getByRole('combobox', { name: 'Currency' });
  }

  async selectCurrency(currency: string): Promise<void> {
    await this.currencySelect().selectOption({ label: currency });
  }

  /** Also unlabelled; named by its placeholder. */
  descriptionField(): Locator {
    return this.page.getByRole('textbox', { name: 'Short description of this compliance charge' });
  }

  async setDescription(text: string): Promise<void> {
    const input = this.descriptionField();
    await input.click();
    await input.fill(text);
  }

  submitForApprovalButton(): Locator {
    return this.page.getByRole('button', { name: 'Submit for Approval' });
  }

  async submitForApproval(): Promise<void> {
    await this.submitForApprovalButton().click();
  }

  saveAsDraftButton(): Locator {
    return this.page.getByRole('button', { name: 'Save As Draft' });
  }

  async saveAsDraft(): Promise<void> {
    await this.saveAsDraftButton().click();
  }

  fieldValidationMessage(fieldName: string): Locator {
    return this.page.getByText(new RegExp(fieldName, 'i')).locator('..').getByRole('alert');
  }

  statusBadge(): Locator {
    return this.page.getByTestId('charge-status');
  }

  activateButton(): Locator {
    return this.page.getByRole('button', { name: 'Activate' });
  }

  async activateCharge(): Promise<void> {
    await this.activateButton().click();
    await this.confirmButton.click();
  }

  deactivateButton(): Locator {
    return this.page.getByRole('button', { name: 'Deactivate' });
  }

  async deactivateCharge(): Promise<void> {
    await this.deactivateButton().click();
    await this.confirmButton.click();
  }
}
