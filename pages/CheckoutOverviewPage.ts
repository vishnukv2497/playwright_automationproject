import { Page, Locator } from '@playwright/test';

/** "Checkout: Overview" (checkout step two). */
export class CheckoutOverviewPage {
    page: Page;
    readonly title: Locator;
    readonly cartItems: Locator;
    readonly itemNames: Locator;
    readonly itemPrices: Locator;
    readonly paymentInfo: Locator;
    readonly shippingInfo: Locator;
    readonly subtotalLabel: Locator;
    readonly taxLabel: Locator;
    readonly totalLabel: Locator;
    readonly finishButton: Locator;
    readonly cancelButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.title = page.getByTestId('title');
        this.cartItems = page.getByTestId('inventory-item');
        this.itemNames = page.getByTestId('inventory-item-name');
        this.itemPrices = page.getByTestId('inventory-item-price');
        this.paymentInfo = page.getByTestId('payment-info-value');
        this.shippingInfo = page.getByTestId('shipping-info-value');
        this.subtotalLabel = page.getByTestId('subtotal-label');
        this.taxLabel = page.getByTestId('tax-label');
        this.totalLabel = page.getByTestId('total-label');
        this.finishButton = page.getByRole('button', { name: 'Finish' });
        this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    }

    /** The order line whose product name is exactly productName. */
    item(productName: string): Locator {
        return this.cartItems.filter({ has: this.page.getByText(productName, { exact: true }) });
    }

    async finish() {
        await this.finishButton.click();
    }

    async cancel() {
        await this.cancelButton.click();
    }
}
