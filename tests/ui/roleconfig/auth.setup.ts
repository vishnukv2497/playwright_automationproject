import { test as setup } from '../../../fixtures/pages.fixture';
import { getRoleConfigEnv } from '../../../utils/env.util';
import { ROLECONFIG_AUTH, RoleConfigUser } from '../../../utils/roleconfig-auth.util';

/**
 * Signs the Admin Maker and the Admin Checker in once per run and saves each session (the app keeps it in
 * localStorage), so specs start authenticated. Credentials come from MAKER_* / CHECKER_* only.
 */
for (const user of ['maker', 'checker'] as RoleConfigUser[]) {
  setup(`authenticate ${user}`, async ({ page, loginPage }) => {
    const { username, password } = getRoleConfigEnv()[user];
    await loginPage.goto();
    await loginPage.login(username, password);
    await page.context().storageState({ path: ROLECONFIG_AUTH[user] });
  });
}
