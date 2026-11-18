import { test, expect } from '../../../fixtures/auth.fixture';
import { caseTitle } from '../../../testdata/charge-configuration-cases';
import { wpsChargeData as data, scopedName } from '../../../testdata/wps-charge.data';

/**
 * CB Compliance Charges (WPS) — TC-037..TC-044.
 * The drawer is a simplified form: rail selector, message-type checkboxes, a single
 * flat Amount, description and an optional attached rule.
 */
test.describe('Charge Configuration - CB Compliance Charges (WPS)', () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ chargeLandingPage, chargesGrid }) => {
    await chargeLandingPage.goto();
    await chargeLandingPage.openCategory('CB Compliance Charges');
  });

  test(caseTitle('TC-037'), async ({ chargesGrid, cbComplianceModal }) => {
    await chargesGrid.openNewCharge();
    await expect(cbComplianceModal.root).toBeVisible();

    await cbComplianceModal.selectRail('WPS');

    // Only WPS message types remain selectable; other rails' types disappear.
    for (const message of data.messageTypes) {
      await expect(cbComplianceModal.messageCheckbox(new RegExp(`^${message}\\b`))).toBeVisible();
    }
    await expect(cbComplianceModal.messageCheckbox('OUT PACS.008 (Credit Transfer)')).toHaveCount(0);

    // The workbook lists PIF among WPS message types; this build offers only
    // SIF, DIF, RFA and EIF. Failing intentionally until PIF is added.
    await expect(cbComplianceModal.messageCheckbox(/^PIF\b/)).toBeVisible();
  });

  test(caseTitle('TC-038'), async ({ chargesGrid, cbComplianceModal }) => {
    const description = scopedName('TC038');

    await chargesGrid.openNewCharge();
    await cbComplianceModal.selectRail('WPS');
    await cbComplianceModal.selectMessage(data.cbMessageType);
    await cbComplianceModal.setAmount(data.cbAmount);
    await cbComplianceModal.setDescription(description);

    // Currency is one of the three mandatory fields per the workbook, but the build
    // renders it as a static AED badge rather than a selectable control (defect 3).
    await expect(cbComplianceModal.currencySelect).toBeVisible();

    await cbComplianceModal.save();
    await chargesGrid.search(description);
    await expect(chargesGrid.dataRows.filter({ hasText: description })).toHaveCount(1);
  });

  test(caseTitle('TC-039'), async ({ chargesGrid, cbComplianceModal }) => {
    await chargesGrid.openNewCharge();
    await cbComplianceModal.selectRail('WPS');

    // A single flat Amount, with none of the Transaction Charge basis breakdown.
    await expect(cbComplianceModal.amountInput).toBeVisible();
    for (const basis of ['Per Transaction', 'Per Txn — Own Bank', 'Per File', 'Per Card']) {
      await expect(cbComplianceModal.root.getByText(basis, { exact: true })).toHaveCount(0);
    }
  });

  test.fixme(caseTitle('TC-040'), async () => {
    // Applying the flat AED 25 at transaction time needs charge simulation; the
    // configuration half of this case is covered by TC-038.
  });

  test.fixme(caseTitle('TC-041'), async () => {
    // Rule-over-flat-amount override is a pricing-time behaviour. Attaching the rule
    // is UI-checkable (see TC-016 pattern) but the resulting charge is not observable.
  });

  test(caseTitle('TC-042'), async ({ chargesGrid, cbComplianceModal, page }) => {
    const description = scopedName('TC042');

    await chargesGrid.openNewCharge();
    await cbComplianceModal.selectRail('WPS');
    await cbComplianceModal.selectMessage(data.cbMessageType);
    await cbComplianceModal.setAmount(data.cbAmount);
    await cbComplianceModal.setDescription(description);
    await cbComplianceModal.save();

    await chargesGrid.search(description);
    const row = chargesGrid.rowByChargeName(description);
    await expect(row).toBeVisible();
    await chargesGrid.rowAction(row, 'edit').click();
    await expect(cbComplianceModal.root).toBeVisible();

    // Verified in the browser: Edit does load the record, but the CB Compliance drawer
    // offers only Browse Rules / Save Configuration / Close — there is no Deactivate,
    // so a CB Compliance charge cannot be deactivated at all. The Transaction Charge
    // drawer does expose one. Fails until the status control is added.
    await expect(cbComplianceModal.descriptionInput).toHaveValue(description);
    await expect(cbComplianceModal.root.getByRole('button', { name: 'Deactivate', exact: true })).toBeVisible();

    const prompt = await cbComplianceModal.confirmStatusChange('Deactivate');
    expect(prompt, 'no confirmation prompt was shown before deactivating').toMatch(/deactivate/i);

    await chargesGrid.waitForGrid();
    await expect(chargesGrid.statusCell(chargesGrid.rowByChargeName(description))).toHaveText('Inactive');
  });

  test.fixme(caseTitle('TC-043'), async () => {
    // Maker-Checker approval: needs a checker account (none provided) and a
    // Submit for Approval control, which this drawer does not expose — it offers
    // only "Save Configuration".
  });

  test(caseTitle('TC-044'), async ({ chargesGrid, cbComplianceModal }) => {
    await chargesGrid.openNewCharge();
    await cbComplianceModal.selectRail('WPS');

    // No message, no amount — submission must be blocked AND the missing field named.
    // Verified in the browser: the drawer instead closes on a success alert, i.e. a
    // completely empty CB Compliance charge is accepted. Assert the outcome before the
    // drawer state, so the failure names the real problem rather than "dialog not found".
    const noFields = await cbComplianceModal.saveAndCaptureDialog();
    expect(noFields, 'saving an empty CB Compliance form gave the user no feedback at all').not.toBeNull();
    expect(
      noFields,
      `an empty CB Compliance charge was accepted with: ${noFields}`,
    ).toMatch(/required|mandatory|select|enter|missing/i);
    await expect(cbComplianceModal.root).toBeVisible();

    // Message selected but amount still blank — still blocked.
    await cbComplianceModal.selectMessage(data.cbMessageType);
    const noAmount = await cbComplianceModal.saveAndCaptureDialog();
    expect(noAmount, 'blocked with no feedback identifying the missing Amount').not.toBeNull();
  });
});
