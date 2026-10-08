# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\known-bugs.spec.ts >> known-bug users >> problem_user: every product shows its own image
- Location: tests\ui\known-bugs.spec.ts:37:13

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 6
Received: 1
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - banner [ref=e5]:
      - generic [ref=e6]:
        - generic:
          - generic:
            - generic [ref=e7]:
              - button "Open Menu" [ref=e8] [cursor=pointer]
              - img "Open Menu" [ref=e9]
            - generic [aria-hidden] [ref=e10]:
              - navigation [ref=e12]:
                - button [ref=e13] [cursor=pointer]: All Items
                - button [ref=e14] [cursor=pointer]: Dynamic Catalog
                - link [ref=e16] [cursor=pointer]:
                  - /url: https://saucelabs.com/error/404
                  - text: About
                - button [ref=e17] [cursor=pointer]: Logout
                - button [ref=e18] [cursor=pointer]: Reset App State
              - button [ref=e20] [cursor=pointer]: Close Menu
        - generic [ref=e22]: Swag Labs
        - button "Cart, empty" [ref=e25]
      - generic [ref=e26]:
        - generic [ref=e27]: Products
        - generic [ref=e29] [cursor=pointer]:
          - generic [ref=e30]: Name (A to Z)
          - combobox "Sort products" [ref=e31]:
            - option "Name (A to Z)" [selected]
            - option "Name (Z to A)"
            - option "Price (low to high)"
            - option "Price (high to low)"
    - main [ref=e32]:
      - generic [ref=e35]:
        - generic [ref=e36]:
          - button "View details for Sauce Labs Backpack" [ref=e38] [cursor=pointer]:
            - img "Sauce Labs Backpack" [ref=e39]
          - generic [ref=e40]:
            - generic [ref=e41]:
              - button "View details for Sauce Labs Backpack" [ref=e42] [cursor=pointer]:
                - generic [ref=e43]: Sauce Labs Backpack
              - generic [ref=e44]: carry.allTheThings() with the sleek, streamlined Sly Pack that melds uncompromising style with unequaled laptop and tablet protection.
            - generic [ref=e45]:
              - generic [ref=e46]: $29.99
              - button "Add to cart" [ref=e47] [cursor=pointer]
        - generic [ref=e48]:
          - button "View details for Sauce Labs Bike Light" [ref=e50] [cursor=pointer]:
            - img "Sauce Labs Bike Light" [ref=e51]
          - generic [ref=e52]:
            - generic [ref=e53]:
              - button "View details for Sauce Labs Bike Light" [ref=e54] [cursor=pointer]:
                - generic [ref=e55]: Sauce Labs Bike Light
              - generic [ref=e56]: A red light isn't the desired state in testing but it sure helps when riding your bike at night. Water-resistant with 3 lighting modes, 1 AAA battery included.
            - generic [ref=e57]:
              - generic [ref=e58]: $9.99
              - button "Add to cart" [ref=e59] [cursor=pointer]
        - generic [ref=e60]:
          - button "View details for Sauce Labs Bolt T-Shirt" [ref=e62] [cursor=pointer]:
            - img "Sauce Labs Bolt T-Shirt" [ref=e63]
          - generic [ref=e64]:
            - generic [ref=e65]:
              - button "View details for Sauce Labs Bolt T-Shirt" [ref=e66] [cursor=pointer]:
                - generic [ref=e67]: Sauce Labs Bolt T-Shirt
              - generic [ref=e68]: Get your testing superhero on with the Sauce Labs bolt T-shirt. From American Apparel, 100% ringspun combed cotton, heather gray with red bolt.
            - generic [ref=e69]:
              - generic [ref=e70]: $15.99
              - button "Add to cart" [ref=e71] [cursor=pointer]
        - generic [ref=e72]:
          - button "View details for Sauce Labs Fleece Jacket" [ref=e74] [cursor=pointer]:
            - img "Sauce Labs Fleece Jacket" [ref=e75]
          - generic [ref=e76]:
            - generic [ref=e77]:
              - button "View details for Sauce Labs Fleece Jacket" [ref=e78] [cursor=pointer]:
                - generic [ref=e79]: Sauce Labs Fleece Jacket
              - generic [ref=e80]: It's not every day that you come across a midweight quarter-zip fleece jacket capable of handling everything from a relaxing day outdoors to a busy day at the office.
            - generic [ref=e81]:
              - generic [ref=e82]: $49.99
              - button "Add to cart" [ref=e83] [cursor=pointer]
        - generic [ref=e84]:
          - button "View details for Sauce Labs Onesie" [ref=e86] [cursor=pointer]:
            - img "Sauce Labs Onesie" [ref=e87]
          - generic [ref=e88]:
            - generic [ref=e89]:
              - button "View details for Sauce Labs Onesie" [ref=e90] [cursor=pointer]:
                - generic [ref=e91]: Sauce Labs Onesie
              - generic [ref=e92]: Rib snap infant onesie for the junior automation engineer in development. Reinforced 3-snap bottom closure, two-needle hemmed sleeved and bottom won't unravel.
            - generic [ref=e93]:
              - generic [ref=e94]: $7.99
              - button "Add to cart" [ref=e95] [cursor=pointer]
        - generic [ref=e96]:
          - button "View details for Test.allTheThings() T-Shirt (Red)" [ref=e98] [cursor=pointer]:
            - img "Test.allTheThings() T-Shirt (Red)" [ref=e99]
          - generic [ref=e100]:
            - generic [ref=e101]:
              - button "View details for Test.allTheThings() T-Shirt (Red)" [ref=e102] [cursor=pointer]:
                - generic [ref=e103]: Test.allTheThings() T-Shirt (Red)
              - generic [ref=e104]: This classic Sauce Labs t-shirt is perfect to wear when cozying up to your keyboard to automate a few tests. Super-soft and comfy ringspun combed cotton.
            - generic [ref=e105]:
              - generic [ref=e106]: $15.99
              - button "Add to cart" [ref=e107] [cursor=pointer]
  - contentinfo [ref=e108]:
    - list [ref=e109]:
      - listitem [ref=e110]:
        - link "X" [ref=e111] [cursor=pointer]:
          - /url: https://x.com/saucelabs
      - listitem [ref=e112]:
        - link "Facebook" [ref=e113] [cursor=pointer]:
          - /url: https://www.facebook.com/saucelabs
      - listitem [ref=e114]:
        - link "LinkedIn" [ref=e115] [cursor=pointer]:
          - /url: https://www.linkedin.com/company/sauce-labs/
    - generic [ref=e116]: © 2026 Sauce Labs. All Rights Reserved. Terms of Service | Privacy Policy
```

# Test source

```ts
  1   | import { test, expect } from '../../fixtures/pages';
  2   | import { users } from '../../test-data/users';
  3   | import { products } from '../../test-data/products';
  4   | import { customer } from '../../test-data/checkout';
  5   | 
  6   | // saucedemo ships users with deliberate bugs. test.fail() marks a test that is expected to fail because the
  7   | // app is broken on purpose; if the app is ever fixed, the test passes and Playwright reports it as unexpected.
  8   | test.describe('known-bug users', { tag: '@regression' }, () => {
  9   |     // Each test logs in as its own user, so start logged out.
  10  |     test.use({ storageState: { cookies: [], origins: [] } });
  11  | 
  12  |     test('problem_user: sorting by Name (Z to A) reorders the products', async ({ loginPage, inventoryPage }) => {
  13  |         // App bug (intentional): sorting does nothing for problem_user. The list stays A to Z and the dropdown snaps back.
  14  |         test.fail();
  15  |         let expectedOrder: string[] = [];
  16  | 
  17  |         await test.step('Log in as problem_user', async () => {
  18  |             await loginPage.goto();
  19  |             await loginPage.login(users.problem.username, users.problem.password);
  20  |             await expect(inventoryPage.inventoryItems).toHaveCount(6);
  21  |             const names = await inventoryPage.itemNames.allInnerTexts();
  22  |             expectedOrder = [...names].sort((a, b) => a.localeCompare(b)).reverse();
  23  |         });
  24  | 
  25  |         await test.step('Sort by Name (Z to A)', async () => {
  26  |             await inventoryPage.sortBy('Name (Z to A)');
  27  |         });
  28  | 
  29  |         await test.step('All 6 names are in Z to A order', async () => {
  30  |             await expect(inventoryPage.itemNames).toHaveText(expectedOrder);
  31  |         });
  32  |     });
  33  | 
  34  |     for (const key of ['standard', 'problem'] as const) {
  35  |         const user = users[key];
  36  | 
  37  |         test(`${user.username}: every product shows its own image`, async ({ loginPage, inventoryPage }) => {
  38  |             // App bug (intentional): problem_user gets the same placeholder image (sl-404) for every product.
  39  |             // standard_user runs the same check as a control, to prove the check itself is valid.
  40  |             test.fail(key === 'problem', 'problem_user shows the same placeholder image for every product');
  41  | 
  42  |             await test.step(`Log in as ${user.username}`, async () => {
  43  |                 await loginPage.goto();
  44  |                 await loginPage.login(user.username, user.password);
  45  |                 await expect(inventoryPage.itemImages).toHaveCount(6);
  46  |             });
  47  | 
  48  |             await test.step('The 6 product images are 6 different images', async () => {
  49  |                 const sources = await inventoryPage.itemImages.evaluateAll((images) => images.map((image) => image.getAttribute('src')));
> 50  |                 expect(new Set(sources).size).toBe(6);
      |                                               ^ Error: expect(received).toBe(expected) // Object.is equality
  51  |             });
  52  |         });
  53  |     }
  54  | 
  55  |     test('error_user: can complete a purchase', async ({ loginPage, inventoryPage, header, cartPage, checkoutInfoPage, checkoutOverviewPage, checkoutCompletePage }) => {
  56  |         // App bug (intentional): for error_user the Last Name field ignores typing and Finish does nothing,
  57  |         // so the order never reaches "Thank you for your order!".
  58  |         test.fail();
  59  | 
  60  |         await test.step('Log in as error_user and add the Backpack', async () => {
  61  |             await loginPage.goto();
  62  |             await loginPage.login(users.error.username, users.error.password);
  63  |             await inventoryPage.addToCart(products.backpack);
  64  |             await expect(header.cartBadge).toHaveText('1');
  65  |         });
  66  | 
  67  |         await test.step('Check out with customer details', async () => {
  68  |             await header.openCart();
  69  |             await cartPage.checkout();
  70  |             await checkoutInfoPage.fillCustomerDetails(customer);
  71  |             await checkoutInfoPage.continueToOverview();
  72  |             await expect(checkoutOverviewPage.title).toHaveText('Checkout: Overview');
  73  |         });
  74  | 
  75  |         await test.step('Finish shows the order confirmation', async () => {
  76  |             await checkoutOverviewPage.finish();
  77  |             await expect(checkoutCompletePage.completeHeader).toHaveText('Thank you for your order!');
  78  |         });
  79  |     });
  80  | 
  81  |     test('performance_glitch_user: login completes within 10 seconds', async ({ loginPage, inventoryPage }) => {
  82  |         // Not test.fail: login is deliberately slow (about 5-7 s) but stays inside the 10 s budget.
  83  |         const budgetMs = 10_000;
  84  |         let elapsedMs = 0;
  85  | 
  86  |         await test.step('Log in as performance_glitch_user', async () => {
  87  |             await loginPage.goto();
  88  |             const start = Date.now();
  89  |             await loginPage.login(users.performanceGlitch.username, users.performanceGlitch.password);
  90  |             await expect(inventoryPage.title).toHaveText('Products', { timeout: budgetMs });
  91  |             elapsedMs = Date.now() - start;
  92  |         });
  93  | 
  94  |         await test.step(`Inventory appeared within ${budgetMs / 1000} s`, async () => {
  95  |             test.info().annotations.push({ type: 'login time', description: `${elapsedMs} ms` });
  96  |             expect(elapsedMs).toBeLessThan(budgetMs);
  97  |         });
  98  |     });
  99  | });
  100 | 
```