/**
 * Expected results for Administration › Roles, taken word for word from Roles FSD v1.4 and
 * Manual_Test_Cases_Role_Configuration_v2.0 (the source of truth). Where the dev build differs, the spec
 * fails and the difference is reported as a possible defect — values here are NOT adjusted to the build.
 */
export const fsd = {
  page: {
    breadcrumb: 'Payment Hub Operations Console › Administration › Roles',
    title: 'Roles',
    subtitle: 'Define roles, assign base role type, and map screens',
  },

  /** §5.2.1, in FSD order. The grid may reorder columns per user configuration, so presence is what is checked. */
  gridColumns: [
    'Sl',
    'Role Code',
    'Role Description',
    'Base Role',
    'Created Date',
    'Created By',
    'Last Modified',
    'Last Modified By',
    'Total Users',
    'Status',
    'Last Action',
    'Actions',
  ],

  /** §5.2.4 */
  rowActions: ['View & Modify', 'Screen Map', 'Audit', 'Delete'],

  /** §5.2.3 — status and badge colour. */
  statuses: { Active: 'green', Disabled: 'grey', Pending: 'amber' } as const,

  /** §8 Last Action values. */
  lastAction: {
    newRole: 'New Role',
    modifyRole: 'Modify Role',
    modifyMapping: 'Modify Screen Mapping',
    deleteRole: 'Delete Role',
    rejected: (action: string) => `${action} - Rejected`,
  },

  /** §5.1 Base Role notes (backend-configured values). */
  baseRoles: ['Business Maker', 'Business Checker', 'Admin Maker', 'Admin Checker', 'Auditor', 'IT Support', 'General'],

  newRole: {
    title: 'Create Role',
    subtitle: 'Define role identity and assign a base role type',
    infoNote: 'Fields marked * are mandatory. Role Code cannot be changed after creation.',
    labels: ['Role Code', 'Role Description', 'Base Role', 'Remarks'],
    messages: {
      codeRequired: 'Role Code is required.',
      codeDuplicate: 'Role Code already exists. Please enter a unique code.',
      codeFormat: 'Role Code must be alphanumeric with no spaces.',
      codeLength: 'Role Code must not exceed 20 characters.',
      descriptionRequired: 'Role Description is required.',
      baseRoleRequired: 'Please select a Base Role.',
    },
    maxCodeLength: 20,
    maxDescriptionLength: 100,
  },

  viewModify: {
    label: 'VIEW & MODIFY',
    title: 'Record Details',
    commentsLabel: 'Modification Comments *',
    commentsPlaceholder: 'Enter reason for this modification…',
    statusOptions: ['Active', 'Disabled'],
  },

  mapping: {
    label: 'SCREEN MAPPING',
    subtitleEdit: 'Select screens this role can access',
    subtitleView: (code: string) => `${code} — view only`,
    infoNote: 'Tick screens to enable access for this role. Click Screen Config to set per-screen configuration options.',
    commentsPlaceholder: 'Enter reason for this screen mapping change…',
    commentsHint: 'This comment will be recorded in the audit trail.',
    columns: ['Screen', 'Rails', 'Access Privilege', 'Config'],
    privileges: ['Actor', 'Viewer'],
  },

  config: {
    label: 'SCREEN CONFIGURATION',
    subtitle: 'Controls applicable for this screen — enable or hide per role',
    columns: ['Element', 'Element Data List', 'Element Type', 'Description', 'Enable', 'Editable'],
    commentsHint: 'This comment will be recorded in the audit trail.',
    /** Display-only element types — Editable shows a dash (§5.5). */
    displayOnlyTypes: ['GRID', 'LABEL', 'COLUMN', 'PAGE', 'CARD', 'KPICARD', 'SECTION', 'TAB'],
    /** Input element types — Editable is a working toggle (TC-049). */
    inputTypes: ['TEXT BOX', 'TEXTBOX', 'DROPDOWN', 'CHECKBOX', 'TOGGLE', 'RADIO'],
  },

  audit: {
    label: 'AUDIT TRAIL',
    title: 'Audit History',
    subtitle: 'All recorded changes for this role',
    sectionOptions: ['All Sections', 'Screen Mapping', 'Screen Config', 'Status Change', 'Role Details', 'Role Created'],
    noMatch: 'No records match the selected filter.',
    /** §5.6.3 badge colours. */
    badgeColours: {
      'Screen Mapping': ['green'],
      'Screen Config': ['purple'],
      'Status Change': ['amber', 'orange'],
      'Role Details': ['blue'],
      'Role Created': ['grey'],
      Approval: ['teal'],
    } as const,
  },

  delete: {
    label: 'DELETE ROLE',
    message: 'To delete-Remove the Role mapping for the assigned users',
    reasonLabel: 'Reason / Remarks',
  },

  formats: {
    /** §5.2.1 Created Date / Last Modified. */
    gridDateTime: /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/,
    /** §5.6.2 card timestamp. */
    auditDateTime: /^\d{2}-[A-Z][a-z]{2}-\d{4} \d{2}:\d{2} (AM|PM)$/,
    /** §5.6.5 e.g. "Showing 1–5 of 12 entries". */
    auditCount: /^Showing \d+–\d+ of \d+ entries$/,
  },
};

/** Role Code values for TC-004 (manual test data), one case per row of the data-driven loop. */
export const roleCodeCases = [
  { name: 'contains a space', code: 'HR Maker', message: fsd.newRole.messages.codeFormat },
  { name: 'contains a special character', code: 'HR@Maker', message: fsd.newRole.messages.codeFormat },
  { name: 'is 21 characters long', code: 'ABCDEFGHIJKLMNOPQRSTU', message: fsd.newRole.messages.codeLength },
  { name: 'is blank', code: '', message: fsd.newRole.messages.codeRequired },
] as const;

/**
 * Screens on the dev host used as mapping data (see /api/iam/screens). Business Maker roles inherit
 * charge-config (Actor) and ops dashboard (Viewer); department is applicable but not inherited.
 */
export const screens = {
  chargeConfig: { app: 'bankingops', code: 'charge-config', name: 'Charge Configuration', element: { key: 'config:charge:write', name: 'Edit / Save' } },
  department: { app: 'bankingops', code: 'department', name: 'Department' },
  dashboard: { app: 'ops', code: 'dashboard', name: 'Dashboard' },
  routingRules: { app: 'bankingops', code: 'routing-rules', name: 'Routing Rules' },
  /** Has input elements: an "Export" Dropdown and an "accountNumber-unmask" Toggle. */
  sifSummary: { app: 'bankingops', code: 'sif-summary', name: 'SIF Summary Report' },
};

export const remarks = {
  create: 'Created by Role Configuration automation',
  modify: 'Modified by Role Configuration automation',
  mapping: 'Screen mapping changed by Role Configuration automation',
  config: 'Screen configuration changed by Role Configuration automation',
  delete: 'Deleted by Role Configuration automation',
  approve: 'Approved by Role Configuration automation',
  reject: 'Rejected by Role Configuration automation',
};

/** Parses "DD-MM-YYYY HH:MM:SS" (grid) or "DD-Mon-YYYY HH:MM AM/PM" (FSD audit) into a Date. */
export function parseDisplayDate(text: string): Date {
  const numeric = text.match(/(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})(?::(\d{2}))?/);
  if (numeric) {
    const [, d, m, y, h, mi, s] = numeric;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(mi), Number(s ?? 0));
  }
  const named = text.match(/(\d{2})-([A-Za-z]{3})-(\d{4}) (\d{2}):(\d{2}) (AM|PM)/);
  if (!named) throw new Error(`Unrecognised date "${text}"`);
  const [, d, mon, y, h, mi, ap] = named;
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(mon);
  return new Date(Number(y), month, Number(d), (Number(h) % 12) + (ap === 'PM' ? 12 : 0), Number(mi));
}

/** yyyy-mm-dd for native date inputs. */
export function isoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
