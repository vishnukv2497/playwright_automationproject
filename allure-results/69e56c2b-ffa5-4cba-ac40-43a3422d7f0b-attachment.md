# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\visual.spec.ts >> visual >> logged out >> visual_user inventory differs from the standard_user baseline
- Location: tests\ui\visual.spec.ts:36:13

# Error details

```
Error: expect(page).toHaveScreenshot(expected) failed

  34046 pixels (ratio 0.03 of all image pixels) are different.

  Snapshot: inventory.png

Call log:
  - Expect "toHaveScreenshot(inventory.png)" with timeout 5000ms
    - verifying given screenshot expectation
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - 34046 pixels (ratio 0.03 of all image pixels) are different.
  - waiting 100ms before taking screenshot
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - captured a stable screenshot
  - 34046 pixels (ratio 0.03 of all image pixels) are different.

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - banner [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]:
          - button "Open Menu" [ref=e8] [cursor=pointer]
          - img "Open Menu" [ref=e9]
        - generic [ref=e10]: Swag Labs
        - button "Cart, empty" [ref=e13]
      - generic [ref=e14]:
        - generic [ref=e15]: Products
        - generic [ref=e17] [cursor=pointer]:
          - generic [ref=e18]: Name (A to Z)
          - combobox "Sort products" [ref=e19]:
            - option "Name (A to Z)" [selected]
            - option "Name (Z to A)"
            - option "Price (low to high)"
            - option "Price (high to low)"
    - main [ref=e20]:
      - generic [ref=e23]:
        - generic [ref=e24]:
          - button "View details for Sauce Labs Backpack" [ref=e26] [cursor=pointer]:
            - img "Sauce Labs Backpack" [ref=e27]
          - generic [ref=e28]:
            - generic [ref=e29]:
              - button "View details for Sauce Labs Backpack" [ref=e30] [cursor=pointer]:
                - generic [ref=e31]: Sauce Labs Backpack
              - generic [ref=e32]: carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.
            - generic [ref=e33]:
              - generic [ref=e34]: $43.11
              - button "Add to cart" [ref=e35] [cursor=pointer]
        - generic [ref=e36]:
          - button "View details for Sauce Labs Bike Light" [ref=e38] [cursor=pointer]:
            - img "Sauce Labs Bike Light" [ref=e39]
          - generic [ref=e40]:
            - generic [ref=e41]:
              - button "View details for Sauce Labs Bike Light" [ref=e42] [cursor=pointer]:
                - generic [ref=e43]: Sauce Labs Bike Light
              - generic [ref=e44]: A red light isn't the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes, 1 AAA battery included.
            - generic [ref=e45]:
              - generic [ref=e46]: $52.19
              - button "Add to cart" [ref=e47] [cursor=pointer]
        - generic [ref=e48]:
          - button "View details for Sauce Labs Bolt T-Shirt" [ref=e50] [cursor=pointer]:
            - img "Sauce Labs Bolt T-Shirt" [ref=e51]
          - generic [ref=e52]:
            - generic [ref=e53]:
              - button "View details for Sauce Labs Bolt T-Shirt" [ref=e54] [cursor=pointer]:
                - generic [ref=e55]: Sauce Labs Bolt T-Shirt
              - generic [ref=e56]: Get your testing superhero on with the Sauce Labs bolt T-shirt. From American Apparel, 100% ringspun combed cotton, heather gray with red bolt.
            - generic [ref=e57]:
              - generic [ref=e58]: $19.69
              - button "Add to cart" [ref=e59] [cursor=pointer]
        - generic [ref=e60]:
          - button "View details for Sauce Labs Fleece Jacket" [ref=e62] [cursor=pointer]:
            - img "Sauce Labs Fleece Jacket" [ref=e63]
          - generic [ref=e64]:
            - generic [ref=e65]:
              - button "View details for Sauce Labs Fleece Jacket" [ref=e66] [cursor=pointer]:
                - generic [ref=e67]: Sauce Labs Fleece Jacket
              - generic [ref=e68]: It's not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at the office.
            - generic [ref=e69]:
              - generic [ref=e70]: $82.02
              - button "Add to cart" [ref=e71] [cursor=pointer]
        - generic [ref=e72]:
          - button "View details for Sauce Labs Onesie" [ref=e74] [cursor=pointer]:
            - img "Sauce Labs Onesie" [ref=e75]
          - generic [ref=e76]:
            - generic [ref=e77]:
              - button "View details for Sauce Labs Onesie" [ref=e78] [cursor=pointer]:
                - generic [ref=e79]: Sauce Labs Onesie
              - generic [ref=e80]: Rib snap infant onesie for the junior automation engineer in development. Reinforced 3-snap bottom closure, two-needle hemmed sleeved and bottom won't unravel.
            - generic [ref=e81]:
              - generic [ref=e82]: $57.46
              - button "Add to cart" [ref=e83] [cursor=pointer]
        - generic [ref=e84]:
          - button "View details for Test.allTheThings() T-Shirt (Red)" [ref=e86] [cursor=pointer]:
            - img "Test.allTheThings() T-Shirt (Red)" [ref=e87]
          - generic [ref=e88]:
            - generic [ref=e89]:
              - button "View details for Test.allTheThings() T-Shirt (Red)" [ref=e90] [cursor=pointer]:
                - generic [ref=e91]: Test.allTheThings() T-Shirt (Red)
              - generic [ref=e92]: This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests. Super-soft and comfy ringspun combed cotton.
            - generic [ref=e93]:
              - generic [ref=e94]: $76.51
              - button "Add to cart" [ref=e95] [cursor=pointer]
  - contentinfo [ref=e96]:
    - list [ref=e97]:
      - listitem [ref=e98]:
        - link "X" [ref=e99] [cursor=pointer]:
          - /url: https://x.com/saucelabs
      - listitem [ref=e100]:
        - link "Facebook" [ref=e101] [cursor=pointer]:
          - /url: https://www.facebook.com/saucelabs
      - listitem [ref=e102]:
        - link "LinkedIn" [ref=e103] [cursor=pointer]:
          - /url: https://www.linkedin.com/company/sauce-labs/
    - generic [ref=e104]: © 2026 Sauce Labs. All Rights Reserved. Terms of Service | Privacy Policy
```

# Test source

```ts
  1  | import fs from 'fs';
  2  | import { test, expect } from '../../fixtures/pages';
  3  | import { users } from '../../test-data/users';
  4  | 
  5  | // Baselines live in visual.spec.ts-snapshots/ and are only kept for Chromium on this OS.
  6  | // To refresh them, update the standard_user tests only, never the visual_user one:
  7  | //   npx playwright test visual.spec.ts --project=chromium --update-snapshots --grep-invert visual_user
  8  | test.describe('visual', { tag: '@regression' }, () => {
  9  |     test.skip(({ browserName }) => browserName !== 'chromium', 'Screenshot baselines are only kept for Chromium');
  10 | 
  11 |     test('standard_user inventory matches the baseline', async ({ page, inventoryPage }) => {
  12 |         await test.step('Open the inventory as standard_user', async () => {
  13 |             await inventoryPage.goto();
  14 |             await expect(inventoryPage.itemImages).toHaveCount(6);
  15 |         });
  16 | 
  17 |         await test.step('Inventory looks the same as the baseline', async () => {
  18 |             await expect(page).toHaveScreenshot('inventory.png', { fullPage: true });
  19 |         });
  20 |     });
  21 | 
  22 |     test.describe('logged out', () => {
  23 |         test.use({ storageState: { cookies: [], origins: [] } });
  24 | 
  25 |         test('login page matches the baseline', async ({ page, loginPage }) => {
  26 |             await test.step('Open the login page', async () => {
  27 |                 await loginPage.goto();
  28 |                 await expect(loginPage.loginButton).toBeVisible();
  29 |             });
  30 | 
  31 |             await test.step('Login page looks the same as the baseline', async () => {
  32 |                 await expect(page).toHaveScreenshot('login.png');
  33 |             });
  34 |         });
  35 | 
  36 |         test('visual_user inventory differs from the standard_user baseline', async ({ page, loginPage, inventoryPage }) => {
  37 |             // Without a standard_user baseline, this test would write its own broken screenshot as the baseline.
  38 |             test.skip(!fs.existsSync(test.info().snapshotPath('inventory.png', { kind: 'screenshot' })), 'Create the standard_user inventory baseline first');
  39 |             // App bug (intentional): visual_user shows random prices on every load, the placeholder image on the
  40 |             // Backpack, a cart icon moved down and left, and a misaligned "Add to cart" button. The diff image is attached.
  41 |             test.fail();
  42 | 
  43 |             await test.step('Log in as visual_user', async () => {
  44 |                 await loginPage.goto();
  45 |                 await loginPage.login(users.visual.username, users.visual.password);
  46 |                 await expect(inventoryPage.itemImages).toHaveCount(6);
  47 |             });
  48 | 
  49 |             await test.step('Inventory looks the same as the standard_user baseline', async () => {
> 50 |                 await expect(page).toHaveScreenshot('inventory.png', { fullPage: true });
     |                                    ^ Error: expect(page).toHaveScreenshot(expected) failed
  51 |             });
  52 |         });
  53 |     });
  54 | });
  55 | 
```