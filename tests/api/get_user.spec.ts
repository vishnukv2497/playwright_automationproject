import { test, expect } from '../../fixtures/pages';

test('Verify GET users API - page 2', async ({ request }) => {
  const response = await request.get(
    'https://reqres.in/api/users?page=2'
  );

  // Verify status code
  expect(response.status()).toBe(200);

  console.log(response);
 
});