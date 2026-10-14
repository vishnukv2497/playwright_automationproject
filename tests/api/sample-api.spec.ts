import { test } from '@playwright/test';
import { expectJsonArray } from './helpers/api-assertions';
import { sampleApiCases } from './test-cases/sample-api-cases';

test.describe('Beeceptor sample APIs', () => {
  for (const apiCase of sampleApiCases) {
    test(apiCase.description, async ({ request }) => {
      const response = await request.get(apiCase.url);
      const records = await expectJsonArray(response);

      apiCase.validate(records);
    });
  }
});
