import { test, expect } from '../../../fixtures/auth.fixture';
import { cbComplianceRuleLinkTestData as data } from '../../../testdata/cb-compliance-charges.data';
import { scopedName } from '../../../testdata/wps-charge.data';

/**
 * CB Compliance Charges (WPS) — linking an existing charge rule to the SIF charge.
 *
 * Objective: an admin can attach a rule from the catalogue to the WPS SIF compliance
 * charge and persist the configuration.
 *
 * Login is handled by the auth fixture; every control is driven through the Page
 * Objects in Pages/, so a UI change is fixed in one place rather than in each spec.
 */
test.describe('Charge Configuration - CB Compliance Charges - rule linking (WPS)', () => {
  test.describe.configure({ timeout: 90_000 });

  test('attaches rule "Test Rul 01" to the WPS SIF compliance charge and saves it @critical @cb-compliance', async ({
    chargeLandingPage,
    chargesGrid,
    cbComplianceModal,
    browseRulesModal,
  }) => {
    // Run-scoped so the record this test creates is identifiable in a shared
    // environment and can never collide with a parallel worker.
    const description = scopedName('CBSIF');

    await test.step('open the WPS rail under CB Compliance Charges', async () => {
      await chargeLandingPage.goto();
      await chargeLandingPage.openCategory(data.category);
      // The rail card opens the New CB Compliance Charge drawer directly, with the
      // rail already applied — asserted below rather than assumed.
      await chargeLandingPage.openRailCard(data.rail);

      await expect(cbComplianceModal.root).toBeVisible();
      await expect(cbComplianceModal.railSelect).toHaveValue(data.rail);
    });

    await test.step('configure the SIF charge', async () => {
      await cbComplianceModal.selectMessage(data.messageType);
      await expect(cbComplianceModal.messageCheckbox(data.messageType)).toBeChecked();

      await cbComplianceModal.setAmount(data.amount);
      await cbComplianceModal.setDescription(description);
    });

    await test.step('attach the rule from the catalogue', async () => {
      await expect(cbComplianceModal.ruleEmptyState).toBeVisible();

      await cbComplianceModal.openBrowseRules();
      await expect(browseRulesModal.root).toBeVisible();
      await browseRulesModal.selectRule(data.ruleName);
      await browseRulesModal.confirm();

      // The picker closing is not proof of a link — assert the rule actually landed
      // in the drawer's Rule Selection area and displaced the empty state.
      await expect(browseRulesModal.root).toBeHidden();
      await expect(cbComplianceModal.attachedRule(data.ruleName)).toBeVisible();
      await expect(cbComplianceModal.ruleEmptyState).toHaveCount(0);
    });

    await test.step('save and confirm the record was written', async () => {
      // save() blocks until the app has answered: it captures the native alert and
      // waits for the drawer to close, so the search below cannot read a stale grid.
      // It throws on a silently rejected save rather than surfacing as "row not found".
      const message = await cbComplianceModal.save();
      expect(message, `unexpected save confirmation: ${message}`).toMatch(/submitted for approval/i);

      await chargesGrid.search(description);
      await expect(chargesGrid.dataRows.filter({ hasText: description })).toHaveCount(1);
    });
  });
});
