import { test, expect } from '../../fixtures/auth.fixture';
import { cbComplianceChargesTestData as data } from '../../testdata/cb-compliance-charges.data';

/**
 * Scripted from cb-compliance-charges-test-cases.md (TC_CB_001 - TC_CB_010).
 *
 * TC_CB_001 and TC_CB_002 reuse the CB Compliance Charges navigation already verified
 * via a real recorded flow (Charge Management > Charge Configuration > View > CB
 * Compliance Charges > WPS).
 *
 * VERIFIED against the live drawer on 2026-09-17. "New CB Compliance Charge" renders
 * exactly four buttons — Close drawer / Browse Rules / Save Configuration / Close — one
 * unlabelled rail <select>, two unlabelled textboxes (placeholders "0.00" and "Short
 * description of this compliance charge") and the message checkboxes for the selected
 * rail. Two locators that were guessed wrong have been corrected in
 * ChargeConfigurationPage (Amount, Description).
 *
 * The rest of TC_CB_003..TC_CB_010 target controls this build does NOT have — there is no
 * Currency control (the currency is a static AED badge), no Submit for Approval, no Save
 * As Draft, no Activate/Deactivate on this drawer, no inline validation messages and no
 * charge-status badge. Those assertions are left standing because they state the
 * documented FSD behaviour; they fail on the missing controls, which is the intended
 * signal. See tests/ui/charge-configuration/README.md for the full defect list, and
 * tests/ui/charge-configuration/cb-compliance-charge.spec.ts, which covers the same
 * ground through verified locators.
 *
 * NOTE: because this block is serial, TC_CB_003's failure suppresses the six cases after
 * it. They are blocked by the same missing controls, not by anything test-side.
 *
 * Declared with `describe.serial` because the source doc's "Execution Order" implies
 * later cases build on state created earlier (e.g. TC_CB_009 expects a charge already
 * left Inactive by an earlier step).
 */
test.describe.serial('Charge Management - CB Compliance Charges (TC_CB_001-010)', () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ dashboardPage, chargeConfigurationPage }) => {
    await dashboardPage.openChargeManagement();
    await chargeConfigurationPage.openChargeConfiguration();
    await chargeConfigurationPage.selectChargeView(data.view);
  });

  test('TC_CB_001 - Verify CB Compliance Charge page launch @testcase @P1 @Smoke @CBCompliance @ChargeManagement', async ({
    chargeConfigurationPage,
  }) => {
    await expect(chargeConfigurationPage.categoryButton(data.rail)).toBeVisible();
  });

  test('TC_CB_002 - Verify rail selection loads applicable messages @testcase @P1 @Smoke @CBCompliance @ChargeManagement', async ({
    chargeConfigurationPage,
  }) => {
    await chargeConfigurationPage.selectCategory(data.rail);
    await chargeConfigurationPage.openNewCharge();

    await expect(chargeConfigurationPage.messageCheckbox(data.message)).toBeVisible();
  });

  test('TC_CB_003 - Create CB Compliance Charge successfully @testcase @P1 @Smoke @CBCompliance @ChargeManagement', async ({
    chargeConfigurationPage,
  }) => {
    await chargeConfigurationPage.selectCategory(data.rail);
    await chargeConfigurationPage.openNewCharge();
    await chargeConfigurationPage.selectMessage(data.message);
    await chargeConfigurationPage.setAmount(data.amount);
    await chargeConfigurationPage.selectCurrency(data.currency);
    await chargeConfigurationPage.setDescription(data.description);

    await chargeConfigurationPage.submitForApproval();

    await expect(chargeConfigurationPage.statusBadge()).toHaveText(/pending approval/i);
  });

  test('TC_CB_004 - Mandatory field validation @testcase @P1 @Regression @CBCompliance @ChargeManagement', async ({
    chargeConfigurationPage,
  }) => {
    await chargeConfigurationPage.selectCategory(data.rail);
    await chargeConfigurationPage.openNewCharge();

    await chargeConfigurationPage.submitForApproval();

    await expect(chargeConfigurationPage.fieldValidationMessage('Message')).toBeVisible();
    await expect(chargeConfigurationPage.fieldValidationMessage('Amount')).toBeVisible();
    await expect(chargeConfigurationPage.fieldValidationMessage('Currency')).toBeVisible();
  });

  test('TC_CB_005 - Amount does not accept negative values (BR-014) @testcase @P1 @Regression @CBCompliance @ChargeManagement', async ({
    chargeConfigurationPage,
  }) => {
    await chargeConfigurationPage.selectCategory(data.rail);
    await chargeConfigurationPage.openNewCharge();
    await chargeConfigurationPage.selectMessage(data.message);
    await chargeConfigurationPage.setAmount(data.negativeAmount);
    await chargeConfigurationPage.selectCurrency(data.currency);
    await chargeConfigurationPage.setDescription(data.description);

    await chargeConfigurationPage.submitForApproval();

    await expect(chargeConfigurationPage.fieldValidationMessage('Amount')).toBeVisible();
  });

  test('TC_CB_006 - Zero amount is accepted (BR-014) @testcase @P1 @Regression @CBCompliance @ChargeManagement', async ({
    chargeConfigurationPage,
  }) => {
    await chargeConfigurationPage.selectCategory(data.rail);
    await chargeConfigurationPage.openNewCharge();
    await chargeConfigurationPage.selectMessage(data.message);
    await chargeConfigurationPage.setAmount(data.zeroAmount);
    await chargeConfigurationPage.selectCurrency(data.currency);
    await chargeConfigurationPage.setDescription(data.description);

    await chargeConfigurationPage.submitForApproval();

    await expect(chargeConfigurationPage.fieldValidationMessage('Amount')).toBeHidden();
  });

  test('TC_CB_007 - Save as Draft @testcase @P1 @Regression @CBCompliance @ChargeManagement', async ({
    chargeConfigurationPage,
  }) => {
    await chargeConfigurationPage.selectCategory(data.rail);
    await chargeConfigurationPage.openNewCharge();
    await chargeConfigurationPage.selectMessage(data.message);
    await chargeConfigurationPage.setAmount(data.amount);
    await chargeConfigurationPage.selectCurrency(data.currency);
    await chargeConfigurationPage.setDescription(data.description);

    await chargeConfigurationPage.saveAsDraft();

    await expect(chargeConfigurationPage.statusBadge()).toHaveText(/draft/i);
  });

  test.fixme(
    'TC_CB_008 - Draft charge is excluded from charge simulation (BR-013) @testcase @P1 @Regression @CBCompliance @ChargeManagement',
    async () => {
      // No "Charge Simulation" module has been observed anywhere in this app's navigation
      // (the sidebar only exposes New Payment, Charge Management, Corporate Management,
      // Routing Rules, Exception Management, Reports, Ask a Question) — needs the real
      // nav path/locators before this can be scripted.
    }
  );

  test('TC_CB_009 - Activate an inactive CB Compliance Charge @testcase @P1 @Regression @CBCompliance @ChargeManagement', async ({
    chargeConfigurationPage,
  }) => {
    await chargeConfigurationPage.activateCharge();

    await expect(chargeConfigurationPage.statusBadge()).toHaveText(/active/i);
  });

  test('TC_CB_010 - Deactivate an active CB Compliance Charge @testcase @P1 @Regression @CBCompliance @ChargeManagement', async ({
    chargeConfigurationPage,
  }) => {
    await chargeConfigurationPage.deactivateCharge();

    await expect(chargeConfigurationPage.statusBadge()).toHaveText(/inactive/i);
  });
});
