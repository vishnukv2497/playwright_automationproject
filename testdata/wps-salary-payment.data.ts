export const wpsSalaryPaymentTestData = {
  sifFileName: '0001234567890260907060003.SIF',
  numberOfEmployees: '1',
  reference: 'WPS-SALARY-AUTOMATION',
  accountListCount: '2',
  accountRowIndex: 0,
  operationalPurpose: 'Monthly WPS salary disbursement',

  // Values the app auto-populates from the SIF file above (confirmed from a real run's DOM snapshot).
  //
  // The corporate name is NOT carried in the SIF — the backend resolves it from the MOL
  // ID (SCR record, 0001234567890). This demo environment now resolves that ID to
  // "Emirates Group" (the same and only entity the Browse Corporate picker offers); the
  // previous 'Test Comp LLC' was stale backend data. The app renders it with a trailing
  // space, so the spec compares it whitespace-tolerantly rather than pinning the padding.
  expectedCorporateName: 'Emirates Group',
  expectedMolId: '0001234567890',
  expectedCustomerCategory: 'Corporate',
  // The debit account is NOT asserted from here any more — the accounts this environment
  // offers for the SIF above have already shifted once (012345DIB6392xx -> 012345DIB9936xx),
  // so the spec reads the account number off the row it selects. Kept only for reference.
  expectedDebitAccount: '012345DIB993601',
  expectedBranchId: 'DIB001',
};
