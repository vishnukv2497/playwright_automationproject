import { test, expect } from '../../../fixtures/roles.fixture';
import { blockWrites } from '../../../utils/network.util';
import { rolesData as data, uniqueRoleCode } from '../../../testdata/roles.data';

/** Roles FSD §5.3 — View & Modify (TC_ROLE_017, 018, 022, 023, 025). */
test.describe('Roles - View & Modify', () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ rolesPage }) => {
    await rolesPage.goto();
  });

  test('TC_ROLE_017 View & Modify panel loads the selected role\'s own data (not a shared/static record) @roles @modify @critical @regression', async ({ rolesPage }) => {
    const roles = [data.seeded.withUsers, data.seeded.plain];
    const seen: string[] = [];

    for (const role of roles) {
      await test.step(role.code, async () => {
        const gridStatus = (await rolesPage.cell(role.code, 'Status').textContent())!.trim();
        await rolesPage.openAction(role.code, 'View');
        const detail = rolesPage.detail(role.code);

        await expect(detail.overviewValue('Role Name')).toHaveText(role.code);
        await expect(detail.overviewValue('Description')).toHaveText(role.description);
        await expect(detail.overviewValue('Base Role')).toHaveText(role.baseRole);
        await expect(detail.overviewValue('Status')).toHaveText(gridStatus);
        await expect(detail.overviewValue('Created')).toHaveText(/\w{3} \d{1,2}, \d{4}, \d{2}:\d{2} (AM|PM)/);
        seen.push((await detail.overviewValue('Description').textContent())!.trim());
        await detail.close();
      });
    }
    expect(new Set(seen).size, 'both roles rendered the same record').toBe(roles.length);
  });

  test('TC_ROLE_018 Role Code, Created By, Created On and Last Modified are read-only @roles @modify @critical', async ({ page, rolesPage }) => {
    await blockWrites(page);
    const code = data.seeded.plain.code;

    await test.step('Overview shows identity and audit fields as plain text', async () => {
      await rolesPage.openAction(code, 'View');
      const detail = rolesPage.detail(code);
      await expect(detail.overviewValue('Created')).toBeVisible();
      await expect(detail.overviewValue('Last Modified')).toBeVisible();
      await expect(detail.panel.getByRole('textbox')).toHaveCount(0);
      await detail.close();
    });

    await test.step('Modify drawer: Role Code locked, Description and Base Role editable', async () => {
      await rolesPage.openAction(code, 'Edit');
      await expect(rolesPage.form.roleName).toHaveValue(code);
      await expect(rolesPage.form.roleName).toBeDisabled();
      await expect(rolesPage.form.description).toBeEditable();
      await expect(rolesPage.form.baseRole).toBeEnabled();
      // FSD §5.3 lists Status (Active / Disabled) as editable here; this build has no Status control.
      await expect.soft(rolesPage.form.status, 'FSD: Status is editable on View & Modify').toBeVisible({ timeout: 2_000 });
      await rolesPage.form.cancel();
    });
  });

  test('TC_ROLE_022 Blank Modification Comments blocks Save on View & Modify @roles @modify @high @negative', async ({ page, rolesPage }) => {
    const { attempted } = await blockWrites(page);
    const code = data.seeded.plain.code;

    await rolesPage.openAction(code, 'Edit');
    await rolesPage.form.description.fill(`${data.seeded.plain.description} - edited`);
    await rolesPage.form.submit();

    await expect(rolesPage.form.error(data.messages.remarksRequired)).toBeVisible();
    await expect(rolesPage.form.dialog).toBeVisible();
    expect(attempted, 'a Modify Role without comments reached the server').toEqual([]);
    await rolesPage.form.cancel();
  });

  test('TC_ROLE_023 Change Base Role - grid reflects the new Base Role @roles @modify @high', async ({ rolesPage, trackRole }) => {
    test.skip(
      !(await rolesPage.isMakerOnly()),
      'Needs an Active role this test owns: under Maker-Checker that takes a second (Checker) user to approve its creation',
    );
    const code = trackRole(uniqueRoleCode('AUTO-BR'));
    await rolesPage.createRole({ code, baseRole: 'BusinessMaker', remarks: data.remarks });

    await rolesPage.openAction(code, 'Edit');
    await rolesPage.form.fill({ baseRole: 'Auditor', remarks: 'Base role change' });
    await rolesPage.form.submit();
    await rolesPage.resultDrawer.waitFor();
    await rolesPage.closeResult();

    await expect(rolesPage.cell(code, 'Base Role')).toHaveText('Auditor');
    await expect(rolesPage.cell(code, 'Last Action')).toHaveText('Modify Role');
    // Which screens the new Base Role offers in Screen Mapping needs Screens-master data
    // (FSD Gaps #4) — not asserted.
  });

  test('TC_ROLE_025 Cancel on View & Modify discards changes @roles @modify @high', async ({ page, rolesPage }) => {
    const { attempted } = await blockWrites(page);
    const role = data.seeded.plain;

    await rolesPage.openAction(role.code, 'Edit');
    await rolesPage.form.description.fill('Discard me');
    await rolesPage.form.baseRole.selectOption('General');
    await rolesPage.form.cancel();

    await rolesPage.openAction(role.code, 'Edit');
    await expect(rolesPage.form.description).toHaveValue(role.description);
    await expect(rolesPage.form.baseRole).toHaveValue(role.baseRole);
    await rolesPage.form.cancel();
    expect(attempted).toEqual([]);
  });
});
