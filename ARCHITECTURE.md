# TRANSHUB Playwright Framework — Architecture & Reusable Prompts

This document does two things: it explains the folder structure and conventions applied to the WPS Salary flow (delivered as working code alongside this file), and it gives you reusable prompts for converting your remaining recorded flows — this scenario is only about 20% of the application — into the same pattern without drifting from it.

## Target folder structure

```
TRANSHUB/
├── Pages/                          # Page Objects — one class per screen/component
│   ├── BasePage.ts                 # shared helpers every page object inherits
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── DomesticPaymentsPage.ts
│   └── WpsSalaryPaymentPage.ts
├── fixtures/                       # Playwright test-extensions (dependency injection)
│   ├── pages.fixture.ts            # one entry per Page Object
│   └── auth.fixture.ts             # auto-login, extends pages.fixture
├── utils/                          # framework-level helpers, no test logic
│   ├── env.util.ts                 # credentials / base URL from process.env
│   └── testDataPath.util.ts        # resolves paths under testdata/files
├── testdata/                       # inputs, not test code
│   ├── files/                      # upload fixtures (.SIF, .csv, .pdf, ...)
│   │   └── README.md
│   └── wps-salary-payment.data.ts  # one *.data.ts per scenario or module
└── tests/
    ├── api/                        # (already existed)
    └── ui/
        └── wps-salary-payment.spec.ts
```

As more modules arrive, nest by module rather than flattening everything into one folder, e.g.:

```
Pages/domestic-payments/WpsSalaryPaymentPage.ts
Pages/domestic-payments/OwnAccountTransferPage.ts
Pages/international-payments/SwiftPaymentPage.ts
tests/ui/domestic-payments/wps-salary-payment.spec.ts
tests/ui/international-payments/swift-payment.spec.ts
testdata/domestic-payments/wps-salary-payment.data.ts
testdata/files/domestic-payments/0001234567890260907060003.SIF
```

## Conventions

**Page Objects (`Pages/`)**
- One class per screen or reusable widget, extending `BasePage`.
- Expose locators as `readonly` properties; expose actions as verb-named async methods (`login`, `uploadSifFile`, `submitUpload`) — never leak raw `page.getByRole(...)` calls into spec files.
- A Page Object never imports test data or asserts business outcomes — it only knows how to interact with the screen. Assertions belong in the spec.
- If a button's accessible name is dynamic (e.g. `Select from A/c List (2)`), wrap it in a private method that takes the dynamic part as a parameter, as done in `WpsSalaryPaymentPage.selectFromAccountListButton`.

**Fixtures (`fixtures/`)**
- `pages.fixture.ts` is the base: it wires one fixture per Page Object. Add a new entry here the moment a new Page Object is created — every spec picks it up for free.
- `auth.fixture.ts` extends the base fixture and overrides `page` to perform a real UI login before the test body runs. Import `test`/`expect` from `auth.fixture` for any scenario that needs to start already logged in (this will be nearly every scenario in the remaining 80%); import from `pages.fixture` directly only when the login screen itself is under test.
- If different roles/personas are needed later (e.g. maker vs. checker), add a second fixture (`makerAuth.fixture.ts`, `checkerAuth.fixture.ts`) rather than branching inside one fixture.

**Utils (`utils/`)**
- Framework plumbing only: environment/config reading, file path resolution, date/amount formatting helpers, API helpers for test setup/teardown. No Playwright locators and no business assertions here.
- Every credential, base URL, or environment-specific value goes through `env.util.ts`, sourced from `process.env` — never hardcoded in a Page Object, fixture, or spec. Populate a local `.env` (gitignored) from `.env.example`.

**Test data (`testdata/`)**
- `testdata/files/` holds actual upload fixtures (SIF, CSV, PDF). Reference them only via `testDataPath.util.ts`, never by hardcoded relative/absolute paths.
- `testdata/*.data.ts` holds the literal values a scenario needs (reference codes, employee counts, amounts, expected text). One file per scenario, or per module once scenarios share inputs. Specs import from here instead of inlining literals.

**Specs (`tests/ui/`)**
- Import `test`/`expect` from the appropriate fixture file, not from `@playwright/test` directly.
- Tag every test with a priority tag (`@smoke` or `@regression`) and a module tag (`@wps-salary`, `@international-payments`, ...) in the test title, so `npx playwright test --grep @smoke` works as the suite grows.
- Add real assertions after each meaningful state change (a confirmation toast, a balance updating, a submitted-status label) rather than only relying on the final action not throwing. The delivered spec has a `TODO` marking where the real post-submit assertion should go once you tell me (or record) what the confirmation screen looks like.

## Files delivered in this pass

- `Pages/BasePage.ts`, `LoginPage.ts`, `DashboardPage.ts`, `DomesticPaymentsPage.ts`, `WpsSalaryPaymentPage.ts`
- `fixtures/pages.fixture.ts`, `fixtures/auth.fixture.ts`
- `utils/env.util.ts`, `utils/testDataPath.util.ts`
- `testdata/wps-salary-payment.data.ts`, `testdata/files/README.md`
- `tests/ui/wps-salary-payment.spec.ts`
- `.env.example`

### Setup still needed on your side
1. Copy these files into your existing `TRANSHUB` repo at the matching paths (your `Pages`/`fixtures` folders already exist and are currently empty).
2. `npm install dotenv` and add `import 'dotenv/config';` near the top of `playwright.config.ts` (or use `dotenv-cli` in your `test` script) so `.env` is loaded.
3. In `playwright.config.ts`, add `use: { baseURL: process.env.BASE_URL }` at the top level so `page.goto('/login')` resolves correctly, and make sure `.env` is in `.gitignore`.
4. Copy `.env.example` to `.env` and fill in real values; never commit `.env`.
5. Drop your real `0001234567890260907060003.SIF` file into `testdata/files/` (a placeholder wasn't fabricated since its exact banking format matters).
6. Add the real post-submission assertion in the spec once you confirm what a successful submission shows.

## Reusable prompts for the remaining ~80%

Use these prompts (with me, or with any coding assistant working in this repo) each time you record a new flow with Playwright codegen, so every new scenario lands in this same structure instead of drifting back to flat, hardcoded scripts.

### Master prompt (paste the raw recorded script after this)

> This project follows a Page Object Model Playwright framework with this structure: `Pages/` (one class per screen, actions as verb methods, locators as readonly properties, extending `BasePage`), `fixtures/pages.fixture.ts` (one fixture per Page Object) and `fixtures/auth.fixture.ts` (auto-login, extends pages.fixture), `utils/env.util.ts` (env-sourced config) and `utils/testDataPath.util.ts` (resolves testdata/files paths), `testdata/*.data.ts` (literal scenario data) and `testdata/files/` (upload fixtures), and `tests/ui/<module>/<scenario>.spec.ts` (imports test/expect from auth.fixture, tags each test with a priority tag and a module tag).
>
> Refactor the following raw Playwright codegen script into this structure:
> 1. Reuse an existing Page Object/method if the screen is already modeled; only create new Page Object classes/methods for screens or actions that don't exist yet.
> 2. Extract every literal (account numbers, reference codes, amounts, file names, expected confirmation text) into a new or existing `testdata/*.data.ts` file — nothing hardcoded in the spec.
> 3. Extract any uploaded file into `testdata/files/` and reference it via `testDataPath.util.ts`.
> 4. Never hardcode credentials or base URLs — use `env.util.ts`.
> 5. Write the spec under `tests/ui/<module>/<scenario>.spec.ts`, importing from `auth.fixture` (or `pages.fixture` if the scenario is about login itself), tagged with a priority tag and a module tag.
> 6. Add a real assertion after each meaningful state change, not just at the end.
> 7. Output every new or changed file with its full path and full contents — no partial diffs.
>
> Raw recorded script:
> ```
> <paste your new page.goto(...)/getByRole(...) codegen output here>
> ```

### Narrower prompts, if you want to build one layer at a time

- **Page Objects only:** "Using the Page Object conventions in `ARCHITECTURE.md`, create/extend the Page Object(s) needed for this raw recorded script, reusing `BasePage` and any existing classes. Don't write the spec yet — just the Page Object file(s)."
- **Fixtures only:** "A new Page Object `<Name>Page` was just added. Add its fixture entry to `fixtures/pages.fixture.ts` following the existing pattern."
- **Test data only:** "Extract every literal value and uploaded file from this raw script into a new `testdata/<scenario>.data.ts` file and, if needed, a note for `testdata/files/`, following the pattern in `wps-salary-payment.data.ts`."
- **Spec only:** "Given these existing Page Objects and this `testdata/<scenario>.data.ts`, write `tests/ui/<module>/<scenario>.spec.ts` following the tagging and assertion conventions in `ARCHITECTURE.md`."

Keep this file updated as the structure evolves (new fixture types, new module folders, a shared `BaseTest` for API+UI hybrid scenarios, etc.) so the prompts above stay accurate for whoever — human or AI — picks up the next 80%.
