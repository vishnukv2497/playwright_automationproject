# Role Configuration — Automation Plan (Phase 1, awaiting approval)

- **Source of truth:** Roles FSD v1.4 + `Manual_Test_Cases_Role_Configuration_v2.0.docx` (77 cases: 46 Critical / 31 High)
- **Target:** `tests/ui/roleconfig/` on the dev host (`ROLES_BASE_URL`)
- **Users:** Maker `MAKER_USER/MAKER_PASS` (admin), Checker `CHECKER_USER/CHECKER_PASS` (tester1). Both are read from env only.

## Design decisions

| # | Decision |
|---|---|
| D1 | New specs go in `tests/ui/roleconfig/`. Reuse and extend the existing page objects (`Pages/RolesPage.ts`, `Pages/RoleDrawers.ts`, `Pages/ApprovalQueuePage.ts`) by adding members only, so the existing `tests/ui/roles` suite keeps working. New files: `fixtures/roleconfig.fixture.ts`, `testdata/roleconfig.data.ts`, and two read-only page objects (User role picker and Screens master) if Phase 2 shows they are needed. |
| D2 | Expected results come from the FSD and manual cases, word for word. Labels, titles, hints and placeholders use `expect.soft`, so one run lists every difference. Business outcomes are hard assertions: save blocked, Status, Last Action, audit card. Where the app differs, the test fails and is reported as a defect. (The existing suite asserts the app's observed wording instead.) |
| D3 | Auth uses a `roleconfig-setup` project that saves maker and checker storageState. A `roleconfig` project depends on it, and `chromium` gets a `testIgnore` for `tests/ui/roleconfig` so the specs don't run twice. Maker and checker each get their own browser context. If the session can't be stored in storageState, I'll fall back to the existing per-test UI login. |
| D4 | The base URL comes from `ROLES_BASE_URL`. `BASE_URL` points at the demo host and other suites depend on it, so I won't repoint it. The credential variables go in the local `.env` (gitignored), with empty placeholders in `.env.example`. In Azure DevOps they become secret pipeline variables. |
| D5 | Every test creates its own roles (`RC-<base36>`, 20 characters or fewer, alphanumeric and hyphen). Active preconditions are reached by maker submit followed by checker approval. Cleanup: an Active role gets a delete request and checker approval. A pending create is rejected by the checker, then Closed if the app offers it. Seeded roles are only read, with writes blocked (`blockWrites`). |
| D6 | **Partial** cases automate the Roles-module steps. Each expected result that isn't checked is recorded as a `not-verified` annotation with its blocker, so the report shows exactly what wasn't covered. |

Every test carries `@roleconfig @regression`, plus the tags in the table, plus annotations for the FSD section and BR ID.

**Blocker legend**
- **[USR]** Needs a business user whose role assignment may be changed, logged in to check screen access.
- **[SCR]** Needs Screens master status or element changes (system configuration).
- **[MO]** Needs Maker-only workflow. The test skips itself under Maker-Checker.
- **[API]** No API contract (FSD §2.2: out of scope).
- **[CG]** Common Grid Features FSD not provided.
- **[DB]** No database access.

\* Assignability is checked read-only, by reading the role options in the User module without saving. Phase 2 confirms whether this is possible; if not, these steps become `not-verified`.

## Automation plan

| TC ID | Title | Priority | Spec file | Page objects used | Tags | Automatable? |
|---|---|---|---|---|---|---|
| TC-001 | Create role under Maker-Checker | Critical | new-role | RolesPage, RoleForm, UserAssign* | @critical @mc @smoke | Yes (expected result 6 is checked read-only*) |
| TC-002 | Create role under Maker-only | Critical | new-role | RolesPage, RoleForm | @critical | Yes; skips itself on Maker-Checker [MO] |
| TC-003 | Duplicate Role Code rejected on save | Critical | new-role | RolesPage, RoleForm | @critical @negative @smoke | Yes |
| TC-004 | Role Code format and length (one data-driven loop) | High | new-role | RoleForm | @high @negative | Yes |
| TC-005 | Remarks mandatory on create (blank or spaces) | Critical | new-role | RoleForm, RoleDetail | @critical @negative | Yes |
| TC-006 | Duplicate from Role pre-fills fields; Role Code must still be unique | High | new-role | RoleForm | @high | Yes |
| TC-007 | Base Role mandatory and loaded from the backend | High | new-role | RoleForm | @high @negative | Yes (backend source checked via the network response) |
| TC-008 | Role Description mandatory, 100-character limit | High | new-role | RoleForm | @high @negative | Yes |
| TC-009 | Cancel on Create Role discards the record | High | new-role | RolesPage, RoleForm | @high | Yes |
| TC-010 | Creation writes a Role Created audit card | Critical | new-role | RolesPage, RoleDetail | @critical | Yes |
| TC-011 | Grid columns, header, formats, alignment | High | roles-list | RolesPage | @high @smoke | Yes |
| TC-012 | Sl column sequential, resets on filter | High | roles-list | RolesPage | @high | Yes |
| TC-013 | Status badge colours (Active, Disabled, Pending only) | High | roles-list | RolesPage, RoleForm, ApprovalQueue | @high @mc | Yes |
| TC-014 | Last Action reflects the latest workflow action | Critical | roles-list | RolesPage, RoleForm, ApprovalQueue | @critical @mc | Yes |
| TC-015 | Combined filter and search use AND logic | High | roles-list | RolesPage | @high | Partial: count-label format from the manual case [CG] |
| TC-016 | Total Users drives the delete precondition | Critical | roles-list | RolesPage, DeleteDrawer | @critical | Partial: steps 2–4 need user assignment [USR] |
| TC-017 | Row actions present and bound to the same role | High | roles-list | RolesPage, RoleForm, RoleDetail, DeleteDrawer | @high | Yes |
| TC-018 | Export matches the applied filter | High | roles-list | RolesPage | @high | Partial: export format not specified [CG]; parsing .xlsx would need a new dependency (I'll ask first) |
| TC-019 | View & Modify binds to the selected row's role | Critical | view-modify | RolesPage, RoleForm, RoleDetail | @critical @smoke | Yes (read-only on seeded roles, writes blocked) |
| TC-020 | Role Code read-only after creation | Critical | view-modify | RoleForm | @critical @negative | Partial: changing the request payload only if the modify endpoint is visible in Phase 2 |
| TC-021 | Modification Comments mandatory on Modify | Critical | view-modify | RoleForm, RoleDetail, ApprovalQueue | @critical @negative @mc | Yes |
| TC-022 | Modify under Maker-Checker sets Pending / Modify Role | Critical | view-modify | RolesPage, RoleForm, ApprovalQueue | @critical @mc | Partial: existing-user access [USR] |
| TC-023 | Active → Disabled | Critical | view-modify | RolesPage, RoleForm, RoleDetail, ApprovalQueue, UserAssign* | @critical @mc | Partial: suspension of existing users [USR] |
| TC-024 | Disabled → Active | Critical | view-modify | RolesPage, RoleForm, RoleDetail, ApprovalQueue, UserAssign* | @critical @mc | Partial: existing users regain access [USR] |
| TC-025 | Base Role change re-scopes Screen Mapping | Critical | view-modify | RoleForm, RoleDetail, ApprovalQueue | @critical @mc | Yes |
| TC-026 | Description and Status in one save give one card with two badges | High | view-modify | RoleForm, RoleDetail, ApprovalQueue | @high @mc | Yes |
| TC-027 | Cancel on View & Modify discards changes | High | view-modify | RoleForm, RoleDetail | @high | Yes |
| TC-028 | Last Modified and Last Modified By updated by the system | High | view-modify | RolesPage, RoleForm, ApprovalQueue | @high @mc | Yes |
| TC-029 | Only Active screens applicable to the Base Role are listed | Critical | screen-mapping | RoleDetail, ScreensMaster* | @critical | Partial: read-only comparison; relies on Disabled and Deleted screens already existing |
| TC-030 | Disabling a screen in the master removes it from mappings | Critical | screen-mapping | — | @critical | No: fixme [SCR] [USR] |
| TC-031 | Re-enabled screen is mappable again | High | screen-mapping | — | @high | No: fixme [SCR] |
| TC-032 | Map a screen as Actor | Critical | screen-mapping | RoleDetail, MappingDrawer, ApprovalQueue | @critical @mc @smoke | Partial: user's actions on the screen [USR] |
| TC-033 | Viewer privilege is read-only | Critical | screen-mapping | RoleDetail, MappingDrawer, ApprovalQueue | @critical @mc | Partial: user-side read-only check [USR] |
| TC-034 | Access Privilege only counts when the screen is ticked | High | screen-mapping | RoleDetail, MappingDrawer | @high | Yes |
| TC-035 | Unticking removes privilege and config; kept in audit | Critical | screen-mapping | RoleDetail, MappingDrawer, ApprovalQueue | @critical @mc | Partial: users lose access [USR] |
| TC-036 | Privilege change on one role doesn't affect another | Critical | screen-mapping | RoleDetail, MappingDrawer, ApprovalQueue | @critical @mc | Partial: user-access steps [USR] |
| TC-037 | Modification Comments mandatory for Save Mapping | Critical | screen-mapping | RoleDetail, MappingDrawer | @critical @negative @mc | Yes |
| TC-038 | Header checkbox selects and deselects all | High | screen-mapping | RoleDetail | @high | Yes |
| TC-039 | Screen Config button only on screens with configurable elements | High | screen-mapping | RoleDetail | @high | Yes |
| TC-040 | Role with no screens can't be assigned | Critical | screen-mapping | UserAssign*, ApprovalQueue | @critical @mc | Partial: actual assignment [USR] |
| TC-041 | Screen Mapping blocked while Add Role is pending | Critical | screen-mapping | RolesPage, RoleDetail, ApprovalQueue | @critical @mc @negative | Yes |
| TC-042 | Only one workflow action per role at a time | Critical | screen-mapping | RolesPage, RoleForm, RoleDetail, DeleteDrawer, ApprovalQueue | @critical @mc @negative | Yes |
| TC-043 | Disabled (approved) role: mapping and config read-only | Critical | screen-mapping | RoleDetail, MappingDrawer, ApprovalQueue | @critical @mc @negative | Yes |
| TC-044 | Save Mapping under Maker-Checker sets Pending | Critical | screen-mapping | RolesPage, RoleDetail, MappingDrawer, ApprovalQueue | @critical @mc | Partial: existing users keep the old mapping [USR] |
| TC-045 | Only elements Enabled at screen level are offered | Critical | screen-config | RoleDetail, ScreensMaster* | @critical | Partial: columns and header; element comparison read-only, if the Screens master shows it |
| TC-046 | Disabling an element hides it for the role's users | Critical | screen-config | RoleDetail, ApprovalQueue | @critical @mc | Partial: user-side hiding [USR] |
| TC-047 | Enable and Editable are independent | Critical | screen-config | RoleDetail, ApprovalQueue | @critical @mc | Partial: user-side effect [USR] |
| TC-048 | Most restrictive privilege wins | Critical | screen-config | — | @critical | No: fixme [SCR] [USR] |
| TC-049 | Editable shows a dash for display-only elements | High | screen-config | RoleDetail | @high | Yes |
| TC-050 | No add, edit or remove controls for elements | High | screen-config | RoleDetail | @high @negative | Yes |
| TC-051 | Modification Comments mandatory for Save Config | Critical | screen-config | RoleDetail | @critical @negative @mc | Yes |
| TC-052 | Cancel on Screen Config discards changes | High | screen-config | RoleDetail | @high | Yes |
| TC-053 | Delete blocked when users are assigned | Critical | delete-role | RolesPage, DeleteDrawer | @critical @negative @smoke | Yes (seeded role with users, writes blocked) |
| TC-054 | Delete reason mandatory | Critical | delete-role | RolesPage, DeleteDrawer, RoleDetail, ApprovalQueue | @critical @negative @mc | Yes |
| TC-055 | Delete under Maker-Checker keeps the role usable until approved | Critical | delete-role | RolesPage, DeleteDrawer, ApprovalQueue, UserAssign* | @critical @mc | Partial: existing-user usage [USR] |
| TC-056 | Soft delete; Role Code stays reserved | Critical | delete-role | — | @critical @mc | No: fixme. Precondition needs a previously assigned role [USR]; record retention [DB]; reuse rule unconfirmed (G4) |
| TC-057 | Cancel on delete confirmation | High | delete-role | RolesPage, DeleteDrawer | @high | Yes |
| TC-058 | All operations captured in the audit trail | Critical | audit-trail | RolesPage, RoleForm, RoleDetail, MappingDrawer, ApprovalQueue | @critical @mc | Yes (slow: several approval rounds) |
| TC-059 | Checker decision is a separate card | Critical | audit-trail | RoleForm, RoleDetail, ApprovalQueue | @critical @mc | Yes |
| TC-060 | Mapping card shows +, − and privilege before → after | High | audit-trail | RoleDetail, MappingDrawer, ApprovalQueue | @high @mc | Yes |
| TC-061 | Config card has one line per element and attribute | High | audit-trail | RoleDetail, ApprovalQueue | @high @mc | Yes |
| TC-062 | Section and date filters combine with AND | High | audit-trail | RoleDetail | @high | Yes |
| TC-063 | To Date earlier than From Date rejected | High | audit-trail | RoleDetail | @high @negative | Yes |
| TC-064 | Audit entries immutable | Critical | audit-trail | RoleDetail | @critical @negative | Partial: UI has no edit or delete controls; back-end check only if an audit endpoint is visible |
| TC-065 | One save across sections gives one card with several badges | High | audit-trail | RoleForm, RoleDetail, ApprovalQueue | @high @mc | Yes |
| TC-066 | Audit pagination and record count | High | audit-trail | RoleDetail | @high | Yes (read-only on a seeded role with 12 or more entries) |
| TC-067 | Audit trail scoped to the selected role | Critical | audit-trail | RolesPage, RoleDetail | @critical | Yes |
| TC-068 | Maker can't approve their own submission | Critical | workflow | RolesPage, RoleForm, ApprovalQueue | @critical @mc @negative | Yes |
| TC-069 | Checker rejects New Role; Resubmit and Close | Critical | workflow | RolesPage, RoleDetail, ApprovalQueue | @critical @mc | Yes (where Resubmit and Close appear is not specified, G3) |
| TC-070 | Checker rejects Modify, Mapping and Delete | Critical | workflow | RolesPage, RoleForm, MappingDrawer, DeleteDrawer, ApprovalQueue | @critical @mc | Partial: user access [USR] |
| TC-071 | Checker approves a mapping change and it takes effect | Critical | workflow | RoleDetail, MappingDrawer, ApprovalQueue | @critical @mc | Partial: user access [USR] |
| TC-072 | New role not assignable until approved and mapped | Critical | workflow | RoleForm, ApprovalQueue, UserAssign* | @critical @mc | Partial: actual assignment [USR] |
| TC-073 | Status limited to Active, Disabled and Pending | High | workflow | RolesPage, RoleForm | @high | Yes |
| TC-074 | Maker-only applies changes immediately | Critical | workflow | RolesPage, RoleForm, MappingDrawer, DeleteDrawer | @critical | Yes; skips itself on Maker-Checker [MO] |
| TC-075 | API add, modify and delete | High | api | — | @high @api | No: fixme [API] |
| TC-076 | Mapping and config not exposed via API | High | api | — | @high @api | No: fixme [API] |
| TC-077 | Role without mapping can't be assigned via API | Critical | api | — | @critical @api | No: fixme [API] [USR] |

**Totals:** Yes 48 (TC-002 and TC-074 skip themselves on Maker-Checker) · Partial 22 · No 7.

## FSD gaps and contradictions (not invented; affected tests noted)

| # | Gap | Affects |
|---|---|---|
| G1 | §5.1 field 5 says Status "always defaults to Active on create", but the panel footer says the role is created "in Pending status". §8 rows 1–2 resolve this by workflow; tests follow §8. | TC-001, TC-002 |
| G2 | §5.2.3 says Pending means "not yet active", but §8 rows 3, 5 and 7 say a Pending role "remains OK for user assignment". Tests follow §8 and the manual cases. | TC-022, TC-044, TC-055 |
| G3 | §8 row 9: after a New Role rejection the status is "blank/Disabled" (blank is not a defined status), and nowhere specifies where Resubmit and Close appear. | TC-069 |
| G4 | §8 row 8 gives no terminal status after an approved delete. Soft delete applies only "if ever assigned"; behaviour for never-assigned roles, and whether the code can be reused, is undefined. | TC-056 (fixme) |
| G5 | The §5.7 confirmation message ("Remove the Role mapping for the assigned users") contradicts the precondition that delete is blocked when users exist. The text of the blocking message is not given. | TC-053 (asserts that a message appears, not its wording) |
| G6 | No success message or toast text is specified for any save. Tests assert one is shown, not its wording. | TC-001, 021, 032, 037, 051, 054 |
| G7 | No message is specified for Description over 100 characters. | TC-008 |
| G8 | The §5.6.1 Section filter has no "Approval" option, although §5.6.3 defines an Approval card. | TC-062 |
| G9 | No message text for To Date earlier than From Date. | TC-063 |
| G10 | No message text for the BR-ROLES-013 "action in progress" block. | TC-041, TC-042 |
| G11 | §6 open note: whether system-user base roles need screen mapping. Tests assume BR-ROLES-003 always applies. | TC-040, 072, 077 |
| G12 | Last Action wording differs between §8 and the mock. Tests use §8. | TC-014, TC-069, TC-070 |
| G13 | Admin Checker permissions and the approval screen are in the separate Approval FSD, which wasn't provided. Checker steps use the app's Approval Queue as found. | All @mc tests |
| G14 | Common Grid Features FSD not provided (filters, count label, export format). | TC-012, 015, 018 |
| G15 | Numbering errors: §5.4.1 and §5.4.2 reused under §5.5; §5.5 used twice (Audit should be §5.6); "5.3.3" sits under §5.4; §5.2.3A points to a §5.1.3A that doesn't exist. Document Control says v1.4 but Version History stops at 1.3. | Traceability only |
| G16 | "Must not be blank" doesn't say whether spaces-only counts as blank. The manual cases treat it as blank, and tests follow them. | TC-005, TC-021 |
| G17 | Screens assigned to no base role are offered to every base role; the FSD does not define this case. | TC-029 (not asserted) |
| G18 | No Last Action is defined for a Screen Config change (the build shows "Modify Screen Config"). | — |
| G19 | Every registered screen has at least its page element, so no row "without configurable elements" exists. The FSD also doesn't say whether Config is offered for unmapped screens. | TC-039 |
| G20 | In the build, new roles inherit the base role's screen template; the FSD assumes a new role has no screens. | TC-072 |

## Changes after Phase 2 (live exploration, 12-Nov-2026)

- **Environment:** every Roles action is Maker-Checker (`makerOnlyActions: []`), so TC-002 and TC-074 skip themselves. The tester1 checker approves through the Approval Queue and can't open the Roles screen.
- **Page objects:** the Roles screen was redesigned after the existing `tests/ui/roles` suite was written, so that suite fails on page load (`Pages/RolesPage.ts` waits for a "View" button that no longer exists). The new suite uses new page objects in `Pages/roleconfig/`, and the old suite is untouched.
- **Assignability checks:** done read-only through the Create User form's role list (UserAssign\* confirmed). The Screens master was compared read-only through `/api/iam/screens` (ScreensMaster\*).
- **Status changes:**
  - **TC-020:** Partial → Yes. The modify endpoint was found, so the payload tamper check runs.
  - **TC-056:** No → Partial. Removal, reserved code and retained history are checked; the "previously assigned" precondition can't be.
  - **TC-039:** Yes → Partial. The dash case can't be verified (G19).
  - **TC-015:** Partial → Yes. Checked as the manual case describes it.
- **Gap resolved:** G3. Resubmit and Close are on the rejected role's View & Modify panel, and both are tested.
- **Final results** are in `tests/ui/roleconfig/README.md`. Defects are in `Downloads/RoleConfig_Bugs_2026-11-12.xlsx`.
