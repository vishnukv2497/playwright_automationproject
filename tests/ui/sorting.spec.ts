import { test, expect } from '../../fixtures/pages';
import { SortOption } from '../../pages/InventoryPage';
import { toCents } from '../../utils/money';

const byName = (a: string, b: string) => a.localeCompare(b);
const byPrice = (a: string, b: string) => toCents(a) - toCents(b);

interface SortCase {
    option: SortOption;
    /** Which list the sort order is checked on. Prices tie at $15.99, so price sorts compare prices, not names. */
    list: 'names' | 'prices';
    expected: (names: string[], prices: string[]) => string[];
    /** The page opens sorted A to Z, so that case first switches away to prove the sort really runs. */
    startFrom?: SortOption;
}

const sortCases: SortCase[] = [
    { option: 'Name (A to Z)', list: 'names', expected: (names) => [...names].sort(byName), startFrom: 'Name (Z to A)' },
    { option: 'Name (Z to A)', list: 'names', expected: (names) => [...names].sort(byName).reverse() },
    { option: 'Price (low to high)', list: 'prices', expected: (_, prices) => [...prices].sort(byPrice) },
    { option: 'Price (high to low)', list: 'prices', expected: (_, prices) => [...prices].sort(byPrice).reverse() },
];

test.describe('sorting', { tag: '@regression' }, () => {
    for (const { option, list, expected, startFrom } of sortCases) {
        test(`${option} orders the whole list`, async ({ inventoryPage }) => {
            const listLocator = list === 'names' ? inventoryPage.itemNames : inventoryPage.itemPrices;
            let expectedOrder: string[] = [];

            await test.step('Read every product name and price', async () => {
                await inventoryPage.goto();
                await expect(inventoryPage.inventoryItems).toHaveCount(6);
                const names = await inventoryPage.itemNames.allInnerTexts();
                const prices = await inventoryPage.itemPrices.allInnerTexts();
                expectedOrder = expected(names, prices);
            });

            if (startFrom) {
                await test.step(`Sort by "${startFrom}" first so the list is not already in the expected order`, async () => {
                    await inventoryPage.sortBy(startFrom);
                    await expect(listLocator).not.toHaveText(expectedOrder);
                });
            }

            await test.step(`Sort by "${option}"`, async () => {
                await inventoryPage.sortBy(option);
            });

            await test.step(`All 6 ${list} are in the expected order`, async () => {
                await expect(listLocator).toHaveText(expectedOrder);
            });
        });
    }
});
