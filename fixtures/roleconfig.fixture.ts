import { Page, expect } from '@playwright/test';
import { test as base } from './pages.fixture';
import { ApprovalQueuePage } from '../Pages/ApprovalQueuePage';
import { RolesListPage } from '../Pages/roleconfig/RolesListPage';
import { RoleConfigApi, RoleFactory } from '../utils/roleconfig-api.util';
import { ROLECONFIG_AUTH } from '../utils/roleconfig-auth.util';
import { ColourFamily, colourOf } from '../utils/colour.util';

/** The Admin Checker, signed in from its saved session in its own browser context. */
export type CheckerSession = { page: Page; approvalQueue: ApprovalQueuePage; rolesList: RolesListPage };

/**
 * Role Configuration specs (tests/ui/roleconfig, project "roleconfig"). The project's storageState signs
 * the test's `page` in as the Admin Maker. On top of the page objects this adds:
 *  - `api`     setup/teardown calls as maker and checker (never the behaviour under test),
 *  - `roles`   creates the roles a test needs and removes them all afterwards,
 *  - `checker` a separate browser context signed in as the Admin Checker.
 */
export const test = base.extend<{
  keepSessionActive: void;
  api: RoleConfigApi;
  roles: RoleFactory;
  checker: CheckerSession;
}>({
  // The saved session carries the sign-in time as "last activity"; refresh it so a long run is not
  // signed out by the app's idle check part-way through.
  keepSessionActive: [
    async ({ context }, use) => {
      await context.addInitScript(() => localStorage.setItem('ph_last_activity', String(Date.now())));
      await use();
    },
    { auto: true },
  ],

  api: async ({ playwright, baseURL }, use) => {
    const api = await RoleConfigApi.create(playwright.request, baseURL!);
    await use(api);
    await api.dispose();
  },

  roles: async ({ api }, use, testInfo) => {
    const factory = new RoleFactory(api);
    await use(factory);
    await factory.cleanup(testInfo);
  },

  checker: async ({ browser, baseURL }, use) => {
    const context = await browser.newContext({ baseURL, storageState: ROLECONFIG_AUTH.checker });
    await context.addInitScript(() => localStorage.setItem('ph_last_activity', String(Date.now())));
    const page = await context.newPage();
    await use({ page, approvalQueue: new ApprovalQueuePage(page), rolesList: new RolesListPage(page) });
    await context.close();
  },
});

export { expect };

/** Traceability: FSD section and business rule(s) shown in the report next to the test. */
export function traceTo(fsd: string, ...rules: string[]): void {
  test.info().annotations.push({ type: 'FSD', description: fsd });
  for (const rule of rules) test.info().annotations.push({ type: 'BR', description: rule });
}

/** Records an expected result this automation could not check, and why — so a pass is never read as full coverage. */
export function notVerified(expectedResult: string, reason: string): void {
  test.info().annotations.push({ type: 'not-verified', description: `${expectedResult} — ${reason}` });
}

/** Web-first check of an element's colour family (FSD names colours, not shades). */
export async function expectColour(
  locator: Parameters<typeof colourOf>[0],
  family: ColourFamily | readonly ColourFamily[],
  message: string,
  options: { property?: string; soft?: boolean } = {},
): Promise<void> {
  const families: readonly ColourFamily[] = typeof family === 'string' ? [family] : family;
  const check = options.soft ? expect.soft : expect;
  await check
    .poll(() => colourOf(locator, options.property ?? 'color'), { message, timeout: 10_000 })
    .toMatch(new RegExp(`^(${families.join('|')})$`));
}
