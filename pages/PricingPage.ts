import { Page, Locator } from '@playwright/test';

export class PricingPage {
    page: Page;
    readonly getStartedButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.getStartedButton = page.getByRole('button', { name: 'Get started' }).first();
    }

    async clickGetStarted() {
        await this.getStartedButton.click();
    }
}
