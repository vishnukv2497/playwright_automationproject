import { test, expect } from '../../../fixtures/roles.fixture';
import { blockWrites } from '../../../utils/network.util';
import { rolesData as data, uniqueRoleCode } from '../../../testdata/roles.data';

/** Roles FSD §5.7 — Delete Role (TC_ROLE_055–058). */
test.describe('Roles - Delete Role', () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ rolesPage }) => {
    await rolesPage.goto();
  });

  test('TC_ROLE_055 Delete blocked when users are assigned to the role @roles @delete @critical @negative', async ({ page, rolesPage }) => {
    // Writes blocked: if the confirmation does open, nothing can be submitted from it.
    await blockWrites(page);
    const code = data.seeded.withUsers.code;
    const users = Number((await rolesPage.cell(code, 'Users').textContent())!.trim());
    test.skip(users === 0, `${code} no longer has users assigned — pick another seeded role`);
    test.skip(await rolesPage.rowAction(code, 'Delete').isDisabled(), `${code} has a change awaiting a Checker`);

    await rolesPage.openAction(code, 'Delete');
    // Wait for whichever the click produced — the confirmation or an informational error.
    await expect(page.getByRole('dialog').or(page.getByRole('alert')).first()).toBeVisible();

    // BR-ROLES-004: an informational error instead of the confirmation. This build opens the
    // confirmation with a "N users currently hold <role>" warning and allows the proposal.
    await expect(rolesPage.deleteDrawer.dialog(code), `delete confirmation opened for a role held by ${users} user(s)`).toHaveCount(0);
  });

  test('TC_ROLE_056 Delete role under Maker-only workflow removes it immediately @roles @delete @high @makeronly', async ({ rolesPage, trackRole }) => {
    test.skip(!(await rolesPage.isMakerOnly()), 'Deployment routes Delete Role to a Checker (Maker-Checker)');
    const code = trackRole(uniqueRoleCode('AUTO-DEL'));
    await rolesPage.createRole({ code, baseRole: 'General', remarks: data.remarks });

    await rolesPage.openAction(code, 'Delete');
    await rolesPage.deleteDrawer.remarks(code).fill('No longer required');
    await rolesPage.deleteDrawer.submitButton(code).click();
    await rolesPage.resultDrawer.waitFor();
    await rolesPage.closeResult();

    await expect(rolesPage.roleRow(code)).toHaveCount(0);
  });

  test('TC_ROLE_057 Blank Reason/Remarks blocks delete @roles @delete @high @negative', async ({ page, rolesPage }) => {
    const { attempted } = await blockWrites(page);
    const code = data.seeded.plain.code;

    await rolesPage.openAction(code, 'Delete');
    await rolesPage.deleteDrawer.submitButton(code).click();

    await expect(rolesPage.deleteDrawer.dialog(code).getByText(data.messages.remarksRequired)).toBeVisible();
    await expect(rolesPage.deleteDrawer.dialog(code)).toBeVisible();
    expect(attempted, 'a delete without remarks reached the server').toEqual([]);
    await rolesPage.deleteDrawer.cancel(code);
  });

  test('TC_ROLE_058 Cancel on Delete confirmation performs no delete @roles @delete @high', async ({ page, rolesPage }) => {
    const { attempted } = await blockWrites(page);
    const code = data.seeded.plain.code;
    const status = (await rolesPage.cell(code, 'Status').textContent())!.trim();
    const lastAction = (await rolesPage.cell(code, 'Last Action').textContent())!.trim();

    await rolesPage.openAction(code, 'Delete');
    await rolesPage.deleteDrawer.remarks(code).fill('Will be cancelled');
    await rolesPage.deleteDrawer.cancel(code);

    await expect(rolesPage.deleteDrawer.dialog(code)).toBeHidden();
    await expect(rolesPage.cell(code, 'Status')).toHaveText(status);
    await expect(rolesPage.cell(code, 'Last Action')).toHaveText(lastAction);
    expect(attempted).toEqual([]);
  });
});
