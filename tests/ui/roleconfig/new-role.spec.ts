import { test, expect, traceTo, expectColour } from '../../../fixtures/roleconfig.fixture';
import { blockWrites } from '../../../utils/network.util';
import { getRoleConfigEnv } from '../../../utils/env.util';
import { uniqueRoleCode } from '../../../utils/roleconfig-api.util';
import { fsd, roleCodeCases } from '../../../testdata/roleconfig.data';

/**
 * Roles FSD v1.4 §5.1 — New Role Panel (manual cases TC-001 … TC-010).
 * Validation cases run with every IAM write aborted (blockWrites), which also proves the save was blocked in
 * the browser: no create request was ever sent.
 */
test.describe('Role Configuration - New Role panel', () => {
  test.beforeEach(async ({ rolesListPage }) => {
    await rolesListPage.goto();
  });

  test('TC-001 | Create a new role with all mandatory fields under Maker-Checker workflow @critical @smoke @mc @roleconfig @regression', async ({ page, rolesListPage: list, api, roles, userRolePicker }) => {
    traceTo('§5.1, §8 row 1', 'BR-ROLES-012');
    test.skip(await api.isMakerOnly('NewRole'), 'New Role applies without a Checker here (Maker-only) — covered by TC-002');
    const code = roles.newCode();
    const panel = list.newRole;

    await test.step('1-2. Click + New Role: Create Role panel slides in', async () => {
      await list.newRoleButton.click();
      await expect(panel.dialog).toBeVisible();
      await expect.soft(panel.title, 'FSD §5.1 panel title').toHaveText(fsd.newRole.title);
      await expect.soft(panel.subtitle, 'FSD §5.1 panel sub-title').toHaveText(fsd.newRole.subtitle);
      await expect.soft(panel.infoNote, 'FSD §5.1 info note').toHaveText(fsd.newRole.infoNote);
      await expect(panel.status, 'FSD §5.1: Status is system-set and not user-editable').toHaveCount(0);
    });

    await test.step('3-7. Enter Role Code, Description, Base Role, Remarks and click Save Role', async () => {
      await panel.fill({ code, description: 'Payment Maker Role', baseRole: 'Business Maker', remarks: 'New role required for payment origination' });
      await panel.save();
      await expect(panel.dialog, 'FSD §5.1: Save Role closes the panel').toBeHidden();
      await expect(list.notification(code), 'FSD §5.1: a success message is shown').toBeVisible();
    });

    await test.step('Role is listed with Status Pending (amber) and Last Action "New Role"', async () => {
      await list.findRole(code);
      await expect(list.cell(code, 'Status')).toHaveText('Pending');
      await expectColour(list.statusBadge(code), fsd.statuses.Pending, 'FSD §5.2.3: Pending badge is amber');
      await expect(list.cell(code, 'Last Action')).toHaveText(fsd.lastAction.newRole);
    });

    await test.step('Role is NOT available for assignment to a user', async () => {
      const writes = await blockWrites(page, '**/api/**');
      await userRolePicker.open();
      await expect(userRolePicker.roleOption(code)).toHaveCount(0);
      await userRolePicker.close();
      await writes.release();
    });
  });

  test('TC-002 | Create a new role under Maker-only workflow @critical @roleconfig @regression', async ({ rolesListPage: list, api, roles, userRolePicker }) => {
    traceTo('§5.1, §8 row 2');
    test.skip(!(await api.isMakerOnly('NewRole')), 'This environment routes New Role to a Checker (Maker-Checker); TC-002 needs Maker-only');
    const code = roles.newCode();

    await test.step('1-5. Create a role with valid data and Remarks', async () => {
      await list.newRoleButton.click();
      await list.newRole.fill({ code, description: 'Payment Maker Role - Direct', baseRole: 'Business Maker', remarks: 'Created under maker-only configuration' });
      await list.newRole.save();
      await expect(list.newRole.dialog).toBeHidden();
    });

    await test.step('Role is Active (green) with Last Action "New Role" and no Checker request', async () => {
      await list.findRole(code);
      await expect(list.cell(code, 'Status')).toHaveText('Active');
      await expectColour(list.statusBadge(code), fsd.statuses.Active, 'FSD §5.2.3: Active badge is green');
      await expect(list.cell(code, 'Last Action')).toHaveText(fsd.lastAction.newRole);
      expect((await api.role(code))?.pendingRequest, 'No Checker approval is requested').toBeNull();
    });

    await test.step('Role is not assignable until a screen is mapped', async () => {
      await userRolePicker.open();
      await expect(userRolePicker.roleOption(code)).toHaveCount(0);
      await userRolePicker.close();
    });
  });

  test('TC-003 | Duplicate Role Code is rejected on save @critical @smoke @negative @roleconfig @regression', async ({ page, rolesListPage: list, api }) => {
    traceTo('§5.1', 'BR-ROLES-001');
    const writes = await blockWrites(page, '**/api/**');
    // Uniqueness must hold across ALL roles, so reuse a code that is not on the visible page.
    const onPage = await list.codesOnPage();
    const existing = (await api.roles()).map((r) => r.roleName).filter((c) => /^[A-Za-z0-9-]{1,20}$/.test(c));
    const duplicate = existing.find((c) => !onPage.includes(c)) ?? existing[0];

    await test.step(`1-4. Enter existing Role Code "${duplicate}" with valid other fields and click Save Role`, async () => {
      await list.newRoleButton.click();
      await list.newRole.fill({ code: duplicate, description: 'Duplicate Check Role', baseRole: 'Business Maker', remarks: 'Duplicate negative test' });
      await list.newRole.save();
    });

    await test.step('Save is blocked with the duplicate message; no role is created', async () => {
      await expect(list.newRole.message(fsd.newRole.messages.codeDuplicate)).toBeVisible();
      await expect(list.newRole.dialog).toBeVisible();
      expect(writes.attempted, 'No create request reaches the server').toEqual([]);
    });
  });

  for (const c of roleCodeCases) {
    test(`TC-004 | Role Code that ${c.name} is rejected @high @negative @roleconfig @regression`, async ({ page, rolesListPage: list }) => {
      traceTo('§5.1 Validation Messages', 'BR-ROLES-001');
      const writes = await blockWrites(page, '**/api/**');

      await test.step(`Enter Role Code "${c.code}" and attempt to save`, async () => {
        await list.newRoleButton.click();
        await list.newRole.fill({ code: c.code, description: 'Format check', baseRole: 'Auditor', remarks: 'Format check' });
        await list.newRole.save();
      });

      await test.step(`"${c.message}" is shown and the save is blocked`, async () => {
        const typed = await list.newRole.roleCode.inputValue();
        // TC-004: for 21+ characters, truncating the input at 20 is an accepted alternative to the message.
        if (c.code.length > fsd.newRole.maxCodeLength && typed.length <= fsd.newRole.maxCodeLength) return;
        await expect(list.newRole.message(c.message)).toBeVisible();
        await expect(list.newRole.dialog).toBeVisible();
        expect(writes.attempted).toEqual([]);
      });
    });
  }

  test('TC-004 | Role Code with a hyphen is accepted @high @roleconfig @regression', async ({ rolesListPage: list, roles }) => {
    traceTo('§5.1 Validation Messages', 'BR-ROLES-001');
    const code = roles.track(uniqueRoleCode('HR-MK'));

    await list.newRoleButton.click();
    await list.newRole.fill({ code, description: 'Hyphen code check', baseRole: 'Auditor', remarks: 'Hyphen code check' });
    await list.newRole.save();

    await expect(list.newRole.dialog, 'Save proceeds for alphanumeric + hyphen').toBeHidden();
    await list.findRole(code);
    await expect(list.row(code)).toHaveCount(1);
  });

  test('TC-005 | Remarks is mandatory on role creation @critical @negative @roleconfig @regression', async ({ page, rolesListPage: list, roles }) => {
    traceTo('§5.1', 'BR-ROLES-005');
    const code = roles.newCode();
    const panel = list.newRole;
    const writes = await blockWrites(page, '**/api/**');
    await list.newRoleButton.click();
    await panel.fill({ code, description: 'Remarks Validation Role', baseRole: 'Auditor' });

    for (const [step, value] of [['1-2. Remarks left blank', ''], ['3. Remarks with spaces only', '   ']] as const) {
      await test.step(`${step}: save is blocked, border turns red, focus moves to Remarks`, async () => {
        await panel.remarks.fill(value);
        await panel.save();
        await expectColour(panel.remarks, 'red', 'FSD §5.1: Remarks border turns red', { property: 'border-top-color' });
        await expect(panel.remarks, 'FSD §5.1: focus shifts to Remarks').toBeFocused();
        await expect(panel.dialog).toBeVisible();
        expect(writes.attempted, 'No role is created').toEqual([]);
      });
    }
    await writes.release();

    await test.step('4. Valid Remarks: role is created', async () => {
      await panel.remarks.fill('Created for remarks validation');
      await panel.save();
      await expect(panel.dialog).toBeHidden();
    });

    await test.step('Remarks are stored as the Role Created audit entry', async () => {
      await list.findRole(code);
      await list.open(code, 'Audit Trail');
      const audit = list.audit(code);
      await audit.waitForLoad();
      const created = await audit.card((await audit.cards.count()) - 1).read();
      expect(created.badges).toContain('Role Created');
      expect(created.comments).toBe('Created for remarks validation');
    });
  });

  test('TC-006 | Duplicate from Role pre-fills values and still enforces a unique Role Code @high @roleconfig @regression', async ({ page, rolesListPage: list, api, roles }) => {
    traceTo('§5.1 Field 1', 'BR-ROLES-001');
    const source = (await api.roles()).find((r) => r.status === 'Active' && r.description && r.baseRole && /^[A-Za-z0-9-]{1,20}$/.test(r.roleName))!;
    const panel = list.newRole;
    const writes = await blockWrites(page, '**/api/**');

    await test.step(`1-3. Select "${source.roleName}" in Duplicate from Role: values are pre-filled`, async () => {
      await list.newRoleButton.click();
      await panel.duplicateFrom.selectOption({ label: source.roleName });
      await expect.soft(panel.roleCode, 'FSD §5.1 Field 1: Role Code is pre-filled from the selected role').toHaveValue(source.roleName);
      await expect(panel.description).toHaveValue(source.description);
      await expect(panel.baseRole.locator('option:checked')).toHaveText(source.baseRole!);
    });

    await test.step('4. Keep the source Role Code and save: duplicate alert blocks the user', async () => {
      await panel.roleCode.fill(source.roleName);
      await panel.remarks.fill('Duplicate from role');
      await panel.save();
      await expect(panel.message(fsd.newRole.messages.codeDuplicate)).toBeVisible();
      expect(writes.attempted).toEqual([]);
    });
    await writes.release();

    const code = roles.newCode();
    await test.step('5. Change to a unique Role Code and save: role created with the duplicated values', async () => {
      await panel.roleCode.fill(code);
      await panel.save();
      await expect(panel.dialog).toBeHidden();
      await list.findRole(code);
      await expect(list.cell(code, 'Role Code')).toContainText(source.description);
      await expect(list.cell(code, 'Base Role')).toHaveText(source.baseRole!);
    });
  });

  test('TC-007 | Base Role is mandatory and sourced from backend configuration @high @negative @roleconfig @regression', async ({ page, rolesListPage: list, roles }) => {
    traceTo('§5.1 Field 4', 'BR-ROLES-002');
    const baseRolesResponse = page.waitForResponse((r) => r.request().method() === 'GET' && r.url().includes('/api/iam/base-roles'));
    await list.goto();
    const backend = ((await (await baseRolesResponse).json()) as { baseRoles: string[] }).baseRoles;
    const panel = list.newRole;
    const code = roles.newCode();

    await test.step('1-2. Base Role options are the backend-configured base roles', async () => {
      await list.newRoleButton.click();
      expect(await panel.baseRoleOptions(), 'Dropdown values come from the backend').toEqual(backend);
      expect.soft(await panel.baseRoleOptions(), 'Backend-configured base roles per FSD §5.1 / TC-007 test data').toEqual(fsd.baseRoles);
    });

    await test.step('3. Leave Base Role unselected and save: "Please select a Base Role." and save blocked', async () => {
      const writes = await blockWrites(page, '**/api/**');
      await panel.fill({ code, description: 'Base role check', remarks: 'Base role check' });
      await panel.save();
      await expect(panel.message(fsd.newRole.messages.baseRoleRequired)).toBeVisible();
      expect(writes.attempted).toEqual([]);
      await writes.release();
    });

    await test.step('4. Select exactly one Base Role and save: role saved with that Base Role', async () => {
      await panel.baseRole.selectOption({ label: 'General' });
      await panel.save();
      await expect(panel.dialog).toBeHidden();
      await list.findRole(code);
      await expect(list.cell(code, 'Base Role')).toHaveText('General');
    });
  });

  test('TC-008 | Role Description is mandatory with a 100-character limit @high @negative @roleconfig @regression', async ({ page, rolesListPage: list, roles }) => {
    traceTo('§5.1 Field 3');
    const panel = list.newRole;
    const code = roles.newCode();
    const writes = await blockWrites(page, '**/api/**');
    await list.newRoleButton.click();
    await panel.fill({ code, baseRole: 'Auditor', remarks: 'Description check' });

    await test.step('1. Blank description: "Role Description is required." and save blocked', async () => {
      await panel.save();
      await expect(panel.message(fsd.newRole.messages.descriptionRequired)).toBeVisible();
      expect(writes.attempted).toEqual([]);
    });

    await test.step('2. 101 characters: input is restricted or rejected beyond 100', async () => {
      await panel.description.fill('D'.repeat(fsd.newRole.maxDescriptionLength + 1));
      const kept = (await panel.description.inputValue()).length;
      if (kept > fsd.newRole.maxDescriptionLength) {
        await panel.save();
        await expect(panel.dialog, '101 characters must not be saved').toBeVisible();
        expect(writes.attempted).toEqual([]);
      } else {
        expect(kept).toBe(fsd.newRole.maxDescriptionLength);
      }
    });
    await writes.release();

    const description = `${code} `.padEnd(fsd.newRole.maxDescriptionLength, 'x');
    await test.step('3. Exactly 100 characters: saved and shown in full in the Roles List', async () => {
      await panel.description.fill(description);
      await panel.save();
      await expect(panel.dialog).toBeHidden();
      await list.findRole(code);
      const shown = list.cell(code, 'Role Code').getByTitle(description);
      await expect(list.cell(code, 'Role Code')).toContainText(description);
      expect.soft(
        await shown.evaluate((el) => el.scrollWidth <= el.clientWidth),
        'TC-008: the full description is displayed without truncation',
      ).toBe(true);
    });
  });

  test('TC-009 | Cancel on the Create Role panel discards the record @high @roleconfig @regression', async ({ page, rolesListPage: list, roles, api }) => {
    traceTo('§5.1 Panel Footer');
    const code = roles.newCode();
    const writes = await blockWrites(page, '**/api/**');

    await test.step('1-2. Complete all fields and click Cancel: panel closes without saving', async () => {
      await list.newRoleButton.click();
      await list.newRole.fill({ code, description: 'Cancel Discard Role', baseRole: 'General', remarks: 'Cancel check' });
      await list.newRole.cancel();
      expect(writes.attempted).toEqual([]);
    });

    await test.step('3. Search for the Role Code: no record exists', async () => {
      await list.filter({ code });
      await expect(list.row(code)).toHaveCount(0);
      expect(await api.role(code)).toBeNull();
    });

    await test.step('The Role Code remains available for reuse', async () => {
      await list.newRoleButton.click();
      await list.newRole.fill({ code, description: 'Cancel Discard Role', baseRole: 'General', remarks: 'Reuse check' });
      await list.newRole.save();
      await expect.poll(() => writes.attempted, { message: 'The create request is sent (no duplicate block)' }).toContain('POST /api/iam/roles');
      await expect(list.newRole.message(fsd.newRole.messages.codeDuplicate)).toHaveCount(0);
    });
  });

  test('TC-010 | Role creation is written to the Audit Trail with the initial field values @critical @roleconfig @regression', async ({ rolesListPage: list, roles }) => {
    traceTo('§5.1, §5.6.3', 'BR-ROLES-010');
    const role = await roles.pending({ description: 'Payment Maker Role', baseRole: 'Business Maker', remarks: 'New role required for payment origination' });
    const maker = getRoleConfigEnv().maker.username;

    await test.step('1-2. Locate the new role and click Audit', async () => {
      await list.goto();
      await list.findRole(role.code);
      await list.open(role.code, 'Audit Trail');
    });

    await test.step('3. Earliest card: Role Created (grey) with the initial values, user, date and Remarks', async () => {
      const audit = list.audit(role.code);
      await audit.waitForLoad();
      const card = audit.card((await audit.cards.count()) - 1);
      const data = await card.read();
      expect(data.badges).toContain('Role Created');
      await expectColour(card.badge('Role Created'), fsd.audit.badgeColours['Role Created'], 'FSD §5.6.3: Role Created badge is grey', { soft: true });
      expect.soft(data.changes.some((c) => c.startsWith('Role Code') && c.includes(role.code)), `FSD: initial Role Code listed (got ${JSON.stringify(data.changes)})`).toBe(true);
      expect.soft(data.changes.some((c) => c.startsWith('Description') && c.includes(role.description)), 'FSD: initial Description listed').toBe(true);
      expect.soft(data.changes.some((c) => c.startsWith('Base Role') && c.includes(role.baseRole)), 'FSD: initial Base Role listed').toBe(true);
      expect.soft(data.changes.some((c) => /Status/.test(c)), 'FSD: initial Status listed').toBe(true);
      expect.soft(data.user, 'FSD §5.6.2: the Maker\'s username').toBe(maker);
      expect(data.roleLine).toBe(`${role.code} / ${role.description}`);
      expect.soft(data.dateTime, 'FSD §5.6.2: DD-Mon-YYYY HH:MM AM/PM').toMatch(fsd.formats.auditDateTime);
      expect(data.comments).toBe(role.remarks);
    });
  });
});
