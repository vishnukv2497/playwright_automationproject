import fs from 'fs';
import { test, expect, traceTo, notVerified, expectColour } from '../../../fixtures/roleconfig.fixture';
import { blockWrites } from '../../../utils/network.util';
import { parseCsv } from '../../../utils/csv.util';
import { colourOf } from '../../../utils/colour.util';
import { fsd, remarks } from '../../../testdata/roleconfig.data';

/** Roles FSD v1.4 §5.2 — Roles List grid and badges (manual cases TC-011 … TC-018). */
test.describe('Role Configuration - Roles List', () => {
  test('TC-011 | Roles List displays all defined columns with correct data and formats @high @smoke @roleconfig @regression', async ({ rolesListPage: list }) => {
    traceTo('§4, §5.2.1');
    await list.goto();

    await test.step('2. Breadcrumb, page title and sub-title', async () => {
      await expect(list.breadcrumb).toHaveText(/Payment Hub Operations Console\s*›\s*Administration\s*›\s*Roles/);
      await expect(list.heading).toHaveText(fsd.page.title);
      await expect(list.subtitle).toHaveText(fsd.page.subtitle);
    });

    await test.step('3. Every FSD column is displayed', async () => {
      // DOM text, not innerText: the headers are upper-cased by CSS only.
      const headers = (await list.columnHeaders.allTextContents()).map((h) => h.replace(/[▼▲]/g, '').trim());
      for (const column of fsd.gridColumns) {
        expect.soft(headers, `FSD §5.2.1 column "${column}"`).toContain(column);
      }
    });

    await test.step('4. Created and Last Modified show date and time as DD-MM-YYYY HH:MM:SS', async () => {
      for (const column of ['Created Date', 'Last Modified'] as const) {
        const values = await list.columnValues(column);
        expect(values.length).toBeGreaterThan(0);
        for (const value of values) expect(value, `${column} "${value}"`).toMatch(fsd.formats.gridDateTime);
      }
    });

    await test.step('5. Total Users is a right-aligned number', async () => {
      const values = await list.columnValues('Total Users');
      for (const value of values) expect(value).toMatch(/^\d+$/);
      const code = (await list.codesOnPage())[0];
      const cell = list.cell(code, 'Total Users');
      const rightAligned = await cell.evaluate((td) => {
        const box = td.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(td);
        const text = range.getBoundingClientRect();
        return box.right - text.right <= text.left - box.left;
      });
      expect.soft(rightAligned, 'FSD §5.2.1: Total Users is right-aligned').toBe(true);
    });
    notVerified('Total Users equals the number of users assigned to the role', 'needs a business user whose role assignments the suite may change (User module)');
  });

  test('TC-012 | Serial number (Sl) is sequential within the page and resets on filter @high @roleconfig @regression', async ({ rolesListPage: list }) => {
    traceTo('§5.2.1 Column 1');
    const sequence = (n: number) => Array.from({ length: n }, (_, i) => String(i + 1));
    await list.goto();

    await test.step('1. Sl runs 1..N on the first page with no gaps', async () => {
      const sl = await list.columnValues('Sl');
      expect(sl).toEqual(sequence(sl.length));
    });

    await test.step('2. After a Status filter, Sl restarts from 1', async () => {
      await list.filter({ status: 'Active' });
      for (const status of await list.columnValues('Status')) expect(status).toBe('Active');
      const sl = await list.columnValues('Sl');
      expect(sl).toEqual(sequence(sl.length));
      await list.clearFilters();
    });

    await test.step('3. Page 2: Sl is sequential with no gaps, 1..N within the page', async () => {
      test.skip(!(await list.nextPage.isEnabled()), 'Only one page of roles in this environment');
      await list.nextPage.click();
      await expect(list.recordCount).toHaveText(/^Showing\s*21–/);
      const sl = (await list.columnValues('Sl')).map(Number);
      for (let i = 1; i < sl.length; i++) expect(sl[i], 'No gaps or skipped numbers').toBe(sl[i - 1] + 1);
      expect.soft(sl[0], 'FSD §5.2.1: "sequential 1..N within the current page"').toBe(1);
    });
  });

  test('TC-013 | Status badge colour and value mapping on the grid @high @mc @roleconfig @regression', async ({ rolesListPage: list, roles }) => {
    traceTo('§5.2.3');
    const pending = await roles.pending();
    const disabled = await roles.disabled();
    const active = await roles.active();
    await list.goto();

    for (const [label, code, status] of [
      ['2. Active role', active.code, 'Active'],
      ['3. Disabled role', disabled.code, 'Disabled'],
      ['4. Pending role', pending.code, 'Pending'],
    ] as const) {
      await test.step(`${label}: ${status} badge is ${fsd.statuses[status]}`, async () => {
        await list.findRole(code);
        await expect(list.cell(code, 'Status')).toHaveText(status);
        await expectColour(list.statusBadge(code), fsd.statuses[status], `FSD §5.2.3: ${status} badge is ${fsd.statuses[status]}`, { soft: true });
      });
    }

    await test.step('5. No status other than Active, Disabled or Pending appears', async () => {
      await list.clearFilters();
      await list.showMaxRowsPerPage();
      const shown = new Set(await list.columnValues('Status'));
      for (const status of shown) expect(Object.keys(fsd.statuses), `Status "${status}"`).toContain(status);
      await list.showFilters();
      const filterOptions = (await list.statusFilter.locator('option').allTextContents()).map((o) => o.trim()).filter((o) => o !== 'All');
      expect(filterOptions.sort()).toEqual(Object.keys(fsd.statuses).sort());
    });
  });

  test('TC-014 | Last Action reflects the most recent workflow action on the record @critical @mc @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§5.2.1 Column 11, §8');
    const role = await roles.active();

    await test.step('1-2. Approved new role: Last Action "New Role", Status Active', async () => {
      await list.goto();
      await list.findRole(role.code);
      await expect(list.cell(role.code, 'Last Action')).toHaveText(fsd.lastAction.newRole);
      await expect(list.cell(role.code, 'Status')).toHaveText('Active');
    });

    await test.step('3. Submit a Modify: Last Action updates to "Modify Role" immediately', async () => {
      await list.open(role.code, 'View & Modify');
      await list.viewModify.change({ description: `${role.description} - modified`, comments: remarks.modify });
      await list.viewModify.save();
      await expect(list.viewModify.dialog).toBeHidden();
      await list.goto();
      await list.findRole(role.code);
      await expect(list.cell(role.code, 'Last Action')).toHaveText(fsd.lastAction.modifyRole);
      await expect.soft(list.cell(role.code, 'Status'), 'FSD §8 row 3: Status is Pending while the Modify awaits the Checker').toHaveText('Pending');
    });

    await test.step('Checker rejects: Last Action "Modify Role - Rejected", existing Status kept', async () => {
      await api.reject(await api.pendingRequestId(role.code), remarks.reject);
      await list.goto();
      await list.findRole(role.code);
      await expect(list.cell(role.code, 'Last Action')).toHaveText(fsd.lastAction.rejected(fsd.lastAction.modifyRole));
      await expect(list.cell(role.code, 'Status')).toHaveText('Active');
    });
  });

  test('TC-015 | Combined filter and search returns correctly narrowed results @high @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§5.2, Common Grid Features FSD');
    const token = `QA${Date.now().toString(36).toUpperCase()}`;
    const described = await roles.pending({ description: `Search ${token} role` });
    const sample = (await api.roles()).find((r) => r.status === 'Active' && r.baseRole === 'Business Maker')!;
    const partial = sample.roleName.slice(0, 3);
    await list.goto();
    const totalBefore = await list.recordCount.innerText();

    await test.step(`1-4. Status Active + Base Role Business Maker + code "${partial}", then Search`, async () => {
      await list.filter({ status: 'Active', baseRole: 'Business Maker', code: partial });
      const codes = await list.codesOnPage();
      expect(codes).toContain(sample.roleName);
      for (const code of codes) {
        await expect(list.cell(code, 'Status')).toHaveText('Active');
        await expect(list.cell(code, 'Base Role')).toHaveText('Business Maker');
        expect(code.toLowerCase()).toContain(partial.toLowerCase());
      }
      await expect(list.recordCount).toHaveText(new RegExp(`^Showing\\s*1–${codes.length}\\s*of\\s*${codes.length}\\b`));
    });

    await test.step('Search matches the role description as well as the code', async () => {
      await list.clearFilters();
      await list.filter({ code: token });
      await expect.soft(list.row(described.code), 'TC-015: search matches on role description').toHaveCount(1);
    });

    await test.step('5. Reset restores the full list', async () => {
      await list.clearFilters();
      await expect(list.recordCount).toHaveText(totalBefore);
    });
  });

  test('TC-016 | Total Users count drives the delete pre-condition @critical @roleconfig @regression', async ({ page, rolesListPage: list, api }) => {
    traceTo('§5.2.1 Column 9', 'BR-ROLES-004');
    const held = (await api.roles()).find((r) => r.totalUsers > 0 && r.lastAction?.status !== 'Pending')!;
    const writes = await blockWrites(page, '**/api/**');
    await list.goto();
    await list.findRole(held.roleName);

    await test.step('1. Total Users shows the count of users currently assigned', async () => {
      await expect(list.cell(held.roleName, 'Total Users')).toHaveText(String(held.totalUsers));
    });

    await test.step('Count > 0: deletion cannot be confirmed', async () => {
      await list.open(held.roleName, 'Delete');
      const panel = list.deletePanel(held.roleName);
      await expect(panel.reason).toHaveCount(0);
      await expect(panel.deleteButton).toHaveCount(0);
      expect(writes.attempted).toEqual([]);
    });
    notVerified('Steps 2-4: the count follows user assignment / unassignment and delete becomes possible at zero', 'needs a business user whose role assignments the suite may change');
  });

  test('TC-017 | Row action buttons are present and open the correct panel @high @roleconfig @regression', async ({ page, rolesListPage: list, api }) => {
    traceTo('§5.2.4');
    const target = (await api.roles()).find((r) => r.lastAction?.status !== 'Pending' && /^[A-Za-z0-9-]+$/.test(r.roleName))!;
    const code = target.roleName;
    const writes = await blockWrites(page, '**/api/**');
    await list.goto();
    await list.findRole(code);

    await test.step('1. Four actions per row with the FSD names and styles', async () => {
      await expect(list.rowAction(code, 'View & Modify')).toHaveText('View & Modify');
      await expect(list.rowAction(code, 'Screen Mapping')).toHaveText('Screen Map');
      await expect.soft(list.rowAction(code, 'Audit Trail'), 'FSD §5.2.4 button "Audit"').toHaveText('Audit');
      await expect(list.rowAction(code, 'Delete')).toHaveText('Delete');
      const style = async (action: 'View & Modify' | 'Screen Mapping' | 'Delete') => [
        await colourOf(list.rowAction(code, action), 'background-color'),
        await colourOf(list.rowAction(code, action), 'color'),
      ];
      expect.soft(await style('View & Modify'), 'FSD: View & Modify is primary (blue)').toContain('blue');
      expect.soft(await style('Screen Mapping'), 'FSD: Screen Map is purple').toContain('purple');
      expect.soft(await style('Delete'), 'FSD: Delete is danger (red)').toContain('red');
    });

    await test.step('2. View & Modify opens the panel for this role', async () => {
      await list.open(code, 'View & Modify');
      await expect(list.viewModify.roleCode).toHaveValue(code);
      await list.viewModify.close();
    });

    await test.step('3. Screen Map opens the mapping panel for this role', async () => {
      await list.open(code, 'Screen Mapping');
      const mapping = list.mapping(code);
      await expect(mapping.title).toHaveText(code);
      await mapping.close();
    });

    await test.step('4. Audit opens the audit panel for this role', async () => {
      await list.open(code, 'Audit Trail');
      const audit = list.audit(code);
      await audit.waitForLoad();
      for (const card of await audit.readAll()) expect(card.roleLine.startsWith(`${code} / `)).toBe(true);
      await audit.close();
    });

    await test.step('5. Delete opens the delete flow for this role', async () => {
      await list.open(code, 'Delete');
      const panel = list.deletePanel(code);
      await expect(panel.title).toHaveText(code);
      await panel.cancel();
    });
    expect(writes.attempted).toEqual([]);
  });

  test('TC-018 | Export of the Roles List reflects the applied filters @high @roleconfig @regression', async ({ page, rolesListPage: list }) => {
    traceTo('§5.2, Common Grid Features FSD');
    await list.goto();
    await list.showMaxRowsPerPage();

    await test.step('1. Apply Status = Active', async () => {
      await list.filter({ status: 'Active' });
    });
    const codes = await list.codesOnPage();
    const grid = new Map<string, { users: string; created: string }>();
    for (const code of codes) {
      grid.set(code, { users: (await list.cell(code, 'Total Users').innerText()).trim(), created: (await list.cell(code, 'Created Date').innerText()).trim() });
    }

    const rows = await test.step('2. Export as CSV', async () => {
      const download = page.waitForEvent('download');
      await list.exportButton.click();
      await list.exportCsvButton.click();
      const file = await (await download).path();
      await test.info().attach('roles-export.csv', { path: file, contentType: 'text/csv' });
      return parseCsv(fs.readFileSync(file, 'utf-8'));
    });

    await test.step('3. Export holds only the filtered records, with the grid values', async () => {
      const [header, ...data] = rows;
      const col = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());
      expect(data).toHaveLength(codes.length);
      const codeCol = col('Role Code');
      expect(codeCol, `Role Code column in ${JSON.stringify(header)}`).toBeGreaterThanOrEqual(0);
      // The export writes "<code> — <description>" in the Role Code column.
      const exportedCode = (r: string[]) => r[codeCol].split(' — ')[0].trim();
      expect(data.map(exportedCode).sort()).toEqual([...codes].sort());
      for (const r of data) {
        const shown = grid.get(exportedCode(r))!;
        if (col('Status') >= 0) expect(r[col('Status')].trim()).toBe('Active');
        if (col('Total Users') >= 0) expect.soft(r[col('Total Users')].trim(), 'Total Users matches the grid').toBe(shown.users);
        if (col('Created Date') >= 0) expect.soft(r[col('Created Date')].trim(), 'Created Date format matches the grid').toBe(shown.created);
      }
    });
    notVerified('Export completes for the maximum permitted record volume', 'volume limits are defined in the Common Grid Features FSD, not provided');
  });
});
