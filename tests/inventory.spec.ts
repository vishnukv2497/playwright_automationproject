import { expect, test } from '@playwright/test';
import { Page } from '@playwright/test';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { InventoryPage } from '../pages/InventoryPage';
import { inventoryProducts } from '../test-data/inventoryProducts';
import { inventoryTestCases } from '../test-data/inventoryTestCases';
import { parseCurrency } from '../utils/currency';

function caseTitle(id: string): string {
  const testCase = inventoryTestCases.find((item) => item.id === id);
  if (!testCase) {
    throw new Error(`Missing workbook test case: ${id}`);
  }
  return `${testCase.id} ${testCase.name}`;
}

async function signInToInventory(page: Page) {
  const inventory = new InventoryPage(page);
  await inventory.openInventory();
  await expect(page).toHaveURL(/inventory\.html/);
  return inventory;
}

async function enterCheckoutDetails(checkout: CheckoutPage) {
  await checkout.enterCustomerDetails('Maria', 'Babu', '682316');
  await checkout.continueCheckout();
}

test(caseTitle('TC01'), async ({ page }) => {
  await signInToInventory(page);
  await expect(page).toHaveURL(/inventory\.html/);
  await expect(page).toHaveTitle('Swag Labs');
});

test(caseTitle('TC02'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await expect(inventory.products).toHaveCount(inventoryProducts.length);
  for (let index = 0; index < inventoryProducts.length; index += 1) {
    const card = inventory.products.nth(index);
    await expect(card.locator('.inventory_item_name')).toBeVisible();
    await expect(card.locator('.inventory_item_desc')).toBeVisible();
    await expect(card.locator('.inventory_item_price')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Add to cart' })).toBeVisible();
  }
});

test(caseTitle('TC03'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await expect(inventory.products).toHaveCount(6);
});

test(caseTitle('TC04'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  expect(await inventory.productNames()).toEqual(inventoryProducts.map(({ name }) => name));
});

test(caseTitle('TC05'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  const displayedPrices = await inventory.productPrices();
  expect(displayedPrices).toHaveLength(inventoryProducts.length);
  expect(displayedPrices.map(parseCurrency)).toEqual(
    inventoryProducts.map(({ price }) => Math.round(price * 100)),
  );
});

test(caseTitle('TC06'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  const descriptions = await page.locator('.inventory_item_desc').allTextContents();
  expect(descriptions).toHaveLength(inventoryProducts.length);
  expect(descriptions.every((description) => description.trim().length > 0)).toBe(true);
  await expect(inventory.products.first().locator('.inventory_item_desc')).toBeVisible();
});

test(caseTitle('TC07'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  const images = page.locator('.inventory_item img');
  await expect(images).toHaveCount(inventoryProducts.length);
  for (let index = 0; index < inventoryProducts.length; index += 1) {
    const image = images.nth(index);
    await expect(image).toBeVisible();
    await expect
      .poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0))
      .toBe(true);
  }
});

test(caseTitle('TC08'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  const backpack = inventory.productCard(inventoryProducts[0].name);
  await inventory.addProduct(inventoryProducts[0].name);
  await expect(backpack.getByRole('button', { name: 'Remove' })).toBeVisible();
  await expect(inventory.cartBadge).toHaveText('1');
});

test(caseTitle('TC09'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  for (const product of inventoryProducts.slice(0, 3)) {
    await inventory.addProduct(product.name);
  }
  await expect(inventory.cartBadge).toHaveText('3');
});

test(caseTitle('TC10'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  for (const product of inventoryProducts) {
    await inventory.addProduct(product.name);
  }
  await expect(inventory.cartBadge).toHaveText('6');
});

test(caseTitle('TC11'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await inventory.addProduct(inventoryProducts[0].name);
  await inventory.removeProduct(inventoryProducts[0].name);
  await expect(inventory.cartBadge).toBeHidden();
  await expect(inventory.productCard(inventoryProducts[0].name).getByRole('button', { name: 'Add to cart' })).toBeVisible();
});

test(caseTitle('TC12'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await inventory.addProduct(inventoryProducts[0].name);
  await inventory.addProduct(inventoryProducts[1].name);
  await expect(inventory.cartBadge).toHaveText('2');
  await inventory.removeProduct(inventoryProducts[0].name);
  await expect(inventory.cartBadge).toHaveText('1');
  await inventory.removeProduct(inventoryProducts[1].name);
  await expect(inventory.cartBadge).toBeHidden();
});

test(caseTitle('TC13'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await inventory.addProduct(inventoryProducts[0].name);
  await inventory.openCart();
  await expect(page).toHaveURL(/cart\.html/);
});

test(caseTitle('TC14'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await inventory.addProduct(inventoryProducts[0].name);
  await inventory.addProduct(inventoryProducts[1].name);
  await inventory.openCart();
  const cart = new CartPage(page);
  expect(await cart.itemNames()).toEqual(inventoryProducts.slice(0, 2).map(({ name }) => name));
});

test(caseTitle('TC15'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await inventory.openProductByName(inventoryProducts[0].name);
  await expect(page).toHaveURL(/inventory-item\.html/);
  await expect(page.locator('.inventory_details_name')).toHaveText(inventoryProducts[0].name);
});

test(caseTitle('TC16'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await inventory.openProductByImage(inventoryProducts[0].name);
  await expect(page).toHaveURL(/inventory-item\.html/);
  await expect(page.locator('.inventory_details_name')).toHaveText(inventoryProducts[0].name);
});

test(caseTitle('TC17'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  const product = inventory.productCard(inventoryProducts[0].name);
  const name = await product.locator('.inventory_item_name').textContent();
  const description = await product.locator('.inventory_item_desc').textContent();
  const price = await product.locator('.inventory_item_price').textContent();
  await inventory.openProductByName(inventoryProducts[0].name);
  await expect(page.locator('.inventory_details_name')).toHaveText(name ?? '');
  await expect(page.locator('.inventory_details_desc')).toHaveText(description ?? '');
  await expect(page.locator('.inventory_details_price')).toHaveText(price ?? '');
});

test(caseTitle('TC18'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await expect(inventory.sortDropdown).toBeVisible();
});

test(caseTitle('TC19'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await inventory.sortBy('az');
  const names = await inventory.productNames();
  expect(names).toEqual([...names].sort((left, right) => left.localeCompare(right)));
});

test(caseTitle('TC20'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await inventory.sortBy('za');
  const names = await inventory.productNames();
  expect(names).toEqual([...names].sort((left, right) => right.localeCompare(left)));
});

test(caseTitle('TC21'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await inventory.sortBy('lohi');
  const prices = (await inventory.productPrices()).map(parseCurrency);
  expect(prices).toEqual([...prices].sort((left, right) => left - right));
});

test(caseTitle('TC22'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await inventory.sortBy('hilo');
  const prices = (await inventory.productPrices()).map(parseCurrency);
  expect(prices).toEqual([...prices].sort((left, right) => right - left));
});

test(caseTitle('TC23'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await inventory.openMenu();
  await expect(page.getByRole('button', { name: 'All Items' })).toBeVisible();
});

test(caseTitle('TC24'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await inventory.openMenu();
  await expect(page.getByRole('button', { name: 'All Items', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'About', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Logout', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset App State', exact: true })).toBeVisible();
});

test(caseTitle('TC25'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await inventory.openMenu();
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(page).toHaveURL('https://www.saucedemo.com/');
  await expect(inventory.username).toBeVisible();
});

test(caseTitle('TC26'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await inventory.addProduct(inventoryProducts[0].name);
  await inventory.addProduct(inventoryProducts[1].name);
  await inventory.openMenu();
  await page.getByRole('button', { name: 'Reset App State', exact: true }).click();
  await expect(inventory.cartBadge).toBeHidden();
  await inventory.openCart();
  await expect(new CartPage(page).items).toHaveCount(0);
});

test(caseTitle('TC27'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  const backpack = inventory.productCard(inventoryProducts[0].name);
  await inventory.addProduct(inventoryProducts[0].name);
  await expect(backpack.getByRole('button', { name: 'Add to cart' })).toHaveCount(0);
  await expect(backpack.getByRole('button', { name: 'Remove' })).toBeVisible();
  await expect(inventory.cartBadge).toHaveText('1');
});

test(caseTitle('TC28'), async ({ page }) => {
  const inventory = new InventoryPage(page);
  await page.goto('https://www.saucedemo.com/inventory.html');
  await expect(page).toHaveURL('https://www.saucedemo.com/');
  await expect(inventory.username).toBeVisible();
});

test(caseTitle('TC29'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await inventory.addProduct(inventoryProducts[0].name);
  await page.reload();
  await expect(page).toHaveURL(/inventory\.html/);
  await expect(inventory.cartBadge).toHaveText('1');
  await expect(inventory.productCard(inventoryProducts[0].name).getByRole('button', { name: 'Remove' })).toBeVisible();
});

test(caseTitle('TC30'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await expect(inventory.headerLogo).toHaveText('Swag Labs');
});

test(caseTitle('TC31'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await expect(inventory.cartLink).toBeVisible();
});

test(caseTitle('TC32'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  for (const width of [1280, 768, 375]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(inventory.products.first()).toBeVisible();
    const box = await inventory.products.first().boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(width);
  }
});

test(caseTitle('TC33'), async ({ page }) => {
  await signInToInventory(page);
  const addButtons = page.getByRole('button', { name: 'Add to cart', exact: true });
  await expect(addButtons).toHaveCount(inventoryProducts.length);
  await expect(addButtons).toHaveText(Array(inventoryProducts.length).fill('Add to cart'));
});

test(caseTitle('TC34'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  await inventory.addProduct(inventoryProducts[0].name);
  await inventory.openCart();
  const cart = new CartPage(page);
  await cart.checkout();
  const checkout = new CheckoutPage(page);
  await checkout.enterCustomerDetails('Maria', 'Babu', '682316');
  await checkout.continueCheckout();
  await checkout.finishOrder();
  await expect(checkout.confirmationHeader).toHaveText('Thank you for your order!');
});

test(caseTitle('TC35'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  const selectedProducts = inventoryProducts.slice(0, 2);
  for (const product of selectedProducts) {
    await inventory.addProduct(product.name);
  }
  await inventory.openCart();
  const cart = new CartPage(page);
  await cart.checkout();
  const checkout = new CheckoutPage(page);
  await enterCheckoutDetails(checkout);
  expect(await cart.itemNames()).toEqual(selectedProducts.map(({ name }) => name));
  await checkout.finishOrder();
  await expect(checkout.confirmationHeader).toHaveText('Thank you for your order!');
});

test(caseTitle('TC36'), async ({ page }) => {
  const inventory = await signInToInventory(page);
  const selectedProducts = inventoryProducts.slice(0, 2);
  for (const product of selectedProducts) {
    await inventory.addProduct(product.name);
  }
  await inventory.openCart();
  const cart = new CartPage(page);
  await cart.checkout();
  const checkout = new CheckoutPage(page);
  await enterCheckoutDetails(checkout);

  const expectedSubtotal = selectedProducts.reduce(
    (sum, product) => sum + Math.round(product.price * 100),
    0,
  );
  const actualSubtotal = parseCurrency(await checkout.subtotal.textContent() ?? '');
  const actualTax = parseCurrency(await checkout.tax.textContent() ?? '');
  const actualTotal = parseCurrency(await checkout.total.textContent() ?? '');
  expect(actualSubtotal).toBe(expectedSubtotal);
  expect(actualTotal).toBe(actualSubtotal + actualTax);
});