import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Charge Configuration landing page (/config/charges) — the category cards.
 * Selecting a category expands the Configured Charges grid inline below the cards
 * (see ConfiguredChargesGridPage); it does not navigate to a separate route.
 */
export type ChargeCategory =
  | 'Transaction Charge'
  | 'CB Compliance Charges'
  | 'Charge Treatment'
  | 'Additional Charge on Corporate';

/** Payment rails offered as cards once a category is open. */
export type ChargeRail = 'NPSS / IPP' | 'IPI' | 'FTS / UAEFTS' | 'WPS' | 'SWIFT';

export class ChargeConfigurationLandingPage extends BasePage {
  readonly heading: Locator;
  readonly chargeManagementNav: Locator;
  readonly chargeConfigurationNavLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Charge Configuration', level: 1 });
    this.chargeManagementNav = page.getByRole('button', { name: 'Charge Management' });
    this.chargeConfigurationNavLink = page.getByRole('link', { name: 'Charge Configuration' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/config/charges');
    await this.heading.waitFor();
  }

  /** Navigates via the sidebar rather than by URL, for tests that assert menu access. */
  async gotoViaMenu(): Promise<void> {
    await this.chargeManagementNav.waitFor();

    // The section may already be expanded — clicking it then would collapse it and
    // hide the link. Drive off the link's own visibility rather than aria-expanded,
    // which the sidebar sets before the submenu has finished rendering, and wait for
    // the link after expanding so the click below is never a race.
    if (!(await this.chargeConfigurationNavLink.isVisible())) {
      await this.chargeManagementNav.click();
      await this.chargeConfigurationNavLink.waitFor();
    }

    await this.chargeConfigurationNavLink.click();
    await this.heading.waitFor();
  }

  /**
   * Category cards expose their accessible name as "View → <name> <description>",
   * so a substring match on the category name is the stable form.
   */
  categoryCard(category: ChargeCategory): Locator {
    return this.page.getByRole('button', { name: `View → ${category}` });
  }

  async openCategory(category: ChargeCategory): Promise<void> {
    await this.categoryCard(category).click();
  }

  /**
   * Rail cards rendered under an open category, e.g. "WPS Wage Protection".
   *
   * Their accessible name is "<rail> <description>", and the grid below repeats the bare
   * rail label on every row's Rail badge button — so this anchors the match at the start
   * of the name and takes the first hit, which is always the card (cards render above
   * the grid). Same reasoning as ConfiguredChargesGridPage.railFilter().
   */
  railCard(rail: ChargeRail): Locator {
    return this.page.getByRole('button', { name: new RegExp(`^${rail}\\b`) }).first();
  }

  /**
   * Opens a rail under the current category.
   *
   * Under CB Compliance Charges this goes straight into the "New CB Compliance Charge"
   * drawer with the rail preselected — there is no separate "New Charge" click.
   */
  async openRailCard(rail: ChargeRail): Promise<void> {
    await this.railCard(rail).click();
  }
}
