# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\cart.spec.ts >> Login with valid credentials
- Location: tests\ui\cart.spec.ts:4:5

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  locator('.title')
Expected: "Productss"
Received: "Products"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" with timeout 5000ms
  - waiting for locator('.title')
    14 × locator resolved to <span class="title" data-test="title">Products</span>
       - unexpected value "Products"

```

```yaml
- text: Products
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { LoginPage } from '../../Pages/LoginPage';
  3  | 
  4  | test('Login with valid credentials', async ({ page }) => {
  5  |   const loginPage = new LoginPage(page);
  6  | 
  7  |   await loginPage.navigateToLoginPage();
  8  |   await loginPage.login('standard_user', 'secret_sauce');
  9  | 
  10 |   await expect(page).toHaveURL(/inventory\.html/);
> 11 |   await expect(page.locator('.title')).toHaveText('Productss');
     |                                        ^ Error: expect(locator).toHaveText(expected) failed
  12 | });
```