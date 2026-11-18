export const cbComplianceChargesTestData = {
  view: 'CB Compliance Charges',
  rail: 'WPS',
  message: 'SIF',
  amount: '10',
  negativeAmount: '-10',
  zeroAmount: '0',
  currency: 'AED',
  description: 'Automation Test',
};

/**
 * Linking an existing charge rule to the WPS SIF compliance charge.
 *
 * `as const` keeps `category` and `rail` as literal types, so they satisfy
 * ChargeCategory / ChargeRail without a cast at the call site.
 *
 * `ruleName` must exist in the Browse Rules catalogue — verified present on
 * 2026-09-24 alongside WPS-Retail-Customer-SpecialRule and WPS-SIF-SpecialRule.
 * The catalogue is environment data and has been empty before now, so if this
 * case starts failing at rule selection, check the catalogue before the locator.
 */
export const cbComplianceRuleLinkTestData = {
  category: 'CB Compliance Charges',
  rail: 'WPS',
  messageType: 'SIF (Salary Instruction File)',
  ruleName: 'Test Rul 01',
  amount: '25',
} as const;
