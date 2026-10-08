import { Page, Locator } from '@playwright/test';

/** Header shown on every logged-in screen: cart link/badge and the burger menu. */
export class HeaderComponent {
    page: Page;
    readonly cartLink: Locator;
    readonly cartBadge: Locator;
    readonly openMenuButton: Locator;
    readonly closeMenuButton: Locator;
    readonly allItemsButton: Locator;
    readonly aboutLink: Locator;
    readonly logoutButton: Locator;
    readonly resetAppStateButton: Locator;

    constructor(page: Page) {
        this.page = page;
        // The cart's accessible name changes with its contents ("Cart, empty" / "Cart, 1 items"), so use the test id.
        this.cartLink = page.getByTestId('shopping-cart-link');
        this.cartBadge = page.getByTestId('shopping-cart-badge');
        this.openMenuButton = page.getByRole('button', { name: 'Open Menu' });
        this.closeMenuButton = page.getByRole('button', { name: 'Close Menu' });
        this.allItemsButton = page.getByRole('button', { name: 'All Items' });
        this.aboutLink = page.getByRole('link', { name: 'About' });
        this.logoutButton = page.getByRole('button', { name: 'Logout' });
        this.resetAppStateButton = page.getByRole('button', { name: 'Reset App State' });
    }

    async openCart() {
        await this.cartLink.click();
    }

    /**
     * "Open Menu" toggles the menu, so only click it while the menu is closed. Every direct page load goes through
     * saucedemo's 404 -> "/?/route" redirect, and a click right after that is sometimes dropped (seen in Firefox and
     * WebKit), so click again until the menu items are visible.
     */
    async openMenu() {
        for (let attempt = 1; attempt <= 3; attempt++) {
            if (!(await this.closeMenuButton.isVisible())) {
                await this.openMenuButton.click();
            }
            const opened = await this.logoutButton.waitFor({ state: 'visible', timeout: 2_000 }).then(() => true, () => false);
            if (opened) {
                return;
            }
        }
        throw new Error('The burger menu did not open after 3 clicks on "Open Menu"');
    }

    async closeMenu() {
        await this.closeMenuButton.click();
    }

    async goToAllItems() {
        await this.openMenu();
        await this.allItemsButton.click();
    }

    async goToAbout() {
        await this.openMenu();
        await this.aboutLink.click();
    }

    async logout() {
        await this.openMenu();
        await this.logoutButton.click();
    }

    async resetAppState() {
        await this.openMenu();
        await this.resetAppStateButton.click();
    }
}
