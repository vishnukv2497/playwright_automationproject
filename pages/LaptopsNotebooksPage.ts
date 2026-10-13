import { Page, Locator, expect } from '@playwright/test';

/**
 * Page object for the "Laptops & Notebooks" category page (route=product/category&path=18)
 * and, through goto(), any other category/listing URL that shares the same layout.
 */
export class LaptopsNotebooksPage {
    readonly page: Page;

    // Header utilities (scoped: footer repeats "My Account", "Wish List" ...)
    readonly btnCurrency: Locator;
    readonly lnkPhone: Locator;
    readonly lnkMyAccount: Locator;
    readonly lnkWishList: Locator;
    readonly lnkShoppingCart: Locator;
    readonly lnkCheckout: Locator;
    readonly lnkLogo: Locator;

    // Search + mini cart
    readonly txtSearch: Locator;
    readonly btnSearch: Locator;
    readonly btnCart: Locator;
    readonly miniCartMenu: Locator;

    // Top menu
    readonly topMenu: Locator;
    readonly lnkLaptopsMenu: Locator;

    // Content
    readonly headingCategory: Locator;
    readonly txtDescription: Locator;
    readonly breadcrumb: Locator;
    readonly leftPanel: Locator;
    readonly headingRefineSearch: Locator;
    readonly refineSearchLinks: Locator;
    readonly btnListView: Locator;
    readonly btnGridView: Locator;
    readonly lnkProductCompare: Locator;
    readonly selSortBy: Locator;
    readonly selShow: Locator;
    readonly productLayouts: Locator;
    readonly productThumbs: Locator;
    readonly productNames: Locator;
    readonly alert: Locator;
    readonly txtPagination: Locator;
    readonly pagination: Locator;
    readonly txtEmptyCategory: Locator;

    constructor(page: Page) {
        this.page = page;

        this.btnCurrency = page.locator('#form-currency button.dropdown-toggle');
        this.lnkPhone = page.locator('#top-links').getByRole('link').first();
        this.lnkMyAccount = page.locator('#top-links').getByTitle('My Account');
        this.lnkWishList = page.locator('#wishlist-total');
        this.lnkShoppingCart = page.locator('#top-links').getByRole('link', { name: 'Shopping Cart' });
        this.lnkCheckout = page.locator('#top-links').getByRole('link', { name: 'Checkout' });
        this.lnkLogo = page.locator('#logo').getByRole('link');

        this.txtSearch = page.getByPlaceholder('Search');
        this.btnSearch = page.locator('#search button');
        this.btnCart = page.locator('#cart > button');
        this.miniCartMenu = page.locator('#cart .dropdown-menu');

        this.topMenu = page.locator('#menu');
        this.lnkLaptopsMenu = this.topMenu.getByRole('link', { name: 'Laptops & Notebooks', exact: true });

        this.headingCategory = page.locator('#content h2').first();
        this.txtDescription = page.locator('#content').getByText('Shop Laptop feature only the best laptop deals');
        this.breadcrumb = page.locator('.breadcrumb');
        this.leftPanel = page.locator('#column-right, #column-left').locator('.list-group');
        this.headingRefineSearch = page.locator('#content').getByRole('heading', { name: 'Refine Search' });
        this.refineSearchLinks = page.locator('#content .row').filter({ has: page.locator('a') }).first().locator('a');
        this.btnListView = page.locator('#list-view');
        this.btnGridView = page.locator('#grid-view');
        this.lnkProductCompare = page.locator('#compare-total');
        this.selSortBy = page.locator('#input-sort');
        this.selShow = page.locator('#input-limit');
        this.productLayouts = page.locator('#content .product-layout');
        this.productThumbs = page.locator('#content .product-thumb');
        this.productNames = page.locator('#content .product-thumb h4');
        this.alert = page.locator('.alert');
        this.txtPagination = page.locator('#content .row > .text-right');
        this.pagination = page.locator('#content .pagination');
        this.txtEmptyCategory = page.locator('#content').getByText('There are no products to list in this category.');
    }

    // ---------- Navigation ----------

    /**
     * Opens a category page. Accepts a category path ("18", "18_46"), or a full query suffix
     * starting with "&" / "?" (e.g. "18&sort=p.price&order=ASC") that is appended verbatim.
     * Base URL comes from WEB_APP_URL.
     * @param path - category path, optionally followed by extra query string (default "18")
     */
    async goto(path: string = '18'): Promise<void> {
        const base = (process.env.WEB_APP_URL || 'https://tutorialsninja.com/demo/').replace(/\/?$/, '/');
        await this.page.goto(`${base}index.php?route=product/category&path=${path}`);
    }

    /**
     * Opens a category page using a raw query string (without leading "?"), e.g. "route=product/category&path=18&limit=2"
     */
    async gotoQuery(query: string): Promise<void> {
        const base = (process.env.WEB_APP_URL || 'https://tutorialsninja.com/demo/').replace(/\/?$/, '/');
        await this.page.goto(`${base}index.php?${query}`);
    }

    // ---------- Header ----------

    async openMyAccountMenu(): Promise<void> {
        await this.lnkMyAccount.click();
    }

    /** @returns visible items of the My Account dropdown (guest: Register, Login) */
    async getMyAccountMenuItems(): Promise<string[]> {
        return (await this.page.locator('#top-links .dropdown-menu a').allInnerTexts()).map(t => t.trim());
    }

    async clickMyAccountMenuItem(name: string): Promise<void> {
        await this.page.locator('#top-links .dropdown-menu').getByRole('link', { name, exact: true }).click();
    }

    async openCurrencyMenu(): Promise<void> {
        await this.btnCurrency.click();
    }

    /** @returns currency options, e.g. "€Euro", "£Pound Sterling", "$US Dollar" */
    async getCurrencyOptions(): Promise<string[]> {
        return (await this.page.locator('#form-currency .dropdown-menu button').allInnerTexts()).map(t => t.trim());
    }

    /** @param code - EUR | GBP | USD */
    async selectCurrency(code: 'EUR' | 'GBP' | 'USD'): Promise<void> {
        await this.openCurrencyMenu();
        await this.page.locator(`#form-currency button[name="${code}"]`).click();
    }

    /** @returns currency symbol currently shown in the header ("$", "€", "£") */
    async getCurrentCurrencySymbol(): Promise<string> {
        return (await this.page.locator('#form-currency strong').innerText()).trim();
    }

    async clickWishListLink(): Promise<void> {
        await this.lnkWishList.click();
    }

    /** @returns text such as "Wish List (0)" */
    async getWishListText(): Promise<string> {
        return (await this.lnkWishList.innerText()).trim();
    }

    async clickShoppingCartLink(): Promise<void> {
        await this.lnkShoppingCart.click();
    }

    async clickCheckoutLink(): Promise<void> {
        await this.lnkCheckout.click();
    }

    async clickLogo(): Promise<void> {
        await this.lnkLogo.click();
    }

    // ---------- Search ----------

    async search(text: string): Promise<void> {
        await this.txtSearch.fill(text);
        await this.btnSearch.click();
    }

    async searchByEnter(text: string): Promise<void> {
        await this.txtSearch.fill(text);
        await this.txtSearch.press('Enter');
    }

    // ---------- Mini cart ----------

    /** @returns e.g. "0 item(s) - $0.00" */
    async getCartButtonText(): Promise<string> {
        return (await this.btnCart.innerText()).trim();
    }

    async openMiniCart(): Promise<void> {
        await this.btnCart.click();
    }

    /** @returns inner text of the opened mini-cart dropdown */
    async getMiniCartText(): Promise<string> {
        return (await this.miniCartMenu.innerText()).trim();
    }

    // ---------- Top menu ----------

    async clickLaptopsMenu(): Promise<void> {
        await this.lnkLaptopsMenu.click();
    }

    /** Hovers the "Laptops & Notebooks" top menu item to reveal its dropdown. */
    async hoverLaptopsMenu(): Promise<void> {
        await this.lnkLaptopsMenu.hover();
    }

    /** Visible dropdown links under Laptops & Notebooks (after hoverLaptopsMenu). */
    laptopsDropdownItem(name: string): Locator {
        return this.topMenu.locator('li.dropdown').filter({ has: this.page.getByRole('link', { name: 'Laptops & Notebooks', exact: true }) }).locator('.dropdown-menu').getByRole('link', { name });
    }

    async clickLaptopsDropdownItem(name: string): Promise<void> {
        await this.hoverLaptopsMenu();
        await this.laptopsDropdownItem(name).click();
    }

    /** Top-level menu link by name (exact), e.g. "Desktops". */
    topMenuLink(name: string): Locator {
        return this.topMenu.getByRole('link', { name, exact: true });
    }

    /** @returns names of the top-level menu items, in order */
    async getTopMenuItems(): Promise<string[]> {
        return (await this.topMenu.locator('ul.nav > li > a').allInnerTexts()).map(t => t.trim());
    }

    // ---------- Heading / description / breadcrumb ----------

    async getHeadingText(): Promise<string> {
        return (await this.headingCategory.innerText()).trim();
    }

    async isCategoryPageExists(name: string = 'Laptops & Notebooks'): Promise<boolean> {
        try {
            await this.page.locator('#content').getByRole('heading', { name, exact: true, level: 2 }).waitFor({ state: 'visible', timeout: 10000 });
            return true;
        } catch (error) {
            console.log(`Error checking category page "${name}": ${error}`);
            return false;
        }
    }

    /** @returns breadcrumb text, whitespace-normalised (e.g. "Laptops & Notebooks Macs") */
    async getBreadcrumbText(): Promise<string> {
        return (await this.breadcrumb.innerText()).replace(/\s+/g, ' ').trim();
    }

    /** Breadcrumb link by name; use name 'home' for the house icon link. */
    breadcrumbLink(name: string): Locator {
        if (name === 'home') {
            return this.breadcrumb.locator('a').first();
        }
        return this.breadcrumb.getByRole('link', { name, exact: true });
    }

    async clickBreadcrumbLink(name: string): Promise<void> {
        await this.breadcrumbLink(name).click();
    }

    // ---------- Left category panel ----------

    /** Left panel link by visible text incl. count, e.g. "Laptops & Notebooks (5)", "-Macs (0)". Use exact text. */
    leftPanelItem(name: string): Locator {
        return this.page.locator('.list-group').getByRole('link', { name, exact: true });
    }

    /** @returns all left-panel entries as text, e.g. "Desktops (13)", "-Macs (0)" */
    async getLeftPanelItems(): Promise<string[]> {
        return (await this.page.locator('.list-group a').allInnerTexts()).map(t => t.trim());
    }

    async clickLeftPanelItem(name: string): Promise<void> {
        await this.leftPanelItem(name).click();
    }

    /** @returns the currently highlighted (active) left-panel entry text */
    async getActiveLeftPanelItem(): Promise<string[]> {
        return (await this.page.locator('.list-group a.active').allInnerTexts()).map(t => t.trim());
    }

    // ---------- Refine Search ----------

    /** Refine Search link by text with count, e.g. "Macs (0)". */
    refineSearchLink(name: string): Locator {
        return this.page.locator('#content').getByRole('link', { name, exact: true }).filter({ hasNot: this.page.locator('img') });
    }

    async clickRefineSearchLink(name: string): Promise<void> {
        await this.refineSearchLink(name).click();
    }

    /** @returns refine-search entries, e.g. ["Macs (0)", "Windows (0)"] */
    async getRefineSearchItems(): Promise<string[]> {
        return (await this.page.locator('#content h3 + .row a, #content h3 ~ .row li a').allInnerTexts()).map(t => t.trim());
    }

    // ---------- View toggle ----------

    async clickListView(): Promise<void> {
        await this.btnListView.click();
    }

    async clickGridView(): Promise<void> {
        await this.btnGridView.click();
    }

    /** @returns 'list' or 'grid' according to the layout class of the first product (null when no products) */
    async getCurrentView(): Promise<'list' | 'grid' | null> {
        const cls = await this.productLayouts.first().getAttribute('class');
        if (!cls) return null;
        return cls.includes('product-list') ? 'list' : 'grid';
    }

    // ---------- Compare ----------

    /** @returns text such as "Product Compare (0)" */
    async getCompareLinkText(): Promise<string> {
        return (await this.lnkProductCompare.innerText()).trim();
    }

    async clickProductCompare(): Promise<void> {
        await this.lnkProductCompare.click();
    }

    // ---------- Sort / Show ----------

    /** @returns option labels of the Sort By select */
    async getSortOptions(): Promise<string[]> {
        return (await this.selSortBy.locator('option').allInnerTexts()).map(t => t.trim());
    }

    /** @returns option labels of the Show select */
    async getShowOptions(): Promise<string[]> {
        return (await this.selShow.locator('option').allInnerTexts()).map(t => t.trim());
    }

    async getSelectedSort(): Promise<string> {
        return (await this.selSortBy.evaluate((el: HTMLSelectElement) => el.selectedOptions[0].text)).trim();
    }

    async getSelectedShow(): Promise<string> {
        return (await this.selShow.evaluate((el: HTMLSelectElement) => el.selectedOptions[0].text)).trim();
    }

    /**
     * Chooses a Sort By option by label (e.g. "Price (Low > High)") and waits for the reload.
     */
    async selectSortBy(label: string): Promise<void> {
        await Promise.all([
            this.page.waitForURL(/sort=/),
            this.selSortBy.selectOption({ label }),
        ]);
    }

    /**
     * Chooses a Show option by label (e.g. "25") and waits for the reload.
     */
    async selectShow(label: string): Promise<void> {
        await Promise.all([
            this.page.waitForURL(/limit=/),
            this.selShow.selectOption({ label }),
        ]);
    }

    // ---------- Product cards ----------

    /** Product card (.product-thumb) by exact product name. */
    productCard(name: string): Locator {
        return this.productThumbs.filter({ has: this.page.getByRole('heading', { name, exact: true }) });
    }

    /** Card in the layout wrapper (.product-layout), useful to read the list/grid class. */
    productLayout(name: string): Locator {
        return this.productLayouts.filter({ has: this.page.getByRole('heading', { name, exact: true }) });
    }

    productNameLink(name: string): Locator {
        return this.productCard(name).getByRole('heading', { name, exact: true }).getByRole('link');
    }

    productImageLink(name: string): Locator {
        return this.productCard(name).locator('.image a');
    }

    productImage(name: string): Locator {
        return this.productCard(name).locator('.image img');
    }

    productDescription(name: string): Locator {
        return this.productCard(name).locator('.caption p').first();
    }

    productPrice(name: string): Locator {
        return this.productCard(name).locator('.price');
    }

    productExTax(name: string): Locator {
        return this.productCard(name).locator('.price-tax');
    }

    productAddToCartButton(name: string): Locator {
        return this.productCard(name).getByRole('button', { name: 'Add to Cart' });
    }

    productWishListButton(name: string): Locator {
        return this.productCard(name).locator('button[onclick^="wishlist.add"]');
    }

    productCompareButton(name: string): Locator {
        return this.productCard(name).locator('button[onclick^="compare.add"]');
    }

    /** @returns price text with the ex-tax part removed, e.g. "$602.00" */
    async getProductPrice(name: string): Promise<string> {
        const full = (await this.productPrice(name).innerText()).trim();
        return full.split('\n')[0].replace(/Ex Tax:.*$/, '').trim();
    }

    /** @returns ex-tax text, e.g. "Ex Tax:$500.00" */
    async getProductExTax(name: string): Promise<string> {
        return (await this.productExTax(name).innerText()).trim();
    }

    async clickProductName(name: string): Promise<void> {
        await this.productNameLink(name).click();
    }

    async clickProductImage(name: string): Promise<void> {
        await this.productImageLink(name).click();
    }

    async clickAddToCart(name: string): Promise<void> {
        await this.productAddToCartButton(name).click();
    }

    async clickAddToWishList(name: string): Promise<void> {
        await this.productWishListButton(name).click();
    }

    async clickAddToCompare(name: string): Promise<void> {
        await this.productCompareButton(name).click();
    }

    async getProductCount(): Promise<number> {
        return this.productThumbs.count();
    }

    /** @returns product names in the order displayed */
    async getProductNames(): Promise<string[]> {
        return (await this.productNames.allInnerTexts()).map(t => t.trim());
    }

    /** @returns numeric unit prices (incl. tax, as displayed) in displayed order, currency symbols stripped */
    async getProductPriceValues(): Promise<number[]> {
        const prices = await this.productThumbs.locator('.price').evaluateAll(els =>
            els.map(el => (el.childNodes[0]?.textContent || '').trim()));
        return prices.map(p => parseFloat(p.replace(/[^0-9.]/g, '')));
    }

    // ---------- Alerts ----------

    /** First visible alert (success / warning / danger). Use expect(alert).toContainText(...). */
    getAlert(): Locator {
        return this.alert.first();
    }

    /** @returns alert text without the trailing close "x" */
    async getAlertText(): Promise<string> {
        await this.alert.first().waitFor({ state: 'visible', timeout: 10000 });
        return (await this.alert.first().innerText()).replace(/×/g, '').trim();
    }

    async closeAlert(): Promise<void> {
        await this.alert.first().locator('button.close').click();
    }

    /** Waits for an alert containing the text (web-first assertion). */
    async expectAlertContains(text: string | RegExp): Promise<void> {
        await expect(this.alert.first()).toContainText(text);
    }

    // ---------- Pagination text ----------

    /** @returns e.g. "Showing 1 to 5 of 5 (1 Pages)" */
    async getPaginationText(): Promise<string> {
        return (await this.txtPagination.last().innerText()).trim();
    }

    async isEmptyMessageDisplayed(): Promise<boolean> {
        try {
            await this.txtEmptyCategory.waitFor({ state: 'visible', timeout: 10000 });
            return true;
        } catch (error) {
            console.log(`Error checking empty category message: ${error}`);
            return false;
        }
    }

    /** Pagination page link ("2", ">", ">|", "|<", "<"). */
    paginationLink(label: string): Locator {
        return this.pagination.getByRole('link', { name: label, exact: true });
    }
}
