import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * WPS Salary upload-and-submit flow.
 * Methods are grouped in the order the real screen steps through:
 * upload -> employee/reference details -> account selection -> charges -> confirm -> submit.
 */
export class WpsSalaryPaymentPage extends BasePage {
  readonly browseLink: Locator;
  readonly fileInput: Locator;
  readonly numberOfEmployeesInput: Locator;
  readonly referenceInput: Locator;
  readonly checkBalanceButton: Locator;
  readonly waiveAllCheckbox: Locator;
  readonly continueButton: Locator;
  readonly operationalPurposeInput: Locator;
  readonly submitUploadButton: Locator;
  readonly paymentInitiationHeading: Locator;
  readonly sifUploadModeButton: Locator;
  readonly corporateNameInput: Locator;
  readonly molIdInput: Locator;
  readonly customerCategoryInput: Locator;
  readonly expenseGlInput: Locator;
  readonly branchIdInput: Locator;
  readonly drAccountInput: Locator;

  constructor(page: Page) {
    super(page);
    this.browseLink = page.getByText('Browse…');
    this.fileInput = page.getByLabel('Browse…');
    this.numberOfEmployeesInput = page.getByRole('spinbutton', { name: 'Number of employees' });
    this.referenceInput = page.getByRole('textbox', { name: 'e.g.' });
    this.checkBalanceButton = page.getByRole('button', { name: 'Check Balance' });
    this.waiveAllCheckbox = page.getByRole('checkbox', { name: 'Waive All' });
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.operationalPurposeInput = page.getByRole('textbox', { name: 'Provide operational' });
    this.submitUploadButton = page.getByRole('button', { name: 'Submit Upload' });
    this.paymentInitiationHeading = page.getByRole('heading', { name: 'WPS Payment Initiation' });
    this.sifUploadModeButton = page.getByRole('button', { name: 'SIF Upload', exact: false });
    // "Auto-populated from SIF" and "Auto-populated" are each shared by more than one field,
    // in the fixed DOM order the form renders them (Corporate Name, then MOL ID / Customer
    // Category, Expense GL, then Branch ID) — `exact: true` keeps the two groups from overlapping.
    this.corporateNameInput = page.getByRole('textbox', { name: 'Auto-populated from SIF', exact: true }).nth(0);
    this.molIdInput = page.getByRole('textbox', { name: 'Auto-populated from SIF', exact: true }).nth(1);
    this.customerCategoryInput = page.getByRole('textbox', { name: 'Auto-populated', exact: true }).nth(0);
    this.expenseGlInput = page.getByRole('textbox', { name: 'Auto-populated', exact: true }).nth(1);
    this.branchIdInput = page.getByRole('textbox', { name: 'Auto-populated', exact: true }).nth(2);
    this.drAccountInput = page.getByRole('textbox', { name: 'Select account from A/c List' });
  }

  /** The account-list button's accessible name includes a dynamic count, e.g. "Select from A/c List (2)". */
  private selectFromAccountListButton(accountListCount: string): Locator {
    return this.page.getByRole('button', { name: `Select from A/c List (${accountListCount})` });
  }

  private accountListDialog(): Locator {
    return this.page.getByRole('dialog', { name: 'Account list' });
  }

  /** The uploaded file name is echoed back as plain text next to the "Browse…" control. */
  uploadedFileNameText(fileName: string): Locator {
    return this.page.getByText(fileName, { exact: true });
  }

  async uploadSifFile(filePath: string): Promise<void> {
    await this.browseLink.click();
    await this.fileInput.setInputFiles(filePath);
  }

  async setNumberOfEmployees(count: string): Promise<void> {
    await this.numberOfEmployeesInput.click();
    await this.numberOfEmployeesInput.fill(count);
  }

  async setReference(reference: string): Promise<void> {
    await this.referenceInput.click();
    await this.referenceInput.fill(reference);
  }

  /**
   * Picks an account and returns the account number it actually selected (the row's
   * first cell, e.g. "012345DIB993601").
   *
   * Returning it matters: the accounts this demo environment offers for a given SIF
   * change over time, so a caller that hardcodes the expected number goes stale and
   * fails for a reason that has nothing to do with the behaviour under test. Assert
   * against the returned value instead.
   */
  async selectAccountFromList(accountListCount: string, rowIndex: number): Promise<string> {
    await this.selectFromAccountListButton(accountListCount).click();

    const dialog = this.accountListDialog();
    await dialog.waitFor({ state: 'visible' });

    // +1 skips the header row so rowIndex 0 maps to the first data row.
    const row = dialog.getByRole('row').nth(rowIndex + 1);
    const accountNumber = ((await row.getByRole('cell').first().textContent()) ?? '').trim();

    await row.getByRole('button', { name: 'Select' }).click();
    return accountNumber;
  }

  async checkBalance(): Promise<void> {
    await this.checkBalanceButton.click();
  }

  async waiveAllCharges(): Promise<void> {
    await this.waiveAllCheckbox.check();
  }

  async continueToNextStep(): Promise<void> {
    await this.continueButton.click();
  }

  async fillOperationalPurpose(text: string): Promise<void> {
    await this.operationalPurposeInput.click();
    await this.operationalPurposeInput.fill(text);
  }

  async submitUpload(): Promise<void> {
    await this.submitUploadButton.click();
  }
}
