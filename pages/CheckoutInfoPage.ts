import { Page, Locator } from '@playwright/test';
import { CustomerDetails } from '../test-data/checkout';

/** "Checkout: Your Information" (checkout step one). */
export class CheckoutInfoPage {
    page: Page;
    readonly title: Locator;
    readonly firstNameInput: Locator;
    readonly lastNameInput: Locator;
    readonly postalCodeInput: Locator;
    readonly continueButton: Locator;
    readonly cancelButton: Locator;
    readonly errorMessage: Locator;

    constructor(page: Page) {
        this.page = page;
        this.title = page.getByTestId('title');
        this.firstNameInput = page.getByRole('textbox', { name: 'First Name' });
        this.lastNameInput = page.getByRole('textbox', { name: 'Last Name' });
        this.postalCodeInput = page.getByRole('textbox', { name: 'Zip/Postal Code' });
        this.continueButton = page.getByRole('button', { name: 'Continue' });
        this.cancelButton = page.getByRole('button', { name: 'Cancel' });
        this.errorMessage = page.getByTestId('error');
    }

    async goto() {
        await this.page.goto('/checkout-step-one.html');
    }

    async fillCustomerDetails(details: CustomerDetails) {
        await this.firstNameInput.fill(details.firstName);
        await this.lastNameInput.fill(details.lastName);
        await this.postalCodeInput.fill(details.postalCode);
    }

    async continueToOverview() {
        await this.continueButton.click();
    }

    async cancel() {
        await this.cancelButton.click();
    }
}
