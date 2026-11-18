import { test, expect, traceTo, notVerified, expectColour } from '../../../fixtures/roleconfig.fixture';
import { blockWrites } from '../../../utils/network.util';
import { getRoleConfigEnv } from '../../../utils/env.util';
import { RoleConfigApi } from '../../../utils/roleconfig-api.util';
import { fsd, screens, parseDisplayDate, isoDate } from '../../../testdata/roleconfig.data';
import { descriptionAndStatusInOneSave } from './shared-steps';

/** Seeded roles with the longest audit history (read only). */
async function rolesWithHistory(api: RoleConfigApi, minimum: number, count: number): Promise<string[]> {
  const candidates = (await api.roles()).filter((r) => /^[A-Za-z0-9-]+$/.test(r.roleName)).slice(0, 15);
  const totals = await Promise.all(candidates.map(async (r) => ({ code: r.roleName, total: await api.auditTotal(r.roleName) })));
  return totals.filter((t) => t.total >= minimum).sort((a, b) => b.total - a.total).slice(0, count).map((t) => t.code);
}

const dayOf = (text: string) => isoDate(parseDisplayDate(text));

/** Roles FSD v1.4 §5.6 — Audit Trail panel (manual cases TC-058 … TC-067). */
test.describe('Role Configuration - Audit Trail', () => {
  test('TC-058 | All create, modify, mapping, configuration and status operations are captured @critical @mc @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§5.6, §5.6.2', 'BR-ROLES-010');
    test.slow();
    const role = await roles.active({ baseRole: 'Business Maker', remarks: 'Audit: created' });
    const maker = getRoleConfigEnv().maker.username;

    await test.step('Precondition: modify, map, configure and change status, each approved with distinct comments', async () => {
      await api.approve(await api.modifyRole(role.code, { description: `${role.description} v2`, remarks: 'Audit: details modified' }));
      await api.approve(await api.mapScreens(role.code, [{ app: screens.department.app, pageCode: screens.department.code, accessPrivilege: 'Viewer' }], 'Audit: mapping changed'));
      await api.approve(await api.configure(role.code, screens.chargeConfig.app, screens.chargeConfig.code, { [screens.chargeConfig.element.key]: false }, 'Audit: config changed'));
      await api.approve(await api.modifyRole(role.code, { status: 'Disabled', remarks: 'Audit: status changed' }));
    });

    await list.openRole(role.code, 'Audit Trail');
    const audit = list.audit(role.code);
    await audit.waitForLoad();
    await audit.showAll();
    const cards = await audit.readAll();

    for (const [comment, section] of [
      ['Audit: created', 'Role Created'],
      ['Audit: details modified', 'Role Details'],
      ['Audit: mapping changed', 'Screen Mapping'],
      ['Audit: config changed', 'Screen Config'],
      ['Audit: status changed', 'Status Change'],
    ] as const) {
      await test.step(`"${section}" operation has its own complete card`, async () => {
        const card = cards.find((c) => c.comments === comment);
        expect(card, `Card with comment "${comment}"`).toBeTruthy();
        expect(card!.badges).toContain(section);
        expect(card!.entry).toMatch(/^\d+$/);
        expect(card!.roleLine.startsWith(`${role.code} / `)).toBe(true);
        expect(card!.changes.length, 'Structured change details').toBeGreaterThan(0);
        expect.soft(card!.user, 'FSD §5.6.2: username of the user who made the change').toBe(maker);
        expect.soft(card!.dateTime, 'FSD §5.6.2: DD-Mon-YYYY HH:MM AM/PM').toMatch(fsd.formats.auditDateTime);
      });
    }

    await test.step('Cards are numbered in order and sorted newest-first', async () => {
      expect(cards.map((c) => Number(c.entry))).toEqual(cards.map((_, i) => i + 1));
      const times = cards.map((c) => parseDisplayDate(c.dateTime).getTime());
      for (let i = 1; i < times.length; i++) expect(times[i], `card ${i + 1} is not newer than card ${i}`).toBeLessThanOrEqual(times[i - 1]);
    });
  });

  test('TC-059 | Checker approval or rejection is recorded as a separate card from the Maker\'s action @critical @mc @roleconfig @regression', async ({ rolesListPage: list, roles, api, checker }) => {
    traceTo('§5.6.2, §5.6.3', 'BR-ROLES-010');
    const role = await roles.active();
    const checkerName = getRoleConfigEnv().checker.username;

    for (const [pass, decision, makerComment, checkerRemarks] of [
      ['Approve', 'Approved', 'Description updated', 'Approved as per request'],
      ['Reject', 'Rejected', 'Description updated again', 'Not aligned to naming standard'],
    ] as const) {
      await test.step(`${pass}: Maker submits a Role Modification, Checker decides with remarks`, async () => {
        await api.modifyRole(role.code, { description: `${role.description} (${pass})`, remarks: makerComment });
        const review = await checker.approvalQueue.openRoleReview(role.code);
        if (decision === 'Approved') await review.approve(checkerRemarks);
        else await review.reject(checkerRemarks);
      });

      await test.step(`${pass}: the decision is its own teal Approval card, separate from the Maker's card`, async () => {
        await list.openRole(role.code, 'Audit Trail');
        const audit = list.audit(role.code);
        await audit.waitForLoad();
        const cards = await audit.readAll();
        const makerCard = cards.find((c) => c.comments === makerComment);
        const decisionIndex = cards.findIndex((c) => c.comments === checkerRemarks);
        expect(makerCard, 'Maker card').toBeTruthy();
        expect(makerCard!.badges).not.toContain('Approval');
        expect(decisionIndex, 'Checker card').toBeGreaterThanOrEqual(0);
        const decisionCard = cards[decisionIndex];
        expect(decisionCard.badges).toContain('Approval');
        expect(decisionCard.user).toBe(checkerName);
        expect(decisionCard.purpose).toContain(decision);
        expect(decisionCard.dateTime).not.toBe('');
        await expectColour(audit.card(decisionIndex).badge('Approval'), fsd.audit.badgeColours.Approval, 'FSD §5.6.3: Approval badge is teal', { soft: true });
        await audit.close();
      });
    }
  });

  test('TC-060 | Screen Mapping changes display added, removed and privilege-changed screens correctly @high @mc @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§5.6.3');
    const role = await roles.active({ baseRole: 'Business Maker' });
    const { department: added, dashboard: removed, chargeConfig: changed } = screens;
    await api.approve(await api.mapScreens(role.code, [
      { app: added.app, pageCode: added.code, accessPrivilege: 'Viewer' },
      { app: removed.app, pageCode: removed.code, unmap: true },
      { app: changed.app, pageCode: changed.code, accessPrivilege: 'Viewer' },
    ], 'Add, remove and re-privilege in one save'));

    await list.openRole(role.code, 'Audit Trail');
    const audit = list.audit(role.code);
    await audit.waitForLoad();
    const cards = await audit.readAll();
    const index = cards.findIndex((c) => c.comments === 'Add, remove and re-privilege in one save');
    expect(index, 'Screen Mapping card for the save').toBeGreaterThanOrEqual(0);
    const card = cards[index];

    await test.step('1. Green Screen Mapping badge', async () => {
      expect(card.badges).toContain('Screen Mapping');
      await expectColour(audit.card(index).badge('Screen Mapping'), fsd.audit.badgeColours['Screen Mapping'], 'FSD §5.6.3: Screen Mapping badge is green', { soft: true });
    });

    await test.step('2-4. "+" added, "−" removed, and "Actor → Viewer" for the re-privileged screen', async () => {
      const lines = JSON.stringify(card.changes);
      expect.soft(card.changes.some((c) => c.startsWith('+') && c.includes(added.code) && c.includes(added.name)), `FSD: "+ ${added.code} / ${added.name}" (got ${lines})`).toBe(true);
      expect.soft(card.changes.some((c) => /^[−-]/.test(c) && c.includes(removed.code) && c.includes(removed.name)), `FSD: "− ${removed.code} / ${removed.name}" (got ${lines})`).toBe(true);
      expect.soft(card.changes.some((c) => c.includes(changed.code) && /Actor\s*→\s*Viewer/.test(c)), `FSD: "${changed.code} · Actor → Viewer" (got ${lines})`).toBe(true);
    });
  });

  test('TC-061 | Screen Config changes are listed individually per element and attribute @high @mc @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§5.6.3');
    const role = await roles.active({ baseRole: 'Business Maker' });
    const screen = screens.chargeConfig;
    const items = (await api.screenConfig(role.code, screen.app, screen.code)).filter((i) => !i.governedBy).slice(0, 2);
    const changes = Object.fromEntries(items.map((i) => [i.permissionKey, !i.enable]));
    await api.approve(await api.configure(role.code, screen.app, screen.code, changes, 'Two Enable changes in one save'));

    await list.openRole(role.code, 'Audit Trail');
    const audit = list.audit(role.code);
    await audit.waitForLoad();
    const cards = await audit.readAll();
    const index = cards.findIndex((c) => c.comments === 'Two Enable changes in one save');
    expect(index, 'Screen Config card for the save').toBeGreaterThanOrEqual(0);
    const card = cards[index];

    await test.step('1. Purple Screen Config badge with the screen code in the header', async () => {
      expect(card.badges).toContain('Screen Config');
      await expectColour(audit.card(index).badge('Screen Config'), fsd.audit.badgeColours['Screen Config'], 'FSD §5.6.3: Screen Config badge is purple', { soft: true });
      expect(card.purpose).toContain(screen.code);
    });

    await test.step('2-4. One line per element: name · Enable · On/Off before → after, no combined entry', async () => {
      expect(card.changes, 'One line per changed element — no single combined entry').toHaveLength(items.length);
      for (const line of card.changes) expect(line).toMatch(/Enable.*(On|Off)\s*→\s*(On|Off)/);
      for (const item of items) {
        const [before, after] = item.enable ? ['On', 'Off'] : ['Off', 'On'];
        const named = new RegExp(`${item.elementName.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}.*Enable.*${before}\\s*→\\s*${after}`);
        expect.soft(card.changes.some((c) => named.test(c)), `FSD §5.6.3: "${item.elementName} · Enable · ${before} → ${after}" (got ${JSON.stringify(card.changes)})`).toBe(true);
      }
    });
    notVerified('An Editable change is listed as its own line', 'the build exposes no Editable toggle (see TC-047)');
  });

  test('TC-062 | Audit filter applies Section, From Date and To Date jointly with AND logic @high @roleconfig @regression', async ({ rolesListPage: list, api }) => {
    traceTo('§5.6.1');
    const [code] = await rolesWithHistory(api, 10, 1);
    test.skip(!code, 'No role with enough audit history');
    await list.openRole(code, 'Audit Trail');
    const audit = list.audit(code);
    await audit.waitForLoad();
    await audit.showAll();

    const all = await test.step('1. Search with no criteria: the unfiltered feed', async () => {
      await audit.search({ section: 'All Sections', from: '', to: '' });
      await audit.waitForLoad();
      return { total: await audit.total(), cards: await audit.readAll() };
    });
    const days = [...new Set(all.cards.map((c) => dayOf(c.dateTime)))].sort();
    const middle = days[Math.floor(days.length / 2)];

    await test.step('2. Section only: every card is a Screen Mapping card', async () => {
      await audit.search({ section: 'Screen Mapping', from: '', to: '' });
      await audit.waitForLoad();
      for (const c of await audit.readAll()) expect(c.badges).toContain('Screen Mapping');
    });

    await test.step(`3. From Date only (${middle}): no entry before it`, async () => {
      await audit.search({ section: 'All Sections', from: middle, to: '' });
      await audit.waitForLoad();
      for (const c of await audit.readAll()) expect(dayOf(c.dateTime) >= middle, c.dateTime).toBe(true);
    });

    await test.step(`4. To Date only (${middle}): no entry after it`, async () => {
      await audit.search({ section: 'All Sections', from: '', to: middle });
      await audit.waitForLoad();
      for (const c of await audit.readAll()) expect(dayOf(c.dateTime) <= middle, c.dateTime).toBe(true);
    });

    await test.step('5. Section + From + To narrow the feed together (AND)', async () => {
      await audit.search({ section: 'Approval', from: days[0], to: middle });
      await audit.waitForLoad();
      for (const c of await audit.readAll()) {
        expect(c.badges).toContain('Approval');
        expect(dayOf(c.dateTime) >= days[0] && dayOf(c.dateTime) <= middle, c.dateTime).toBe(true);
      }
    });

    await test.step('6. Criteria matching nothing: "No records match the selected filter."', async () => {
      await audit.search({ section: 'All Sections', from: '2000-01-01', to: '2000-01-02' });
      await expect(audit.dialog.getByText(fsd.audit.noMatch)).toBeVisible();
    });
    expect(all.total).toBeGreaterThan(0);
  });

  test('TC-063 | To Date earlier than From Date is rejected @high @negative @roleconfig @regression', async ({ page, rolesListPage: list, api }) => {
    traceTo('§5.6.1');
    const [code] = await rolesWithHistory(api, 1, 1);
    await list.openRole(code, 'Audit Trail');
    const audit = list.audit(code);
    await audit.waitForLoad();
    const newest = dayOf((await audit.card(0).read()).dateTime);
    const dayBefore = isoDate(new Date(new Date(newest).getTime() - 86_400_000));
    const queries: string[] = [];
    page.on('request', (r) => { if (r.url().includes('/audit')) queries.push(r.url()); });

    await test.step('1-3. From = newest day, To = the day before: invalid range is not searched', async () => {
      await audit.fromDate.fill(newest);
      await audit.toDate.fill(dayBefore);
      queries.length = 0;
      if (await audit.searchButton.isEnabled()) await audit.searchButton.click();
      // FSD gap G9: the message wording is not specified — any message about the date order counts.
      await expect(audit.dialog.getByText(/date.*(cannot|must not|earlier|before)|(earlier|before).*date/i)).toBeVisible();
      expect(queries, 'No query runs with the invalid range').toEqual([]);
    });

    await test.step('4. Correct To Date: entries within the range, both bounds inclusive', async () => {
      await audit.toDate.fill(newest);
      await audit.searchButton.click();
      await audit.waitForLoad();
      const cards = await audit.readAll();
      expect(cards.length).toBeGreaterThan(0);
      for (const c of cards) expect(dayOf(c.dateTime)).toBe(newest);
    });
  });

  test('TC-064 | Audit entries are immutable once submitted @critical @negative @roleconfig @regression', async ({ page, rolesListPage: list, api }) => {
    traceTo('§5.6', 'BR-ROLES-006');
    const [code] = await rolesWithHistory(api, 3, 1);
    const writes = await blockWrites(page, '**/api/**');
    await list.openRole(code, 'Audit Trail');
    const audit = list.audit(code);
    await audit.waitForLoad();

    await test.step('1-3. No edit or delete control on any card; comments are not editable', async () => {
      await expect(audit.cards.getByRole('button', { name: /edit|delete|remove/i })).toHaveCount(0);
      await expect(audit.cards.getByRole('textbox')).toHaveCount(0);
      await expect(audit.cards.locator('[contenteditable="true"]')).toHaveCount(0);
    });
    expect(writes.attempted).toEqual([]);
    notVerified('4. A back-end attempt to alter an audit record is rejected', 'no audit write endpoint is known; the API contract is not available');
  });

  test('TC-065 | A single save touching multiple sections produces one card with multiple badges @high @mc @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§5.6.3');
    await descriptionAndStatusInOneSave(list, api, await roles.active({ description: 'Reports Viewer' }));
  });

  test('TC-066 | Audit feed pagination and record count behave correctly @high @roleconfig @regression', async ({ rolesListPage: list, api }) => {
    traceTo('§5.6.2, §5.6.5');
    const [code] = await rolesWithHistory(api, 12, 1);
    test.skip(!code, 'No role with 12+ audit entries');
    await list.openRole(code, 'Audit Trail');
    const audit = list.audit(code);
    await audit.waitForLoad();
    const total = await audit.total();

    await test.step('2. Record count label left of the right-aligned page size and navigation', async () => {
      await expect(audit.recordCount).toHaveText(fsd.formats.auditCount);
      const label = (await audit.recordCount.boundingBox())!;
      const size = (await audit.entriesPerPage.boundingBox())!;
      const next = (await audit.nextPage.boundingBox())!;
      const panel = (await audit.dialog.boundingBox())!;
      expect(label.x).toBeLessThan(size.x);
      expect(size.x).toBeLessThan(next.x);
      expect.soft(panel.x + panel.width - (next.x + next.width), 'Navigation is right-aligned in the panel').toBeLessThan(80);
    });

    const firstPage = await test.step('3. Page size 5: label and cards follow', async () => {
      await audit.entriesPerPage.selectOption('5');
      await expect(audit.recordCount).toHaveText(new RegExp(`^Showing\\s*1–5\\s*of\\s*${total}\\s*entries$`));
      await expect(audit.cards).toHaveCount(5);
      return audit.readAll();
    });

    await test.step('4. Next page and back: newest-first order holds across pages', async () => {
      await audit.nextPage.click();
      await expect(audit.recordCount).toHaveText(new RegExp(`^Showing\\s*6–10\\s*of\\s*${total}\\s*entries$`));
      const second = await audit.readAll();
      expect(parseDisplayDate(second[0].dateTime).getTime()).toBeLessThanOrEqual(parseDisplayDate(firstPage[4].dateTime).getTime());
      await audit.previousPage.click();
      await expect(audit.recordCount).toHaveText(new RegExp(`^Showing\\s*1–5\\s*of\\s*${total}\\s*entries$`));
    });

    await test.step('5. A section filter re-paginates against the filtered set', async () => {
      await audit.search({ section: 'Approval' });
      await audit.waitForLoad();
      const filtered = await audit.total();
      expect(filtered).toBeLessThan(total);
      await expect(audit.recordCount).toHaveText(new RegExp(`of\\s*${filtered}\\s*entr`));
    });
  });

  test('TC-067 | Audit Trail is role-scoped and shows only the selected role\'s history @critical @roleconfig @regression', async ({ page, rolesListPage: list, api }) => {
    traceTo('§5.6');
    const [roleA, roleB] = await rolesWithHistory(api, 1, 2);
    const writes = await blockWrites(page, '**/api/**');

    for (const [step, code, other] of [['1', roleA, roleB], ['2-4', roleB, roleA]] as const) {
      await test.step(`${step}. Audit for "${code}" shows only its own entries`, async () => {
        await list.openRole(code, 'Audit Trail');
        const audit = list.audit(code);
        await audit.waitForLoad();
        const cards = await audit.readAll();
        expect(cards.length).toBeGreaterThan(0);
        for (const c of cards) {
          expect(c.roleLine.startsWith(`${code} / `), `Card role "${c.roleLine}"`).toBe(true);
          expect(c.roleLine.startsWith(`${other} / `)).toBe(false);
        }
        await audit.close();
      });
    }
    expect(writes.attempted).toEqual([]);
  });
});
