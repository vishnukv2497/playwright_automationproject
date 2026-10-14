/**
 * Test Case: Product Search
 *
 * Tags: @master @sanity @regression @web
 *
 * Steps:
 * 1) Search for a known product from the header search box
 * 2) Verify the search results page is displayed
 * 3) Verify the expected product is listed and every result matches the search term
 */

// using custom fixtures
import { test, expect } from '../../fixtures/pageFixtures';
import { Helper } from '../../utils/helper';

test('Product search test @master @sanity @regression @web', async ({ homePage, searchResultsPage }) => {
    const { productName } = Helper.getProductDetails();

    await test.step('1) Search for the product', async () => {
        await homePage.enterProductName(productName);
        await homePage.clickSearch();
    });

    await test.step('2) Verify the search results page is displayed', async () => {
        expect(await searchResultsPage.isSearchResultsPageExists(), 'Search results page should be displayed').toBeTruthy();
    });

    await test.step('3) Verify the expected product is in the results', async () => {
        expect(await searchResultsPage.isProductExist(productName), `"${productName}" should be in the search results`).toBeTruthy();

        const productNames = await searchResultsPage.getProductNames();
        productNames.forEach((name) => {
            expect(name.toLowerCase(), `Result "${name}" should match the search term`).toContain(productName.toLowerCase());
        });
    });

    console.log('✅ Product search completed successfully!');
});
