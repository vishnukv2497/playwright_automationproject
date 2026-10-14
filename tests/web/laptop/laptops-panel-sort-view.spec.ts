/**
 * Laptops & Notebooks category: left panel, Refine Search, List/Grid toggle,
 * Product Compare link, Sort By and Show (TC-LN-027 .. TC-LN-044).
 * Source: laptops-notebooks-manual-test-cases.md sections 4.5 - 4.7
 */

import { test, expect } from '../../../fixtures/pageFixtures';

const EMPTY_MESSAGE = 'There are no products to list in this category.';
const DEFAULT_PRODUCTS = ['HP LP3065', 'MacBook', 'MacBook Air', 'MacBook Pro', 'Sony VAIO'];

test.describe('4.5 Left category panel and Refine Search', () => {
    test.beforeEach(async ({ laptopsPage }) => {
        await laptopsPage.goto();
        await expect(laptopsPage.headingCategory).toHaveText('Laptops & Notebooks');
    });

    test('TC-LN-027 Category list and counts in left panel @master @regression @web', async ({ laptopsPage }) => {
        await expect(laptopsPage.page.locator('.list-group a')).toHaveText([
            'Desktops (13)', 'Laptops & Notebooks (5)', '-Macs (0)', '-Windows (0)', 'Components (2)',
            'Tablets (1)', 'Software (0)', 'Phones & PDAs (3)', 'Cameras (2)', 'MP3 Players (4)',
        ]);
        await expect(laptopsPage.page.locator('.list-group a.active')).toHaveText('Laptops & Notebooks (5)');
        await expect(laptopsPage.leftPanelItem('-Macs (0)')).toBeVisible();
        await expect(laptopsPage.leftPanelItem('-Windows (0)')).toBeVisible();
    });

    test('TC-LN-028 Count matches products listed @master @regression @web', async ({ laptopsPage }) => {
        await expect(laptopsPage.leftPanelItem('Laptops & Notebooks (5)')).toBeVisible();
        await expect(laptopsPage.productThumbs).toHaveCount(5);
    });

    test('TC-LN-029 Navigate to Phones & PDAs via left panel @master @regression @web', async ({ laptopsPage, page }) => {
        await laptopsPage.clickLeftPanelItem('Phones & PDAs (3)');
        await expect(page).toHaveURL(/path=24/);
        await expect(laptopsPage.headingCategory).toHaveText('Phones & PDAs');
        await expect(laptopsPage.productThumbs).toHaveCount(3);
    });

    test('TC-LN-030 Empty sub-category Macs via left panel @master @regression @web', async ({ laptopsPage, page }) => {
        await laptopsPage.clickLeftPanelItem('-Macs (0)');
        await expect(page).toHaveURL(/path=18_46/);
        await expect(laptopsPage.txtEmptyCategory).toBeVisible();
        await expect(page.locator('#content').getByRole('link', { name: 'Continue' })).toBeVisible();
        await expect(laptopsPage.productThumbs).toHaveCount(0);
    });

    test('TC-LN-031 Empty main category Software via left panel @master @regression @web', async ({ laptopsPage, page }) => {
        await laptopsPage.clickLeftPanelItem('Software (0)');
        await expect(page).toHaveURL(/path=17/);
        await expect(laptopsPage.headingCategory).toHaveText('Software');
        await expect(laptopsPage.txtEmptyCategory).toBeVisible();
        await expect(page.locator('#content').getByRole('link', { name: 'Continue' })).toBeVisible();
    });

    test('TC-LN-032 Left banner image loads and is clickable @master @regression @web', async ({ laptopsPage, page }) => {
        const banner = page.locator('#column-left .swiper-viewport .swiper-slide-active img');
        await expect(banner).toBeVisible();
        await expect.poll(() => banner.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
        const link = page.locator('#column-left .swiper-viewport .swiper-slide-active a');
        await expect(link).toHaveAttribute('href', /route=product\/manufacturer\/info/);
        await link.click();
        await expect(page).toHaveURL(/route=product\/manufacturer\/info/);
        await expect(laptopsPage.productThumbs.first()).toBeVisible();
    });

    test('TC-LN-033 Refine Search links open empty sub-categories @master @regression @web', async ({ laptopsPage, page }) => {
        await expect(laptopsPage.headingRefineSearch).toBeVisible();
        await laptopsPage.clickRefineSearchLink('Macs (0)');
        await expect(page).toHaveURL(/path=18_46/);
        await expect(laptopsPage.txtEmptyCategory).toBeVisible();

        await page.goBack();
        await expect(laptopsPage.headingCategory).toHaveText('Laptops & Notebooks');

        await laptopsPage.clickRefineSearchLink('Windows (0)');
        await expect(page).toHaveURL(/path=18_45/);
        await expect(laptopsPage.txtEmptyCategory).toBeVisible();
    });
});

test.describe('4.6 List/Grid toggle and Product Compare link', () => {
    test.beforeEach(async ({ laptopsPage }) => {
        await laptopsPage.goto();
        await expect(laptopsPage.productThumbs).toHaveCount(5);
    });

    test('TC-LN-034 Switch to List view @master @regression @web', async ({ laptopsPage }) => {
        await expect(laptopsPage.productLayouts.first()).toHaveClass(/product-grid/);
        await laptopsPage.clickListView();
        for (const layout of await laptopsPage.productLayouts.all()) {
            await expect(layout).toHaveClass(/product-list/);
        }
        await expect(laptopsPage.btnListView).toHaveClass(/active/);
        await expect(laptopsPage.btnGridView).not.toHaveClass(/active/);
        const card = laptopsPage.productCard('MacBook');
        await expect(card.locator('.image img')).toBeVisible();
        await expect(card.getByRole('heading', { name: 'MacBook', exact: true })).toBeVisible();
        await expect(laptopsPage.productDescription('MacBook')).toBeVisible();
        await expect(laptopsPage.productPrice('MacBook')).toBeVisible();
        await expect(laptopsPage.productAddToCartButton('MacBook')).toBeVisible();
    });

    test('TC-LN-035 Switch back to Grid view @master @regression @web', async ({ laptopsPage }) => {
        await laptopsPage.clickListView();
        await expect(laptopsPage.productLayouts.first()).toHaveClass(/product-list/);
        await laptopsPage.clickGridView();
        for (const layout of await laptopsPage.productLayouts.all()) {
            await expect(layout).toHaveClass(/product-grid/);
        }
        await expect(laptopsPage.btnGridView).toHaveClass(/active/);
        await expect(laptopsPage.btnListView).not.toHaveClass(/active/);
    });

    test('TC-LN-036 View preference retained across categories @master @regression @web', async ({ laptopsPage }) => {
        await laptopsPage.clickListView();
        await expect(laptopsPage.productLayouts.first()).toHaveClass(/product-list/);
        await laptopsPage.goto('24');
        await expect(laptopsPage.headingCategory).toHaveText('Phones & PDAs');
        await laptopsPage.goto();
        await expect(laptopsPage.productThumbs).toHaveCount(5);
        await expect(laptopsPage.productLayouts.first()).toHaveClass(/product-list/);
        await expect(laptopsPage.btnListView).toHaveClass(/active/);
    });

    test('TC-LN-037 Product Compare link with nothing chosen @master @regression @web', async ({ laptopsPage, page }) => {
        await expect(laptopsPage.lnkProductCompare).toHaveText('Product Compare (0)');
        await laptopsPage.clickProductCompare();
        await expect(page).toHaveURL(/route=product\/compare/);
        await expect(page.locator('#content')).toContainText('You have not chosen any products to compare.');
    });
});

test.describe('4.7 Sort By and Show', () => {
    test.beforeEach(async ({ laptopsPage }) => {
        await laptopsPage.goto();
        await expect(laptopsPage.productThumbs).toHaveCount(5);
    });

    test('TC-LN-038 Sort By options @master @regression @web', async ({ laptopsPage }) => {
        await expect(laptopsPage.selSortBy.locator('option')).toHaveText([
            'Default', 'Name (A - Z)', 'Name (Z - A)', 'Price (Low > High)', 'Price (High > Low)',
            'Rating (Highest)', 'Rating (Lowest)', 'Model (A - Z)', 'Model (Z - A)',
        ]);
        await expect(laptopsPage.selSortBy.locator('option:checked')).toHaveText('Default');
    });

    test('TC-LN-039 Sort by Name A-Z and Z-A @master @regression @web', async ({ laptopsPage, page }) => {
        await laptopsPage.selectSortBy('Name (A - Z)');
        await expect(page).toHaveURL(/sort=pd\.name&order=ASC/);
        await expect(laptopsPage.selSortBy.locator('option:checked')).toHaveText('Name (A - Z)');
        const names = await laptopsPage.getProductNames();
        expect(names).toHaveLength(5);
        // DEVIATION: server collation is case-insensitive ("HP LP3065" < "MacBook"); compare lower-cased
        expect(names).toEqual([...names].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())));

        await laptopsPage.selectSortBy('Name (Z - A)');
        await expect(page).toHaveURL(/sort=pd\.name&order=DESC/);
        await expect(laptopsPage.selSortBy.locator('option:checked')).toHaveText('Name (Z - A)');
        await expect(laptopsPage.productNames).toHaveText(['Sony VAIO', 'MacBook Pro', 'MacBook Air', 'MacBook', 'HP LP3065']);
    });

    test('TC-LN-040 Sort by Price Low>High and High>Low @master @regression @web', async ({ laptopsPage, page }) => {
        await laptopsPage.selectSortBy('Price (Low > High)');
        await expect(page).toHaveURL(/sort=p\.price&order=ASC/);
        await expect(laptopsPage.selSortBy.locator('option:checked')).toHaveText('Price (Low > High)');
        await expect(laptopsPage.productNames.first()).toHaveText('HP LP3065');
        await expect(laptopsPage.productNames.nth(1)).toHaveText('MacBook');
        await expect(laptopsPage.productNames.last()).toHaveText('MacBook Pro');
        // MacBook Air and Sony VAIO share a price, so only the price sequence is asserted
        const asc = await laptopsPage.getProductPriceValues();
        expect(asc).toEqual([...asc].sort((a, b) => a - b));

        await laptopsPage.selectSortBy('Price (High > Low)');
        await expect(page).toHaveURL(/sort=p\.price&order=DESC/);
        await expect(laptopsPage.selSortBy.locator('option:checked')).toHaveText('Price (High > Low)');
        await expect(laptopsPage.productNames.first()).toHaveText('MacBook Pro');
        await expect(laptopsPage.productNames.last()).toHaveText('HP LP3065');
        const desc = await laptopsPage.getProductPriceValues();
        expect(desc).toEqual([...desc].sort((a, b) => b - a));
    });

    test('TC-LN-041 All products rendered with Show 20 @master @regression @web', async ({ laptopsPage }) => {
        await expect(laptopsPage.selShow.locator('option:checked')).toHaveText('20');
        await expect(laptopsPage.productNames).toHaveText(DEFAULT_PRODUCTS);
        await laptopsPage.productThumbs.last().scrollIntoViewIfNeeded();
        await expect(laptopsPage.productThumbs.last()).toBeInViewport();
        await expect(laptopsPage.txtPagination.last()).toHaveText('Showing 1 to 5 of 5 (1 Pages)');
    });

    test('TC-LN-042 Show (limit) options @master @regression @web', async ({ laptopsPage }) => {
        await expect(laptopsPage.selShow.locator('option')).toHaveText(['20', '25', '50', '75', '100']);
    });

    test('TC-LN-043 Change Show limit to 25 @master @regression @web', async ({ laptopsPage, page }) => {
        await laptopsPage.selectShow('25');
        await expect(page).toHaveURL(/limit=25/);
        await expect(laptopsPage.selShow.locator('option:checked')).toHaveText('25');
        await expect(laptopsPage.productThumbs).toHaveCount(5);
    });

    test('TC-LN-044 Invalid limit via URL is handled gracefully @master @regression @web', async ({ laptopsPage, page }) => {
        // DEVIATION: the page does not error and still lists all 5 products, but the pagination
        // summary is malformed ("Showing 1 to -1 of 5 (-5 Pages)" / "Showing 1 to 0 of 5 (0 Pages)").
        // DEVIATION: for limit=abc the server also leaks a raw PHP "Warning: Division by zero ... category.php"
        // at the top of the page (a real app defect), so only "no fatal/parse error, products rendered" is asserted.
        for (const bad of ['-1', 'abc']) {
            await laptopsPage.goto(`18&limit=${bad}`);
            await expect(laptopsPage.headingCategory).toHaveText('Laptops & Notebooks');
            await expect(page.locator('body')).not.toContainText(/Fatal error|Parse error|Uncaught/);
            await expect(laptopsPage.productThumbs).toHaveCount(5);
        }
    });
});
