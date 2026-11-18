import { test, expect } from '../../../fixtures/roles.fixture';
import { blockWrites } from '../../../utils/network.util';
import { rolesData as data, uniqueRoleCode, roleCodeOfLength } from '../../../testdata/roles.data';

/**
 * Roles FSD §5.1 — New Role field validation (TC_ROLE_004–009).
 *
 * Negative cases run with IAM writes blocked: "save is blocked" is asserted as "no write
 * request ever left the browser", and a missing validation can never create a record.
 */
test.describe('Roles - New Role validation', () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ rolesPage }) => {
    await rolesPage.goto();
  });

  test('TC_ROLE_004 Save with all mandatory fields blank shows field-level validation and blocks save @roles @create @high @negative', async ({ page, rolesPage }) => {
    const { attempted } = await blockWrites(page);

    await rolesPage.newRoleButton.click();
    await rolesPage.form.submit();

    await expect(rolesPage.form.error(data.messages.codeRequired)).toBeVisible();
    await expect(rolesPage.form.error(data.messages.baseRoleRequired)).toBeVisible();
    await expect(rolesPage.form.error(data.messages.remarksRequired)).toBeVisible();
    await expect(rolesPage.form.dialog).toBeVisible();
    expect(attempted, 'a blank New Role form reached the server').toEqual([]);

    // FSD §5.1: Role Description is mandatory. This build labels it "Optional".
    await expect.soft(rolesPage.form.error(data.messages.fsdDescriptionRequired), 'FSD: Role Description is required').toBeVisible({ timeout: 2_000 });
  });

  test('TC_ROLE_005 Remarks blank blocks role creation even when other fields are valid @roles @create @high @negative', async ({ page, rolesPage }) => {
    const { attempted } = await blockWrites(page);
    const code = uniqueRoleCode('AUTO-NRM');

    await rolesPage.newRoleButton.click();
    await rolesPage.form.fill({ code, description: 'No remarks', baseRole: 'General' });
    await rolesPage.form.submit();

    await expect(rolesPage.form.error(data.messages.remarksRequired)).toBeVisible();
    await expect(rolesPage.form.dialog).toBeVisible();
    expect(attempted, 'a New Role without remarks reached the server').toEqual([]);

    // FSD §5.1: focus moves to Remarks and its border turns red.
    await expect.soft(rolesPage.form.remarks, 'FSD: focus shifts to Remarks').toBeFocused({ timeout: 2_000 });
  });

  test('TC_ROLE_006 Role Code with spaces / special characters is rejected (data-driven) @roles @create @high @negative @datadriven', async ({ page, rolesPage }) => {
    const { attempted } = await blockWrites(page);
    await rolesPage.newRoleButton.click();

    // The build sanitises as you type (FSD expects a message on save) — either way, a
    // character other than A-Z, 0-9 or '-' must never survive into the Role Code.
    for (const { typed, expected } of data.invalidCodes) {
      await test.step(`"${typed}"`, async () => {
        await rolesPage.form.roleCode.fill(typed);
        await expect(rolesPage.form.roleCode).toHaveValue(expected);
        await expect(rolesPage.form.roleCode).toHaveValue(/^[A-Za-z0-9-]*$/);
      });
    }
    expect(attempted).toEqual([]);
  });

  test('TC_ROLE_007 Role Code boundary - 20 characters with hyphen is accepted @roles @create @high @boundary', async ({ rolesPage, trackRole }) => {
    const code = trackRole(roleCodeOfLength(data.fsdMaxCodeLength));
    expect(code).toHaveLength(20);
    expect(code).toContain('-');

    await rolesPage.createRole({ code, baseRole: 'General', remarks: data.remarks });

    await expect(rolesPage.roleRow(code).getByRole('button', { name: code, exact: true })).toBeVisible();
  });

  test('TC_ROLE_008 Role Code boundary - 21 characters is rejected @roles @create @high @negative @boundary', async ({ page, rolesPage }) => {
    const { attempted } = await blockWrites(page);
    const code = roleCodeOfLength(data.fsdMaxCodeLength + 1);

    await rolesPage.newRoleButton.click();
    await rolesPage.form.fill({ code, baseRole: 'General', remarks: data.remarks });

    // Either the input stops at 20 characters, or save shows the FSD message — and in both
    // cases nothing is sent. This build's input allows 100 (maxlength="100").
    const kept = await rolesPage.form.roleCode.inputValue();
    if (kept.length > data.fsdMaxCodeLength) {
      await rolesPage.form.submit();
      await expect(rolesPage.form.error(data.messages.fsdCodeTooLong), `input kept all ${kept.length} characters`).toBeVisible({ timeout: 5_000 });
    }
    expect(attempted, 'a 21-character Role Code reached the server').toEqual([]);
  });

  test('TC_ROLE_009 Role Description boundary - 101 characters blocked @roles @create @high @negative @boundary', async ({ page, rolesPage }) => {
    const { attempted } = await blockWrites(page);
    const description = 'D'.repeat(data.fsdMaxDescriptionLength + 1);

    await rolesPage.newRoleButton.click();
    await rolesPage.form.fill({ code: uniqueRoleCode('AUTO-D101'), description, baseRole: 'General', remarks: data.remarks });

    // FSD defines no message (FSD Gaps #2): accept "input restricted" or "save blocked".
    const kept = await rolesPage.form.description.inputValue();
    if (kept.length > data.fsdMaxDescriptionLength) {
      await rolesPage.form.submit();
      await expect(rolesPage.form.dialog).toBeVisible();
    }
    expect(attempted, `a ${kept.length}-character description reached the server (input maxlength is 500)`).toEqual([]);
  });

  test('TC_ROLE_009 Role Description boundary - 100 characters accepted @roles @create @high @boundary', async ({ rolesPage, trackRole }) => {
    const code = trackRole(uniqueRoleCode('AUTO-D100'));
    const description = 'D'.repeat(data.fsdMaxDescriptionLength);

    await rolesPage.createRole({ code, description, baseRole: 'General', remarks: data.remarks });

    await expect(rolesPage.roleRow(code)).toContainText(description);
  });
});
