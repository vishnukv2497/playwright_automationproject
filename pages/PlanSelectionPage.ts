import { Page, Locator } from '@playwright/test';

export class PlanSelectionPage {
    page: Page;
    readonly apiAndMobileBetaTestingOption: Locator;

    constructor(page: Page) {
        this.page = page;
        this.apiAndMobileBetaTestingOption = page.getByText('API and Mobile Beta testing');
    }

    async selectApiAndMobileBetaTesting() {
        await this.apiAndMobileBetaTestingOption.click();
    }
}
