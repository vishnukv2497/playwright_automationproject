import { test, expect, traceTo, notVerified, expectColour } from '../../../fixtures/roleconfig.fixture';
import { blockWrites } from '../../../utils/network.util';
import { fsd, screens, remarks } from '../../../testdata/roleconfig.data';

/** Roles FSD v1.4 §5.4 — Screen Mapping panel (manual cases TC-029 … TC-044). */
test.describe('Role Configuration - Screen Mapping', () => {
  test('TC-029 | Only Active screens applicable to the role\'s Base Role are listed for mapping @critical @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§5.4.1');
    const base = 'Business Checker';
    const role = await roles.pending({ baseRole: base });
    const master = await api.screens();
    const masterKey = (s: { app: string; screenCode: string }) => `${s.app}:${s.screenCode}`;

    await list.openRole(role.code, 'Screen Mapping');
    const mapping = list.mapping(role.code);
    await mapping.showAll();
    const listed = (await mapping.rowStates()).map((r) => r.key);

    await test.step('1-2. Listed screens are registered, Active and applicable to the Base Role', async () => {
      for (const key of listed) {
        const screen = master.find((s) => masterKey(s) === key);
        expect(screen, `${key} is registered in the screen master`).toBeTruthy();
        expect(screen!.status, `${key} is Active`).toBe('Active');
        expect(screen!.baseRoles.length === 0 || screen!.baseRoles.includes(base), `${key} is applicable to ${base}`).toBe(true);
      }
      for (const s of master.filter((m) => m.status === 'Active' && m.baseRoles.includes(base))) {
        expect(listed, `Active ${base} screen ${masterKey(s)} is listed`).toContain(masterKey(s));
      }
    });

    await test.step('Disabled screens are excluded', async () => {
      const disabled = master.filter((s) => s.status === 'Disabled');
      if (!disabled.length) notVerified('Disabled screens are excluded', 'no Disabled screen exists in the screen master');
      for (const s of disabled) expect(listed, `Disabled screen ${masterKey(s)}`).not.toContain(masterKey(s));
    });
    notVerified('Deleted screens are never shown', 'the screen master API does not return deleted screens, so there is nothing to compare against');

    await test.step('Each row shows the screen code and description and its rail pills', async () => {
      for (const s of master.filter((m) => listed.includes(masterKey(m)))) {
        const row = mapping.row({ app: s.app, code: s.screenCode });
        await expect(row).toContainText(s.screenName);
        await expect(row).toContainText(`${s.app} · ${s.screenCode}`);
        const rails = [...new Set([...s.rails, ...(s.rail ? [s.rail] : [])])];
        const railsCell = await mapping.cell({ app: s.app, code: s.screenCode }, 'Rails');
        for (const rail of rails) await expect.soft(railsCell, `FSD §5.4.1: rail pill "${rail}" on ${masterKey(s)}`).toContainText(rail);
      }
    });
  });

  test.fixme('TC-030 | Disabling a screen at screen-master level removes it from all role mappings @critical @roleconfig @regression', async () => {
    traceTo('§5.4.1');
    test.info().annotations.push({ type: 'blocked', description: 'Needs a screen in the Screens master that the suite may disable (system configuration) and a business user to check runtime access' });
  });

  test.fixme('TC-031 | Re-enabling a screen makes it available for mapping again @high @roleconfig @regression', async () => {
    traceTo('§5.4.1');
    test.info().annotations.push({ type: 'blocked', description: 'Needs a screen in the Screens master that the suite may disable and re-enable (system configuration)' });
  });

  test('TC-032 | Map a screen with Access Privilege = Actor @critical @smoke @mc @roleconfig @regression', async ({ rolesListPage: list, roles, checker }) => {
    traceTo('§5.4.1, §5.4 Access Privilege', 'BR-ROLES-008');
    const role = await roles.active({ baseRole: 'Business Maker' });
    const target = screens.department;

    await test.step('1-4. Tick the screen, set Actor, comment and Save Mapping', async () => {
      await list.openRole(role.code, 'Screen Mapping');
      const mapping = list.mapping(role.code);
      await mapping.showAll();
      await mapping.tick(target, 'Actor');
      await mapping.save('Initial screen mapping');
      await expect(mapping.dialog).toBeHidden();
      await expect(list.notification(role.code), 'FSD: success toast').toBeVisible();
    });

    await test.step('5. Checker approves the mapping', async () => {
      const review = await checker.approvalQueue.openRoleReview(role.code);
      await review.approve(remarks.approve);
    });

    await test.step('The screen is mapped with Actor', async () => {
      await list.openRole(role.code, 'Screen Mapping');
      const mapping = list.mapping(role.code);
      await mapping.showAll();
      await expect(mapping.rowCheckbox(target)).toBeChecked();
      expect(await mapping.selectedPrivilege(target)).toBe('Actor');
    });
    notVerified('6. The user can view, initiate, approve and modify on the screen', 'needs a business user assigned to the role');
  });

  test('TC-033 | Map a screen with Access Privilege = Viewer @critical @mc @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§5.4.1, §5.4 Access Privilege');
    const role = await roles.active({ baseRole: 'Business Maker' });
    const target = screens.chargeConfig;

    await test.step('1-3. Change the mapped screen from Actor to Viewer, comment, Save Mapping', async () => {
      await list.openRole(role.code, 'Screen Mapping');
      const mapping = list.mapping(role.code);
      await mapping.showAll();
      expect(await mapping.selectedPrivilege(target)).toBe('Actor');
      await mapping.setPrivilege(target, 'Viewer');
      await mapping.save('Read-only access granted');
      await expect(mapping.dialog).toBeHidden();
    });

    await test.step('4. Checker approves: the screen is mapped as Viewer', async () => {
      await api.approve(await api.pendingRequestId(role.code));
      await list.openRole(role.code, 'Screen Mapping');
      const mapping = list.mapping(role.code);
      await mapping.showAll();
      expect(await mapping.selectedPrivilege(target)).toBe('Viewer');
    });
    notVerified('5. The user has read-only access; action controls are unavailable', 'needs a business user assigned to the role');
  });

  test('TC-034 | Access Privilege is only relevant when the screen checkbox is ticked @high @mc @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§5.4.1');
    const role = await roles.active({ baseRole: 'Business Maker' });
    const unticked = screens.routingRules;
    const ticked = screens.department;
    await list.openRole(role.code, 'Screen Mapping');
    const mapping = list.mapping(role.code);
    await mapping.showAll();

    await test.step('1-2. A privilege chosen on an unticked row is not kept once the row is unticked', async () => {
      await expect(mapping.rowCheckbox(unticked)).not.toBeChecked();
      await mapping.setPrivilege(unticked, 'Actor');
      await mapping.untick(unticked);
      expect(await mapping.selectedPrivilege(unticked), 'No privilege for an unmapped screen').toBe('Unmapped');
    });

    await test.step('3-4. Tick another screen as Viewer, save, approve, re-open', async () => {
      await mapping.tick(ticked, 'Viewer');
      await mapping.save('Privilege on ticked screen only');
      await expect(mapping.dialog).toBeHidden();
      await api.approve(await api.pendingRequestId(role.code));
      await list.openRole(role.code, 'Screen Mapping');
      await mapping.showAll();
      await expect(mapping.rowCheckbox(ticked)).toBeChecked();
      expect(await mapping.selectedPrivilege(ticked)).toBe('Viewer');
      await expect(mapping.rowCheckbox(unticked)).not.toBeChecked();
      expect(await mapping.selectedPrivilege(unticked)).toBe('Unmapped');
    });
  });

  test('TC-035 | Unticking a screen removes its privilege and configuration but retains them for audit @critical @mc @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§5.4.1', 'BR-ROLES-007');
    test.slow();
    const role = await roles.active({ baseRole: 'Business Maker' });
    const target = screens.chargeConfig;
    const elementKey = target.element.key;
    const defaultEnable = (await api.screenConfig(role.code, target.app, target.code)).find((i) => i.permissionKey === elementKey)!.enable;

    await test.step('Precondition: customise the screen config for this role (approved)', async () => {
      await api.approve(await api.configure(role.code, target.app, target.code, { [elementKey]: !defaultEnable }, 'Customised for TC-035'));
    });

    await test.step('1-4. Untick the screen, comment, Save Mapping; Checker approves', async () => {
      await list.openRole(role.code, 'Screen Mapping');
      const mapping = list.mapping(role.code);
      await mapping.showAll();
      await mapping.untick(target);
      await mapping.save('Screen access withdrawn');
      await expect(mapping.dialog).toBeHidden();
      await api.approve(await api.pendingRequestId(role.code));
    });

    await test.step('Privilege and configuration are removed with the mapping', async () => {
      await list.openRole(role.code, 'Screen Mapping');
      const mapping = list.mapping(role.code);
      await mapping.showAll();
      await expect(mapping.rowCheckbox(target)).not.toBeChecked();
      expect(await mapping.selectedPrivilege(target)).toBe('Unmapped');
      await mapping.close();
    });

    await test.step('5. Re-tick the screen: it starts from the default configuration', async () => {
      await api.approve(await api.mapScreens(role.code, [{ app: target.app, pageCode: target.code, accessPrivilege: 'Actor' }], 'Re-mapped for TC-035'));
      const config = await api.screenConfig(role.code, target.app, target.code);
      expect(config.find((i) => i.permissionKey === elementKey)!.enable, 'Previous customisation is not silently restored').toBe(defaultEnable);
    });

    await test.step('6. Audit shows the removed screen with a red "−" prefix', async () => {
      await list.openRole(role.code, 'Audit Trail');
      const audit = list.audit(role.code);
      await audit.waitForLoad();
      const card = (await audit.readAll()).find((c) => c.comments === 'Screen access withdrawn');
      expect(card, 'Screen Mapping card for the removal').toBeTruthy();
      expect.soft(card!.changes.some((c) => /^[−-]/.test(c) && c.includes(target.code)), `FSD §5.6.3: "− ${target.code}" line (got ${JSON.stringify(card!.changes)})`).toBe(true);
    });
    notVerified('Users of the role lose access to the screen after approval', 'needs a business user assigned to the role');
  });

  test('TC-036 | Access Privilege change for one role does not affect other roles on the same screen @critical @mc @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§5.4', 'BR-ROLES-008');
    const roleA = await roles.active({ baseRole: 'Business Maker' });
    const roleB = await roles.active({ baseRole: 'Business Maker' });
    const target = screens.chargeConfig;

    await test.step('1-3. Role A: Actor → Viewer, comment, save; Checker approves', async () => {
      await list.openRole(roleA.code, 'Screen Mapping');
      const mapping = list.mapping(roleA.code);
      await mapping.showAll();
      await mapping.setPrivilege(target, 'Viewer');
      await mapping.save('Role A set to Viewer');
      await expect(mapping.dialog).toBeHidden();
      await api.approve(await api.pendingRequestId(roleA.code));
    });

    await test.step('4. Role B keeps Actor on the same screen', async () => {
      await list.openRole(roleB.code, 'Screen Mapping');
      const mapping = list.mapping(roleB.code);
      await mapping.showAll();
      expect(await mapping.selectedPrivilege(target)).toBe('Actor');
      expect((await api.roleScreens(roleA.code)).find((s) => s.pageCode === target.code)!.accessPrivilege).toBe('Viewer');
    });
    notVerified('Role A users are read-only and Role B users keep full actions on the screen', 'needs business users assigned to both roles');
  });

  test('TC-037 | Modification Comments is mandatory before Save Mapping @critical @negative @mc @roleconfig @regression', async ({ page, rolesListPage: list, roles }) => {
    traceTo('§5.4.2', 'BR-ROLES-005');
    const role = await roles.active({ baseRole: 'Business Maker' });
    await list.openRole(role.code, 'Screen Mapping');
    const mapping = list.mapping(role.code);
    await mapping.showAll();

    await test.step('1-2. Tick one, untick one, leave comments blank and Save: blocked', async () => {
      const writes = await blockWrites(page, '**/api/**');
      await mapping.tick(screens.department, 'Viewer');
      await mapping.untick(screens.dashboard);
      await mapping.saveButton.click();
      await expect(mapping.dialog).toBeVisible();
      expect(writes.attempted, 'No mapping change is committed').toEqual([]);
      await writes.release();
    });

    await test.step('Placeholder and hint are shown', async () => {
      await expect.soft(mapping.comments, 'FSD §5.4.2 placeholder').toHaveAttribute('placeholder', fsd.mapping.commentsPlaceholder);
      await expect(mapping.commentsHint).toBeVisible();
    });

    await test.step('3. Valid comments: mapping saved with a success toast', async () => {
      await mapping.save('Mapping revised per approved request');
      await expect(mapping.dialog).toBeHidden();
      await expect(list.notification(role.code)).toBeVisible();
    });

    await test.step('4. The comment appears verbatim on the Screen Mapping audit card', async () => {
      await list.openRole(role.code, 'Audit Trail');
      const audit = list.audit(role.code);
      await audit.waitForLoad();
      const card = (await audit.readAll()).find((c) => c.comments === 'Mapping revised per approved request');
      expect(card).toBeTruthy();
      expect(card!.badges).toContain('Screen Mapping');
    });
  });

  test('TC-038 | Header checkbox selects and deselects all listed screens @high @mc @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§5.4.1');
    const role = await roles.active({ baseRole: 'Business Maker' });
    await list.openRole(role.code, 'Screen Mapping');
    const mapping = list.mapping(role.code);
    await mapping.waitForLoad();
    const pageOne = (await mapping.rowStates()).map((r) => r.key);

    await test.step('1-2. Tick the header: every row on the page is ticked', async () => {
      await mapping.headerCheckbox.check();
      for (const r of await mapping.rowStates()) expect(r.mapped, r.key).toBe(true);
    });

    await test.step('3. Untick the header: every row is unticked', async () => {
      await mapping.headerCheckbox.uncheck();
      for (const r of await mapping.rowStates()) expect(r.mapped, r.key).toBe(false);
    });

    await test.step('4. A partial manual selection does not show the header as fully selected', async () => {
      const [first, second] = pageOne.map((k) => ({ app: k.split(':')[0], code: k.split(':')[1] }));
      await mapping.tick(first);
      await mapping.tick(second);
      await expect(mapping.headerCheckbox).not.toBeChecked();
    });

    await test.step('5. Select all, save, approve and re-open: the saved selection persists', async () => {
      await mapping.headerCheckbox.check();
      await mapping.save('All screens on the page');
      await expect(mapping.dialog).toBeHidden();
      await api.approve(await api.pendingRequestId(role.code));
      await list.openRole(role.code, 'Screen Mapping');
      await mapping.waitForLoad();
      const states = await mapping.rowStates();
      for (const key of pageOne) expect(states.find((s) => s.key === key)?.mapped, key).toBe(true);
    });
  });

  test('TC-039 | Screen Config button visibility depends on the screen having configurable elements @high @roleconfig @regression', async ({ rolesListPage: list, roles }) => {
    traceTo('§5.4.1 Screen Config Button Availability');
    const role = await roles.active({ baseRole: 'Business Maker' });
    const target = screens.chargeConfig;
    await list.openRole(role.code, 'Screen Mapping');
    const mapping = list.mapping(role.code);
    await mapping.showAll();

    await test.step('1-2. A screen with configurable elements shows the purple Screen Config button', async () => {
      await expect(mapping.configButton(target)).toBeVisible();
      await expectColour(mapping.configButton(target), 'purple', 'FSD §5.4.1: Screen Config button is purple', { soft: true });
    });

    await test.step('Screen Config opens the Screen Configuration panel for that screen only', async () => {
      const config = await mapping.openConfig(target, target.name);
      await expect(config.title).toHaveText(target.name);
      await config.cancel();
    });
    notVerified('Rows without configurable elements show a dash', 'every screen registered on this host has at least its page element configurable (FSD gap G19)');
  });

  test('TC-040 | A role cannot be assigned to a user unless at least one screen is mapped @critical @mc @roleconfig @regression', async ({ page, roles, api, userRolePicker }) => {
    traceTo('§6', 'BR-ROLES-003');
    const role = await roles.active({ baseRole: 'Business Maker' });
    const offered = async () => {
      const writes = await blockWrites(page, '**/api/**');
      await userRolePicker.open();
      const count = await userRolePicker.roleOption(role.code).count();
      await userRolePicker.close();
      await writes.release();
      return count > 0;
    };

    await test.step('Precondition: unmap every screen of the Active role (approved)', async () => {
      const mapped = (await api.roleScreens(role.code)).filter((s) => s.isMapped);
      await api.approve(await api.mapScreens(role.code, mapped.map((s) => ({ app: s.app, pageCode: s.pageCode, unmap: true as const })), 'Unmap all for TC-040'));
      expect((await api.roleScreens(role.code)).filter((s) => s.isMapped)).toHaveLength(0);
    });

    await test.step('1-2. The role with no screens is not offered for assignment', async () => {
      expect(await offered()).toBe(false);
    });

    await test.step('3-4. Map one screen and approve: the role is offered for assignment', async () => {
      await api.approve(await api.mapScreens(role.code, [{ app: screens.department.app, pageCode: screens.department.code, accessPrivilege: 'Viewer' }], 'Map one screen for TC-040'));
      expect(await offered()).toBe(true);
    });
    notVerified('The assignment itself succeeds, and the rule holds for API assignments', 'needs a user record the suite may change, and the user API contract');
  });

  test('TC-041 | Screen Mapping is only possible after the Add Role request is approved @critical @negative @mc @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§5.4', 'BR-ROLES-013');
    const role = await roles.pending({ baseRole: 'Business Maker' });

    await test.step('1-2. Pending new role: Screen Map opens read-only', async () => {
      await list.openRole(role.code, 'Screen Mapping');
      const mapping = list.mapping(role.code);
      await mapping.waitForLoad();
      await expect(mapping.subtitle).toHaveText(fsd.mapping.subtitleView(role.code));
      await expect(mapping.saveButton).toHaveCount(0);
      await expect(mapping.headerCheckbox).toHaveCount(0);
      await mapping.close();
    });

    await test.step('3-4. After the Checker approves, mapping can be changed and saved', async () => {
      await api.approve(role.requestId);
      await list.openRole(role.code, 'Screen Mapping');
      const mapping = list.mapping(role.code);
      await mapping.showAll();
      await expect(mapping.subtitle).toHaveText(fsd.mapping.subtitleEdit);
      await mapping.tick(screens.department, 'Viewer');
      await mapping.save('Mapping after approval');
      await expect(mapping.dialog).toBeHidden();
      await expect(list.notification(role.code)).toBeVisible();
    });
  });

  test('TC-042 | Only one workflow action can be in progress for a role at any time @critical @negative @mc @roleconfig @regression', async ({ page, rolesListPage: list, roles, api }) => {
    traceTo('§5.4', 'BR-ROLES-013');
    const role = await roles.active({ baseRole: 'Business Maker' });

    await test.step('1. Submit a Role Modification', async () => {
      await list.openRole(role.code, 'View & Modify');
      await list.viewModify.change({ description: `${role.description} - pending`, comments: 'First request' });
      await list.viewModify.save();
      await expect(list.viewModify.dialog).toBeHidden();
    });

    await test.step('2. Screen Mapping cannot be submitted while it is pending', async () => {
      await list.openRole(role.code, 'Screen Mapping');
      const mapping = list.mapping(role.code);
      await mapping.waitForLoad();
      await expect(mapping.saveButton).toHaveCount(0);
      await expect(mapping.subtitle).toHaveText(fsd.mapping.subtitleView(role.code));
      await mapping.close();
    });

    await test.step('3. Delete cannot be requested either; an informational message explains why', async () => {
      await expect(list.rowAction(role.code, 'Delete')).toBeDisabled();
      // The disabled button's wrapper carries the explanation as a tooltip (FSD gap G10: wording not specified).
      await expect(list.row(role.code).getByTitle(/\S/).filter({ has: page.getByRole('button', { name: 'Delete', exact: true }) })).toHaveCount(1);
    });

    await test.step('4-5. After the Checker decides, a new action can be initiated', async () => {
      await api.approve(await api.pendingRequestId(role.code));
      await list.openRole(role.code, 'Screen Mapping');
      const mapping = list.mapping(role.code);
      await mapping.showAll();
      await mapping.tick(screens.department, 'Viewer');
      await mapping.save('Second request after approval');
      await expect(mapping.dialog).toBeHidden();
      await expect(list.notification(role.code)).toBeVisible();
    });
  });

  test('TC-043 | Screen Mapping and Screen Config are read-only for a Disabled (approved) role @critical @negative @mc @roleconfig @regression', async ({ rolesListPage: list, roles }) => {
    traceTo('§5.4', 'BR-ROLES-014');
    const role = await roles.disabled({ baseRole: 'Business Maker' });
    await list.openRole(role.code, 'Screen Mapping');
    const mapping = list.mapping(role.code);
    await mapping.showAll();

    await test.step('1-3. View mode: "<code> — view only", only Close, no ticking or privilege changes', async () => {
      await expect(mapping.subtitle).toHaveText(fsd.mapping.subtitleView(role.code));
      await expect(mapping.closeButton).toBeVisible();
      await expect(mapping.saveButton).toHaveCount(0);
      await expect(mapping.dialog.getByRole('checkbox')).toHaveCount(0);
      await expect(mapping.dialog.getByRole('combobox', { name: /^Access privilege/ })).toHaveCount(0);
    });

    await test.step('4. Screen Config opens with no toggles and no Save Config', async () => {
      const config = await mapping.openConfig(screens.chargeConfig, screens.chargeConfig.name);
      await expect(config.dialog.getByRole('switch', { disabled: false })).toHaveCount(0);
      await expect(config.saveButton).toHaveCount(0);
    });
  });

  test('TC-044 | Save Mapping under Maker-Checker sets Pending without disrupting existing users @critical @mc @roleconfig @regression', async ({ page, rolesListPage: list, roles, checker, userRolePicker }) => {
    traceTo('§8 rows 5-6');
    const role = await roles.active({ baseRole: 'Business Maker' });

    await test.step('1-2. Add one screen and remove one, comment, Save Mapping', async () => {
      await list.openRole(role.code, 'Screen Mapping');
      const mapping = list.mapping(role.code);
      await mapping.showAll();
      await mapping.tick(screens.department, 'Viewer');
      await mapping.untick(screens.dashboard);
      await mapping.save('Mapping realigned');
      await expect(mapping.dialog).toBeHidden();
    });

    await test.step('3. Roles List: Status Pending, Last Action "Modify Screen Mapping"', async () => {
      await list.goto();
      await list.findRole(role.code);
      await expect(list.cell(role.code, 'Last Action')).toHaveText(fsd.lastAction.modifyMapping);
      await expect.soft(list.cell(role.code, 'Status'), 'FSD §8 row 5: Status Pending until the Checker decides').toHaveText('Pending');
    });

    await test.step('The role remains OK for user assignment', async () => {
      const writes = await blockWrites(page, '**/api/**');
      await userRolePicker.open();
      await expect(userRolePicker.roleOption(role.code)).toBeVisible();
      await userRolePicker.close();
      await writes.release();
    });

    await test.step('5. Checker approves: Status Active (unchanged), new mapping in effect', async () => {
      const review = await checker.approvalQueue.openRoleReview(role.code);
      await review.approve(remarks.approve);
      await list.goto();
      await list.findRole(role.code);
      await expect(list.cell(role.code, 'Status')).toHaveText('Active');
      await expect(list.cell(role.code, 'Last Action')).toHaveText(fsd.lastAction.modifyMapping);
      await list.open(role.code, 'Screen Mapping');
      const mapping = list.mapping(role.code);
      await mapping.showAll();
      await expect(mapping.rowCheckbox(screens.department)).toBeChecked();
      await expect(mapping.rowCheckbox(screens.dashboard)).not.toBeChecked();
    });
    notVerified('4. Existing users keep the old mapping until approval, then get the new one', 'needs a business user assigned to the role');
  });
});
