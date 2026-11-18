import { test } from '../../../fixtures/auth.fixture';
import { caseTitle } from '../../../testdata/charge-configuration-cases';

/**
 * Charge Calculation Priority (WPS) — TC-032..TC-036.
 *
 * Every case in this module asserts which charge is *applied to a transaction*, which
 * this environment gives no way to observe: there is no Charge Simulation screen in the
 * navigation (Payment Que, New Payment, Charge Management, Rule Management, Corporate
 * Management, Routing Rules, Exception Management, Reports, Ask a Question) and no
 * charge-calculation API was provided.
 *
 * They are therefore fixme rather than asserted — a UI-only assertion here would be
 * checking configuration, not the priority behaviour the cases actually describe.
 *
 * To finish these, one of the following is needed:
 *   - a charge-calculation / simulation endpoint (drive it via APIRequestContext), or
 *   - a payment-processing flow whose applied charge is readable in the UI, or
 *   - DB access to assert the persisted charge on a processed transaction.
 *
 * The configuration each case depends on IS covered: Global create (TC-001),
 * Preferential create (TC-021), rule attachment (TC-016), deactivation (TC-010).
 */
test.describe('Charge Configuration - Charge Calculation Priority (WPS)', () => {
  test.fixme(caseTitle('TC-032'), async () => {
    // Priority 1 — Preferential rules, then Preferential defaults, Global not evaluated.
    // Needs two priced transactions for corporate ENBD (one rule-matching, one not).
  });

  test.fixme(caseTitle('TC-033'), async () => {
    // Priority 2 — with no valid Preferential, Global rules then Global defaults.
    // Needs priced transactions for a corporate with no Preferential charge.
  });

  test.fixme(caseTitle('TC-034'), async () => {
    // End-to-end FSD example: AED 100 -> base 5.10 -> VAT 0.26 -> final 5.36.
    // Needs the computed charge for a WPS SIF transaction from ENBD.
  });

  test.fixme(caseTitle('TC-035'), async () => {
    // BR-012 — an Inactive charge is skipped and the next in priority order is used.
    // Deactivation itself is asserted in TC-010; the fall-through needs pricing.
  });

  test.fixme(caseTitle('TC-036'), async () => {
    // BR-013 — Draft charges are excluded from calculation. Doubly blocked: this build
    // has no Save as Draft control (see TC-012), so a Draft record cannot be created
    // through the UI in the first place.
  });
});
