import { test, expect } from '../../../fixtures/roles.fixture';
import { rolesData as data, uniqueRoleCode, parseAuditDate } from '../../../testdata/roles.data';

/** Roles FSD §5.6 — Audit Trail (TC_ROLE_046, 050–053). */
test.describe('Roles - Audit Trail', () => {
  test.describe.configure({ timeout: 120_000 });

  const history = data.seeded.withHistory.code;

  test.beforeEach(async ({ rolesPage }) => {
    await rolesPage.goto();
  });

  test('TC_ROLE_046 Role Created audit card captures initial values, user, timestamp and remarks @roles @audit @critical', async ({ rolesPage, trackRole }) => {
    const code = trackRole(uniqueRoleCode('AUTO-AUD'));
    const remarks = `Audit check ${code}`;
    await rolesPage.createRole({ code, description: 'Audit role', baseRole: 'Auditor', remarks });

    await rolesPage.openAction(code, 'Audit Trail');
    const detail = rolesPage.detail(code);
    const created = detail.auditCards.filter({ hasText: `Role Name — → ${code}` });

    await expect(created).toHaveCount(1);
    await expect(created).toContainText('Base Role — → Auditor');
    await expect(created).toContainText(`Reason: ${remarks}`);
    await expect(created).toContainText(data.auditDate);
  });

  test('TC_ROLE_050 Audit filter by Section and search; no-match message @roles @audit @high', async ({ rolesPage }) => {
    await rolesPage.openAction(history, 'Audit Trail');
    const detail = rolesPage.detail(history);
    // The counter reads "0 changes" until the feed has loaded.
    await expect(detail.auditCards.first()).toBeVisible();
    const total = await detail.auditCount();

    await detail.auditSectionFilter.selectOption('Screen Mapping');
    await expect.poll(() => detail.auditCount()).toBeLessThan(total);
    const filtered = await detail.auditCount();
    expect(filtered).toBeGreaterThan(0);
    await expect(detail.auditCards).toHaveCount(filtered);
    for (const card of await detail.auditCards.all()) {
      await expect(card).toContainText('Screen Mapping');
    }

    await detail.auditSectionFilter.selectOption('All Sections');
    await detail.auditSearch.fill('zz-no-such-audit-entry-zz');
    await expect(detail.auditNoMatch).toBeVisible();
    await expect(detail.auditSummary).toHaveText('0 changes');
  });

  test('TC_ROLE_051 To Date earlier than From Date is not allowed @roles @audit @high @negative', async ({ rolesPage }) => {
    await rolesPage.openAction(history, 'Audit Trail');
    const detail = rolesPage.detail(history);
    await expect(detail.auditSummary).toBeVisible();

    // FSD §5.6.1 specifies From Date / To Date pickers. This build's filter bar has only the
    // Section select and a free-text search, so the range rule has nothing to act on.
    // Failing intentionally until the date filters exist.
    await expect(detail.panel.getByLabel(/From Date/i), 'FSD: From Date filter').toBeVisible({ timeout: 5_000 });
    await expect(detail.panel.getByLabel(/To Date/i), 'FSD: To Date filter').toBeVisible({ timeout: 5_000 });
  });

  test('TC_ROLE_052 Audit comments cannot be edited or deleted @roles @audit @high @negative', async ({ rolesPage }) => {
    await rolesPage.openAction(history, 'Audit Trail');
    const detail = rolesPage.detail(history);
    await expect(detail.auditCards.first()).toBeVisible();

    await expect(detail.auditCards.getByRole('button')).toHaveCount(0);
    await expect(detail.auditCards.getByRole('textbox')).toHaveCount(0);
    await expect(detail.auditCards.locator('[contenteditable="true"]')).toHaveCount(0);
    // The API half of this case is blocked with the other API cases (no contract yet).
  });

  test('TC_ROLE_053 Audit cards sorted newest-first with working pagination @roles @audit @high', async ({ rolesPage }) => {
    await rolesPage.openAction(history, 'Audit Trail');
    const detail = rolesPage.detail(history);
    await expect(detail.auditCards.first()).toBeVisible();

    const stamps = (await detail.auditCards.allInnerTexts()).map((text) => {
      const match = text.match(data.auditDate);
      expect(match, `card without a timestamp: ${text.slice(0, 80)}`).not.toBeNull();
      return parseAuditDate(match![0]).getTime();
    });
    expect(stamps.length).toBeGreaterThan(1);
    expect(stamps, 'cards are not newest-first').toEqual([...stamps].sort((a, b) => b - a));

    // FSD §5.6.2/5.6.5: the feed is paged with a "Showing 1–5 of N entries" label and a
    // page-size control. This build renders every card in one list.
    await expect.soft(detail.panel.getByText(/Showing \d+–\d+ of \d+/), 'FSD: audit feed pagination').toBeVisible({ timeout: 2_000 });
  });
});
