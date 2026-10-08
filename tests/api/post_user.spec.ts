import { test, expect } from '../../fixtures/pages';

test('Create User - POST API', async ({ request }) => {

  const requestBody = {
    name: 'pavan',
    job: 'trainer'
  };

  const response = await request.post(
  'https://reqres.in/api/users',
  {
    data: requestBody,
  }
);

  // Verify status code
  expect(response.status()).toBe(201);

  // Parse response
  const responseBody = await response.json();

  console.log(responseBody);

  // Validate response fields
  expect(responseBody.name).toBe('pavan');
  expect(responseBody.job).toBe('trainer');

  // Validate dynamic fields
  expect(responseBody.id).toBeTruthy();
  expect(responseBody.createdAt).toBeTruthy();

  // Optional validations
  expect(typeof responseBody.id).toBe('string');
});