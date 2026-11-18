import { test, expect } from '../fixtures/auth.fixture';

// Runs auto-login (see fixtures/auth.fixture.ts) before every generated scenario,
// so generated tests always start from an authenticated dashboard like the rest
// of this suite, instead of the login screen.
test.describe('Test group', () => {
  test('seed', async ({ page }) => {
    // generate code here.
  });
});
