import { test, expect, traceTo, notVerified } from '../../../fixtures/roleconfig.fixture';
import { blockWrites } from '../../../utils/network.util';
import { fsd, screens } from '../../../testdata/roleconfig.data';
import { RolesListPage } from '../../../Pages/roleconfig/RolesListPage';
import { ScreenConfigPanel } from '../../../Pages/roleconfig/ScreenConfigPanel';

/** Opens Screen Mapping for the role and drills into one screen's Screen Configuration. */
async function openConfig(list: RolesListPage, code: string, screen: { app: string; code: string; name: string }): Promise<ScreenConfigPanel> {
  await list.openRole(code, 'Screen Mapping');
  const mapping = list.mapping(code);
  await mapping.showAll();
  return mapping.openConfig(screen, screen.name);
}

/** Roles FSD v1.4 §5.5 — Screen Configuration panel (manual cases TC-045 … TC-052). */
test.describe('Role Configuration - Screen Configuration', () => {
  test.describe('on a wide screen', () => {
    // At 1280px every drawer fills the viewport; a wider viewport lets the "wide" variant show.
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('TC-045 | Only elements Enabled at Screen Maintenance level are available for role-level configuration @critical @roleconfig @regression', async ({ rolesListPage: list, roles }) => {
      traceTo('§5.5');
      const role = await roles.active({ baseRole: 'Business Maker' });
      const config = await openConfig(list, role.code, screens.chargeConfig);

      await test.step('4. Wide right slide-in: label SCREEN CONFIGURATION, screen name as title', async () => {
        await expect.soft(config.label, 'FSD §5.5 label').toHaveText(fsd.config.label, { useInnerText: true });
        await expect(config.title).toHaveText(screens.chargeConfig.name);
        await expect.soft(config.subtitle, 'FSD §5.5 sub-title').toHaveText(fsd.config.subtitle);
        const mappingWidth = await list.drawerWidth(list.mapping(role.code).dialog);
        expect.soft(await config.drawerWidth(config.dialog), 'FSD §5.5: wide variant, wider than the Screen Mapping panel').toBeGreaterThan(mappingWidth);
      });

      await test.step('3. Columns: Element, Element Data List, Element Type, Description, Enable, Editable', async () => {
        const headers = await config.headers();
        for (const column of fsd.config.columns) expect.soft(headers, `FSD §5.5 column "${column}"`).toContain(column);
      });
      notVerified('1-2. Only elements Enabled at Screen Maintenance level are offered', 'needs a screen whose element enablement the suite may change in the Screens master');
    });
  });

  test('TC-046 | Disabling an element at role level hides it from the screen for that role\'s users @critical @mc @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§5.5', 'BR-ROLES-009');
    const roleA = await roles.active({ baseRole: 'Business Maker' });
    const roleB = await roles.active({ baseRole: 'Business Maker' });
    const screen = screens.chargeConfig;
    const element = screen.element.key;

    await test.step('1-3. Toggle Enable OFF for an enabled element, comment, Save Config', async () => {
      const config = await openConfig(list, roleA.code, screen);
      await expect(config.enableSwitch(element)).toBeChecked();
      await config.enableSwitch(element).click();
      await expect(config.enableSwitch(element)).not.toBeChecked();
      await config.save('Approval withdrawn for this role');
      await expect(config.dialog).toBeHidden();
      await expect(list.notification(roleA.code)).toBeVisible();
    });

    await test.step('4. Checker approves: the element is disabled for this role only', async () => {
      await api.approve(await api.pendingRequestId(roleA.code));
      const config = await openConfig(list, roleA.code, screen);
      await expect(config.enableSwitch(element)).not.toBeChecked();
      const other = await openConfig(list, roleB.code, screen);
      await expect(other.enableSwitch(element), 'Another role on the same screen is unaffected').toBeChecked();
    });
    notVerified('5-6. The element is hidden for every user of the role and visible for users of other roles', 'needs business users assigned to both roles');
  });

  test('TC-047 | Enable and Editable are independent per-element decisions @critical @mc @roleconfig @regression', async ({ rolesListPage: list, roles }) => {
    traceTo('§5.5', 'BR-ROLES-009');
    const role = await roles.active({ baseRole: 'Business Maker' });
    const config = await openConfig(list, role.code, screens.sifSummary);
    const elements = await config.elements();
    const inputs = elements.filter((e) => fsd.config.inputTypes.includes(e.type.toUpperCase()));

    await test.step('1-3. Input fields expose Enable and, independently, Editable', async () => {
      expect(inputs.length, 'The screen has input elements').toBeGreaterThan(0);
      for (const e of inputs) {
        expect(e.enableKey, `${e.type} element has an Enable toggle`).not.toBeNull();
        expect(e.editableSwitch, `FSD §5.5: ${e.type} element (${e.enableKey}) has an Editable toggle`).toBe(true);
      }
    });
    notVerified('5. Only enabled fields are visible and only editable ones accept input for users of the role', 'needs a business user assigned to the role');
  });

  test.fixme('TC-048 | Most restrictive privilege takes precedence between screen level and role level @critical @roleconfig @regression', async () => {
    traceTo('§5.5');
    test.info().annotations.push({ type: 'blocked', description: 'Needs element enablement/editability changes in the Screens master (system configuration) and a business user to observe the effective access' });
  });

  test('TC-049 | Editable column is not applicable to display-only elements @high @roleconfig @regression', async ({ rolesListPage: list, roles }) => {
    traceTo('§5.5');
    const role = await roles.active({ baseRole: 'Business Maker' });
    const config = await openConfig(list, role.code, screens.sifSummary);
    const elements = await config.elements();

    await test.step('1-3. Display-only elements show a dash in Editable', async () => {
      const displayOnly = elements.filter((e) => fsd.config.displayOnlyTypes.includes(e.type.toUpperCase()));
      expect(displayOnly.length, `Element types read: ${JSON.stringify(elements.map((e) => e.type))}`).toBeGreaterThan(0);
      for (const e of displayOnly) {
        expect(e.editableText, `${e.type} ${e.enableKey}`).toBe('—');
        expect(e.editableSwitch).toBe(false);
      }
    });

    await test.step('4. Input elements expose a working Editable toggle', async () => {
      for (const e of elements.filter((x) => fsd.config.inputTypes.includes(x.type.toUpperCase()))) {
        expect.soft(e.editableSwitch, `FSD §5.5: ${e.type} element ${e.enableKey} has an Editable toggle (shows "${e.editableText}")`).toBe(true);
      }
    });

    await test.step('The Enable toggle is available for every element type', async () => {
      for (const e of elements) expect(e.enableKey, `${e.type} element has an Enable toggle`).not.toBeNull();
    });
  });

  test('TC-050 | Administrators cannot add, modify or remove screen elements @high @negative @roleconfig @regression', async ({ page, rolesListPage: list, roles }) => {
    traceTo('§5.5');
    const role = await roles.active({ baseRole: 'Business Maker' });
    const writes = await blockWrites(page, '**/api/**');
    const config = await openConfig(list, role.code, screens.chargeConfig);

    await test.step('2. No Add / Edit / Delete element control', async () => {
      await expect(config.dialog.getByRole('button', { name: /^(add|new|edit|delete|remove)\b/i })).toHaveCount(0);
    });

    await test.step('3-4. Element name, type and description cannot be edited; no new rows can be added', async () => {
      await expect(config.rows.getByRole('textbox')).toHaveCount(0);
      await expect(config.rows.getByRole('combobox')).toHaveCount(0);
      const interactive = config.rows.locator('button, input, select, textarea, [contenteditable="true"]');
      const kinds = await interactive.evaluateAll((els) => els.map((e) => e.getAttribute('role') ?? e.tagName));
      for (const kind of kinds) expect(kind, 'Only the Enable / Editable toggles are interactive').toBe('switch');
    });
    await config.cancel();
    expect(writes.attempted).toEqual([]);
  });

  test('TC-051 | Modification Comments is mandatory before Save Config @critical @negative @mc @roleconfig @regression', async ({ page, rolesListPage: list, roles, api }) => {
    traceTo('§5.5', 'BR-ROLES-005', 'BR-ROLES-006');
    const role = await roles.active({ baseRole: 'Business Maker' });
    const config = await openConfig(list, role.code, screens.chargeConfig);
    await config.enableSwitch(screens.chargeConfig.element.key).click();

    await test.step('1-2. Comments blank: Save Config is blocked', async () => {
      const writes = await blockWrites(page, '**/api/**');
      await config.saveButton.click();
      await expect(config.dialog).toBeVisible();
      expect(writes.attempted, 'No configuration change is committed').toEqual([]);
      await writes.release();
      await expect(config.commentsHint).toBeVisible();
    });

    await test.step('3. Valid comments: saved, panel closes, success toast', async () => {
      await config.save('Element restrictions applied for this role');
      await expect(config.dialog).toBeHidden();
      await expect(list.notification(role.code)).toBeVisible();
    });

    await test.step('4. The comment is on the Screen Config audit card and cannot be edited or deleted', async () => {
      await api.approve(await api.pendingRequestId(role.code));
      await list.openRole(role.code, 'Audit Trail');
      const audit = list.audit(role.code);
      await audit.waitForLoad();
      const card = audit.cards.filter({ hasText: 'Comments: Element restrictions applied for this role' });
      await expect(card).toHaveCount(1);
      await expect(card.getByText('Screen Config', { exact: true }).first()).toBeVisible();
      await expect(card.getByRole('button', { name: /edit|delete|remove/i })).toHaveCount(0);
      await expect(card.getByRole('textbox')).toHaveCount(0);
    });
  });

  test('TC-052 | Cancel on Screen Configuration discards all toggle changes @high @roleconfig @regression', async ({ page, rolesListPage: list, roles, api }) => {
    traceTo('§5.5 Panel Footer');
    const role = await roles.active({ baseRole: 'Business Maker' });
    const auditBefore = await api.auditTotal(role.code);
    const writes = await blockWrites(page, '**/api/**');
    let config = await openConfig(list, role.code, screens.chargeConfig);
    const before = await config.elements();
    const toggles = before.filter((e) => e.enableKey && !e.switchDisabled).slice(0, 2);

    await test.step('1-3. Change several toggles, comment, Cancel: the panel closes without saving', async () => {
      for (const e of toggles) await config.enableSwitch(e.enableKey!).click();
      await config.comments.fill('Discard check');
      await config.cancel();
      await expect(list.mapping(role.code).dialog, 'Back on the Screen Mapping panel').toBeVisible();
    });

    await test.step('4. Re-open: toggles are back to their saved state; nothing was recorded', async () => {
      config = await list.mapping(role.code).openConfig(screens.chargeConfig, screens.chargeConfig.name);
      for (const e of toggles) {
        if (e.enabled) await expect(config.enableSwitch(e.enableKey!)).toBeChecked();
        else await expect(config.enableSwitch(e.enableKey!)).not.toBeChecked();
      }
      expect(writes.attempted).toEqual([]);
      expect(await api.auditTotal(role.code)).toBe(auditBefore);
    });
  });
});
