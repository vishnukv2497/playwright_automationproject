import { Page, Locator } from '@playwright/test';

/** "Checkout: Complete!" */
export class CheckoutCompletePage {
    page: Page;
    readonly title: Locator;
    readonly completeHeader: Locator;
    readonly completeText: Locator;
    readonly backHomeButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.title = page.getByTestId('title');
        this.completeHeader = page.getByTestId('complete-header');
        this.completeText = page.getByTestId('complete-text');
        this.backHomeButton = page.getByRole('button', { name: 'Back Home' });
    }

    async backHome() {
        await this.backHomeButton.click();
    }
}
