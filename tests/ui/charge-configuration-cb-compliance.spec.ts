import { test, expect } from '../../fixtures/auth.fixture';
import { cbComplianceChargeTestData as data } from '../../testdata/charge-configuration.data';

test.describe('Charge Management - CB Compliance Charges', () => {
  test.describe.configure({ timeout: 60_000 });

  test.beforeEach(async ({ dashboardPage, chargeConfigurationPage }) => {
    await dashboardPage.openChargeManagement();
    await chargeConfigurationPage.openChargeConfiguration();
    await chargeConfigurationPage.selectChargeView(data.view);
  });

  test('opens the CB Compliance charge grid for a category @charge-config', async ({
    chargeConfigurationPage,
  }) => {
    await chargeConfigurationPage.selectCategory(data.category);

    await expect(chargeConfigurationPage.newChargeButton).toBeVisible();
  });

  test('scoping a new charge to SIF uploads checks the SIF option @charge-config', async ({
    chargeConfigurationPage,
  }) => {
    await chargeConfigurationPage.selectCategory(data.category);
    await chargeConfigurationPage.openNewCharge();

    await expect(chargeConfigurationPage.sifFileScopeCheckbox).not.toBeChecked();
    await chargeConfigurationPage.enableSifFileScope();
    await expect(chargeConfigurationPage.sifFileScopeCheckbox).toBeChecked();
  });

  test('browsing rules lists a selectable DIF rule @charge-config', async ({ chargeConfigurationPage }) => {
    await chargeConfigurationPage.selectCategory(data.category);
    await chargeConfigurationPage.openNewCharge();
    await chargeConfigurationPage.enableSifFileScope();
    await chargeConfigurationPage.setChargeAmount(data.chargeAmount);

    await chargeConfigurationPage.browseChargeTemplates('Browse Rules');
    await chargeConfigurationPage.selectBrowseResultRow();

    await expect(chargeConfigurationPage.ruleRowCheckbox(data.difRuleName)).toBeVisible();
  });

  test('creates a new WPS CB Compliance charge from a browsed rule @smoke @charge-config', async ({
    chargeConfigurationPage,
  }) => {
    await chargeConfigurationPage.selectCategory(data.category);
    await chargeConfigurationPage.openNewCharge();
    await chargeConfigurationPage.enableSifFileScope();
    await chargeConfigurationPage.setChargeAmount(data.chargeAmount);

    await chargeConfigurationPage.browseChargeTemplates('Browse Rules');
    await chargeConfigurationPage.selectBrowseResultRow();

    await chargeConfigurationPage.selectRule(data.difRuleName);
    await chargeConfigurationPage.confirmSelection();

    const dialogMessage = await chargeConfigurationPage.saveChanges('dismiss', 'Save Configuration');
    expect(dialogMessage.length).toBeGreaterThan(0);
  });
});
