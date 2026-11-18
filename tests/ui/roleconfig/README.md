# Role Configuration (User Management › Roles) — UI automation

Automation of `Manual_Test_Cases_Role_Configuration_v2.0` (77 Critical/High cases, TC-001 … TC-077)
against **Roles FSD v1.4**, for **Administration › Roles** (`/user-management/roles`) on the dev host.
The plan, with the automatable / partial / blocked decision per case, is in
[`specs/roleconfig-automation-plan.md`](../../../specs/roleconfig-automation-plan.md).

## Running

```bash
npx playwright test --project=roleconfig                       # whole suite (setup runs first)
npx playwright test --project=roleconfig --grep @critical      # by tag
npx playwright test --project=roleconfig --grep @smoke
npx playwright test --project=roleconfig --grep "@mc"          # Maker-Checker flows
npx playwright test --project=roleconfig --grep "TC-053"       # one manual case
npx playwright test --project=roleconfig --grep-invert @mc     # quick run without approval rounds
```

Tags: `@critical` / `@high` (manual-case priority), `@smoke`, `@regression` (all), `@negative`, `@mc`
(needs the Checker), `@api`, and the module tag `@roleconfig`. Each test title starts with its manual TC ID;
the report also shows the FSD section and BR IDs as annotations, plus `not-verified` annotations for expected
results that could not be checked (see below).

## Configuration

| Variable | Purpose |
|---|---|
| `ROLES_BASE_URL` | Dev host (default `https://bankops-dev.transacthub.te.nestdigital.com`). `BASE_URL` is left for the other suites. |
| `MAKER_USER` / `MAKER_PASS` | Admin Maker (submits changes). |
| `CHECKER_USER` / `CHECKER_PASS` | A different Admin Checker (approves / rejects in the Approval Queue). |

Set them in a local `.env` (gitignored) or, in Azure DevOps, as secret pipeline variables. They are read only
by `utils/env.util.ts → getRoleConfigEnv()` and used only as login input.

Projects (in `playwright.config.ts`):

- `roleconfig-setup` — `auth.setup.ts` signs the Maker and the Checker in once and saves both sessions to
  `playwright/.auth/` (gitignored). The app keeps its session in `localStorage`, which storageState captures.
- `roleconfig` — the specs, signed in as the Maker; `fixtures/roleconfig.fixture.ts` opens a **separate
  browser context** for the Checker. Test timeout 120 s (approval rounds).
- The existing `chromium` project ignores this folder, so a plain `npx playwright test` does not run it twice.

## Layout

| Spec | FSD | Manual cases |
|---|---|---|
| `new-role.spec.ts` | §5.1 | TC-001 … TC-010 (TC-004 is one data-driven loop) |
| `roles-list.spec.ts` | §5.2 | TC-011 … TC-018 |
| `view-modify.spec.ts` | §5.3 | TC-019 … TC-028 |
| `screen-mapping.spec.ts` | §5.4 | TC-029 … TC-044 |
| `screen-config.spec.ts` | §5.5 | TC-045 … TC-052 |
| `delete-role.spec.ts` | §5.7 | TC-053 … TC-057 |
| `audit-trail.spec.ts` | §5.6 | TC-058 … TC-067 |
| `workflow.spec.ts` | §3, §8 | TC-068 … TC-074 |
| `api.spec.ts` | §6 | TC-075 … TC-077 (fixme — no API contract) |
| `shared-steps.ts` | §5.6.3 | flow shared by TC-026 and TC-065 |

Page objects (`Pages/roleconfig/`): `RolesListPage`, `NewRolePanel`, `ViewModifyPanel`,
`ScreenMappingPanel`, `ScreenConfigPanel`, `AuditTrailPanel` (+ `AuditCard`), `DeleteRolePanel`,
`UserRolePicker`; plus `ReviewChangePanel` added to the existing `Pages/ApprovalQueuePage.ts`.
Test data and FSD wording: `testdata/roleconfig.data.ts`. Helpers: `utils/roleconfig-api.util.ts`,
`utils/roleconfig-auth.util.ts`, `utils/colour.util.ts`, `utils/csv.util.ts`.

## How the tests work

- **Expected results are the FSD's.** Messages, labels and formats are asserted word for word from FSD v1.4 /
  the manual cases. UI wording, labels and colours use soft assertions so one run lists every difference;
  business outcomes (save blocked, Status, Last Action, audit entries) are hard assertions. A difference from
  the FSD therefore fails the test and is reported as a possible defect — tests are not bent to the build.
- **Arrange through the API, act through the UI.** Preconditions such as "an Active role" or "a Disabled role"
  are created with the same endpoints the Roles screen and the Approval Queue call (`RoleFactory`), then the
  steps under test are driven in the UI. The grid filters the data it loaded, so tests reload it after arranging.
- **Own data only.** Each test creates uniquely coded roles (`RC-<time><random>`, ≤ 20 chars) and
  `RoleFactory.cleanup()` removes them all when the test ends, pass or fail: pending requests are rejected,
  rejected new roles are Closed, the rest are deleted and the deletion approved. Anything that cannot be
  removed is reported as a `cleanup` annotation. Tests that only *read* seeded roles run with
  `blockWrites()` (`utils/network.util.ts`), which aborts every non-GET request — they can never change data.
- **Assignability** ("not available for assignment") is read from the Create User form's role list, which
  the tests open and close without saving.
- **`not-verified` annotations** list each expected result a test could not check, with the reason —
  mostly user-side access checks that need a business user (see the coverage table).
- Waiting is web-first throughout; `waitForResponse` is used once (TC-007) where the UI gives no signal
  of where the Base Role list comes from.

## Latest run (dev, 12-Nov-2026)

77 manual cases (81 tests: TC-004 runs as 5 data-driven tests), 4 workers, 4.8 min:

- **43 pass.** 12 of them (TC-016, 023, 024, 032, 033, 036, 040, 046, 053, 056, 064, 070) carry `not-verified`
  annotations for steps that need a business user or the Screens master.
- **26 fail, all on differences from the FSD**, reported as BUG-01 … BUG-18 in
  `Downloads/RoleConfig_Bugs_2026-11-12.xlsx`, with screenshots and traces in `Downloads/RoleConfig_Bug_Evidence/`.
- **8 skipped:** TC-002 and TC-074 need Maker-only (this host is Maker-Checker); TC-030, 031, 048, 075, 076 and 077 are fixme
  (Screens master changes or the API contract).
- `--repeat-each=3` over the passing set: 143 of 143 passed, 0 flaky. Cleanup left no `RC-…` roles behind.

## CI (Azure DevOps)

The suite runs headless and every test owns its data, so tests run in parallel and in any order. The config uses
1 worker and 2 retries when `CI` is set, so expect about 25 minutes. Pass the users as secret variables:

```yaml
- script: npx playwright install --with-deps chromium
- script: npx playwright test --project=roleconfig
  env:
    CI: 'true'
    ROLES_BASE_URL: $(ROLES_BASE_URL)
    MAKER_USER: $(MAKER_USER)
    MAKER_PASS: $(MAKER_PASS)
    CHECKER_USER: $(CHECKER_USER)
    CHECKER_PASS: $(CHECKER_PASS)
- task: PublishPipelineArtifact@1
  condition: always()
  inputs: { targetPath: playwright-report, artifact: roleconfig-report }
```

## Troubleshooting

If a run hangs before any test starts, a paused Playwright MCP session is probably holding a file in
`test-results/`. Close the MCP session, or run with `--output=<another folder>`.
