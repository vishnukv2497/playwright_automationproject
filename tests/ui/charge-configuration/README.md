# Charge Configuration — WPS automation suite

Playwright + TypeScript coverage for the Charge Configuration module of NeST TransactHub,
scripted from `Charge_Configuration_Test_Cases_WPS.xlsx` (46 Critical/High cases derived from
FSD *Charge Configuration v2.0*, PHOC-FSD-ADM-CHG-002).

## Layout

| Path | Purpose |
| --- | --- |
| `tests/ui/charge-configuration/global-charge.spec.ts` | TC-001..TC-020, TC-046 |
| `tests/ui/charge-configuration/preferential-charge.spec.ts` | TC-021..TC-031 |
| `tests/ui/charge-configuration/calculation-priority.spec.ts` | TC-032..TC-036 |
| `tests/ui/charge-configuration/cb-compliance-charge.spec.ts` | TC-037..TC-044 |
| `tests/ui/charge-configuration/access-control.spec.ts` | TC-045 |
| `tests/ui/charge-configuration/known-defects.spec.ts` | DEF-1..DEF-5 regression checks |
| `testdata/charge-configuration-cases.ts` | Typed copy of all 46 workbook rows + `caseTitle()` |
| `testdata/wps-charge.data.ts` | Amounts, dates, rule/corporate values, run-scoped naming |
| `Pages/ChargeConfigurationLandingPage.ts` | Category cards + menu navigation |
| `Pages/ConfiguredChargesGridPage.ts` | Rail/category filters, search, rows, pagination |
| `Pages/TransactionChargeModal.ts` | Global + Preferential drawer |
| `Pages/CbComplianceChargeModal.ts` | CB Compliance drawer |
| `Pages/BrowseRulesModal.ts` / `Pages/BrowseCorporateModal.ts` | Pickers |

Page Objects live in the existing `Pages/` folder and are exposed as fixtures in
`fixtures/pages.fixture.ts`; specs import `test`/`expect` from `fixtures/auth.fixture.ts`,
which auto-logs in before each test.

## Running

```bash
npx playwright test tests/ui/charge-configuration           # whole module
npx playwright test --grep @critical                        # Critical cases only (26)
npx playwright test --grep @high                            # High cases only (20)
npx playwright test --grep @known-defect                    # the 5 defect regressions
npx playwright test --grep "TC-016"                         # a single case
npx playwright show-report
```

Titles are built by `caseTitle()` as `TC-0xx - <scenario> @<priority>`, so the workbook's
priority column drives tag selection directly.

## Environment

Copy `.env.example` to `.env` and fill in real values — `.env` is gitignored, secrets are
never hardcoded.

```
BASE_URL=https://bankops.demo.transacthub.te.nestdigital.com
ADMIN_USERNAME=...
ADMIN_PASSWORD=...
```

`BASE_URL` feeds `use.baseURL` in `playwright.config.ts`; credentials are read once in
`utils/env.util.ts` and consumed by the auto-login fixture.

## Known gaps — what is NOT asserted, and why

Nothing in this suite fakes a passing assertion for behaviour it cannot observe.

**No charge-calculation surface.** 18 cases describe the charge *applied to a transaction*
(TC-004..008, TC-020, TC-023, TC-027, TC-029, TC-032..036, TC-040, TC-041). This environment
exposes no Charge Simulation screen and no calculation API, so these are `test.fixme()` with a
note naming what would finish them. Their configuration half is covered by TC-001/TC-016/TC-021.
To enable: provide a simulation endpoint and drive it with `APIRequestContext`, or DB access.

**No second user account.** Maker-Checker (TC-013, TC-014, TC-015, TC-043) needs a checker
distinct from the maker; access denial (TC-045) needs an unprivileged user. Only `admin`
exists. To enable, add to `.env` and build a second-user fixture:

```
CHECKER_USERNAME=      CHECKER_PASSWORD=
READONLY_USERNAME=     READONLY_PASSWORD=
```

**The rule catalogue is empty.** Verified live (2026-09-17): opening Browse Rules from any
charge drawer with the filters at *All Rails* + *All Statuses* returns
`No rules match the current filters.`, and Rule Management exposes only a **Create Rule**
entry (`/rule-engine/new`) — there is no rule list screen. Nothing can be attached to a
charge, so these fail on missing data rather than on a locator:

| Test | Rule it expects |
| --- | --- |
| `TC-016` | `WPS-DIF-Preferential-Rule` (`testdata/wps-charge.data.ts`) |
| `charge-configuration.spec.ts` (3 tests) | `New DIF Rule -Preferential` |
| `charge-configuration-cb-compliance.spec.ts` (2 tests) | `New DIF Rule -Preferential` |

Both rule names existed when the suite was written. To re-enable: restore the rule
catalogue in the environment, or add a setup project that creates a rule via
`/rule-engine/new` before the charge specs run.

**Defects these tests assert against (they fail today, by design).** Verified in the browser:

| Finding | Evidence |
| --- | --- |
| Maker-checker is bypassed | Save raises `alert("✓ Charge configuration submitted for approval")` but the record is written as **Active** — no row ever reaches `Pending Approval` |
| BR-014 not enforced | A charge amount of `-5` saves successfully |
| BR-015 not enforced | TC-031 and TC-046 both persist the duplicate — `toHaveCount` reports `Received: 2` |
| BR-001 not enforced | 27–29 Active Global charges on the WPS rail |
| BR-003 blocks silently | Saving with no corporate is correctly rejected, but with **no message at all** |
| **Deactivate does not deactivate** | The `confirm()` is accepted and the drawer reports success, but the row stays `Active` (TC-010, TC-011) |
| **Category chips filter only the loaded page** | At 10 rows/page, clicking `Global` shows *"No charges match the current filters."* while 29 Global records exist. Raise the page size **before** applying a category chip |
| **Empty CB Compliance charge is accepted** | Saving with no message type and no amount returns `✓ CB compliance charge submitted for approval` (TC-044) |
| **CB Compliance has no Deactivate** | Its drawer offers only Browse Rules / Save Configuration / Close, so such a charge can never be deactivated (TC-042) |
| **A past `Valid To` is rejected silently** | No dialog, no inline message, no record — the user cannot tell the save failed (TC-024) |
| No `Save as Draft` control | Drawer offers only Deactivate / Close / Save Changes |
| `+ Create New Rule` permanently disabled | Rule Modal unreachable from the drawer |
| `PIF` missing | WPS exposes only SIF, DIF, RFA, EIF |

**How this app reports outcomes.** There is no inline validation anywhere. Feedback comes from
native browser dialogs — `alert()` on success, `confirm()` before activate/deactivate — and a
rejected save produces *nothing at all*. Assert with `saveAndCaptureDialog()` /
`confirmStatusChange()` on the page objects; never look for inline error text.

**Beware vacuous passes.** `allTextContents()` and `count()` do not auto-wait. Reading the grid
before it populates yields `[]`/`0`, which silently satisfies "no bad values" style assertions —
this produced a false green on DEF-5 *and* on TC-002, which reported a clean pass while 27
Active Global charges sat on screen.

One `<tbody>` renders three different things — a loading placeholder, the
`"No charges match the current filters."` row, and real records — and the first two are
single-cell rows that `count()` reads as zero. So:

- Read rows through `dataRows` (`tbody tr:has(td:nth-child(5))`), never `rows`.
- Go through `waitForGrid()` after every filter, search, page-size change or save. The empty
  state is *not* a terminal state: the grid flashes it for about a second after a rail chip
  click before the records arrive, so `waitForGrid()` gives rows a bounded second chance
  before accepting "no results".
- Guard every "at most N" / "none of these" assertion with a non-empty check
  (`dataRowCount()` > 0) so an empty read can never be mistaken for a pass.

**Wait for writes, don't sleep through them.** `save()` and `confirmStatusChange()` on the
drawers block until the app has actually answered — `save()` waits for the success alert and
for the drawer to close, `confirmStatusChange()` closes the drawer itself because a status
change leaves it open. A bare `click()` on Save returns while the write is still in flight, so
the `search()` that follows filters a stale list and a record that was created looks missing.
That single race caused most of the suite's historic flakiness.

**View and Edit are different dialogs.** The View row action opens a read-only panel labelled
per record (`aria-label="Charge CCWPSG…"`, exposed as `chargesGrid.detailDrawer`) whose only
control is Close — and `Escape` does *not* dismiss it. The editable Transaction Charge drawer
is a separate dialog reached through the Edit row action.

## Data hygiene

The suite writes to a shared environment. Records it creates are named
`AUTO<timestamp>_TC0xx` (`scopedName()` in `testdata/wps-charge.data.ts`) so they can be
found and removed later. Activate/deactivate cases act only on records the same test just
created — they never mutate pre-existing data. There is no automated cleanup: deleting
records was not authorised, so purge `AUTO*` rows manually when needed.

## Locator notes for the dev team

Several controls have no accessible name or test id and are currently reached positionally:

- Grid row actions (View / Edit / History) — suggest `data-testid="charge-row-view|edit|history"`.
- Browse Rules row checkboxes — suggest `data-testid="rule-select-<code>"`.
- The Transaction Charge drawer has `role=dialog` but no accessible name — suggest `aria-label`.
- The corporate picker is not exposed as a dialog at all — suggest `role="dialog"` +
  `aria-label="Select Corporate / Retail Customer"`.
- The grid's loading, empty and populated states are all plain `<tr>`s and can only be told
  apart by counting cells — suggest `data-testid="charge-grid-loading|empty"` and
  `data-testid="charge-row"` so `waitForGrid()` can stop inferring state from DOM shape.

Adding these would remove the most brittle selectors in the suite.

## Stability

The six tests that used to vary run-to-run (TC-009, TC-024, TC-026, TC-039, TC-042, TC-046)
are fixed. Two consecutive full runs produce **identical** results, and every failure reports
a specific application behaviour rather than a timeout. Fixing the races also converted two
false greens (TC-002, TC-046) into true failures that name real rule violations.

**Corporate picker (fixed 2026-09-17).** `selectFirstEntity()` read the row label with
`textContent()`, which does not auto-wait, so before the picker settled it returned the
`No results found.` placeholder — and because `check()` re-resolves the locator a moment
later, it then ticked the real row that had since arrived. The method succeeded while
returning the wrong name, and TC-021 failed further down looking for "No results found."
on the charge form. Reads now go through `selectableRows` (rows that actually carry a
checkbox) after waiting for one, mirroring `dataRows` on the charges grid.

**Only one corporate exists.** The picker's Corporate tab holds a single entity
("Emirates Group"); the Retail Customer tab holds four. TC-030 therefore exercises
multi-select on the Retail Customer tab — on the Corporate tab there is no second row to
tick and `nth(1)` could never resolve.

**Don't hardcode environment-supplied values.** Two assertions went stale because the demo
backend changed underneath them: the corporate name resolved from the SIF's MOL ID
(`Test Comp LLC` -> `Emirates Group`) and the debit accounts offered for that SIF
(`012345DIB6392xx` -> `012345DIB9936xx`). The account case now reads the account number off
the row it selects and asserts the form matches, so it cannot go stale again.
