import { test, expect } from '../../../fixtures/roles.fixture';
import { blockWrites } from '../../../utils/network.util';
import { rolesData as data } from '../../../testdata/roles.data';
import type { AccessPrivilege } from '../../../Pages/RoleDrawers';

/**
 * Roles FSD §5.4 — Screen Mapping (TC_ROLE_034, 036, 038).
 *
 * This build maps one screen at a time: each row's "Modify mapping" opens a drawer with an
 * Access privilege select (Unmapped / Viewer / Actor) and mandatory comments, instead of the
 * FSD's checkbox grid + single Save Mapping. Seeded roles, writes blocked.
 */
test.describe('Roles - Screen Mapping', () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ rolesPage }) => {
    await rolesPage.goto();
  });

  test('TC_ROLE_034 Blank Modification Comments blocks Save Mapping @roles @mapping @high @negative', async ({ page, rolesPage }) => {
    const { attempted } = await blockWrites(page);
    const code = data.seeded.plain.code;

    await rolesPage.openAction(code, 'Screen Mapping');
    const detail = rolesPage.detail(code);
    const row = detail.mappingRows.first();
    const screen = await detail.screenName(row);
    const current = (await detail.privilegeCell(row).innerText()).trim() as AccessPrivilege;

    await row.getByRole('button', { name: 'Modify mapping' }).click();
    const mapping = rolesPage.mappingDrawer(screen);
    await mapping.setPrivilege(current === 'Unmapped' ? 'Viewer' : 'Unmapped');
    await mapping.submitButton.click();

    await expect(mapping.dialog.getByText(data.messages.remarksRequired)).toBeVisible();
    await expect(mapping.dialog).toBeVisible();
    expect(attempted, 'a mapping change without comments reached the server').toEqual([]);
    await mapping.cancel();
  });

  test('TC_ROLE_036 Screen Config is available only for mapped screens @roles @mapping @high', async ({ page, rolesPage }) => {
    await blockWrites(page);
    const code = data.seeded.withHistory.code;

    await rolesPage.openAction(code, 'Screen Mapping');
    const detail = rolesPage.detail(code);
    await expect(detail.mappedSummary).toBeVisible();

    await detail.screenFilter.selectOption('Mapped');
    await expect(detail.mappingRows.first()).toBeVisible();
    for (const row of await detail.mappingRows.all()) {
      await expect(row.getByRole('button', { name: 'Screen Config' }), await detail.screenName(row)).toBeEnabled();
    }

    await detail.screenFilter.selectOption('Unmapped');
    await expect(detail.mappingRows.first()).toBeVisible();
    for (const row of await detail.mappingRows.all()) {
      await expect(row.getByRole('button', { name: 'Screen Config' }), await detail.screenName(row)).toBeDisabled();
    }
    // FSD §5.4.1 keys availability on "has configurable elements" and shows '—' otherwise;
    // this build keys it on "is mapped" and disables the button instead.
  });

  test('TC_ROLE_038 Cancel on Screen Mapping makes no change @roles @mapping @high', async ({ page, rolesPage }) => {
    const { attempted } = await blockWrites(page);
    const code = data.seeded.plain.code;

    await rolesPage.openAction(code, 'Screen Mapping');
    const detail = rolesPage.detail(code);
    const row = detail.mappingRows.first();
    // The summary reads "0 of 0 mapped" until the screen list has loaded.
    await expect(row).toBeVisible();
    const summaryBefore = await detail.mappedSummary.innerText();
    const screen = await detail.screenName(row);
    const before = (await detail.privilegeCell(row).innerText()).trim() as AccessPrivilege;

    await row.getByRole('button', { name: 'Modify mapping' }).click();
    const mapping = rolesPage.mappingDrawer(screen);
    await mapping.setPrivilege(before === 'Actor' ? 'Viewer' : 'Actor');
    await mapping.comments.fill('Will be cancelled');
    await mapping.cancel();

    await expect(detail.privilegeCell(detail.mappingRow(screen))).toHaveText(before);
    await expect(detail.mappedSummary).toHaveText(summaryBefore);
    expect(attempted).toEqual([]);
  });
});
