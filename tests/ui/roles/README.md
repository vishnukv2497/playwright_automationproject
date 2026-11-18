# Roles (User Management) — UI automation

Automation of `Roles_FSD_v1.5_Critical_High_TestCases.md` (71 Critical/High cases) for
**Administration › Roles** (`/user-management/roles`), built against the dev host.

## Running

```bash
npx playwright test tests/ui/roles                    # whole suite
npx playwright test tests/ui/roles --grep @critical   # by tag (tags match the test-case document)
npx playwright test tests/ui/roles/create-role.spec.ts
```

Configuration (`.env`, see `.env.example`):

| Variable | Purpose |
|---|---|
| `ROLES_BASE_URL` | Host for this suite only. Defaults to `https://bankops-dev.transacthub.te.nestdigital.com`. Other suites keep using `BASE_URL`. |
| `ROLES_USERNAME` / `ROLES_PASSWORD` | Optional. Fall back to `ADMIN_USERNAME` / `ADMIN_PASSWORD`. |

`fixtures/roles.fixture.ts` logs in to `ROLES_BASE_URL` and provides `trackRole(code)`: every role
a test creates is proposed for deletion when the test ends. Under Maker-Checker that proposal
still needs a Checker, and a role whose own creation is pending cannot be deleted at all. Those
leftovers are recorded as `cleanup` annotations in the report.

`tests/roles-seed.spec.ts` is the Playwright MCP seed for this suite (same login, dev host).

## Layout

| Spec | FSD | Cases |
|---|---|---|
| `create-role.spec.ts` | §5.1 | 001, 002, 003, 010, 011, 012, 013 |
| `create-role-validation.spec.ts` | §5.1 | 004–009 |
| `roles-list.spec.ts` | §5.2 | 014–016 |
| `view-modify.spec.ts` | §5.3 | 017, 018, 022, 023, 025 |
| `screen-mapping.spec.ts` | §5.4 | 034, 036, 038 |
| `screen-config.spec.ts` | §5.5 | 043, 044 |
| `audit-trail.spec.ts` | §5.6 | 046, 050–053 |
| `delete-role.spec.ts` | §5.7 | 055–058 |
| `workflow.spec.ts` | §3, §8 | 059, 064, 065 |
| `pending-cases.spec.ts` | — | the other 33 cases as `test.fixme`, each annotated with its blocker |

Page objects: `Pages/RolesPage.ts`, `Pages/RoleDrawers.ts` (New/Modify form, Delete, detail drawer
tabs, per-screen mapping drawer), `Pages/ApprovalQueuePage.ts`. Data: `testdata/roles.data.ts`.

## Safety on a shared environment

Tests never change seeded roles (`Checker`, `Auditor`, `Viewer`, `WPSMaker`). Any test that opens
a form on one of them runs with `blockWrites()` (`utils/network.util.ts`), which aborts every
non-GET IAM request. Negative tests use the same recorder to prove the save was blocked in the
browser: no write request was sent.

## Environment notes (dev, as explored)

- **Workflow:** every Roles action is Maker-Checker (`/api/iam/change-requests/workflow` returns
  `makerOnlyActions: []`). Maker-only cases (002, 023, 056) skip themselves here.
- **Create is currently down:** `POST /api/iam/roles` returns **503
  `ADMIN_APPROVAL_POLICY_UNAVAILABLE`** ("Operations could not be reached for the approval plan").
  Every test that creates a role fails with that server message until it is fixed.
- **No Checker user:** only `admin` exists, and the Approval Queue does not show a maker their own
  requests. Approve/reject flows stay `fixme` until `CHECKER_USERNAME` / `CHECKER_PASSWORD` exist.

## Build vs FSD — differences the suite asserts or documents

Wording and format differences use the observed value. Rule differences are asserted as the FSD
states them, so they fail and stay visible. Soft assertions are marked `FSD:` in the failure message.

| Area | FSD | Build | Handling |
|---|---|---|---|
| Role Description | Mandatory, max 100 | Optional, maxlength 500 | 004 soft-fails; 009 (101) fails |
| Role Code length | Max 20, message on save | maxlength 100, no message | 008 fails |
| Role Code characters | Message "must be alphanumeric…" | Invalid characters stripped while typing | 006 asserts nothing invalid survives |
| Validation text | "Role Code is required." etc. | "A role code is required." etc. | observed text |
| Remarks blank | Red border + focus | Message only | 005 soft-fails on focus |
| Duplicate from Role | Pre-fills Role Code too | Description + Base Role only | 010 soft-fails |
| Grid | Sl, Role Description, Total Users, DD-MM-YYYY HH:MM:SS | No Sl; description under code; "Users"; DD/MM/YYYY HH:mm | observed |
| Total Users alignment | Right-aligned | Cell has `text-right` but renders left (computed `text-align: left`) | 014 soft-fails |
| Modify | Status (Active/Disabled) editable | No Status control | 018 soft-fails; 020/021/024/066 fixme |
| Status while change pending (M/C) | Pending | Stays Active; only Last Action changes | noted |
| Delete with users (BR-ROLES-004) | Blocked with info message | Confirmation opens with "N users currently hold…" | 055 fails |
| Screen Mapping | Checkbox grid + header select-all + Save Mapping | Per-screen "Modify mapping" drawer | 035 fixme |
| Screen Config availability | Screens with configurable elements, '—' otherwise | Enabled when mapped, disabled when not | 036 asserts build |
| Screen Config | Enable / Editable toggles | Granted checkbox + Mode (No opinion / hidden / disabled) | 043 adapted |
| Audit filters | Section + From/To dates + Search button | Section + free-text search | 051 fails |
| Audit pagination | Paged, "Showing 1–5 of N entries" | All cards in one list | 053 soft-fails |
| Audit user | Username | Display name ("Platform Administrator") | not asserted |

## Latest run (dev, 02-Nov-2026)

72 tests: **19 passed, 17 failed, 36 skipped**, 3.2 min with 4 workers.

- 7 failures are the dev 503 on create: 001, 007, 009 (100 chars), 011, 046, 064, 065.
- 10 failures are the FSD differences above: 004, 005, 008, 009 (101 chars), 010, 014, 018, 051, 053, 055.
- Skipped: 33 `fixme` (pending-cases) plus 002, 023, 056 (Maker-only only).

## Troubleshooting

If a run sits for ~10+ minutes before any test starts, a paused Playwright MCP session
(`planner_setup_page` / `generator_setup_page`) is still recording a video into `test-results/`.
On Windows the runner keeps retrying to clear that folder until the file is released. Close the
MCP session first.
