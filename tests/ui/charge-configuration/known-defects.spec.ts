import { test, expect } from '../../../fixtures/auth.fixture';
import { CHARGE_BASIS_ROWS } from '../../../Pages/TransactionChargeModal';

/**
 * Regression checks for the five defects found in manual testing.
 *
 * These assert the CORRECT behaviour, so they are expected to FAIL against the current
 * build and to start passing once each defect is fixed. They are deliberately hard
 * assertions — not skipped, not soft — so a fix flips them green and a regression flips
 * them red again.
 *
 * Run just these with:  npx playwright test --grep @known-defect
 */
test.describe('Charge Configuration - known defects (expected to fail until fixed)', () => {
  test.describe.configure({ timeout: 90_000 });

  test('DEF-1 - Only one Active Global charge may exist per rail (BR-001) @critical @known-defect', async ({
    chargeLandingPage,
    chargesGrid,
  }) => {
    await chargeLandingPage.goto();
    await chargeLandingPage.openCategory('CB Compliance Charges');
    await chargesGrid.filterByRail('WPS');
    // Page size BEFORE the category chip — the chips filter only the loaded page, so at
    // 10/page "Global" can report "No charges match" while 29 Global records exist.
    await chargesGrid.setRowsPerPage('50');
    await chargesGrid.filterByCategory('Global');

    // count() does not auto-wait — assert the grid actually returned rows before counting,
    // otherwise an empty or still-loading grid satisfies "<= 1" and hides the defect.
    expect(await chargesGrid.dataRowCount(), 'the WPS Global grid returned no rows').toBeGreaterThan(0);

    // Observed live: WPS + Global + Active resolves to many records.
    expect(await chargesGrid.rowsWithStatus('Active').count()).toBeLessThanOrEqual(1);
  });

  test('DEF-2 - Default Charge Amounts shows only the configured charge bases @high @known-defect', async ({
    chargeLandingPage,
    chargesGrid,
    transactionChargeModal,
  }) => {
    await chargeLandingPage.goto();
    await chargeLandingPage.openCategory('Transaction Charge');
    await chargesGrid.filterByRail('WPS');
    await chargesGrid.openNewCharge();
    await transactionChargeModal.openGlobalTab();

    // Observed live: all five rows (Per Transaction, Per Txn Own/Other Bank, Per File,
    // Per Card) render together instead of the bank's mutually exclusive subset.
    expect(await transactionChargeModal.chargeBasisRows().count()).toBeLessThan(CHARGE_BASIS_ROWS.length);
  });

  test('DEF-3 - CB Compliance Currency is an editable dropdown, not a fixed badge @high @known-defect', async ({
    chargeLandingPage,
    chargesGrid,
    cbComplianceModal,
  }) => {
    await chargeLandingPage.goto();
    await chargeLandingPage.openCategory('CB Compliance Charges');
    await chargesGrid.openNewCharge();
    await cbComplianceModal.selectRail('WPS');

    // Observed live: Amount is prefixed with a static "AED" badge; no Currency control.
    await expect(cbComplianceModal.currencySelect).toBeVisible();
  });

  test('DEF-4 - Deactivate is hidden on a new/draft charge @high @known-defect', async ({
    chargeLandingPage,
    chargesGrid,
    transactionChargeModal,
  }) => {
    await chargeLandingPage.goto();
    await chargeLandingPage.openCategory('Transaction Charge');
    await chargesGrid.filterByRail('WPS');
    await chargesGrid.openNewCharge();

    // The drawer opens as "New Transaction Charge" with a DRAFT badge; Deactivate should
    // only be offered in Edit mode for an Active charge.
    await expect(transactionChargeModal.statusBadge).toHaveText('DRAFT');
    await expect(transactionChargeModal.deactivateButton).toHaveCount(0);
  });

  test('DEF-5 - Grid resolves Corporate/Customer to a display name, not an internal ID @high @known-defect', async ({
    chargeLandingPage,
    chargesGrid,
  }) => {
    await chargeLandingPage.goto();
    await chargeLandingPage.openCategory('Transaction Charge');
    await chargesGrid.filterByRail('WPS');
    await chargesGrid.setRowsPerPage('50');

    // allTextContents() does NOT auto-wait: reading before the grid populates returns []
    // and makes the assertion below pass vacuously. Waiting on rows alone is not enough
    // either — the loading placeholder is a row with a single spanning cell — so settle
    // the grid and then wait for the Corporate/Customer column itself.
    await chargesGrid.waitForGrid();
    await expect(chargesGrid.corporateCells().first()).toBeVisible();

    // Observed live: at least one row renders e.g. "1baa48a483064327" instead of the
    // corporate name. Any long hex-looking token in this column is an unresolved ID.
    const corporateCells = await chargesGrid.corporateCells().allTextContents();
    expect(corporateCells.length, 'no Corporate/Customer cells were read').toBeGreaterThan(0);

    const unresolved = corporateCells.filter((text) => /^[0-9a-f]{12,}$/i.test(text.trim()));
    expect(unresolved, `Unresolved corporate identifiers rendered in the grid: ${unresolved.join(', ')}`).toEqual([]);
  });
});
