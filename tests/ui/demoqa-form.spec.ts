import { test, expect } from '../../fixtures/pages';

test('test', async ({ page }) => {
 await page.goto(
  'https://demoqa.com/automation-practice-form/',
  { waitUntil: 'domcontentloaded', timeout: 60000 }
);
  await page.getByRole('textbox', { name: 'First Name' }).click();
  await page.getByRole('textbox', { name: 'First Name' }).fill('vishnu kv');
  await page.getByRole('textbox', { name: 'Last Name' }).click();
  await page.getByRole('textbox', { name: 'Last Name' }).fill('veedu');
  await page.getByRole('textbox', { name: 'name@example.com' }).click();
  await page.getByRole('textbox', { name: 'name@example.com' }).fill('kv.vishnu4@tcs.com');
  await page.getByRole('radio', { name: 'Male', exact: true }).check();
  await page.getByRole('textbox', { name: 'Mobile Number' }).click();
  await page.getByRole('textbox', { name: 'Mobile Number' }).fill('8847326806');
  await page.locator('#dateOfBirthInput').click();

// Month
await page.getByRole('combobox').first().selectOption('August');

// Year
await page.getByRole('combobox').nth(1).selectOption('2013');

// Day
await page.getByRole('gridcell', {
  name: 'Choose Wednesday, August 21st, 2013'
}).click();

  await page.locator('.subjects-auto-complete__input-container').click();
  await page.locator('#subjectsInput').fill('rty');
  await page.getByRole('checkbox', { name: 'Sports' }).check();
 await page.locator('#uploadPicture').setInputFiles(
  'tests\\test-data\\Screenshot 2026-08-21 031034.png'
);
  await page.locator('.css-8mmkcg').first().click();
  await page.getByRole('option', { name: 'Uttar Pradesh' }).click();
  await page.getByRole('button', { name: 'Submit' }).click();
});
