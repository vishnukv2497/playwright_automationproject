import { Page, Locator } from '@playwright/test';

export class AboutPage {
    page: Page;
    readonly pricingLink: Locator;

    constructor(page: Page) {
        this.page = page;
        this.pricingLink = page.getByRole('link', { name: 'Pricing' });
    }

    async goToPricing() {
        await this.pricingLink.click();
    }
}
