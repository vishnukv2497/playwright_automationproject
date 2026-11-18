import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';
import { getRoleConfigBaseUrl } from './utils/env.util';
import { ROLECONFIG_AUTH } from './utils/roleconfig-auth.util';

export default defineConfig({
  testDir: './tests',

  fullyParallel: true,

  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 2 : 0,

  // 8 logical cores locally; 6 browsers is a good balance against a remote demo host.
  // Tests create their own run-scoped records, so they are safe to run concurrently.
  workers: process.env.CI ? 1 : 6,

  // Allure writes raw results to ./allure-results; turn them into a report with
  // `npm run allure:serve` (or allure:generate + allure:open). Both folders are gitignored.
  reporter: [
    ['html'],
    ['allure-playwright', { resultsDir: 'allure-results' }],
  ],

  use: {
    baseURL: process.env.BASE_URL,
    // Without these, a click on a missing element waits out the whole test timeout,
    // so a single bad locator costs 90s instead of surfacing in seconds.
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
      // The Role Configuration suite has its own projects below (dev host, saved maker/checker sessions).
      testIgnore: ['**/ui/roleconfig/**'],
    },
    // Role Configuration (tests/ui/roleconfig): signs the Maker and the Checker in once and saves their
    // sessions; every spec then starts signed in as the Maker and opens a separate Checker context.
    {
      name: 'roleconfig-setup',
      testMatch: /ui[\\/]roleconfig[\\/]auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: getRoleConfigBaseUrl() },
    },
    {
      name: 'roleconfig',
      testMatch: /ui[\\/]roleconfig[\\/].*\.spec\.ts/,
      dependencies: ['roleconfig-setup'],
      // Maker-Checker flows reload the grid several times and wait on approval rounds.
      timeout: 120_000,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: getRoleConfigBaseUrl(),
        storageState: ROLECONFIG_AUTH.maker,
      },
    },
    // Firefox/WebKit are intentionally disabled: their `name` was commented out, which
    // left two *unnamed* projects running every test a third time each — against a
    // shared environment that this suite writes to. Re-enable with a real name when needed.
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});