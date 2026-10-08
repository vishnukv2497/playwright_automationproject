import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { HeaderComponent } from '../pages/HeaderComponent';
import { InventoryPage } from '../pages/InventoryPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutInfoPage } from '../pages/CheckoutInfoPage';
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage';
import { AboutPage } from '../pages/AboutPage';
import { PricingPage } from '../pages/PricingPage';
import { PlanSelectionPage } from '../pages/PlanSelectionPage';

type PageFixtures = {
    loginPage: LoginPage;
    header: HeaderComponent;
    inventoryPage: InventoryPage;
    productDetailPage: ProductDetailPage;
    cartPage: CartPage;
    checkoutInfoPage: CheckoutInfoPage;
    checkoutOverviewPage: CheckoutOverviewPage;
    checkoutCompletePage: CheckoutCompletePage;
    aboutPage: AboutPage;
    pricingPage: PricingPage;
    planSelectionPage: PlanSelectionPage;
};

/** Playwright's test with every page object available as a fixture. Specs import { test, expect } from here. */
export const test = base.extend<PageFixtures>({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
    header: async ({ page }, use) => {
        await use(new HeaderComponent(page));
    },
    inventoryPage: async ({ page }, use) => {
        await use(new InventoryPage(page));
    },
    productDetailPage: async ({ page }, use) => {
        await use(new ProductDetailPage(page));
    },
    cartPage: async ({ page }, use) => {
        await use(new CartPage(page));
    },
    checkoutInfoPage: async ({ page }, use) => {
        await use(new CheckoutInfoPage(page));
    },
    checkoutOverviewPage: async ({ page }, use) => {
        await use(new CheckoutOverviewPage(page));
    },
    checkoutCompletePage: async ({ page }, use) => {
        await use(new CheckoutCompletePage(page));
    },
    aboutPage: async ({ page }, use) => {
        await use(new AboutPage(page));
    },
    pricingPage: async ({ page }, use) => {
        await use(new PricingPage(page));
    },
    planSelectionPage: async ({ page }, use) => {
        await use(new PlanSelectionPage(page));
    },
});

export { expect };
