import { test, expect } from '../../../fixtures/auth.fixture';
import { caseTitle } from '../../../testdata/charge-configuration-cases';
import { wpsChargeData as data, scopedName } from '../../../testdata/wps-charge.data';

/**
 * Txn Charge - Preferential (WPS) — TC-021..TC-031.
 * Runtime-precedence cases are fixme'd (no charge-simulation surface); configuration,
 * validation and corporate-selection behaviour is asserted through the UI.
 */
test.describe('Charge Configuration - Transaction Charge - Preferential (WPS)', () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ chargeLandingPage, chargesGrid }) => {
    await chargeLandingPage.goto();
    await chargeLandingPage.openCategory('Transaction Charge');
    await chargesGrid.filterByRail('WPS');
  });

  test(caseTitle('TC-021'), async ({ chargesGrid, transactionChargeModal, browseCorporateModal }) => {
    const description = scopedName('TC021');

    await chargesGrid.openNewCharge();
    await transactionChargeModal.openPreferentialTab();
    await transactionChargeModal.openBrowseCorporate();

    await expect(browseCorporateModal.heading).toBeVisible();
    const corporate = await browseCorporateModal.selectFirstEntity();
    await expect(browseCorporateModal.selectedCount).toHaveText(/1 customer\(s\) selected/);
    await browseCorporateModal.confirm();

    // Selected entity lands in the Selected Entries Grid on the form.
    await expect(transactionChargeModal.root.getByText(corporate)).toBeVisible();

    await transactionChargeModal.setValidity(data.validFrom, data.validTo);
    await transactionChargeModal.setDefaultChargeAmount('Per Transaction', data.fixedAmount, data.variableRate);
    await transactionChargeModal.setChargeDescription(description);
    await transactionChargeModal.save();

    await chargesGrid.search(description);
    await expect(chargesGrid.dataRows.filter({ hasText: description })).toHaveCount(1);

    // FSD expects status 'Pending Approval' after Submit for Approval — no such control
    // exists in this build (only Save Changes). Failing intentionally; see TC-001.
    await expect(chargesGrid.rowByChargeName(description).getByRole('cell', { name: 'Pending Approval' })).toBeVisible();
  });

  test(caseTitle('TC-022'), async ({ chargesGrid, transactionChargeModal }) => {
    await chargesGrid.openNewCharge();
    await transactionChargeModal.openPreferentialTab();

    // BR-003: corporate/customer is mandatory.
    await expect(transactionChargeModal.corporateEmptyState).toBeVisible();
    await transactionChargeModal.setValidity(data.validFrom);
    await transactionChargeModal.setDefaultChargeAmount('Per Transaction', data.fixedAmount);
    await transactionChargeModal.setChargeDescription(scopedName('TC022'));
    const message = await transactionChargeModal.saveAndCaptureDialog();

    // Verified manually: the save IS blocked (drawer stays open, nothing is created),
    // but the user is told nothing at all — no dialog, no inline message.
    await expect(transactionChargeModal.root).toBeVisible();
    expect(message, 'submission was blocked but gave the user no feedback').not.toBeNull();
  });

  test.fixme(caseTitle('TC-023'), async () => {
    // Preferential-over-Global precedence is only observable when a transaction is priced.
    // Needs a charge-simulation endpoint or manual verification.
  });

  test(caseTitle('TC-024'), async ({ chargesGrid, transactionChargeModal, browseCorporateModal }) => {
    const description = scopedName('TC024');

    await chargesGrid.openNewCharge();
    await transactionChargeModal.openPreferentialTab();
    await transactionChargeModal.openBrowseCorporate();
    await browseCorporateModal.selectFirstEntity();
    await browseCorporateModal.confirm();

    // Valid To already in the past — the record should be classified as Expired.
    await transactionChargeModal.setValidity(data.validFrom, data.expiredValidTo);
    await transactionChargeModal.setDefaultChargeAmount('Per Transaction', data.fixedAmount);
    await transactionChargeModal.setChargeDescription(description);

    // Not save(): a past Valid To is currently rejected, and a rejected save in this
    // build produces no dialog, no inline message and no record. Capture that directly
    // rather than letting it surface later as a confusing "row not found".
    const message = await transactionChargeModal.saveAndCaptureDialog();
    expect(
      message,
      'a past Valid To was rejected silently — no dialog, no inline message, no record created',
    ).not.toBeNull();
    await transactionChargeModal.root.waitFor({ state: 'hidden', timeout: 15_000 });

    await chargesGrid.search(description);
    // Prove the record is actually in the filtered grid before reading its status —
    // otherwise a missing row and a wrong status fail with the same unhelpful message.
    await expect(chargesGrid.rowByChargeName(description)).toBeVisible();
    await expect(chargesGrid.statusCell(chargesGrid.rowByChargeName(description))).toHaveText('Expired');
    // That Global then prices those transactions instead needs transaction processing.
  });

  test(caseTitle('TC-025'), async ({ chargesGrid, transactionChargeModal, browseCorporateModal }) => {
    await chargesGrid.openNewCharge();
    await transactionChargeModal.openPreferentialTab();
    await transactionChargeModal.openBrowseCorporate();
    await browseCorporateModal.selectFirstEntity();
    await browseCorporateModal.confirm();

    // BR-004: Valid From must not be after Valid To.
    await transactionChargeModal.setValidity(data.invalidValidFrom, data.invalidValidTo);
    await transactionChargeModal.setDefaultChargeAmount('Per Transaction', data.fixedAmount);
    await transactionChargeModal.setChargeDescription(scopedName('TC025'));
    const message = await transactionChargeModal.saveAndCaptureDialog();

    // A rejected save is silent in this build, so "no success dialog" means BR-004 held.
    expect(message, `Valid From after Valid To was accepted with: ${message}`).toBeNull();
  });

  test(caseTitle('TC-026'), async ({ chargesGrid }) => {
    // BR-002: multiple Preferential charges may coexist on one rail for different scopes.
    // Page size first — the category chips filter only the rows already loaded (see TC-002).
    await chargesGrid.setRowsPerPage('50');
    await chargesGrid.filterByCategory('Preferential');

    // dataRowCount() settles the grid first; a bare rows.count() here read the loading
    // placeholder (which counts as one row) and failed intermittently.
    expect(await chargesGrid.dataRowCount()).toBeGreaterThan(1);
  });

  test.fixme(caseTitle('TC-027'), async () => {
    // Scoping of Preferential rules to only the assigned corporate is a pricing-time
    // behaviour; needs transaction processing for two different corporates.
  });

  test(caseTitle('TC-028'), async ({ chargesGrid, transactionChargeModal }) => {
    await chargesGrid.openNewCharge();
    await transactionChargeModal.openPreferentialTab();

    // The tab must always present a blank creation form — no in-modal edit of an existing record.
    await expect(transactionChargeModal.corporateEmptyState).toBeVisible();
    await expect(transactionChargeModal.validFromInput).toHaveValue('');
    await expect(transactionChargeModal.editButton).toHaveCount(0);
  });

  test.fixme(caseTitle('TC-029'), async () => {
    // First-matching-rule vs Preferential default requires a priced transaction.
  });

  test(caseTitle('TC-030'), async ({ chargesGrid, transactionChargeModal, browseCorporateModal }) => {
    await chargesGrid.openNewCharge();
    await transactionChargeModal.openPreferentialTab();
    await transactionChargeModal.openBrowseCorporate();

    await expect(browseCorporateModal.corporateTab).toBeVisible();
    await expect(browseCorporateModal.retailCustomerTab).toBeVisible();
    await expect(browseCorporateModal.selectedCount).toHaveText(/0 customer\(s\) selected/);

    // Multi-select is exercised on the Retail Customer tab, not the Corporate one: this
    // environment's Corporate tab holds a single entity ("Emirates Group"), so there is
    // no second row there to tick and nth(1) could never resolve. Verified live — the
    // Retail Customer tab lists four customers, and selecting two updates the count.
    await browseCorporateModal.openRetailCustomerTab();
    await expect(browseCorporateModal.selectableRows.nth(1)).toBeVisible();

    await browseCorporateModal.selectableRows.nth(0).getByRole('checkbox').check();
    await browseCorporateModal.selectableRows.nth(1).getByRole('checkbox').check();
    await expect(browseCorporateModal.selectedCount).toHaveText(/2 customer\(s\) selected/);

    await browseCorporateModal.confirm();
    await expect(transactionChargeModal.corporateEmptyState).toHaveCount(0);
  });

  test(caseTitle('TC-031'), async ({ chargesGrid, transactionChargeModal, browseCorporateModal }) => {
    // BR-015: duplicate Preferential scope combination must be rejected.
    const description = scopedName('TC031');

    for (const attempt of [1, 2]) {
      await chargesGrid.openNewCharge();
      await transactionChargeModal.openPreferentialTab();
      await transactionChargeModal.openBrowseCorporate();
      // selectableRows, not rows: the picker's loading placeholder is a single-cell row
      // with no checkbox, so rows.first() can latch onto it and time out.
      await browseCorporateModal.selectableRows.first().getByRole('checkbox').check();
      await browseCorporateModal.confirm();
      await transactionChargeModal.setValidity(data.validFrom, data.validTo);
      await transactionChargeModal.setDefaultChargeAmount('Per Transaction', data.fixedAmount);
      await transactionChargeModal.setChargeDescription(`${description}_${attempt}`);
      await transactionChargeModal.save();
    }

    await chargesGrid.search(description);
    await expect(chargesGrid.dataRows.filter({ hasText: description })).toHaveCount(1);
  });
});
