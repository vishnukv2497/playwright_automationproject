import { test, expect, expectColour } from '../../../fixtures/roleconfig.fixture';
import { RolesListPage } from '../../../Pages/roleconfig/RolesListPage';
import { CreatedRole, RoleConfigApi } from '../../../utils/roleconfig-api.util';
import { fsd } from '../../../testdata/roleconfig.data';

/**
 * TC-026 and TC-065 (FSD §5.6.3 example): one View & Modify save that changes both the Role Description and the
 * Status must produce exactly ONE audit card carrying both the Role Details and the Status Change badges.
 */
export async function descriptionAndStatusInOneSave(list: RolesListPage, api: RoleConfigApi, role: CreatedRole): Promise<void> {
  const newDescription = `${role.description} - Regional`;

  await test.step('1-3. Change the Role Description and Status Active → Disabled, comment, Save once', async () => {
    await list.openRole(role.code, 'View & Modify');
    await list.viewModify.change({ description: newDescription, status: 'Disabled', comments: 'Regional scope applied and role suspended' });
    await list.viewModify.save();
    await expect(list.viewModify.dialog).toBeHidden();
    await api.approve(await api.pendingRequestId(role.code));
  });

  await test.step('4. Exactly one audit card for the save, with both badges and both changes', async () => {
    await list.openRole(role.code, 'Audit Trail');
    const audit = list.audit(role.code);
    await audit.waitForLoad();
    const cards = await audit.readAll();
    const forTheSave = cards
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => card.comments === 'Regional scope applied and role suspended');
    expect(forTheSave, 'One card for one save — never two cards for the same save').toHaveLength(1);
    const { card, index } = forTheSave[0];
    expect(card.badges).toEqual(expect.arrayContaining(['Role Details', 'Status Change']));
    await expectColour(audit.card(index).badge('Role Details'), fsd.audit.badgeColours['Role Details'], 'FSD §5.6.3: Role Details badge is blue', { soft: true });
    await expectColour(audit.card(index).badge('Status Change'), fsd.audit.badgeColours['Status Change'], 'FSD §5.6.3: Status Change badge is amber/orange', { soft: true });
    expect.soft(card.changes.some((c) => c.startsWith('Description') && c.includes('→') && c.includes(newDescription)), `Description before → after (got ${JSON.stringify(card.changes)})`).toBe(true);
    expect.soft(card.changes.some((c) => /Status/.test(c) && /Active\s*→\s*Disabled/.test(c)), `Status Active → Disabled (got ${JSON.stringify(card.changes)})`).toBe(true);
  });
}
