import { test, expect } from '../../fixtures/auth.fixture';
import { chargeConfigurationTestData as data } from '../../testdata/charge-configuration.data';

test.describe('Charge Management - Charge Configuration', () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ dashboardPage, chargeConfigurationPage }) => {
    await dashboardPage.openChargeManagement();
    await chargeConfigurationPage.openChargeConfiguration();
    await chargeConfigurationPage.openTransactionChargePerView();
  });

  test('opens the charge grid for a category @charge-config', async ({ chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectCategory(data.category);

    await expect(chargeConfigurationPage.newChargeButton).toBeVisible();
  });

  test('browsing a template lists selectable charge rules @charge-config', async ({
    chargeConfigurationPage,
  }) => {
    await chargeConfigurationPage.selectCategory(data.category);
    await chargeConfigurationPage.openNewCharge();
    await chargeConfigurationPage.browseChargeTemplates();
    await chargeConfigurationPage.selectBrowseResultRow();

    await expect(chargeConfigurationPage.ruleRowCheckbox(data.difRuleName)).toBeVisible();
  });

  test('selecting a rule checks it before confirming @charge-config', async ({ chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectCategory(data.category);
    await chargeConfigurationPage.openNewCharge();
    await chargeConfigurationPage.browseChargeTemplates();
    await chargeConfigurationPage.selectBrowseResultRow();

    // Establish a known starting state — this shared demo backend can carry a
    // rule selection over from an earlier test run.
    await chargeConfigurationPage.deselectRule(data.difRuleName);
    await expect(chargeConfigurationPage.ruleRowCheckbox(data.difRuleName)).not.toBeChecked();

    await chargeConfigurationPage.selectRule(data.difRuleName);
    await expect(chargeConfigurationPage.ruleRowCheckbox(data.difRuleName)).toBeChecked();
  });

  test('creates a new WPS charge from a browsed template @smoke @charge-config', async ({
    chargeConfigurationPage,
  }) => {
    await chargeConfigurationPage.selectCategory(data.category);
    await chargeConfigurationPage.openNewCharge();
    await chargeConfigurationPage.browseChargeTemplates();
    await chargeConfigurationPage.selectBrowseResultRow();

    await chargeConfigurationPage.selectRule(data.difRuleName);
    await chargeConfigurationPage.confirmSelection();

    await chargeConfigurationPage.setChargeRateByFieldIndex(1, data.primaryChargeRate);
    await chargeConfigurationPage.setChargeRateInRow(data.chargeRateRowIndex, data.secondaryChargeRate);

    const dialogMessage = await chargeConfigurationPage.saveChanges('dismiss');
    expect(dialogMessage.length).toBeGreaterThan(0);
  });
});
