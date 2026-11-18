import { test, expect } from '../../../fixtures/roles.fixture';
import { ROLE_COLUMNS, RowAction } from '../../../Pages/RolesPage';
import { blockWrites } from '../../../utils/network.util';
import { rolesData as data } from '../../../testdata/roles.data';

/** Roles FSD §5.2 — Roles List (TC_ROLE_014–016). Read-only against seeded roles. */
test.describe('Roles - Roles List', () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeEach(async ({ rolesPage }) => {
    await rolesPage.goto();
  });

  test('TC_ROLE_014 Roles grid displays correct data for each column of a role @roles @grid @high', async ({ page, rolesPage }) => {
    const role = data.seeded.withUsers;

    await test.step('Columns', async () => {
      for (const column of ROLE_COLUMNS) {
        await expect(rolesPage.columnHeader(column), column).toBeVisible();
      }
      await expect(page.getByRole('main').getByRole('columnheader')).toHaveCount(ROLE_COLUMNS.length);
    });

    await test.step('Every row is well-formed', async () => {
      for (const created of await rolesPage.columnValues('Created')) expect(created).toMatch(data.gridDate);
      for (const modified of await rolesPage.columnValues('Last Modified')) expect(modified).toMatch(data.gridDate);
      for (const users of await rolesPage.columnValues('Users')) expect(users).toMatch(/^\d+$/);
      for (const status of await rolesPage.columnValues('Status')) expect(data.statuses).toContain(status);
    });

    await test.step(`${role.code} row matches its own detail record`, async () => {
      await expect(rolesPage.roleRow(role.code)).toContainText(role.description);
      await expect(rolesPage.cell(role.code, 'Base Role')).toHaveText(role.baseRole);
      // The cell carries text-right but renders left-aligned (computed text-align: left).
      await expect.soft(rolesPage.cell(role.code, 'Users'), 'FSD: Total Users is right-aligned').toHaveCSS('text-align', 'right');

      const status = (await rolesPage.cell(role.code, 'Status').textContent())!.trim();
      await rolesPage.openAction(role.code, 'View');
      const detail = rolesPage.detail(role.code);
      await expect(detail.overviewValue('Role Name')).toHaveText(role.code);
      await expect(detail.overviewValue('Base Role')).toHaveText(role.baseRole);
      await expect(detail.overviewValue('Description')).toHaveText(role.description);
      await expect(detail.overviewValue('Status')).toHaveText(status);
    });
  });

  test('TC_ROLE_015 Status badges show only Active / Disabled / Pending @roles @grid @high', async ({ page, rolesPage }) => {
    await test.step('All tab', async () => {
      for (const status of await rolesPage.columnValues('Status')) {
        expect(data.statuses, `unexpected role status "${status}"`).toContain(status);
      }
      const active = (await rolesPage.roleCodes())[(await rolesPage.columnValues('Status')).indexOf('Active')];
      await expect(rolesPage.statusBadge(active)).toHaveClass(/\bsuccess\b/);
    });

    for (const tab of ['Active', 'Pending', 'Disabled'] as const) {
      await test.step(`${tab} tab`, async () => {
        await rolesPage.tab(tab).click();
        await expect(rolesPage.tab(tab)).toHaveAttribute('aria-selected', 'true');
        await expect
          .poll(async () => (await rolesPage.columnValues('Status')).filter((s) => s !== tab), { message: `rows outside ${tab}` })
          .toEqual([]);
      });
    }
  });

  test('TC_ROLE_016 Each row exposes View, Edit, Screen Mapping, Audit Trail, Delete actions bound to that row @roles @grid @high', async ({ page, rolesPage }) => {
    await blockWrites(page);

    for (const code of [data.seeded.plain.code, data.seeded.plainB.code]) {
      await test.step(code, async () => {
        const detail = rolesPage.detail(code);
        const tabFor: Partial<Record<RowAction, 'Overview' | 'Screen Mapping' | 'Audit Trail'>> = {
          View: 'Overview',
          'Screen Mapping': 'Screen Mapping',
          'Audit Trail': 'Audit Trail',
        };
        for (const [action, tab] of Object.entries(tabFor) as [RowAction, string][]) {
          await rolesPage.openAction(code, action);
          await expect(detail.dialog, `${action} opens ${code}`).toBeVisible();
          await expect(detail.tab(tab as 'Overview')).toHaveAttribute('aria-selected', 'true');
          await detail.close();
        }

        await rolesPage.openAction(code, 'Edit');
        await expect(page.getByRole('dialog', { name: `Modify ${code}`, exact: true })).toBeVisible();
        await expect(rolesPage.form.roleName).toHaveValue(code);
        await rolesPage.form.cancel();

        await rolesPage.openAction(code, 'Delete');
        await expect(rolesPage.deleteDrawer.dialog(code)).toBeVisible();
        await rolesPage.deleteDrawer.cancel(code);
      });
    }
  });
});
