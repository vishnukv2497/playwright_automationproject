import { test, expect } from '../../../fixtures/roles.fixture';
import { getRolesEnvConfig } from '../../../utils/env.util';
import { blockWrites } from '../../../utils/network.util';
import { rolesData as data, uniqueRoleCode } from '../../../testdata/roles.data';

/**
 * Roles FSD §5.1 — New Role (TC_ROLE_001–003, 010–013).
 *
 * The dev host runs every Roles action under Maker-Checker; Maker-only cases skip
 * themselves there (and vice versa), so the same spec runs on either configuration.
 */
test.describe('Roles - New Role', () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ rolesPage }) => {
    await rolesPage.goto();
  });

  test('TC_ROLE_001 Create a new role with all valid mandatory fields under Maker-Checker workflow @roles @create @critical @mc @smoke', async ({ rolesPage, trackRole }) => {
    test.skip(await rolesPage.isMakerOnly(), 'Deployment applies New Role without a Checker (Maker-only)');
    const code = trackRole(uniqueRoleCode('AUTO-RL'));

    await test.step('Panel shows the proposal note', async () => {
      await rolesPage.newRoleButton.click();
      await expect(rolesPage.form.dialog).toBeVisible();
      await expect(rolesPage.form.dialog.getByText(/grants nothing until a Checker approves/)).toBeVisible();
      await rolesPage.form.cancel();
    });

    await rolesPage.createRole({ code, description: 'Auto Payments Maker', baseRole: 'BusinessMaker', remarks: data.remarks });

    await expect(rolesPage.roleRow(code)).toContainText('Auto Payments Maker');
    await expect(rolesPage.cell(code, 'Base Role')).toHaveText('BusinessMaker');
    await expect(rolesPage.cell(code, 'Status')).toHaveText('Pending');
    await expect(rolesPage.cell(code, 'Last Action')).toHaveText('New Role');
    await expect(rolesPage.cell(code, 'Created By')).toHaveText(getRolesEnvConfig().adminUsername);
    await expect(rolesPage.cell(code, 'Created')).toHaveText(data.gridDate);
    // "Not available for user assignment" (§8 #1) lives in the User module — not asserted here.
  });

  test('TC_ROLE_002 Create a new role under Maker-only workflow @roles @create @critical @makeronly', async ({ rolesPage, trackRole }) => {
    test.skip(!(await rolesPage.isMakerOnly()), 'Deployment routes New Role to a Checker (Maker-Checker)');
    const code = trackRole(uniqueRoleCode('AUTO-MO'));

    await rolesPage.createRole({ code, baseRole: 'BusinessChecker', remarks: 'Maker-only create' });

    await expect(rolesPage.cell(code, 'Status')).toHaveText('Active');
    await expect(rolesPage.cell(code, 'Last Action')).toHaveText('New Role');
  });

  test('TC_ROLE_003 Duplicate Role Code is rejected on save @roles @create @critical @negative', async ({ rolesPage }) => {
    const existing = data.seeded.withUsers.code;
    const before = await rolesPage.dataRows.count();

    await rolesPage.newRoleButton.click();
    await rolesPage.form.fill({ code: existing, description: 'Duplicate test', baseRole: 'Auditor', remarks: 'dup check' });
    await rolesPage.form.submit();

    await expect(rolesPage.form.error(data.messages.duplicate)).toBeVisible({ timeout: 30_000 });
    await expect(rolesPage.form.dialog).toBeVisible();
    await rolesPage.form.cancel();
    await expect(rolesPage.dataRows).toHaveCount(before);
  });

  test('TC_ROLE_010 Duplicate from Role pre-fills fields and blocks save if Role Code is unchanged @roles @create @high @duplicate', async ({ rolesPage }) => {
    const source = data.seeded.withUsers;

    await rolesPage.newRoleButton.click();
    await rolesPage.form.duplicateFrom.selectOption(source.code);

    await expect(rolesPage.form.description).toHaveValue(source.description);
    await expect(rolesPage.form.baseRole).toHaveValue(source.baseRole);
    // FSD §5.1 field 1 also pre-fills the Role Code; this build leaves it empty.
    expect.soft(await rolesPage.form.roleCode.inputValue(), 'FSD: Duplicate from Role pre-fills Role Code').toBe(source.code);

    // Save with the source's code: must be stopped by the uniqueness check.
    await rolesPage.form.fill({ code: source.code, remarks: 'dup from source' });
    await rolesPage.form.submit();
    await expect(rolesPage.form.error(data.messages.duplicate)).toBeVisible({ timeout: 30_000 });
    await expect(rolesPage.form.dialog).toBeVisible();
  });

  test('TC_ROLE_011 Duplicate from Role with a new Role Code creates role with source Base Role @roles @create @high @duplicate', async ({ rolesPage, trackRole }) => {
    const source = data.seeded.plain;
    const makerOnly = await rolesPage.isMakerOnly();
    const code = trackRole(uniqueRoleCode('AUTO-CPY'));

    // Description and Base Role come only from the duplicate source — not typed.
    await rolesPage.createRole({ code, duplicateFrom: source.code, remarks: data.remarks });

    await expect(rolesPage.roleRow(code)).toContainText(source.description);
    await expect(rolesPage.cell(code, 'Base Role')).toHaveText(source.baseRole);
    await expect(rolesPage.cell(code, 'Status')).toHaveText(makerOnly ? 'Active' : 'Pending');
    await expect(rolesPage.cell(code, 'Last Action')).toHaveText('New Role');
  });

  test('TC_ROLE_012 Base Role dropdown lists values configured in backend @roles @create @high', async ({ rolesPage }) => {
    await rolesPage.newRoleButton.click();

    expect(await rolesPage.form.baseRoleOptions()).toEqual(data.baseRoles);
    // A native <select> without `multiple` — exactly one value can be chosen.
    await expect(rolesPage.form.baseRole).not.toHaveAttribute('multiple');
  });

  test('TC_ROLE_013 Cancel on New Role panel does not create any record @roles @create @high', async ({ page, rolesPage }) => {
    const { attempted } = await blockWrites(page);
    const code = uniqueRoleCode('AUTO-CXL');

    await rolesPage.newRoleButton.click();
    await rolesPage.form.fill({ code, description: 'Cancelled', baseRole: 'General', remarks: data.remarks });
    await rolesPage.form.cancel();

    await expect(rolesPage.form.dialog).toBeHidden();
    await expect(rolesPage.roleRow(code)).toHaveCount(0);
    expect(attempted).toEqual([]);
  });
});
