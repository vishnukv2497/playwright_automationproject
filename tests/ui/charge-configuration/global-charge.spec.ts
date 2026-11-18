import { test, expect } from '../../../fixtures/auth.fixture';
import { caseTitle } from '../../../testdata/charge-configuration-cases';
import { CHARGE_BASIS_ROWS } from '../../../Pages/TransactionChargeModal';
import { wpsChargeData as data, scopedName } from '../../../testdata/wps-charge.data';

/**
 * Txn Charge - Global (WPS) — TC-001..TC-020, TC-046.
 *
 * Cases whose expected result can only be observed at transaction-processing time
 * are marked test.fixme() — this environment exposes no charge-simulation UI or API
 * (confirmed: the sidebar has no simulation entry), so asserting a computed charge
 * here would be fabricated. Each carries a note on what is needed to finish it.
 */
test.describe('Charge Configuration - Transaction Charge - Global (WPS)', () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ chargeLandingPage, chargesGrid }) => {
    await chargeLandingPage.goto();
    await chargeLandingPage.openCategory('Transaction Charge');
    await chargesGrid.filterByRail('WPS');
  });

  test(caseTitle('TC-001'), async ({ chargesGrid, transactionChargeModal }) => {
    const description = scopedName('TC001');

    await chargesGrid.openNewCharge();
    await transactionChargeModal.openGlobalTab();
    await transactionChargeModal.setDefaultChargeAmount('Per Transaction', data.fixedAmount, data.variableRate);
    await transactionChargeModal.setFooterValues({ vat: data.vat, min: data.minCharge, max: data.maxCharge });
    await transactionChargeModal.setChargeDescription(description);
    await transactionChargeModal.save();

    await chargesGrid.search(description);
    await expect(chargesGrid.dataRows.filter({ hasText: description })).toHaveCount(1);

    // FSD expects submission to route the charge to a checker with status 'Pending Approval'
    // and an auto-generated WPS_Global_xxx name. This build offers only "Save Changes" —
    // there is no Submit for Approval control anywhere in the drawer, so the documented
    // outcome cannot be reached. Failing intentionally until the workflow is implemented.
    await expect(chargesGrid.rowByChargeName(description).getByRole('cell', { name: 'Pending Approval' })).toBeVisible();
  });

  test(caseTitle('TC-002'), async ({ chargesGrid }) => {
    // Page size BEFORE the category chip: the chips filter only the rows already loaded,
    // so at 10/page "Global" can report "No charges match" while 29 Global records exist.
    await chargesGrid.setRowsPerPage('50');
    await chargesGrid.filterByCategory('Global');

    // "At most one" passes for free against an empty read, so prove the grid actually
    // returned WPS + Global records before counting the Active ones.
    expect(await chargesGrid.dataRowCount(), 'the WPS Global grid returned no rows').toBeGreaterThan(0);

    // BR-001: at most one Active Global charge may exist per rail.
    // This is known defect 1 — expected to fail until the rule is enforced.
    expect(await chargesGrid.rowsWithStatus('Active').count()).toBeLessThanOrEqual(1);
  });

  test(caseTitle('TC-003'), async ({ chargesGrid, transactionChargeModal }) => {
    await chargesGrid.openNewCharge();
    await transactionChargeModal.openGlobalTab();

    // The four message types this build renders as read-only pills.
    for (const message of ['SIF', 'DIF', 'RFA', 'EIF']) {
      await expect(transactionChargeModal.messagePill(message)).toBeVisible();
    }
    // The workbook expects PIF as a fifth WPS message type; it is absent from this build
    // (also absent from the CB Compliance message list). Failing intentionally.
    await expect(transactionChargeModal.messagePill('PIF')).toBeVisible();
  });

  test.fixme(caseTitle('TC-004'), async () => {
    // Configuration side is covered by TC-001. Verifying that the Default Charge Amounts
    // are actually applied when no rule matches requires processing a WPS transaction and
    // reading back the computed charge — no simulation screen or charge-calculation API
    // is available. Needs: a charge-simulation endpoint, or manual verification.
  });

  test.fixme(caseTitle('TC-005'), async () => {
    // Needs transaction processing to compare rule charge (AED 5) against default (AED 10).
    // Attach-rule configuration is covered by TC-016.
  });

  test.fixme(caseTitle('TC-006'), async () => {
    // Needs two rules with differing Execution Order and a processed transaction to prove
    // only the lowest-order match is applied. Execution Order is not editable in this build
    // (the Rules table shows an Order column but "+ Create New Rule" is disabled).
  });

  test.fixme(caseTitle('TC-007'), async () => {
    // Pure calculation check (Fixed + Amount x Variable%, clamped by Min/Max).
    // Requires a computed charge from transaction processing.
  });

  test.fixme(caseTitle('TC-008'), async () => {
    // Pure calculation check (VAT applied to base charge -> AED 5.36).
    // Requires a computed charge from transaction processing.
  });

  test(caseTitle('TC-009'), async ({ chargesGrid, transactionChargeModal, page }) => {
    // See TC-002: the category chip only filters the loaded page, so widen it first.
    await chargesGrid.setRowsPerPage('50');
    await chargesGrid.filterByCategory('Global');
    // firstDataRow() skips the loading placeholder, which is a row with one spanning
    // cell and therefore carries no View/Edit buttons to click.
    const firstRow = await chargesGrid.firstDataRow();

    // View opens a read-only detail panel — a separate dialog from the editable drawer,
    // labelled per record ("Charge CCWPSG…") and offering only Close.
    await chargesGrid.rowAction(firstRow, 'view').click();
    await expect(chargesGrid.detailDrawer).toBeVisible();
    await expect(chargesGrid.detailDrawer.getByRole('textbox')).toHaveCount(0);
    await expect(chargesGrid.detailDrawer.getByRole('button', { name: 'Save Changes' })).toHaveCount(0);

    // Escape does not dismiss this panel; Close is the only way out.
    await chargesGrid.detailDrawer.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(chargesGrid.detailDrawer).toBeHidden();

    // Editing is a distinct row action, and that one does unlock the fields.
    await chargesGrid.rowAction(await chargesGrid.firstDataRow(), 'edit').click();
    await expect(transactionChargeModal.root).toBeVisible();
    await expect(transactionChargeModal.saveChangesButton).toBeVisible();
    await expect(transactionChargeModal.fixedAmountInput('Per Transaction')).toBeEditable();
  });

  test(caseTitle('TC-010'), async ({ chargesGrid, transactionChargeModal, page }) => {
    // Acts on a charge this run created, never on pre-existing data.
    const description = scopedName('TC010');
    await chargesGrid.openNewCharge();
    await transactionChargeModal.openGlobalTab();
    await transactionChargeModal.setDefaultChargeAmount('Per Transaction', data.fixedAmount);
    await transactionChargeModal.setChargeDescription(description);
    await transactionChargeModal.save();

    await chargesGrid.search(description);
    const row = chargesGrid.rowByChargeName(description);
    await expect(row).toBeVisible();
    await chargesGrid.rowAction(row, 'edit').click();

    // Deactivate raises a native confirm() before applying.
    const prompt = await transactionChargeModal.confirmStatusChange('Deactivate');
    expect(prompt, 'no confirmation prompt was shown before deactivating').toMatch(/deactivate/i);

    // confirmStatusChange() has already waited for the drawer to close, so the grid
    // underneath is showing the post-change state rather than the pre-change one.
    await chargesGrid.waitForGrid();
    await expect(chargesGrid.statusCell(chargesGrid.rowByChargeName(description))).toHaveText('Inactive');
    // Confirming the charge is skipped during processing (BR-012) needs transaction simulation.
  });

  test(caseTitle('TC-011'), async ({ chargesGrid, transactionChargeModal, page }) => {
    const description = scopedName('TC011');
    await chargesGrid.openNewCharge();
    await transactionChargeModal.openGlobalTab();
    await transactionChargeModal.setDefaultChargeAmount('Per Transaction', data.fixedAmount);
    await transactionChargeModal.setChargeDescription(description);
    await transactionChargeModal.save();

    await chargesGrid.search(description);
    const row = chargesGrid.rowByChargeName(description);
    await expect(row).toBeVisible();
    await chargesGrid.rowAction(row, 'edit').click();

    await transactionChargeModal.confirmStatusChange('Deactivate');
    await chargesGrid.waitForGrid();
    await expect(chargesGrid.statusCell(chargesGrid.rowByChargeName(description))).toHaveText('Inactive');

    await chargesGrid.rowAction(chargesGrid.rowByChargeName(description), 'edit').click();
    const prompt = await transactionChargeModal.confirmStatusChange('Activate');
    expect(prompt, 'no confirmation prompt was shown before activating').toMatch(/activate/i);

    await chargesGrid.waitForGrid();
    await expect(chargesGrid.statusCell(chargesGrid.rowByChargeName(description))).toHaveText('Active');
  });

  test(caseTitle('TC-012'), async ({ chargesGrid, transactionChargeModal }) => {
    await chargesGrid.openNewCharge();
    await transactionChargeModal.openGlobalTab();

    // FSD requires a distinct "Save as Draft" action that persists without submitting.
    // This build has only "Save Changes"; the drawer shows a DRAFT badge but offers no
    // draft-save control. Failing intentionally until implemented.
    await expect(transactionChargeModal.root.getByRole('button', { name: 'Save as Draft' })).toBeVisible();
  });

  test.fixme(caseTitle('TC-013'), async () => {
    // Maker-Checker: needs a second (checker) account, and a Submit for Approval control
    // which this build does not expose. No checker credentials were provided.
  });

  test.fixme(caseTitle('TC-014'), async () => {
    // Needs a checker account to reject with remarks before the maker can resubmit.
  });

  test.fixme(caseTitle('TC-015'), async () => {
    // BR-008 rule-removal approval: needs a checker account and the approval workflow.
  });

  test(caseTitle('TC-016'), async ({ chargesGrid, transactionChargeModal, browseRulesModal }) => {
    await chargesGrid.openNewCharge();
    await transactionChargeModal.openGlobalTab();
    await expect(transactionChargeModal.rulesEmptyState).toBeVisible();

    await transactionChargeModal.openBrowseRules();
    await expect(browseRulesModal.root).toBeVisible();
    await browseRulesModal.selectRule(data.ruleName);
    await browseRulesModal.confirm();

    await expect(transactionChargeModal.attachedRuleRow(data.ruleName)).toHaveCount(1);

    // Re-selecting the same rule must be skipped rather than duplicated (BR-010).
    await transactionChargeModal.openBrowseRules();
    await browseRulesModal.selectRule(data.ruleName);
    await browseRulesModal.confirm();

    await expect(transactionChargeModal.attachedRuleRow(data.ruleName)).toHaveCount(1);
  });

  test(caseTitle('TC-017'), async ({ chargesGrid, transactionChargeModal }) => {
    await chargesGrid.openNewCharge();
    await transactionChargeModal.openGlobalTab();

    // Zero is a valid (waived) charge per BR-014.
    await transactionChargeModal.setDefaultChargeAmount('Per Transaction', '0');
    await expect(transactionChargeModal.fixedAmountInput('Per Transaction')).toHaveValue('0');

    // Negative amounts must be rejected (BR-014).
    await transactionChargeModal.setDefaultChargeAmount('Per Transaction', data.negativeAmount);
    await transactionChargeModal.setChargeDescription(scopedName('TC017'));
    const message = await transactionChargeModal.saveAndCaptureDialog();

    // Verified manually: saving -5 raises "✓ Charge configuration submitted for approval",
    // i.e. the negative amount is accepted. A rejected save produces no dialog at all,
    // so a null message is the pass condition here. Fails until BR-014 is enforced.
    expect(message, `negative amount was accepted with: ${message}`).toBeNull();
  });

  test(caseTitle('TC-018'), async ({ chargesGrid, transactionChargeModal }) => {
    await chargesGrid.openNewCharge();
    await transactionChargeModal.openGlobalTab();
    await transactionChargeModal.setDefaultChargeAmount('Per Transaction', data.fixedAmount);
    // BR-007: Min must not exceed Max.
    await transactionChargeModal.setFooterValues({ min: data.invalidMin, max: data.invalidMax });
    await transactionChargeModal.setChargeDescription(scopedName('TC018'));
    const message = await transactionChargeModal.saveAndCaptureDialog();

    // A rejected save is silent in this build, so "no dialog" means the rule held.
    expect(message, `Min > Max was accepted with: ${message}`).toBeNull();
  });

  test(caseTitle('TC-019'), async ({ chargesGrid, transactionChargeModal }) => {
    await chargesGrid.openNewCharge();
    await transactionChargeModal.openGlobalTab();

    // Rule creation is expected from within the charge drawer via "+ New Rule".
    // This build renders "+ Create New Rule" permanently disabled, so mandatory-field
    // validation in the Rule Modal is unreachable from here. Failing intentionally.
    await expect(transactionChargeModal.createNewRuleButton).toBeEnabled();
  });

  test.fixme(caseTitle('TC-020'), async () => {
    // Needs transactions across multiple channels to prove an unconfigured condition
    // matches all values. Requires transaction processing.
  });

  test(caseTitle('TC-046'), async ({ chargesGrid, transactionChargeModal }) => {
    // BR-015: a second Global charge with an identical scope combination must be blocked.
    const description = scopedName('TC046');

    for (const attempt of [1, 2]) {
      await chargesGrid.openNewCharge();
      await transactionChargeModal.openGlobalTab();
      await transactionChargeModal.setDefaultChargeAmount('Per Transaction', data.fixedAmount);
      await transactionChargeModal.setChargeDescription(`${description}_${attempt}`);
      // save() waits for the success alert and for the drawer to close, so the second
      // iteration never races the first write.
      await transactionChargeModal.save();
    }

    await chargesGrid.search(description);
    // The duplicate must not have been persisted.
    await expect(chargesGrid.dataRows.filter({ hasText: description })).toHaveCount(1);
  });

  test('Default Charge Amounts renders only the bank-configured charge bases @high @known-defect', async ({
    chargesGrid,
    transactionChargeModal,
  }) => {
    await chargesGrid.openNewCharge();
    await transactionChargeModal.openGlobalTab();

    // count() does not auto-wait — an unrendered table reads 0, which satisfies
    // "fewer than five" and hides the defect. Prove the table is populated first.
    await expect(transactionChargeModal.chargeBasisRows().first()).toBeVisible();

    // Known defect 2: all five charge-basis rows render together instead of the
    // mutually exclusive subset configured for the bank. Fails until fixed.
    expect(await transactionChargeModal.chargeBasisRows().count()).toBeLessThan(CHARGE_BASIS_ROWS.length);
  });
});
