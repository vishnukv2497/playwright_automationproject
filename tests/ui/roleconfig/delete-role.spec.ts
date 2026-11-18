import { test, expect, traceTo, notVerified, expectColour } from '../../../fixtures/roleconfig.fixture';
import { blockWrites } from '../../../utils/network.util';
import { fsd, remarks } from '../../../testdata/roleconfig.data';

/** Roles FSD v1.4 §5.7 — Delete Role (manual cases TC-053 … TC-057). */
test.describe('Role Configuration - Delete Role', () => {
  test('TC-053 | Delete is blocked when active users are assigned to the role @critical @smoke @negative @roleconfig @regression', async ({ page, rolesListPage: list, api }) => {
    traceTo('§5.7 Pre-condition', 'BR-ROLES-004');
    // A seeded role that holds users; it is only read, with every write aborted.
    const held = (await api.roles()).find((r) => r.totalUsers > 0 && r.lastAction?.status !== 'Pending')!;
    const writes = await blockWrites(page, '**/api/**');
    await list.goto();
    await list.findRole(held.roleName);

    await test.step(`1. "${held.roleName}" has ${held.totalUsers} assigned user(s)`, async () => {
      expect(Number(await list.cell(held.roleName, 'Total Users').innerText())).toBeGreaterThan(0);
    });

    await test.step('2-3. Delete: an informational message instead of the deletion confirmation', async () => {
      await list.open(held.roleName, 'Delete');
      const panel = list.deletePanel(held.roleName);
      await expect(panel.reason, 'No reason field — the deletion cannot be confirmed').toHaveCount(0);
      await expect(panel.deleteButton, 'No Delete Role button').toHaveCount(0);
      await expect.soft(panel.dialog, 'The informational message refers to the assigned users').toContainText(/assigned users/i);
      expect(writes.attempted, 'No delete request or workflow item is created').toEqual([]);
    });
    notVerified('The block is enforced server-side, including for API deletes', 'checking it means sending a delete for a role this suite does not own');
  });

  test('TC-054 | Delete Reason is mandatory in the confirmation panel @critical @negative @mc @roleconfig @regression', async ({ page, rolesListPage: list, roles, api }) => {
    traceTo('§5.7', 'BR-ROLES-005', 'BR-ROLES-010');
    const role = await roles.active({ description: 'Payment Maker Role' });
    await list.openRole(role.code, 'Delete');
    const panel = list.deletePanel(role.code);

    await test.step('2. Panel: DELETE ROLE label, Role Code title, description sub-title, FSD message', async () => {
      await expect.soft(panel.label, 'FSD §5.7 label').toHaveText(fsd.delete.label, { useInnerText: true });
      await expect(panel.title).toHaveText(role.code);
      await expect(panel.subtitle).toHaveText(role.description);
      await expect.soft(panel.message(fsd.delete.message), 'FSD §5.7 confirmation message').toBeVisible();
      await expect(panel.reason).toBeVisible();
      await expectColour(panel.deleteButton, 'red', 'FSD §5.7: Delete Role is a danger (red) button', { property: 'background-color', soft: true });
    });

    await test.step('3. Reason blank: delete blocked, border turns red', async () => {
      const writes = await blockWrites(page, '**/api/**');
      await panel.deleteButton.click();
      await expectColour(panel.reason, 'red', 'FSD §5.7: Reason border turns red', { property: 'border-top-color' });
      await expect(panel.dialog).toBeVisible();
      expect(writes.attempted).toEqual([]);
      await writes.release();
    });

    await test.step('4. Valid reason: panel closes and a success message is shown', async () => {
      await panel.confirm('Role no longer required');
      await expect(panel.dialog).toBeHidden();
      await expect(list.notification(role.code)).toBeVisible();
    });

    await test.step('The reason is recorded in the Audit Trail', async () => {
      await list.openRole(role.code, 'Audit Trail');
      const audit = list.audit(role.code);
      await audit.waitForLoad();
      await expect(audit.cards.filter({ hasText: 'Comments: Role no longer required' })).toHaveCount(1);
    });
    expect(await api.role(role.code)).not.toBeNull();
  });

  test('TC-055 | Delete under Maker-Checker keeps the role usable until approval @critical @mc @roleconfig @regression', async ({ page, rolesListPage: list, roles, checker, userRolePicker }) => {
    traceTo('§5.7, §8 rows 7-8');
    const role = await roles.active();
    const offered = async () => {
      const writes = await blockWrites(page, '**/api/**');
      await userRolePicker.open();
      const count = await userRolePicker.roleOption(role.code).count();
      await userRolePicker.close();
      await writes.release();
      return count > 0;
    };

    await test.step('1. Submit the delete request with a reason', async () => {
      await list.openRole(role.code, 'Delete');
      await list.deletePanel(role.code).confirm('Superseded by another role');
      await expect(list.deletePanel(role.code).dialog).toBeHidden();
    });

    await test.step('2. Status Pending, Last Action "Delete Role"', async () => {
      await list.goto();
      await list.findRole(role.code);
      await expect(list.cell(role.code, 'Last Action')).toHaveText(fsd.lastAction.deleteRole);
      await expect.soft(list.cell(role.code, 'Status'), 'FSD §8 row 7: Status Pending until the Checker decides').toHaveText('Pending');
    });

    await test.step('3. Before approval the role is still OK for user assignment', async () => {
      expect(await offered()).toBe(true);
    });

    await test.step('4-5. Checker approves: the role leaves the listing and is no longer assignable', async () => {
      const review = await checker.approvalQueue.openRoleReview(role.code);
      await review.approve(remarks.approve);
      await list.goto();
      await list.filter({ code: role.code });
      await expect(list.row(role.code)).toHaveCount(0);
      expect(await offered()).toBe(false);
    });
    notVerified('Existing users keep using the role until approval, then lose it', 'needs a business user assigned to the role');
  });

  test('TC-056 | Delete is a soft delete — the record is retained and the Role Code stays reserved @critical @mc @roleconfig @regression', async ({ page, rolesListPage: list, roles, api }) => {
    traceTo('§1, §5.7', 'BR-ROLES-001');
    const role = await roles.active();

    await test.step('1. Delete the role and complete the approval', async () => {
      await list.openRole(role.code, 'Delete');
      await list.deletePanel(role.code).confirm('Role retired');
      await expect(list.deletePanel(role.code).dialog).toBeHidden();
      await api.approve(await api.pendingRequestId(role.code));
    });

    await test.step('2. The role is absent from the Roles List', async () => {
      await list.goto();
      await list.filter({ code: role.code });
      await expect(list.row(role.code)).toHaveCount(0);
    });

    await test.step('3. Its audit history remains retrievable', async () => {
      expect(await api.auditTotal(role.code)).toBeGreaterThan(0);
    });

    await test.step('4. Re-using the deleted Role Code is rejected as a duplicate', async () => {
      const writes = await blockWrites(page, '**/api/**');
      await list.newRoleButton.click();
      await list.newRole.fill({ code: role.code, description: 'Reuse of a deleted code', baseRole: 'General', remarks: 'Reuse check' });
      await list.newRole.save();
      await expect(list.newRole.message(fsd.newRole.messages.codeDuplicate)).toBeVisible();
      expect(writes.attempted).toEqual([]);
    });
    notVerified('The record is retained because the role was once assigned to a user', 'needs a business user to assign first, and database access to see the retained record (FSD gap G4)');
  });

  test('TC-057 | Cancel on the delete confirmation performs no deletion @high @roleconfig @regression', async ({ page, rolesListPage: list, api }) => {
    traceTo('§5.7 Panel Footer');
    // Any role without users and without a pending change; it is only read, with every write aborted.
    const target = (await api.roles()).find((r) => r.totalUsers === 0 && r.lastAction?.status !== 'Pending' && /^[A-Za-z0-9-]+$/.test(r.roleName))!;
    const auditBefore = await api.auditTotal(target.roleName);
    const writes = await blockWrites(page, '**/api/**');
    await list.goto();
    await list.findRole(target.roleName);
    const status = (await list.cell(target.roleName, 'Status').innerText()).trim();
    const lastAction = (await list.cell(target.roleName, 'Last Action').innerText()).trim();

    await test.step('1-2. Enter a reason and click Cancel: the panel closes, nothing is deleted', async () => {
      await list.open(target.roleName, 'Delete');
      const panel = list.deletePanel(target.roleName);
      await panel.reason.fill('Cancel check');
      await panel.cancel();
      expect(writes.attempted).toEqual([]);
    });

    await test.step('3. Refresh: the role is listed with its original Status and Last Action; no audit entry', async () => {
      await writes.release();
      await list.goto();
      await list.findRole(target.roleName);
      await expect(list.cell(target.roleName, 'Status')).toHaveText(status);
      await expect(list.cell(target.roleName, 'Last Action')).toHaveText(lastAction);
      expect(await api.auditTotal(target.roleName)).toBe(auditBefore);
    });
  });
});
