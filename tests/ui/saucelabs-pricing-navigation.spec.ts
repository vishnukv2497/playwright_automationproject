import { test, expect } from '../../fixtures/pages';

test.describe('SauceDemo - navigate to Sauce Labs pricing', () => {
    test('Select API and Mobile Beta Testing plan from the About > Pricing flow', async ({ page, inventoryPage, header, aboutPage, pricingPage, planSelectionPage }) => {
        await test.step('Open the inventory page (already logged in)', async () => {
            await inventoryPage.goto();
            await expect(page).toHaveURL(/inventory\.html/);
        });

        await test.step('Open About page from the menu', async () => {
            await header.goToAbout();
        });

        await test.step('Go to Pricing page', async () => {
            await aboutPage.goToPricing();
        });

        await test.step('Click Get started', async () => {
            await pricingPage.clickGetStarted();
        });

        await test.step('Select API and Mobile Beta Testing plan', async () => {
            await planSelectionPage.selectApiAndMobileBetaTesting();
        });
    });
});
