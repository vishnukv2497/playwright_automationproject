import { test as base } from '@playwright/test';
import { LoginPage } from '../Pages/LoginPage';
import { DashboardPage } from '../Pages/DashboardPage';
import { DomesticPaymentsPage } from '../Pages/DomesticPaymentsPage';
import { WpsSalaryPaymentPage } from '../Pages/WpsSalaryPaymentPage';
import { ChargeConfigurationPage } from '../Pages/ChargeConfigurationPage';
import { ChargeConfigurationLandingPage } from '../Pages/ChargeConfigurationLandingPage';
import { ConfiguredChargesGridPage } from '../Pages/ConfiguredChargesGridPage';
import { TransactionChargeModal } from '../Pages/TransactionChargeModal';
import { CbComplianceChargeModal } from '../Pages/CbComplianceChargeModal';
import { BrowseRulesModal } from '../Pages/BrowseRulesModal';
import { BrowseCorporateModal } from '../Pages/BrowseCorporateModal';
import { RolesPage } from '../Pages/RolesPage';
import { ApprovalQueuePage } from '../Pages/ApprovalQueuePage';
import { RolesListPage } from '../Pages/roleconfig/RolesListPage';
import { UserRolePicker } from '../Pages/roleconfig/UserRolePicker';

/**
 * Base fixture: wires up one Page Object instance per screen, scoped to the test's `page`.
 * Add a new fixture entry here every time a new Page Object is created, and every
 * spec picks up the new fixture automatically by importing `test` from this file.
 */
type PageFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  domesticPaymentsPage: DomesticPaymentsPage;
  wpsSalaryPaymentPage: WpsSalaryPaymentPage;
  chargeConfigurationPage: ChargeConfigurationPage;
  chargeLandingPage: ChargeConfigurationLandingPage;
  chargesGrid: ConfiguredChargesGridPage;
  transactionChargeModal: TransactionChargeModal;
  cbComplianceModal: CbComplianceChargeModal;
  browseRulesModal: BrowseRulesModal;
  browseCorporateModal: BrowseCorporateModal;
  rolesPage: RolesPage;
  approvalQueuePage: ApprovalQueuePage;
  rolesListPage: RolesListPage;
  userRolePicker: UserRolePicker;
};

export const test = base.extend<PageFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  domesticPaymentsPage: async ({ page }, use) => {
    await use(new DomesticPaymentsPage(page));
  },
  wpsSalaryPaymentPage: async ({ page }, use) => {
    await use(new WpsSalaryPaymentPage(page));
  },
  chargeConfigurationPage: async ({ page }, use) => {
    await use(new ChargeConfigurationPage(page));
  },
  chargeLandingPage: async ({ page }, use) => {
    await use(new ChargeConfigurationLandingPage(page));
  },
  chargesGrid: async ({ page }, use) => {
    await use(new ConfiguredChargesGridPage(page));
  },
  transactionChargeModal: async ({ page }, use) => {
    await use(new TransactionChargeModal(page));
  },
  cbComplianceModal: async ({ page }, use) => {
    await use(new CbComplianceChargeModal(page));
  },
  browseRulesModal: async ({ page }, use) => {
    await use(new BrowseRulesModal(page));
  },
  browseCorporateModal: async ({ page }, use) => {
    await use(new BrowseCorporateModal(page));
  },
  rolesPage: async ({ page }, use) => {
    await use(new RolesPage(page));
  },
  approvalQueuePage: async ({ page }, use) => {
    await use(new ApprovalQueuePage(page));
  },
  rolesListPage: async ({ page }, use) => {
    await use(new RolesListPage(page));
  },
  userRolePicker: async ({ page }, use) => {
    await use(new UserRolePicker(page));
  },
});

export { expect } from '@playwright/test';
