import { randomUUID } from 'crypto';
import { APIRequest, APIRequestContext, APIResponse, TestInfo } from '@playwright/test';
import { tokenFromStorageState } from './roleconfig-auth.util';

/**
 * Test setup/teardown for the Role Configuration suite, through the same endpoints the Roles screen and the
 * Approval Queue call (observed on the dev host). Specs use it only to ARRANGE preconditions (e.g. "an Active
 * role exists") and to CLEAN UP; every behaviour under test is driven through the UI.
 */

export type RoleStatus = 'Active' | 'Disabled' | 'Pending';

export type RoleDto = {
  roleName: string;
  description: string;
  baseRole: string | null;
  status: RoleStatus;
  createdBy: string;
  lastModifiedBy: string;
  deletedAt: string | null;
  assignedUserCount: number;
  pendingRequest: { id: number; action: string; makerBy: string } | null;
};

export type RoleListItem = {
  roleName: string;
  description: string;
  baseRole: string | null;
  status: RoleStatus;
  totalUsers: number;
  lastAction: { action: string; status: string } | null;
};

export type RoleScreen = {
  app: string;
  pageCode: string;
  screenName: string;
  mappable: boolean;
  isMapped: boolean;
  accessPrivilege: 'Actor' | 'Viewer' | 'Unmapped' | null;
};

export type ScreenDto = {
  app: string;
  screenCode: string;
  screenName: string;
  baseRoles: string[];
  rails: string[];
  rail: string | null;
  status: 'Active' | 'Disabled';
};

export type ConfigItem = {
  permissionKey: string;
  componentType: string;
  elementName: string;
  enable: boolean;
  uiMode: string | null;
  governedBy: string | null;
};

export type MappingItem = { app: string; pageCode: string; accessPrivilege?: 'Actor' | 'Viewer'; unmap?: true };

export class RoleConfigApi {
  private constructor(
    readonly maker: APIRequestContext,
    readonly checker: APIRequestContext,
  ) {}

  /** Request contexts authorised with the maker's and checker's saved sessions (see auth.setup.ts). */
  static async create(request: APIRequest, baseURL: string): Promise<RoleConfigApi> {
    const ctx = (user: 'maker' | 'checker') =>
      request.newContext({ baseURL, extraHTTPHeaders: { Authorization: `Bearer ${tokenFromStorageState(user)}` } });
    return new RoleConfigApi(await ctx('maker'), await ctx('checker'));
  }

  async dispose(): Promise<void> {
    await this.maker.dispose();
    await this.checker.dispose();
  }

  private async ok<T>(response: APIResponse, what: string): Promise<T> {
    if (!response.ok()) throw new Error(`${what}: HTTP ${response.status()} ${(await response.text()).slice(0, 300)}`);
    return (response.status() === 204 ? null : await response.json()) as T;
  }

  // --- reads (maker) ---

  async workflow(): Promise<{ makerOnlyActions: string[] }> {
    return this.ok(await this.maker.get('/api/iam/change-requests/workflow'), 'Read admin workflow');
  }

  /** True when the given action (NewRole, ModifyRole, ...) applies without a Checker. */
  async isMakerOnly(action: string): Promise<boolean> {
    return (await this.workflow()).makerOnlyActions.includes(action);
  }

  async role(code: string): Promise<RoleDto | null> {
    const response = await this.maker.get(`/api/iam/roles/${encodeURIComponent(code)}`);
    if (response.status() === 404) return null;
    return this.ok(response, `Read role ${code}`);
  }

  async roles(): Promise<RoleListItem[]> {
    return (await this.ok<{ roles: RoleListItem[] }>(await this.maker.get('/api/iam/roles?page=1&pageSize=500'), 'List roles')).roles;
  }

  async roleScreens(code: string): Promise<RoleScreen[]> {
    return (await this.ok<{ screens: RoleScreen[] }>(await this.maker.get(`/api/iam/roles/${encodeURIComponent(code)}/screens`), `Read screens of ${code}`)).screens;
  }

  async screenConfig(code: string, app: string, pageCode: string): Promise<ConfigItem[]> {
    const url = `/api/iam/roles/${encodeURIComponent(code)}/screens/${pageCode}/config?app=${app}`;
    return (await this.ok<{ items: ConfigItem[] }>(await this.maker.get(url), `Read ${pageCode} config of ${code}`)).items;
  }

  async screens(): Promise<ScreenDto[]> {
    return (await this.ok<{ screens: ScreenDto[] }>(await this.maker.get('/api/iam/screens'), 'List screens')).screens;
  }

  async auditTotal(code: string): Promise<number> {
    const body = await this.ok<{ total: number }>(await this.maker.get(`/api/iam/roles/${encodeURIComponent(code)}/audit?page=1&pageSize=1`), `Read audit of ${code}`);
    return body.total;
  }

  async rejection(code: string): Promise<{ requestId: number; isRejectedNew: boolean } | null> {
    const response = await this.maker.get(`/api/iam/roles/${encodeURIComponent(code)}/rejection`);
    if (response.status() === 204) return null;
    return this.ok(response, `Read rejection of ${code}`);
  }

  // --- maker submissions: each returns the change request id ---

  async createRole(r: { code: string; description: string; baseRole: string; remarks: string }): Promise<number> {
    const body = { roleName: r.code, description: r.description, baseRole: r.baseRole, makerRemarks: r.remarks, rails: [] };
    return (await this.ok<{ requestId: number }>(await this.maker.post('/api/iam/roles', { data: body }), `Create role ${r.code}`)).requestId;
  }

  /** Same payload the View & Modify panel sends; omitted fields keep their current values. */
  async modifyRole(code: string, change: { description?: string; baseRole?: string; status?: 'Active' | 'Disabled'; remarks: string }): Promise<number> {
    const current = await this.role(code);
    if (!current) throw new Error(`Role ${code} does not exist`);
    const body = {
      description: change.description ?? current.description,
      baseRole: change.baseRole ?? current.baseRole,
      status: change.status ?? current.status,
      makerRemarks: change.remarks,
      rails: [],
    };
    return (await this.ok<{ requestId: number }>(await this.maker.put(`/api/iam/roles/${encodeURIComponent(code)}`, { data: body }), `Modify role ${code}`)).requestId;
  }

  async mapScreens(code: string, items: MappingItem[], remarks: string): Promise<number> {
    const url = `/api/iam/roles/${encodeURIComponent(code)}/screen-mapping`;
    return (await this.ok<{ requestId: number }>(await this.maker.put(url, { data: { items, makerRemarks: remarks } }), `Map screens of ${code}`)).requestId;
  }

  /** Saves the full element list of one screen, with `changes` (permission key → enable) applied. */
  async configure(code: string, app: string, pageCode: string, changes: Record<string, boolean>, remarks: string): Promise<number> {
    const items = (await this.screenConfig(code, app, pageCode)).map((i) => ({
      permissionKey: i.permissionKey,
      enable: i.permissionKey in changes ? changes[i.permissionKey] : i.enable,
      uiMode: i.uiMode,
    }));
    const url = `/api/iam/roles/${encodeURIComponent(code)}/screens/${pageCode}/config?app=${app}`;
    return (await this.ok<{ requestId: number }>(await this.maker.put(url, { data: { items, makerRemarks: remarks } }), `Configure ${pageCode} of ${code}`)).requestId;
  }

  async deleteRole(code: string, remarks: string): Promise<number> {
    const url = `/api/iam/roles/${encodeURIComponent(code)}`;
    return (await this.ok<{ requestId: number }>(await this.maker.delete(url, { data: { makerRemarks: remarks } }), `Delete role ${code}`)).requestId;
  }

  /** Removes a rejected New Role from the grid (FSD §8 row 9 "Close"). */
  async closeRejected(code: string, requestId: number, remarks: string): Promise<void> {
    const url = `/api/iam/roles/${encodeURIComponent(code)}/close`;
    await this.ok(await this.maker.post(url, { data: { closesRequestId: requestId, makerRemarks: remarks } }), `Close rejected role ${code}`);
  }

  // --- checker decisions ---

  async approve(requestId: number, remarks = 'Approved by automation'): Promise<void> {
    const url = `/api/ops/admin-approval-queue/items/${requestId}/approve`;
    await this.ok(await this.checker.post(url, { data: { remarks, clientRequestId: randomUUID() } }), `Approve request ${requestId}`);
  }

  async reject(requestId: number, remarks = 'Rejected by automation'): Promise<void> {
    const url = `/api/ops/admin-approval-queue/items/${requestId}/reject`;
    await this.ok(await this.checker.post(url, { data: { remarks, clientRequestId: randomUUID() } }), `Reject request ${requestId}`);
  }

  /** Id of the change request currently awaiting a Checker for this role. */
  async pendingRequestId(code: string): Promise<number> {
    const role = await this.role(code);
    if (!role?.pendingRequest) throw new Error(`Role ${code} has no pending change request`);
    return role.pendingRequest.id;
  }
}

/** Unique role code within the FSD rules: alphanumeric and hyphen, at most 20 characters. */
export function uniqueRoleCode(prefix = 'RC'): string {
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${prefix}-${time}${random}`.slice(0, 20);
}

export type CreatedRole = { code: string; description: string; baseRole: string; remarks: string; requestId: number };

/**
 * Creates the roles a test needs and removes every one of them when the test ends (pass or fail): a pending
 * request is rejected, a rejected New Role is closed, anything else is deleted and the deletion approved.
 */
export class RoleFactory {
  private readonly created: string[] = [];

  constructor(private readonly api: RoleConfigApi) {}

  /** Registers a role created through the UI so it is cleaned up too. */
  track(code: string): string {
    this.created.push(code);
    return code;
  }

  newCode(prefix = 'RC'): string {
    return this.track(uniqueRoleCode(prefix));
  }

  /** New Role submitted by the Maker and awaiting the Checker (Status Pending, Last Action New Role). */
  async pending(opts: { baseRole?: string; description?: string; remarks?: string } = {}): Promise<CreatedRole> {
    const code = this.newCode();
    const role = {
      code,
      description: opts.description ?? `Automation role ${code}`,
      baseRole: opts.baseRole ?? 'Business Maker',
      remarks: opts.remarks ?? 'Created by Role Configuration automation',
    };
    return { ...role, requestId: await this.api.createRole(role) };
  }

  /** New Role approved by the Checker (Status Active). */
  async active(opts: { baseRole?: string; description?: string; remarks?: string } = {}): Promise<CreatedRole> {
    const role = await this.pending(opts);
    await this.api.approve(role.requestId);
    return role;
  }

  /** Active role then disabled through an approved Modify Role. */
  async disabled(opts: { baseRole?: string; description?: string } = {}): Promise<CreatedRole> {
    const role = await this.active(opts);
    await this.api.approve(await this.api.modifyRole(role.code, { status: 'Disabled', remarks: 'Disabled for automation precondition' }));
    return role;
  }

  async cleanup(testInfo: TestInfo): Promise<void> {
    for (const code of [...this.created].reverse()) {
      try {
        await this.remove(code);
      } catch (error) {
        testInfo.annotations.push({ type: 'cleanup', description: `${code} not removed: ${String(error).slice(0, 300)}` });
      }
    }
  }

  private async remove(code: string): Promise<void> {
    let role = await this.api.role(code);
    if (!role || role.deletedAt) return;
    if (role.pendingRequest) {
      if (role.pendingRequest.action === 'DeleteRole') {
        await this.api.approve(role.pendingRequest.id, 'Automation cleanup');
        return;
      }
      await this.api.reject(role.pendingRequest.id, 'Automation cleanup');
      role = await this.api.role(code);
      if (!role) return;
    }
    const rejection = await this.api.rejection(code);
    if (rejection?.isRejectedNew) {
      await this.api.closeRejected(code, rejection.requestId, 'Automation cleanup');
      return;
    }
    await this.api.approve(await this.api.deleteRole(code, 'Automation cleanup'), 'Automation cleanup');
  }
}
