import { test, expect, traceTo, notVerified, expectColour } from '../../../fixtures/roleconfig.fixture';
import { blockWrites } from '../../../utils/network.util';
import { getRoleConfigEnv } from '../../../utils/env.util';
import { fsd, parseDisplayDate } from '../../../testdata/roleconfig.data';
import { descriptionAndStatusInOneSave } from './shared-steps';

/** Roles FSD v1.4 §5.3 — View & Modify panel (manual cases TC-019 … TC-028). */
test.describe('Role Configuration - View & Modify', () => {
  test('TC-019 | View & Modify panel binds to the selected row\'s own role data @critical @smoke @roleconfig @regression', async ({ page, rolesListPage: list }) => {
    traceTo('§5.3 (v1.2 change)');
    const writes = await blockWrites(page, '**/api/**');
    await list.goto();
    const codes = await list.codesOnPage();
    const picks = [codes[0], codes[2], codes[4]].filter(Boolean);

    for (const [n, code] of picks.entries()) {
      await test.step(`${n + 1}. Row "${code}": panel shows that role's own values`, async () => {
        const grid = {
          description: await list.descriptionOf(code),
          baseRole: ((await list.cell(code, 'Base Role').textContent()) ?? '').trim(),
          status: ((await list.cell(code, 'Status').textContent()) ?? '').trim(),
          createdBy: ((await list.cell(code, 'Created By').textContent()) ?? '').trim(),
          createdOn: ((await list.cell(code, 'Created Date').textContent()) ?? '').trim(),
          lastModified: ((await list.cell(code, 'Last Modified').textContent()) ?? '').trim(),
        };
        await list.open(code, 'View & Modify');
        const vm = list.viewModify;
        await expect(vm.roleCode).toHaveValue(code);
        await expect(vm.description).toHaveValue(grid.description);
        if (grid.baseRole !== '—') expect.soft(await vm.selectedBaseRole(), `Base Role of ${code}`).toBe(grid.baseRole);
        expect(await vm.selectedStatus()).toBe(grid.status);
        await expect(vm.createdBy).toHaveValue(grid.createdBy);
        await expect(vm.createdOn).toHaveValue(grid.createdOn);
        await expect(vm.lastModified).toHaveValue(grid.lastModified);
        await vm.close();
      });
    }

    await test.step('4. Repeat on the next page of the grid', async () => {
      test.skip(!(await list.nextPage.isEnabled()), 'Only one page of roles');
      await list.nextPage.click();
      await expect(list.recordCount).toHaveText(/^Showing\s*21–/);
      const code = (await list.codesOnPage())[0];
      const description = await list.descriptionOf(code);
      await list.open(code, 'View & Modify');
      await expect(list.viewModify.roleCode).toHaveValue(code);
      await expect(list.viewModify.description).toHaveValue(description);
      await list.viewModify.close();
    });
    expect(writes.attempted).toEqual([]);
  });

  test('TC-020 | Role Code is read-only and cannot be modified after creation @critical @negative @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§5.3', 'BR-ROLES-001');
    const role = await roles.active();
    await list.openRole(role.code, 'View & Modify');
    const vm = list.viewModify;

    await test.step('1-3. Role Code cannot be typed or pasted into; audit fields are read-only too', async () => {
      await expect(vm.roleCode).toHaveValue(role.code);
      await expect(vm.roleCode).not.toBeEditable();
      for (const field of [vm.createdBy, vm.createdOn, vm.lastModified]) await expect(field).not.toBeEditable();
      await vm.close();
    });

    await test.step('4. A request payload that changes the Role Code is rejected or ignored by the server', async () => {
      const renamed = `${role.code}X`.slice(0, 20);
      const response = await api.maker.put(`/api/iam/roles/${role.code}`, {
        data: { roleName: renamed, description: role.description, baseRole: role.baseRole, status: 'Active', makerRemarks: 'Rename attempt', rails: [] },
      });
      if (response.ok()) await api.approve(((await response.json()) as { requestId: number }).requestId);
      expect((await api.role(role.code))?.roleName, 'The role keeps its code').toBe(role.code);
      expect(await api.role(renamed), 'No role exists under the new code').toBeNull();
    });
  });

  test('TC-021 | Modification Comments is mandatory before Save on View & Modify @critical @negative @mc @roleconfig @regression', async ({ page, rolesListPage: list, roles, api }) => {
    traceTo('§5.3', 'BR-ROLES-005', 'BR-ROLES-006');
    const role = await roles.active();
    await list.openRole(role.code, 'View & Modify');
    const vm = list.viewModify;
    const writes = await blockWrites(page, '**/api/**');
    await vm.change({ description: `${role.description} - Updated` });

    for (const [step, value] of [['2. Comments blank', ''], ['3. Comments with spaces only', '   ']] as const) {
      await test.step(`${step}: Save is blocked and the field border turns red`, async () => {
        await vm.comments.fill(value);
        await vm.save();
        await expectColour(vm.comments, 'red', 'FSD §5.3: Modification Comments border turns red', { property: 'border-top-color' });
        await expect(vm.dialog).toBeVisible();
        expect(writes.attempted, 'No change is committed').toEqual([]);
      });
    }
    await expect.soft(vm.comments, 'FSD §5.3 placeholder').toHaveAttribute('placeholder', fsd.viewModify.commentsPlaceholder);
    await writes.release();

    await test.step('4. Valid comments: saved, panel closes, success message', async () => {
      await vm.comments.fill('Description corrected per BA request');
      await vm.save();
      await expect(vm.dialog).toBeHidden();
      await expect(list.notification(role.code)).toBeVisible();
    });

    await test.step('The comment is recorded in the Audit Trail and offers no edit/delete', async () => {
      await api.approve(await api.pendingRequestId(role.code));
      await list.openRole(role.code, 'Audit Trail');
      const audit = list.audit(role.code);
      await audit.waitForLoad();
      const card = audit.cards.filter({ hasText: 'Comments: Description corrected per BA request' });
      await expect(card).toHaveCount(1);
      await expect(card.getByRole('button', { name: /edit|delete|remove/i })).toHaveCount(0);
      await expect(card.getByRole('textbox')).toHaveCount(0);
    });
  });

  test('TC-022 | Modify role details under Maker-Checker workflow @critical @mc @roleconfig @regression', async ({ page, rolesListPage: list, roles, api, userRolePicker }) => {
    traceTo('§5.3, §8 row 3');
    test.skip(await api.isMakerOnly('ModifyRole'), 'Modify Role is Maker-only here');
    const role = await roles.active();

    await test.step('1-3. Change the description, comment and Save', async () => {
      await list.openRole(role.code, 'View & Modify');
      await list.viewModify.change({ description: 'Admin Payment Maker - Revised', comments: 'Description updated' });
      await list.viewModify.save();
      await expect(list.viewModify.dialog).toBeHidden();
    });

    await test.step('4. Status Pending (amber), Last Action "Modify Role"', async () => {
      await list.goto();
      await list.findRole(role.code);
      await expect(list.cell(role.code, 'Last Action')).toHaveText(fsd.lastAction.modifyRole);
      await expect.soft(list.cell(role.code, 'Status'), 'FSD §8 row 3: Status Pending until the Checker decides').toHaveText('Pending');
      await expectColour(list.statusBadge(role.code), fsd.statuses.Pending, 'FSD §5.2.3: Pending badge is amber', { soft: true });
      await expect(list.cell(role.code, 'Role Code'), 'The change does not apply before approval').toContainText(role.description);
    });

    await test.step('The role remains available for user assignment', async () => {
      const writes = await blockWrites(page, '**/api/**');
      await userRolePicker.open();
      await expect(userRolePicker.roleOption(role.code)).toBeVisible();
      await userRolePicker.close();
      await writes.release();
    });
    notVerified('5. Existing users keep working with the previous configuration', 'needs a business user assigned to the role');
  });

  test('TC-023 | Change role Status from Active to Disabled @critical @mc @roleconfig @regression', async ({ page, rolesListPage: list, roles, api, userRolePicker }) => {
    traceTo('§5.3, §8 row 4', 'BR-ROLES-011');
    const role = await roles.active();
    const picker = async () => {
      const writes = await blockWrites(page, '**/api/**');
      await userRolePicker.open();
      const offered = (await userRolePicker.roleOption(role.code).count()) > 0;
      await userRolePicker.close();
      await writes.release();
      return offered;
    };
    expect.soft(await picker(), 'Precondition: the Active role (with its base screens) is assignable').toBe(true);

    await test.step('1-3. Status Active → Disabled with comments, Save', async () => {
      await list.openRole(role.code, 'View & Modify');
      await list.viewModify.change({ status: 'Disabled', comments: 'Role suspended pending review' });
      await list.viewModify.save();
      await expect(list.viewModify.dialog).toBeHidden();
    });

    await test.step('4. Checker approves', async () => {
      await api.approve(await api.pendingRequestId(role.code));
    });

    await test.step('Status Disabled (grey), Last Action "Modify Role"', async () => {
      await list.goto();
      await list.findRole(role.code);
      await expect(list.cell(role.code, 'Status')).toHaveText('Disabled');
      await expectColour(list.statusBadge(role.code), fsd.statuses.Disabled, 'FSD §5.2.3: Disabled badge is grey', { soft: true });
      await expect(list.cell(role.code, 'Last Action')).toHaveText(fsd.lastAction.modifyRole);
    });

    await test.step('5. The role is not available when assigning roles to a user', async () => {
      expect(await picker()).toBe(false);
    });

    await test.step('The status change is recorded with a Status Change badge', async () => {
      await list.openRole(role.code, 'Audit Trail');
      const audit = list.audit(role.code);
      await audit.waitForLoad();
      const data = (await audit.readAll()).find((c) => c.comments === 'Role suspended pending review');
      expect(data, 'Maker card for the status change').toBeTruthy();
      expect(data!.badges).toContain('Status Change');
      expect.soft(data!.changes.some((c) => /Active\s*→\s*Disabled/.test(c)), `Status Active → Disabled (got ${JSON.stringify(data!.changes)})`).toBe(true);
    });
    notVerified('6. Existing assignments are suspended', 'needs a business user assigned to the role');
  });

  test('TC-024 | Re-activate a Disabled role from Disabled to Active @critical @mc @roleconfig @regression', async ({ page, rolesListPage: list, roles, api, userRolePicker }) => {
    traceTo('§5.3, §8 row 4', 'BR-ROLES-011');
    const role = await roles.disabled();

    await test.step('1-3. Status Disabled → Active with comments, Save', async () => {
      await list.openRole(role.code, 'View & Modify');
      await list.viewModify.change({ status: 'Active', comments: 'Role reinstated after review' });
      await list.viewModify.save();
      await expect(list.viewModify.dialog).toBeHidden();
    });

    await test.step('4. Checker approves: Status Active (green)', async () => {
      await api.approve(await api.pendingRequestId(role.code));
      await list.goto();
      await list.findRole(role.code);
      await expect(list.cell(role.code, 'Status')).toHaveText('Active');
      await expectColour(list.statusBadge(role.code), fsd.statuses.Active, 'FSD §5.2.3: Active badge is green', { soft: true });
    });

    await test.step('The role is available again for assignment to new users', async () => {
      const writes = await blockWrites(page, '**/api/**');
      await userRolePicker.open();
      await expect(userRolePicker.roleOption(role.code)).toBeVisible();
      await userRolePicker.close();
      await writes.release();
    });

    await test.step('Audit: Status Change "Disabled → Active"', async () => {
      await list.openRole(role.code, 'Audit Trail');
      const audit = list.audit(role.code);
      await audit.waitForLoad();
      const data = (await audit.readAll()).find((c) => c.comments === 'Role reinstated after review');
      expect(data, 'Maker card for the re-activation').toBeTruthy();
      expect(data!.badges).toContain('Status Change');
      expect.soft(data!.changes.some((c) => /Disabled\s*→\s*Active/.test(c)), `Disabled → Active (got ${JSON.stringify(data!.changes)})`).toBe(true);
    });
    notVerified('5. Previously suspended users regain access', 'needs a business user assigned to the role');
  });

  test('TC-025 | Changing Base Role re-scopes the screens available in Screen Mapping @critical @mc @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§5.3, §5.4.1', 'BR-ROLES-002');
    const role = await roles.active({ baseRole: 'Business Maker' });
    const screens = await api.screens();
    const key = (s: { app: string; screenCode: string }) => `${s.app}:${s.screenCode}`;
    const assignedTo = (base: string) => screens.filter((s) => s.status === 'Active' && s.baseRoles.includes(base)).map(key);
    const onlyOthers = (base: string) => screens.filter((s) => s.baseRoles.length > 0 && !s.baseRoles.includes(base)).map(key);
    const listed = async () => {
      await list.openRole(role.code, 'Screen Mapping');
      const mapping = list.mapping(role.code);
      await mapping.showAll();
      const keys = (await mapping.rowStates()).map((r) => r.key);
      await mapping.close();
      return keys;
    };

    const before = await test.step('1. Screen Map lists the Business Maker screens', async () => {
      const keys = await listed();
      expect(keys).toEqual(expect.arrayContaining(assignedTo('Business Maker')));
      for (const k of onlyOthers('Business Maker')) expect(keys, `${k} is not applicable to Business Maker`).not.toContain(k);
      return keys;
    });

    await test.step('2-3. Change Base Role to Auditor with comments; Checker approves', async () => {
      await list.openRole(role.code, 'View & Modify');
      await list.viewModify.change({ baseRole: 'Auditor', comments: 'Base role re-categorised' });
      await list.viewModify.save();
      await expect(list.viewModify.dialog).toBeHidden();
      await api.approve(await api.pendingRequestId(role.code));
    });

    await test.step('4. Screen Map now offers only the Auditor screens', async () => {
      const keys = await listed();
      expect(keys).not.toEqual(before);
      expect(keys).toEqual(expect.arrayContaining(assignedTo('Auditor')));
      for (const k of onlyOthers('Auditor')) expect(keys, `${k} is not applicable to Auditor`).not.toContain(k);
    });

    await test.step('Exactly one Base Role; the change is a Role Details (blue) audit entry', async () => {
      await list.goto();
      await list.findRole(role.code);
      await expect(list.cell(role.code, 'Base Role')).toHaveText('Auditor');
      await list.open(role.code, 'Audit Trail');
      const audit = list.audit(role.code);
      await audit.waitForLoad();
      const data = (await audit.readAll()).find((c) => c.comments === 'Base role re-categorised');
      expect(data).toBeTruthy();
      expect(data!.badges).toContain('Role Details');
      expect.soft(data!.changes.some((c) => /Base Role.*Business Maker\s*→\s*Auditor/.test(c)), `Base Role before → after (got ${JSON.stringify(data!.changes)})`).toBe(true);
    });
  });

  test('TC-026 | Description and Status changed in one save produce a single audit card with both badges @high @mc @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§5.6.3 Example');
    await descriptionAndStatusInOneSave(list, api, await roles.active({ description: 'Reports Viewer' }));
  });

  test('TC-027 | Cancel on View & Modify discards all unsaved changes @high @roleconfig @regression', async ({ page, rolesListPage: list, api }) => {
    traceTo('§5.3 Panel Footer');
    const target = (await api.roles()).find((r) => r.status === 'Active' && r.lastAction?.status !== 'Pending' && r.baseRole && r.description)!;
    const code = target.roleName;
    const auditBefore = await api.auditTotal(code);
    const writes = await blockWrites(page, '**/api/**');
    await list.goto();
    await list.findRole(code);
    const lastModified = (await list.cell(code, 'Last Modified').innerText()).trim();

    await test.step('1-3. Change Description, Status and Base Role, comment, then Cancel', async () => {
      await list.open(code, 'View & Modify');
      const otherBase = fsd.baseRoles.find((b) => b !== target.baseRole)!;
      await list.viewModify.change({ description: `${target.description} - discard`, status: 'Disabled', baseRole: otherBase, comments: 'Discard check' });
      await list.viewModify.cancel();
      await expect(page.getByRole('dialog'), 'Closes without a confirmation prompt').toHaveCount(0);
    });

    await test.step('4. Re-open: original values, Last Modified unchanged, no audit entry', async () => {
      await list.open(code, 'View & Modify');
      await expect(list.viewModify.description).toHaveValue(target.description);
      expect(await list.viewModify.selectedStatus()).toBe('Active');
      expect(await list.viewModify.selectedBaseRole()).toBe(target.baseRole);
      await expect(list.viewModify.lastModified).toHaveValue(lastModified);
      await list.viewModify.close();
      expect(writes.attempted).toEqual([]);
      expect(await api.auditTotal(code)).toBe(auditBefore);
    });
  });

  test('TC-028 | Last Modified and Last Modified By are system-updated on successful save @high @mc @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§5.3 Fields, §5.2.1');
    const role = await roles.active();
    await list.goto();
    await list.findRole(role.code);
    const before = {
      lastModified: (await list.cell(role.code, 'Last Modified').innerText()).trim(),
      createdDate: (await list.cell(role.code, 'Created Date').innerText()).trim(),
      createdBy: (await list.cell(role.code, 'Created By').innerText()).trim(),
    };

    await test.step('2-3. Change the description, comment, save; Checker approves', async () => {
      await list.open(role.code, 'View & Modify');
      await list.viewModify.change({ description: `${role.description} - updated`, comments: 'Last modified check' });
      await list.viewModify.save();
      await expect(list.viewModify.dialog).toBeHidden();
      await api.approve(await api.pendingRequestId(role.code));
    });

    await test.step('4. Last Modified and Last Modified By updated; Created unchanged; fields read-only', async () => {
      await list.goto();
      await list.findRole(role.code);
      const lastModified = (await list.cell(role.code, 'Last Modified').innerText()).trim();
      expect(lastModified).toMatch(fsd.formats.gridDateTime);
      expect(parseDisplayDate(lastModified).getTime()).toBeGreaterThan(parseDisplayDate(before.lastModified).getTime());
      await expect.soft(list.cell(role.code, 'Last Modified By'), 'TC-028: username of the user who performed the modification (the Maker)').toHaveText(getRoleConfigEnv().maker.username);
      await expect(list.cell(role.code, 'Created Date')).toHaveText(before.createdDate);
      await expect(list.cell(role.code, 'Created By')).toHaveText(before.createdBy);
      await list.open(role.code, 'View & Modify');
      await expect(list.viewModify.lastModified).toHaveValue(lastModified);
      for (const field of [list.viewModify.createdBy, list.viewModify.createdOn, list.viewModify.lastModified]) await expect(field).not.toBeEditable();
    });
  });
});
