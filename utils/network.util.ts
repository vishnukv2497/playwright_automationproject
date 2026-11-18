import { Page } from '@playwright/test';

/**
 * Aborts every non-GET request matching `urlPattern` and records it.
 *
 * Two uses in the Roles suite:
 *  - proving a validation blocked the save client-side (`attempted` stays empty), and
 *  - guaranteeing a test that only opens forms on shared, seeded records can never submit a
 *    change to them, even if a validation it expects turns out to be missing.
 */
export async function blockWrites(
  page: Page,
  urlPattern = '**/api/iam/**',
): Promise<{ attempted: string[]; release: () => Promise<void> }> {
  const attempted: string[] = [];
  await page.route(urlPattern, (route) => {
    const request = route.request();
    if (request.method() === 'GET') return route.continue();
    attempted.push(`${request.method()} ${new URL(request.url()).pathname}`);
    return route.abort();
  });
  return { attempted, release: () => page.unroute(urlPattern) };
}
