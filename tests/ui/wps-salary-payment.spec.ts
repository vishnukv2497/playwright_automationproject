import { test, expect } from '../../fixtures/auth.fixture';
import { testDataFilePath } from '../../utils/testDataPath.util';
import { wpsSalaryPaymentTestData as data } from '../../testdata/wps-salary-payment.data';

test.describe('Domestic Payments - WPS Salary', () => {
  test.beforeEach(async ({ dashboardPage, domesticPaymentsPage }) => {
    await dashboardPage.openNewPayment();
    await domesticPaymentsPage.openDomesticPayments();
    await domesticPaymentsPage.openWpsSalary();
  });

  test('displays the WPS Payment Initiation form @wps-salary', async ({ wpsSalaryPaymentPage }) => {
    await expect(wpsSalaryPaymentPage.paymentInitiationHeading).toBeVisible();
    await expect(wpsSalaryPaymentPage.sifUploadModeButton).toBeVisible();
    await expect(wpsSalaryPaymentPage.browseLink).toBeVisible();
  });

  test('uploading a valid SIF file auto-populates the corporate details @wps-salary', async ({
    wpsSalaryPaymentPage,
  }) => {
    await wpsSalaryPaymentPage.uploadSifFile(testDataFilePath(data.sifFileName));

    await expect(wpsSalaryPaymentPage.uploadedFileNameText(data.sifFileName)).toBeVisible();
    // The app pads the resolved corporate name with a trailing space; assert the name
    // itself rather than pinning the exact padding, which is not part of the behaviour.
    await expect(wpsSalaryPaymentPage.corporateNameInput).toHaveValue(
      new RegExp(`^\\s*${data.expectedCorporateName}\\s*$`),
    );
    await expect(wpsSalaryPaymentPage.molIdInput).toHaveValue(data.expectedMolId);
    await expect(wpsSalaryPaymentPage.customerCategoryInput).toHaveValue(data.expectedCustomerCategory);
  });

  test('selecting an account from the list populates the debit account details @wps-salary', async ({
    wpsSalaryPaymentPage,
  }) => {
    await wpsSalaryPaymentPage.uploadSifFile(testDataFilePath(data.sifFileName));
    // Assert against the account this run actually selected rather than a hardcoded
    // number: the accounts the environment returns for this SIF have already changed
    // once (012345DIB6392xx -> 012345DIB9936xx), which is not what this case is about.
    const account = await wpsSalaryPaymentPage.selectAccountFromList(
      data.accountListCount,
      data.accountRowIndex,
    );
    expect(account, 'no account number was read from the selected row').not.toBe('');

    await expect(wpsSalaryPaymentPage.drAccountInput).toHaveValue(account);
    await expect(wpsSalaryPaymentPage.expenseGlInput).toHaveValue(account);
    await expect(wpsSalaryPaymentPage.branchIdInput).toHaveValue(data.expectedBranchId);
  });

  test('waiving all charges checks the waive-all option @wps-salary', async ({ wpsSalaryPaymentPage }) => {
    await wpsSalaryPaymentPage.uploadSifFile(testDataFilePath(data.sifFileName));
    await wpsSalaryPaymentPage.selectAccountFromList(data.accountListCount, data.accountRowIndex);
    await wpsSalaryPaymentPage.checkBalance();

    await expect(wpsSalaryPaymentPage.waiveAllCheckbox).not.toBeChecked();
    await wpsSalaryPaymentPage.waiveAllCharges();
    await expect(wpsSalaryPaymentPage.waiveAllCheckbox).toBeChecked();
  });

  test('blocks moving to Preview when required fields are incomplete @wps-salary', async ({
    wpsSalaryPaymentPage,
  }) => {
    // No SIF file uploaded and no account selected — required fields are still empty,
    // so Continue is disabled and must not be clicked (a disabled button never becomes
    // actionable, and .click() would just retry until the test times out).
    await expect(wpsSalaryPaymentPage.continueButton).toBeDisabled();
  });

  test('submits a WPS salary payment successfully via SIF upload @smoke @wps-salary', async ({
    wpsSalaryPaymentPage,
  }) => {
    await wpsSalaryPaymentPage.uploadSifFile(testDataFilePath(data.sifFileName));
    await wpsSalaryPaymentPage.setNumberOfEmployees(data.numberOfEmployees);
    await wpsSalaryPaymentPage.setReference(data.reference);

    await wpsSalaryPaymentPage.selectAccountFromList(data.accountListCount, data.accountRowIndex);
    await wpsSalaryPaymentPage.checkBalance();
    await wpsSalaryPaymentPage.waiveAllCharges();
    await wpsSalaryPaymentPage.continueToNextStep();

    await wpsSalaryPaymentPage.fillOperationalPurpose(data.operationalPurpose);
    await wpsSalaryPaymentPage.continueToNextStep();

    await wpsSalaryPaymentPage.submitUpload();

    // TODO: replace with a real assertion once the confirmation screen/toast
    // locator is known (e.g. expect(page.getByText('Upload submitted')).toBeVisible()).
  });
});
