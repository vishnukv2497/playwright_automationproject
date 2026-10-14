import { expect, test } from '@playwright/test';
import { InventoryPage, SortOption } from '../../pages/InventoryPage';
import { parseCurrency } from '../../utils/currency';

const byName = (a: string, b: string) => a.localeCompare(b);
const byPrice = (a: string, b: string) => parseCurrency(a) - parseCurrency(b);

interface SortCase {
    option: SortOption;
    /** Dropdown label, used in the test title. */
    label: string;
    /** Which lists the sorts order is checked on. Prices tie at $15.99, so price sorts compare prices, not names. */
    list: 'names' | 'prices';
    expected: (names: string[], prices: string[]) => string[];
    /** The page opens sorted A to Z, so that case first switches away to prove the sort really runs. */
    startFrom?: SortOption;
}

const sortCases: SortCase[] = [
    { option: 'az', label: 'Name (A to Z)', list: 'names', expected: (names) => [...names].sort(byName), startFrom: 'za' },
    { option: 'za', label: 'Name (Z to A)', list: 'names', expected: (names) => [...names].sort(byName).reverse() },
    { option: 'lohi', label: 'Price (low to high)', list: 'prices', expected: (_, prices) => [...prices].sort(byPrice) },
    { option: 'hilo', label: 'Price (high to low)', list: 'prices', expected: (_, prices) => [...prices].sort(byPrice).reverse() },
];

test.describe('sorting', { tag: '@regression' }, () => {
    for (const { option, label, list, expected, startFrom } of sortCases) {
        test(`${label} orders the whole list`, async ({ page }) => {
            const inventoryPage = new InventoryPage(page);
            const readList = () => (list === 'names' ? inventoryPage.productNames() : inventoryPage.productPrices());
            let expectedOrder: string[] = [];

            await test.step('Log in and read every product name and price', async () => {
                await inventoryPage.openInventory();
                await expect(inventoryPage.products).toHaveCount(6);
                const names = await inventoryPage.productNames();
                const prices = await inventoryPage.productPrices();
                expectedOrder = expected(names, prices);
            });

            if (startFrom) {
                await test.step(`Sort by "${startFrom}" first so the list is not already in the expected order`, async () => {
                    await inventoryPage.sortBy(startFrom);
                    await expect.poll(readList).not.toEqual(expectedOrder);
                });
            }

            await test.step(`Sort by "${label}"`, async () => {
                await inventoryPage.sortBy(option);
            });

            await test.step(`All 6 ${list} are in the expected order`, async () => {
                await expect.poll(readList).toEqual(expectedOrder);
            });
        });
    }
});
