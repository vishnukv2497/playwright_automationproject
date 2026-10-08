# CLAUDE.md

Playwright + TypeScript test framework for https://www.saucedemo.com. Specs live in `tests/ui` and `tests/api`, page objects in `pages/` (one per screen, plus `HeaderComponent`), page-object fixtures in `fixtures/pages.ts`, typed test data in `test-data/`, DB helpers in `utils/`.

## Framework conventions

- Specs import `{ test, expect }` from `fixtures/pages`, never from `@playwright/test`, and get page objects as fixtures (`async ({ loginPage, inventoryPage, header }) => ...`). Register every new page object in `fixtures/pages.ts`.
- Tests start logged in as `standard_user`: the `setup` project (`tests/auth.setup.ts`) saves `.auth/standard.json` and every browser project loads it. Tests about logging in opt out with `test.use({ storageState: { cookies: [], origins: [] } })`.
- Keep assertions in specs; page objects expose locators and actions only.
- Navigate with paths relative to `baseURL` (`page.goto('/cart.html')`).
- Users and checkout data come from `test-data/`. The password is `SAUCE_PASSWORD` in `.env` (gitignored; copy `.env.example`).
- Tag every test `@smoke` or `@regression` (`test('...', { tag: '@smoke' }, ...)`); run them with `npm run test:smoke` / `npm run test:regression`. Wrap actions and checks in `test.step()`.
- One behaviour per test; every test must be independent and parallel-safe. Never use `waitForTimeout` or sleeps: synchronise with web-first assertions. After client-side navigation, use locators that only exist on the new page (e.g. the detail page's `getByTestId('add-to-cart')`), so actions wait for it.
- Deliberate saucedemo bugs (problem_user, error_user, visual_user) are marked `test.fail()` with a comment naming the bug.
- Screenshot baselines are Chromium-only, in `tests/ui/visual.spec.ts-snapshots/`. Refresh them with the command in `visual.spec.ts`, never including the visual_user test. Linux baselines for CI come from the pipeline's `updateSnapshots` run.
- CI is `azure-pipelines.yml`: @smoke on Chromium for PRs, @smoke + @regression on all three browsers nightly, sharded across 3 agents. `SAUCE_PASSWORD` is a secret pipeline variable.

## Playwright CLI

- Always explore with `playwright-cli` before writing or fixing locators: `open <url>`, then `snapshot`, and act on the element refs (`click e15`, `fill e11 <text>`). Use `generate-locator <ref>` to see what Playwright recommends.
- Refs go stale when the page changes. Take a new `snapshot` after every action that changes the page before using a ref again.
- Prefer `getByRole` and `getByTestId` over CSS classes, ids and `nth()`/`first()`. saucedemo uses `data-test` attributes; `testIdAttribute` is set to `'data-test'` in both `playwright.config.ts` and `.playwright/cli.config.json`, so `getByTestId('title')` matches `[data-test="title"]`.
- Follow the existing Page Object Model in `pages/`: the constructor takes `page: Page`, locators are `readonly` properties, and actions are async methods. Keep each page object to its own screen's elements and actions; don't add speculative helpers.
- Verify changes with `npx playwright test <spec> --project=chromium`.
- Close browser sessions when done: `playwright-cli close-all` (check with `playwright-cli list`).
- CLI settings live in `.playwright/cli.config.json`. Snapshots, screenshots and logs go to `.playwright-cli/`, which is gitignored.
