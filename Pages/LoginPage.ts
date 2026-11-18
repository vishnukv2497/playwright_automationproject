import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByRole('textbox', { name: 'Username' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.signInButton = page.getByRole('button', { name: 'Sign In', exact: true });
  }

  /** Requires `baseURL` to be set in playwright.config.ts */
  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.click();
    await this.usernameInput.fill(username);
    await this.passwordInput.click();
    await this.passwordInput.fill(password);
    await this.signInButton.click();

    // Sign-in is slow enough that returning here lets the next navigation race the
    // in-flight auth request and bounce back to /login. The operations sidebar only
    // renders once authenticated, so it is the signal that the session is established.
    await this.page
      .getByRole('navigation', { name: 'Operations navigation' })
      .waitFor({ state: 'visible', timeout: 60_000 });
  }
}
