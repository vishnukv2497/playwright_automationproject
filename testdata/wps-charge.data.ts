/**
 * Test data for the WPS Charge Configuration suite.
 *
 * Values follow the workbook's Test Data column where the build supports them.
 * Divergences are called out inline so the spec stays traceable to the manual cases.
 */

/**
 * Unique per worker, so records this suite creates are identifiable and cleanable and
 * parallel workers cannot collide on a name.
 */
export const RUN_ID = `AUTO${Date.now()}W${process.env.TEST_PARALLEL_INDEX ?? '0'}`;

/** Prefixes a label with the run id, e.g. AUTO1757934000000_TC001. */
export function scopedName(label: string): string {
  return `${RUN_ID}_${label}`;
}

function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export const wpsChargeData = {
  rail: 'WPS',

  // FSD calculation example (Section 10.3): 5.00 + (100 x 0.10%) = 5.10, +5% VAT = 5.36
  fixedAmount: '5',
  variableRate: '0.10',
  vat: '5',
  minCharge: '5',
  maxCharge: '250',

  negativeAmount: '-5',
  zeroAmount: '0',

  // BR-007 violation: Min > Max
  invalidMin: '300',
  invalidMax: '250',

  // BR-004 violation: Valid From after Valid To
  validFrom: isoDate(0),
  validTo: isoDate(30),
  invalidValidFrom: isoDate(30),
  invalidValidTo: isoDate(1),
  expiredValidTo: isoDate(-1),

  /**
   * The workbook names 'WPS ENBD Volume Discount', which does not exist in this
   * environment's rule catalogue. Using a real WPS rule from Browse Rules instead.
   */
  ruleName: 'WPS-DIF-Preferential-Rule',
  secondRuleName: 'New DIF Rule -Preferential',

  /** WPS message types this build offers (the workbook also lists PIF, which is absent). */
  messageTypes: ['SIF', 'DIF', 'RFA', 'EIF'] as const,
  cbMessageType: 'SIF (Salary Instruction File)',
  cbAmount: '25',
  currency: 'AED',
} as const;
