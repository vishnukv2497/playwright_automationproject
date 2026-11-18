import { test, expect } from '../../../fixtures/roles.fixture';
import { getRolesEnvConfig } from '../../../utils/env.util';
import { rolesData as data, uniqueRoleCode } from '../../../testdata/roles.data';

/** Roles FSD §3, §8, BR-ROLES-013 — Maker-Checker workflow rules (TC_ROLE_059, 064, 065). */
test.describe('Roles - Workflow & Business Rules', () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ rolesPage }) => {
    await rolesPage.goto();
  });

  test('TC_ROLE_059 Maker cannot approve own create/modify/delete submission @roles @workflow @critical @negative @security', async ({ rolesPage, approvalQueuePage }) => {
    const me = getRolesEnvConfig().adminUsername;
    const mine = await rolesPage.rolesAwaitingChecker(me);
    test.skip(mine.length === 0, `No role currently has a change submitted by ${me} awaiting a Checker`);

    await approvalQueuePage.goto();
    await approvalQueuePage.openTab('Role');
    for (const code of mine) {
      // Own request is either not offered at all, or offered without an enabled Approve.
      const approve = approvalQueuePage.rowsFor(code).getByRole('button', { name: /approve/i });
      for (const button of await approve.all()) {
        await expect(button, `${me} can approve own request on ${code}`).toBeDisabled();
      }
    }
  });

  test('TC_ROLE_064 Screen Mapping not allowed while New Role request is pending @roles @workflow @critical @negative', async ({ rolesPage, trackRole }) => {
    test.skip(await rolesPage.isMakerOnly(), 'Maker-only: a new role is never pending');
    const code = trackRole(uniqueRoleCode('AUTO-PND'));
    await rolesPage.createRole({ code, baseRole: 'General', remarks: data.remarks });
    await expect(rolesPage.cell(code, 'Status')).toHaveText('Pending');

    const rowAction = rolesPage.rowAction(code, 'Screen Mapping');
    if (await rowAction.isEnabled()) {
      await rowAction.click();
      const detail = rolesPage.detail(code);
      await expect(detail.mappingRows.first()).toBeVisible();
      for (const modify of await detail.mappingRows.getByRole('button', { name: 'Modify mapping' }).all()) {
        await expect(modify, 'mapping offered while New Role is pending').toBeDisabled();
      }
    }
  });

  test('TC_ROLE_065 Modify Role and Screen Mapping cannot be initiated simultaneously @roles @workflow @critical @negative', async ({ rolesPage, trackRole }) => {
    test.skip(await rolesPage.isMakerOnly(), 'Maker-only: nothing stays pending, so nothing can overlap');
    const code = trackRole(uniqueRoleCode('AUTO-ONE'));
    await rolesPage.createRole({ code, baseRole: 'General', remarks: data.remarks });

    for (const action of ['Edit', 'Delete'] as const) {
      await expect(rolesPage.rowAction(code, action), `${action} offered while a request is pending`).toBeDisabled();
      await expect(rolesPage.rowAction(code, action)).toHaveAttribute('title', data.messages.oneChangeAtATime);
    }
  });
});
