import { Page } from '@playwright/test';
import { test, expect, traceTo, notVerified, expectColour } from '../../../fixtures/roleconfig.fixture';
import { blockWrites } from '../../../utils/network.util';
import { UserRolePicker } from '../../../Pages/roleconfig/UserRolePicker';
import { fsd, screens, remarks } from '../../../testdata/roleconfig.data';

/** Read-only: is the role offered in the Create User role list? */
async function isAssignable(page: Page, picker: UserRolePicker, code: string): Promise<boolean> {
  const writes = await blockWrites(page, '**/api/**');
  await picker.open();
  const offered = (await picker.roleOption(code).count()) > 0;
  await picker.close();
  await writes.release();
  return offered;
}

/** Roles FSD v1.4 §3, §8 — Maker-Checker workflow and status behaviour (manual cases TC-068 … TC-074). */
test.describe('Role Configuration - Maker-Checker workflow', () => {
  test('TC-068 | A Maker cannot approve their own submission @critical @negative @mc @roleconfig @regression', async ({ rolesListPage: list, approvalQueuePage, roles, checker }) => {
    traceTo('§3 Roles and Access');
    const role = await roles.pending();

    await test.step('2. The Maker\'s own request is not offered for approval in the Approval Queue', async () => {
      await approvalQueuePage.goto();
      await approvalQueuePage.openTab('Role');
      await expect(approvalQueuePage.reviewButton(role.code)).toHaveCount(0);
    });

    await test.step('3. On the Maker\'s audit card, Approve and Reject are unavailable', async () => {
      await list.openRole(role.code, 'Audit Trail');
      const audit = list.audit(role.code);
      await audit.waitForLoad();
      const card = audit.card(0);
      await expect(card.approveButton).toBeDisabled();
      await expect(card.rejectButton).toBeDisabled();
    });

    await test.step('4. A different Checker approves it successfully', async () => {
      const review = await checker.approvalQueue.openRoleReview(role.code);
      await review.approve(remarks.approve);
      await list.goto();
      await list.findRole(role.code);
      await expect(list.cell(role.code, 'Status')).toHaveText('Active');
    });
  });

  test('TC-069 | Checker rejects a New Role request; Maker can Resubmit or Close @critical @mc @roleconfig @regression', async ({ page, rolesListPage: list, roles, api, checker, userRolePicker }) => {
    traceTo('§8 row 9');
    const role = await roles.pending();
    const reason = 'Role code does not follow naming standard';

    await test.step('1. Checker rejects with remarks', async () => {
      const review = await checker.approvalQueue.openRoleReview(role.code);
      await review.reject(reason);
    });

    await test.step('2. Last Action "New Role - Rejected"; role blank/Disabled and not assignable', async () => {
      await list.goto();
      await list.findRole(role.code);
      await expect(list.cell(role.code, 'Last Action')).toHaveText(fsd.lastAction.rejected(fsd.lastAction.newRole));
      await expect(list.cell(role.code, 'Status')).toHaveText(/^(Disabled)?$/);
      expect(await isAssignable(page, userRolePicker, role.code)).toBe(false);
    });

    await test.step('5. The rejection is a separate teal Approval card with the Checker\'s remarks', async () => {
      await list.openRole(role.code, 'Audit Trail');
      const audit = list.audit(role.code);
      await audit.waitForLoad();
      const cards = await audit.readAll();
      const index = cards.findIndex((c) => c.comments === reason);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(cards[index].badges).toContain('Approval');
      expect(cards[index].purpose).toContain('Rejected');
      await expectColour(audit.card(index).badge('Approval'), fsd.audit.badgeColours.Approval, 'FSD §5.6.3: Approval badge is teal', { soft: true });
      await audit.close();
    });

    await test.step('3. Resubmit puts the request back to Pending for the Checker', async () => {
      await list.openRole(role.code, 'View & Modify');
      await expect(list.viewModify.resubmitButton).toBeVisible();
      await expect(list.viewModify.closeRequestButton).toBeVisible();
      await list.viewModify.resubmit('Resubmitted with corrected details');
      // The Resubmit form closes; the read-only panel it was opened from stays open underneath.
      await expect(page.getByRole('dialog', { name: 'Record Details' })).toHaveCount(1);
      await list.viewModify.close();
      await list.goto();
      await list.findRole(role.code);
      await expect(list.cell(role.code, 'Status')).toHaveText('Pending');
      expect((await api.role(role.code))?.pendingRequest?.action).toBe('NewRole');
    });

    await test.step('4. After another rejection, Close removes the item from the grid', async () => {
      await api.reject(await api.pendingRequestId(role.code), reason);
      await list.openRole(role.code, 'View & Modify');
      await list.viewModify.closeRemarks.fill('Not needed any more');
      await list.viewModify.closeRequestButton.click();
      // The grid behind the panel refreshes without the role; the panel itself stays open, read-only.
      await expect(list.row(role.code)).toHaveCount(0);
      await list.viewModify.close();
      await list.goto();
      await list.filter({ code: role.code });
      await expect(list.row(role.code)).toHaveCount(0);
    });
  });

  test('TC-070 | Checker rejects Modify Role / Modify Screen Mapping / Delete Role requests @critical @mc @roleconfig @regression', async ({ page, rolesListPage: list, roles, api, checker, userRolePicker }) => {
    traceTo('§8 row 9');
    test.slow();
    const modified = await roles.active();
    const remapped = await roles.active({ baseRole: 'Business Maker' });
    const deleted = await roles.active();
    await api.modifyRole(modified.code, { description: 'Admin Payment Maker - Revised', remarks: 'Modify to be rejected' });
    await api.mapScreens(remapped.code, [{ app: screens.department.app, pageCode: screens.department.code, accessPrivilege: 'Viewer' }], 'Mapping to be rejected');
    await api.deleteRole(deleted.code, 'Delete to be rejected');

    for (const [label, role, action] of [
      ['1. Modify Role', modified, fsd.lastAction.modifyRole],
      ['2. Modify Screen Mapping', remapped, fsd.lastAction.modifyMapping],
      ['3. Delete Role', deleted, fsd.lastAction.deleteRole],
    ] as const) {
      await test.step(`${label}: Checker rejects with remarks; existing status kept, Last Action "${action} - Rejected"`, async () => {
        const review = await checker.approvalQueue.openRoleReview(role.code);
        await review.reject(`${label} rejected`);
        await list.goto();
        await list.findRole(role.code);
        await expect(list.cell(role.code, 'Status')).toHaveText('Active');
        await expect(list.cell(role.code, 'Last Action')).toHaveText(fsd.lastAction.rejected(action));
      });
    }

    await test.step('The pending changes were discarded', async () => {
      expect((await api.role(modified.code))!.description).toBe(modified.description);
      expect((await api.roleScreens(remapped.code)).find((s) => s.pageCode === screens.department.code)!.isMapped).toBe(false);
      expect((await api.role(deleted.code))!.deletedAt).toBeNull();
    });

    await test.step('Each role remains OK for assignment', async () => {
      for (const role of [modified, remapped, deleted]) expect(await isAssignable(page, userRolePicker, role.code), role.code).toBe(true);
    });
    notVerified('5. Existing users continue with the pre-change configuration', 'needs business users assigned to the roles');
  });

  test('TC-071 | Checker approves a Modify Screen Mapping request and the new mapping takes effect @critical @mc @roleconfig @regression', async ({ rolesListPage: list, roles, api, checker }) => {
    traceTo('§8 row 6');
    const role = await roles.active({ baseRole: 'Business Maker' });
    await api.mapScreens(role.code, [
      { app: screens.department.app, pageCode: screens.department.code, accessPrivilege: 'Viewer' },
      { app: screens.dashboard.app, pageCode: screens.dashboard.code, unmap: true },
    ], 'Add department, remove dashboard');

    await test.step('1-2. The Checker sees exactly which screens are added and removed', async () => {
      const review = await checker.approvalQueue.openRoleReview(role.code);
      await expect.soft(review.changeRows.filter({ hasText: screens.department.code }), 'Added screen shown for review').toHaveCount(1);
      await expect.soft(review.changeRows.filter({ hasText: screens.dashboard.code }), 'Removed screen shown for review').toHaveCount(1);
      await review.approve(remarks.approve);
    });

    await test.step('3-4. Status Active (unchanged), Last Action "Modify Screen Mapping"; new mapping in effect', async () => {
      await list.goto();
      await list.findRole(role.code);
      await expect(list.cell(role.code, 'Status')).toHaveText('Active');
      await expect(list.cell(role.code, 'Last Action')).toHaveText(fsd.lastAction.modifyMapping);
      const mapped = (await api.roleScreens(role.code)).filter((s) => s.isMapped).map((s) => s.pageCode);
      expect(mapped).toContain(screens.department.code);
      expect(mapped).not.toContain(screens.dashboard.code);
    });
    notVerified('5. Users of the role get the new screen access immediately', 'needs a business user assigned to the role');
  });

  test('TC-072 | Newly created role defaults to Pending and is not assignable until approved and mapped @critical @mc @roleconfig @regression', async ({ page, rolesListPage: list, roles, api, userRolePicker }) => {
    traceTo('§8 rows 1-2', 'BR-ROLES-012', 'BR-ROLES-003');
    const code = roles.newCode();

    await test.step('1. Maker creates the role: Status Pending', async () => {
      await list.goto();
      await list.newRoleButton.click();
      await list.newRole.fill({ code, description: 'Payment Maker 3', baseRole: 'Business Maker', remarks: 'TC-072' });
      await list.newRole.save();
      await expect(list.newRole.dialog).toBeHidden();
      await list.findRole(code);
      await expect(list.cell(code, 'Status')).toHaveText('Pending');
    });

    await test.step('2. Not available for assignment while Pending', async () => {
      expect(await isAssignable(page, userRolePicker, code)).toBe(false);
    });

    await test.step('3-4. Approved: Active, but not assignable before any screen is mapped', async () => {
      await api.approve(await api.pendingRequestId(code));
      await list.goto();
      await list.findRole(code);
      await expect(list.cell(code, 'Status')).toHaveText('Active');
      expect.soft(await isAssignable(page, userRolePicker, code), 'FSD §8 row 2: "not ready for user assignment, pending for screens mapping"').toBe(false);
    });

    await test.step('5. Map a screen and approve: assignable', async () => {
      await api.approve(await api.mapScreens(code, [{ app: screens.department.app, pageCode: screens.department.code, accessPrivilege: 'Viewer' }], 'TC-072 mapping'));
      expect(await isAssignable(page, userRolePicker, code)).toBe(true);
    });
  });

  test('TC-073 | Role status is restricted to Active, Disabled and Pending @high @mc @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§5.2.3 Note');
    const allowed = Object.keys(fsd.statuses);

    await test.step('1. Status filter offers only Active, Pending and Disabled', async () => {
      await list.goto();
      await list.showFilters();
      const options = (await list.statusFilter.locator('option').allTextContents()).map((o) => o.trim()).filter((o) => o !== 'All');
      expect(options.sort()).toEqual([...allowed].sort());
      await list.showMaxRowsPerPage();
      for (const status of new Set(await list.columnValues('Status'))) expect(allowed, `Status "${status}" on the grid`).toContain(status);
    });

    const role = await roles.pending();
    await test.step('2. View & Modify Status offers only Active and Disabled for an Active role', async () => {
      await api.approve(role.requestId);
      await list.openRole(role.code, 'View & Modify');
      await expect(list.viewModify.roleCode).toHaveValue(role.code);
      await expect(list.viewModify.statusOptionItems).toHaveText(fsd.viewModify.statusOptions);
      await list.viewModify.close();
    });

    await test.step('3. Through create, approve, modify, reject and delete, Status stays within the allowed values', async () => {
      const statusNow = async () => (await api.role(role.code))!.status;
      expect(allowed).toContain(await statusNow());
      await api.modifyRole(role.code, { description: `${role.description} v2`, remarks: 'Lifecycle modify' });
      expect(allowed).toContain(await statusNow());
      await api.reject(await api.pendingRequestId(role.code));
      expect(allowed).toContain(await statusNow());
      await api.deleteRole(role.code, 'Lifecycle delete');
      expect(allowed).toContain(await statusNow());
      await list.goto();
      await list.findRole(role.code);
      expect(allowed).toContain((await list.cell(role.code, 'Status').innerText()).trim());
    });
  });

  test('TC-074 | Maker-only workflow applies changes immediately without a Checker step @critical @roleconfig @regression', async ({ rolesListPage: list, roles, api }) => {
    traceTo('§8 rows 2, 4, 6, 8');
    test.skip(!(await api.isMakerOnly('NewRole')), 'This environment uses Maker-Checker for every Roles action; TC-074 needs Maker-only');
    const code = roles.newCode();

    await test.step('1. Create: Active immediately, Last Action "New Role"', async () => {
      await list.goto();
      await list.newRoleButton.click();
      await list.newRole.fill({ code, description: 'Maker-only role', baseRole: 'Business Maker', remarks: 'Maker-only create' });
      await list.newRole.save();
      await list.findRole(code);
      await expect(list.cell(code, 'Status')).toHaveText('Active');
      await expect(list.cell(code, 'Last Action')).toHaveText(fsd.lastAction.newRole);
    });

    await test.step('2. Modify: applied immediately', async () => {
      await list.open(code, 'View & Modify');
      await list.viewModify.change({ description: 'Maker-only role v2', comments: 'Maker-only modify' });
      await list.viewModify.save();
      expect((await api.role(code))!.description).toBe('Maker-only role v2');
    });

    await test.step('3. Screen mapping: applied immediately, status unchanged', async () => {
      await list.openRole(code, 'Screen Mapping');
      const mapping = list.mapping(code);
      await mapping.showAll();
      await mapping.tick(screens.department, 'Viewer');
      await mapping.save('Maker-only mapping');
      expect((await api.roleScreens(code)).find((s) => s.pageCode === screens.department.code)!.isMapped).toBe(true);
      expect((await api.role(code))!.status).toBe('Active');
    });

    await test.step('4. Delete: removed from the listing immediately', async () => {
      await list.openRole(code, 'Delete');
      await list.deletePanel(code).confirm('Maker-only delete');
      await list.goto();
      await list.filter({ code });
      await expect(list.row(code)).toHaveCount(0);
    });
  });
});
