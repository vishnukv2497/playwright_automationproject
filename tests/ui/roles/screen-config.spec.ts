import { test, expect } from '../../../fixtures/roles.fixture';
import { blockWrites } from '../../../utils/network.util';
import { rolesData as data } from '../../../testdata/roles.data';

/**
 * Roles FSD §5.5 — Screen Configuration (TC_ROLE_043, 044).
 *
 * This build's Screen Config tab lists each element with a "Granted" checkbox and a "Mode"
 * select (No opinion / hidden / disabled) in place of the FSD's Enable / Editable toggles,
 * and submits the whole screen at once. Rail elements are read-only here (managed through
 * Rail Access). Seeded role, writes blocked; the drawer is closed without submitting.
 */
test.describe('Roles - Screen Configuration', () => {
  test.describe.configure({ timeout: 120_000 });

  const role = data.seeded.withHistory;
  let attempted: string[];

  test.beforeEach(async ({ page, rolesPage }) => {
    ({ attempted } = await blockWrites(page));
    await rolesPage.goto();
    await rolesPage.openAction(role.code, 'View');
    const detail = rolesPage.detail(role.code);
    await detail.openTab('Screen Config');
    await detail.configScreen.selectOption({ label: role.configScreen });
  });

  test('TC_ROLE_043 Element controls are independent per element; rail elements are read-only @roles @config @high', async ({ rolesPage }) => {
    const detail = rolesPage.detail(role.code);
    const pageMode = (await detail.elementModeLabel(role.pageElement).textContent())!.trim();
    const pageGranted = await detail.elementGranted(role.pageElement).isChecked();
    const actionGranted = await detail.elementGranted(role.actionElement).isChecked();

    await detail.elementMode(role.actionElement).selectOption({ label: 'hidden' });

    await expect(detail.elementModeLabel(role.actionElement)).toHaveText('hidden');
    await expect(detail.elementModeLabel(role.pageElement), 'changing one element moved another').toHaveText(pageMode);
    expect(await detail.elementGranted(role.pageElement).isChecked()).toBe(pageGranted);
    expect(await detail.elementGranted(role.actionElement).isChecked()).toBe(actionGranted);

    await expect(detail.elementGranted(role.railElement)).toBeDisabled();
    await expect(detail.elementMode(role.railElement)).toBeDisabled();

    await detail.close();
  });

  test('TC_ROLE_044 Blank Modification Comments blocks Save Config @roles @config @high @negative', async ({ rolesPage }) => {
    const detail = rolesPage.detail(role.code);

    await detail.elementMode(role.actionElement).selectOption({ label: 'hidden' });
    await detail.configSubmit.click();

    await expect(detail.panel.getByText(data.messages.remarksRequired)).toBeVisible();
    expect(attempted, 'a Screen Config change without comments reached the server').toEqual([]);
    await detail.close();
  });
});
