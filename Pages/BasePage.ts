import { Page, Locator } from '@playwright/test';

/**
 * Base class for every Page Object in the framework.
 * Add cross-cutting helpers here (toast handling, loading spinners,
 * generic table helpers, etc.) as the suite grows past this first module.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Width of a slide-in drawer. The `dialog` role sits on the full-screen overlay, so measure the overlay's
   * child that holds the drawer's heading instead.
   */
  async drawerWidth(dialog: Locator): Promise<number> {
    return dialog.getByRole('heading').first().evaluate((heading) => {
      let el: HTMLElement = heading as HTMLElement;
      while (el.parentElement && el.parentElement.getAttribute('role') !== 'dialog') el = el.parentElement;
      return el.getBoundingClientRect().width;
    });
  }
}
