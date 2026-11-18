/**
 * Test data for Administration > Roles (Roles FSD v1.5), as observed on the dev host.
 * Where the build's wording/format differs from the FSD, the observed value is used and the
 * difference is listed in tests/ui/roles/README.md.
 */
export const rolesData = {
  /** Backend-configured base roles, as rendered in the Base Role dropdown. */
  baseRoles: ['BusinessMaker', 'BusinessChecker', 'AdminMaker', 'AdminChecker', 'Auditor', 'ITSupport', 'General'],

  statuses: ['Active', 'Pending', 'Disabled'],

  /**
   * Seeded roles, used read-only. Tests only open forms on these with writes blocked
   * (utils/network.util.ts → blockWrites) and never submit a change to them.
   */
  seeded: {
    /** Holds users — the delete pre-condition case. */
    withUsers: { code: 'Checker', description: 'Reviews, edits and submits corporates', baseRole: 'BusinessChecker' },
    /** No users, no pending change. */
    plain: { code: 'Auditor', description: 'Auditor role', baseRole: 'Auditor' },
    plainB: { code: 'Viewer', description: 'Viewer role' },
    /** Mapped screens with configurable elements, and a long audit history. */
    withHistory: {
      code: 'WPSMaker',
      configScreen: 'Charge Configuration (bankingops)',
      pageElement: 'bankingops:page.charge-config:view',
      actionElement: 'config:charge:write',
      railElement: 'rail:WPS:access',
    },
  },

  remarks: 'Created for automation',

  /** Observed validation/outcome text (FSD §5.1 wording differs — see README). */
  messages: {
    codeRequired: 'A role code is required.',
    baseRoleRequired: 'A base role is required.',
    remarksRequired: /Maker remarks are required/,
    duplicate: /already exists/i,
    oneChangeAtATime: /is awaiting a Checker\. One change at a time per role\./,
    // FSD-only messages — this build never renders them; asserting them documents the gap.
    fsdDescriptionRequired: /Role Description is required/i,
    fsdCodeTooLong: /must not exceed 20 characters/i,
  },

  /** Characters the Role Code input silently strips -> expected value left in the field. */
  invalidCodes: [
    { typed: 'AUTO RL', expected: 'AUTORL' },
    { typed: 'AUTO_RL', expected: 'AUTORL' },
    { typed: 'AUTO@RL', expected: 'AUTORL' },
    { typed: 'AUTO.RL', expected: 'AUTORL' },
    { typed: 'RL#1', expected: 'RL1' },
  ],

  /** Grid timestamps render DD/MM/YYYY HH:mm (FSD: DD-MM-YYYY HH:MM:SS). */
  gridDate: /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/,
  /** Audit card timestamps: DD-Mon-YYYY HH:MM AM/PM — matches FSD §5.6.2. */
  auditDate: /\d{2}-[A-Za-z]{3}-\d{4} \d{2}:\d{2} (AM|PM)/,

  fsdMaxCodeLength: 20,
  fsdMaxDescriptionLength: 100,
};

/** Unique, alphanumeric-plus-hyphen role code, <= 20 chars, safe for parallel workers. */
export function uniqueRoleCode(prefix = 'AUTO'): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${prefix}-${ts}${rnd}`.slice(0, 20);
}

/** Unique role code of an exact length (padded with X), always containing a hyphen. */
export function roleCodeOfLength(length: number): string {
  const base = uniqueRoleCode('AB');
  return base.length >= length ? base.slice(0, length) : base.padEnd(length, 'X');
}

/** Parses an audit timestamp such as "29-Oct-2026 04:32 PM". */
export function parseAuditDate(text: string): Date {
  const [, d, mon, y, h, m, ap] = text.match(/(\d{2})-([A-Za-z]{3})-(\d{4}) (\d{2}):(\d{2}) (AM|PM)/)!;
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(mon);
  const hour = (Number(h) % 12) + (ap === 'PM' ? 12 : 0);
  return new Date(Number(y), month, Number(d), hour, Number(m));
}
